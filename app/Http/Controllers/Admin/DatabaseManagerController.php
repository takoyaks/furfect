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
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class DatabaseManagerController extends Controller
{
    /**
     * Enforce super admin access strictly for 'kerbie'.
     * Returns 404 so the route remains invisible and hidden to other users.
     */
    private function authorizeSuperAdmin(Request $request): void
    {
        $user = $request->user();

        if (! $user || ($user->name !== 'kerbie' && $user->email !== 'kerbie@furfect.com')) {
            abort(404);
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

        $users = $query->paginate(20, ['*'], 'users_page')->withQueryString();
        $roles = Role::pluck('name');

        // Fetch pets
        $petsQuery = Pet::with('shelter:id,name')->latest('id');
        if ($request->filled('pet_search')) {
            $petSearch = $request->input('pet_search');
            $petsQuery->where(function ($q) use ($petSearch): void {
                $q->where('name', 'like', "%{$petSearch}%")
                    ->orWhere('breed', 'like', "%{$petSearch}%")
                    ->orWhere('species', 'like', "%{$petSearch}%")
                    ->orWhere('id', $petSearch);
            });
        }
        if ($request->filled('pet_status') && ! in_array($request->input('pet_status'), ['all', 'All'], true)) {
            $petsQuery->where('status', $request->input('pet_status'));
        }
        $pets = $petsQuery->paginate(20, ['*'], 'pets_page')->withQueryString();

        // Fetch applications with recent timeline
        $appsQuery = Application::with([
            'pet:id,name,status,species',
            'user:id,name,email',
            'timelines' => fn ($t) => $t->latest('created_at')->limit(3),
        ])->latest('id');

        if ($request->filled('app_search')) {
            $appSearch = $request->input('app_search');
            $appsQuery->where(function ($q) use ($appSearch): void {
                $q->where('reference_number', 'like', "%{$appSearch}%")
                    ->orWhere('id', $appSearch)
                    ->orWhereHas('user', function ($uq) use ($appSearch): void {
                        $uq->where('name', 'like', "%{$appSearch}%")
                            ->orWhere('email', 'like', "%{$appSearch}%");
                    })
                    ->orWhereHas('pet', function ($pq) use ($appSearch): void {
                        $pq->where('name', 'like', "%{$appSearch}%");
                    });
            });
        }

        if ($request->filled('app_status') && ! in_array($request->input('app_status'), ['all', 'All'], true)) {
            $appsQuery->where('status', $request->input('app_status'));
        }
        $applications = $appsQuery->paginate(20, ['*'], 'apps_page')->withQueryString();

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
            'pets' => $pets,
            'applications' => $applications,
            'roles' => $roles,
            'filters' => $request->only(['search', 'role', 'pet_search', 'pet_status', 'app_search', 'app_status', 'tab']),
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

    /**
     * Level 2: Update normal user details (name, email).
     */
    public function updateUser(Request $request, int $id): RedirectResponse
    {
        $this->authorizeSuperAdmin($request);

        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,'.$user->id],
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        if ($user->adopterProfile) {
            $user->adopterProfile->update([
                'full_name' => $validated['name'],
            ]);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('User #:id (:name) updated successfully.', ['id' => $user->id, 'name' => $user->name]),
        ]);

        return back();
    }

    /**
     * Level 2: Emergency reset password for normal user.
     */
    public function resetUserPassword(Request $request, int $id): RedirectResponse
    {
        $this->authorizeSuperAdmin($request);

        $user = User::findOrFail($id);

        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8'],
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Password for user :name (ID #:id) has been reset.', ['name' => $user->name, 'id' => $user->id]),
        ]);

        return back();
    }

    /**
     * Level 2: Update pet profile name and status.
     */
    public function updatePet(Request $request, int $id): RedirectResponse
    {
        $this->authorizeSuperAdmin($request);

        $pet = Pet::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:available,adopted,archived'],
        ]);

        $pet->update([
            'name' => $validated['name'],
            'status' => $validated['status'],
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Pet #:id (:name) updated successfully.', ['id' => $pet->id, 'name' => $pet->name]),
        ]);

        return back();
    }

    /**
     * Level 2: Super Admin Override or Rollback Application Status.
     */
    public function overrideApplicationStatus(Request $request, int $id): RedirectResponse
    {
        $this->authorizeSuperAdmin($request);

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:pending,under_review,mao_audit,approved,released,rejected,unclaimed,closed'],
            'reason' => ['required', 'string', 'max:500'],
            'sync_pet_status' => ['nullable', 'boolean'],
        ]);

        $application = Application::with('pet')->findOrFail($id);
        $oldStatus = $application->status;
        $newStatus = $validated['status'];
        $syncPet = $validated['sync_pet_status'] ?? true;

        DB::transaction(function () use ($application, $oldStatus, $newStatus, $syncPet, $validated): void {
            $updateData = [
                'status' => $newStatus,
            ];

            if (in_array($newStatus, ['approved', 'rejected', 'released', 'closed', 'unclaimed'])) {
                $updateData['resolved_at'] = now();
            } else {
                $updateData['resolved_at'] = null;
            }

            if ($newStatus === 'released') {
                $updateData['released_at'] = now();
                $updateData['releasing_officer_id'] = auth()->id();
            }

            $application->update($updateData);

            if ($syncPet && $application->pet) {
                if (in_array($newStatus, ['released', 'completed'])) {
                    $application->pet->update(['status' => 'adopted']);
                } elseif (in_array($newStatus, ['pending', 'under_review', 'mao_audit', 'rejected', 'closed', 'unclaimed'])) {
                    $application->pet->update(['status' => 'available']);
                }
            }

            $isRollback = in_array($newStatus, ['pending', 'under_review', 'mao_audit']) && in_array($oldStatus, ['approved', 'released', 'rejected', 'closed']);

            $application->logTimeline(
                stage: 'super_admin_override',
                action: $isRollback ? 'status_rollback' : 'status_override',
                title: sprintf('Status %s by Super Admin Kerbie', $isRollback ? 'Rolled Back' : 'Overridden'),
                description: sprintf('Status changed from [%s] to [%s]. Notes: %s', $oldStatus, $newStatus, $validated['reason']),
                actor: auth()->user(),
                metadata: [
                    'previous_status' => $oldStatus,
                    'new_status' => $newStatus,
                    'reason' => $validated['reason'],
                    'is_rollback' => $isRollback,
                    'synced_pet_status' => $syncPet,
                ]
            );
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Application :ref status changed from :old to :new.', [
                'ref' => $application->reference_number,
                'old' => $oldStatus,
                'new' => $newStatus,
            ]),
        ]);

        return back();
    }
}
