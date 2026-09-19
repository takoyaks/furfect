<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdopterProfile;
use App\Models\Announcement;
use App\Models\Application;
use App\Models\ApplicationTimeline;
use App\Models\DiditVerification;
use App\Models\DssMatchScore;
use App\Models\LifestyleProfile;
use App\Models\Pet;
use App\Models\PetPhoto;
use App\Models\SavedPet;
use App\Models\Shelter;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class DatabaseManagerController extends Controller
{
    /**
     * Enforce super admin access strictly for 'kerbie'.
     */
    private function authorizeSuperAdmin(Request $request): void
    {
        $user = $request->user();

        if (! $user || ($user->name !== 'kerbie' && $user->email !== 'kerbie@furfect.com')) {
            abort(403, 'Unauthorized access.');
        }
    }

    /**
     * Display simple Level 2 database & logs management dashboard.
     */
    public function index(Request $request): Response
    {
        $this->authorizeSuperAdmin($request);

        // Core table row counts
        $stats = [
            'users' => User::count(),
            'adopter_profiles' => AdopterProfile::count(),
            'lifestyle_profiles' => LifestyleProfile::count(),
            'applications' => Application::count(),
            'application_timelines' => ApplicationTimeline::count(),
            'pets' => Pet::count(),
            'adopted_pets' => Pet::where('status', 'adopted')->count(),
            'pet_photos' => PetPhoto::count(),
            'shelters' => Shelter::count(),
            'didit_verifications' => DiditVerification::count(),
            'verified_adopters' => AdopterProfile::where('is_identity_verified', true)->count(),
            'saved_pets' => SavedPet::count(),
            'dss_match_scores' => DssMatchScore::count(),
            'announcements' => Announcement::count(),
            'system_settings' => SystemSetting::count(),
        ];

        // Fetch users with related record counts
        $query = User::with(['roles', 'adopterProfile:id,user_id,full_name,is_identity_verified', 'lifestyleProfile:id,user_id,submitted_at'])
            ->withCount(['applications', 'savedPets', 'matchScores', 'diditVerifications'])
            ->latest('id');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('id', $search);
            });
        }

        if ($request->filled('role') && ! in_array($request->input('role'), ['all', 'All roles'], true)) {
            $query->role($request->input('role'));
        }

        $users = $query->paginate(20)->withQueryString();
        $roles = Role::pluck('name');

        // Read last 150 lines of system logs
        $logPath = storage_path('logs/laravel.log');
        $recentLogs = '';
        if (File::exists($logPath)) {
            $logContent = File::get($logPath);
            $lines = explode("\n", trim($logContent));
            $recentLines = array_slice($lines, -150);
            $recentLogs = implode("\n", $recentLines);
        }

        return Inertia::render('admin/database/index', [
            'stats' => $stats,
            'users' => $users,
            'roles' => $roles,
            'filters' => $request->only(['search', 'role']),
            'logs' => $recentLogs,
        ]);
    }

    /**
     * Inspect a specific user's complete relationship tree.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        $user = User::with([
            'roles',
            'adopterProfile',
            'lifestyleProfile',
            'applications.pet:id,name,species,breed',
            'applications.timeline',
            'matchScores.pet:id,name,species',
            'savedPets.pet:id,name,species',
            'diditVerifications',
        ])->findOrFail($id);

        return response()->json([
            'user' => $user,
            'is_current_user' => auth()->id() === $user->id,
        ]);
    }

    /**
     * Permanently cascade-delete a user and all their related records and uploaded files.
     */
    public function destroy(Request $request, int $id): RedirectResponse
    {
        $this->authorizeSuperAdmin($request);

        $user = User::with(['adopterProfile'])->findOrFail($id);

        if ($user->id === auth()->id()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('You cannot delete your own active super admin account.'),
            ]);

            return back();
        }

        DB::transaction(function () use ($user): void {
            // 1. Clean up stored files
            if ($user->adopterProfile) {
                if ($user->adopterProfile->id_document_path && Storage::disk('public')->exists($user->adopterProfile->id_document_path)) {
                    Storage::disk('public')->delete($user->adopterProfile->id_document_path);
                }
                if ($user->adopterProfile->id_document_back_path && Storage::disk('public')->exists($user->adopterProfile->id_document_back_path)) {
                    Storage::disk('public')->delete($user->adopterProfile->id_document_back_path);
                }
            }

            if ($user->avatar && ! str_starts_with($user->avatar, 'http') && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }

            // 2. Cascade delete records
            DiditVerification::where('user_id', $user->id)->delete();
            DssMatchScore::where('user_id', $user->id)->delete();
            SavedPet::where('user_id', $user->id)->delete();

            $applicationIds = Application::where('user_id', $user->id)->pluck('id');
            if ($applicationIds->isNotEmpty()) {
                ApplicationTimeline::whereIn('application_id', $applicationIds)->delete();
                Application::whereIn('id', $applicationIds)->delete();
            }

            AdopterProfile::where('user_id', $user->id)->delete();
            LifestyleProfile::where('user_id', $user->id)->delete();

            DB::table('notifications')->where('notifiable_id', $user->id)->where('notifiable_type', User::class)->delete();

            $user->syncRoles([]);
            $user->delete();
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('User #:id (:name) and all related data deleted cleanly.', [
                'id' => $id,
                'name' => $user->name,
            ]),
        ]);

        return back();
    }

    /**
     * Master Reset: Reset all adopted data, Didit verification data, applications, and match scores.
     */
    public function resetAll(Request $request): RedirectResponse
    {
        $this->authorizeSuperAdmin($request);

        $validated = $request->validate([
            'scope' => ['required', 'string', 'in:all,adopted_data,verification_data,quiz_data'],
        ]);

        $scope = $validated['scope'];

        DB::transaction(function () use ($scope): void {
            // 1. Reset Adopted & Application Data
            if (in_array($scope, ['all', 'adopted_data'], true)) {
                ApplicationTimeline::truncate();
                Application::truncate();
                // Set all pets back to 'available'
                Pet::query()->update(['status' => 'available']);
                SavedPet::truncate();
            }

            // 2. Reset Didit & Identity Verification Data
            if (in_array($scope, ['all', 'verification_data'], true)) {
                DiditVerification::truncate();

                // Clean up uploaded ID files from storage
                $profiles = AdopterProfile::whereNotNull('id_document_path')
                    ->orWhereNotNull('id_document_back_path')
                    ->get();

                foreach ($profiles as $profile) {
                    if ($profile->id_document_path && Storage::disk('public')->exists($profile->id_document_path)) {
                        Storage::disk('public')->delete($profile->id_document_path);
                    }
                    if ($profile->id_document_back_path && Storage::disk('public')->exists($profile->id_document_back_path)) {
                        Storage::disk('public')->delete($profile->id_document_back_path);
                    }
                }

                // Reset verification fields on adopter profiles
                AdopterProfile::query()->update([
                    'is_identity_verified' => false,
                    'identity_verified_at' => null,
                    'identity_verification_provider' => null,
                    'didit_session_id' => null,
                    'face_match_score' => null,
                    'liveness_verified' => false,
                    'id_document_path' => null,
                    'id_document_mime' => null,
                    'id_document_name' => null,
                    'id_document_back_path' => null,
                    'id_document_back_mime' => null,
                    'id_document_back_name' => null,
                ]);
            }

            // 3. Reset Quiz & Matching Scores
            if (in_array($scope, ['all', 'quiz_data'], true)) {
                DssMatchScore::truncate();
                LifestyleProfile::truncate();
            }
        });

        $messages = [
            'all' => __('Master Reset Completed: All adoptions, Didit verifications, applications, and match scores have been cleanly reset.'),
            'adopted_data' => __('All adopted pets set back to available and all applications/timelines cleared.'),
            'verification_data' => __('All Didit verifications and identity uploads cleared and reset to unverified.'),
            'quiz_data' => __('All lifestyle quizzes and DSS match scores cleared.'),
        ];

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $messages[$scope] ?? __('Data reset successfully.'),
        ]);

        return back();
    }

    /**
     * Clear system log file.
     */
    public function clearLogs(Request $request): RedirectResponse
    {
        $this->authorizeSuperAdmin($request);

        $logPath = storage_path('logs/laravel.log');
        if (File::exists($logPath)) {
            File::put($logPath, '');
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('System logs cleared successfully.'),
        ]);

        return back();
    }
}
