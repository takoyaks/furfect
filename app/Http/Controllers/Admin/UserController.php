<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdopterProfile;
use App\Models\Application;
use App\Models\ApplicationTimeline;
use App\Models\DiditVerification;
use App\Models\DssMatchScore;
use App\Models\LifestyleProfile;
use App\Models\SavedPet;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Display list of users split by sub-tabs: Subscribers vs Staff.
     */
    public function index(Request $request): Response
    {
        $tab = $request->input('tab', 'subscribers');
        if (! in_array($tab, ['subscribers', 'staff'], true)) {
            $tab = 'subscribers';
        }

        $staffRoles = ['admin', 'shelter_staff', 'mao_officer'];

        // Compute tab badges counts
        $subscribersCount = User::whereDoesntHave('roles', function ($q) use ($staffRoles): void {
            $q->whereIn('name', $staffRoles);
        })->count();

        $unverifiedSubscribersCount = User::whereDoesntHave('roles', function ($q) use ($staffRoles): void {
            $q->whereIn('name', $staffRoles);
        })->where(function ($q): void {
            $q->whereDoesntHave('adopterProfile')
                ->orWhereHas('adopterProfile', function ($sub): void {
                    $sub->where('is_identity_verified', false);
                });
        })->count();

        $staffCount = User::whereHas('roles', function ($q) use ($staffRoles): void {
            $q->whereIn('name', $staffRoles);
        })->count();

        // Build main query
        $query = User::with('roles')->latest('id');

        if ($tab === 'subscribers') {
            $query->whereDoesntHave('roles', function ($q) use ($staffRoles): void {
                $q->whereIn('name', $staffRoles);
            })->with([
                'adopterProfile',
                'lifestyleProfile',
            ])->withCount([
                'applications',
                'savedPets',
                'matchScores',
                'diditVerifications',
            ]);

            if ($request->filled('verification')) {
                if ($request->input('verification') === 'verified') {
                    $query->whereHas('adopterProfile', function ($q): void {
                        $q->where('is_identity_verified', true);
                    });
                } elseif ($request->input('verification') === 'unverified') {
                    $query->where(function ($q): void {
                        $q->whereDoesntHave('adopterProfile')
                            ->orWhereHas('adopterProfile', function ($sub): void {
                                $sub->where('is_identity_verified', false);
                            });
                    });
                }
            }
        } else {
            // Staff Tab
            $query->whereHas('roles', function ($q) use ($staffRoles): void {
                $q->whereIn('name', $staffRoles);
            });

            if ($request->filled('role') && ! in_array($request->input('role'), ['all', 'All roles'], true)) {
                $query->role($request->input('role'));
            }
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('id', $search);
            });
        }

        $users = $query->paginate(12)->withQueryString();
        $roles = Role::pluck('name');

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'roles' => $roles,
            'tab' => $tab,
            'counts' => [
                'subscribers' => $subscribersCount,
                'unverified_subscribers' => $unverifiedSubscribersCount,
                'staff' => $staffCount,
            ],
            'filters' => $request->only(['search', 'role', 'verification', 'tab']),
        ]);
    }

    /**
     * Manually toggle or approve identity verification for a subscriber.
     */
    public function toggleVerification(Request $request, int $id): RedirectResponse
    {
        $user = User::with('adopterProfile')->findOrFail($id);

        $profile = $user->adopterProfile;

        if (! $profile) {
            // Create a basic profile if none exists so verification can be granted
            $profile = AdopterProfile::create([
                'user_id' => $user->id,
                'full_name' => $user->name,
                'contact_number' => $user->phone ?? 'N/A',
                'date_of_birth' => '2000-01-01',
                'home_address' => $user->address ?? 'N/A',
                'valid_id_type' => 'Admin Verified ID',
                'valid_id_number' => 'MANUAL-ADMIN',
                'adoption_reason' => 'companionship',
                'is_identity_verified' => true,
                'identity_verified_at' => now(),
                'identity_verification_provider' => 'manual_admin',
                'profile_completed_at' => now(),
            ]);

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => __('Profile created and identity manually verified for :name.', ['name' => $user->name]),
            ]);

            return back();
        }

        $newStatus = ! $profile->is_identity_verified;

        $profile->update([
            'is_identity_verified' => $newStatus,
            'identity_verified_at' => $newStatus ? now() : null,
            'identity_verification_provider' => $newStatus ? 'manual_admin' : null,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $newStatus
                ? __('Identity successfully verified manually for :name.', ['name' => $user->name])
                : __('Identity verification revoked for :name.', ['name' => $user->name]),
        ]);

        return back();
    }

    /**
     * Granularly reset a subscriber's quiz, eKYC, or application history.
     */
    public function resetSubscriberProfile(Request $request, int $id): RedirectResponse
    {
        $user = User::with(['adopterProfile', 'lifestyleProfile'])->findOrFail($id);

        $validated = $request->validate([
            'reset_type' => ['required', 'string', 'in:quiz,ekyc,applications,full'],
        ]);

        $type = $validated['reset_type'];

        DB::transaction(function () use ($user, $type): void {
            if (in_array($type, ['quiz', 'full'], true)) {
                LifestyleProfile::where('user_id', $user->id)->delete();
                DssMatchScore::where('user_id', $user->id)->delete();
            }

            if (in_array($type, ['ekyc', 'full'], true)) {
                if ($user->adopterProfile) {
                    if ($user->adopterProfile->id_document_path && Storage::disk('public')->exists($user->adopterProfile->id_document_path)) {
                        Storage::disk('public')->delete($user->adopterProfile->id_document_path);
                    }
                    if ($user->adopterProfile->id_document_back_path && Storage::disk('public')->exists($user->adopterProfile->id_document_back_path)) {
                        Storage::disk('public')->delete($user->adopterProfile->id_document_back_path);
                    }
                    $user->adopterProfile()->update([
                        'is_identity_verified' => false,
                        'identity_verified_at' => null,
                        'identity_verification_provider' => null,
                        'didit_session_id' => null,
                        'face_match_score' => null,
                        'liveness_verified' => false,
                        'id_document_path' => null,
                        'id_document_back_path' => null,
                    ]);
                }
                DiditVerification::where('user_id', $user->id)->delete();
            }

            if (in_array($type, ['applications', 'full'], true)) {
                $applicationIds = Application::where('user_id', $user->id)->pluck('id');
                if ($applicationIds->isNotEmpty()) {
                    ApplicationTimeline::whereIn('application_id', $applicationIds)->delete();
                    Application::whereIn('id', $applicationIds)->delete();
                }
                SavedPet::where('user_id', $user->id)->delete();
            }
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Successfully reset :type for subscriber :name.', [
                'type' => str_replace('_', ' ', $type),
                'name' => $user->name,
            ]),
        ]);

        return back();
    }

    /**
     * Store a newly created staff user in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'string', 'exists:roles,name'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(), // Auto-verify accounts created by admin
        ]);

        $user->assignRole($validated['role']);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Account created successfully!'),
        ]);

        return back();
    }

    /**
     * Update the specified user's profile and role.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role' => ['required', 'string', 'exists:roles,name'],
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        $user->syncRoles([$validated['role']]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('User account updated successfully.'),
        ]);

        return back();
    }

    /**
     * Reset the specified user's password.
     */
    public function resetPassword(Request $request, int $id): RedirectResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Password for :name has been successfully reset.', ['name' => $user->name]),
        ]);

        return back();
    }

    /**
     * Permanently delete user account and clean up child records.
     */
    public function destroy(int $id): RedirectResponse
    {
        $user = User::with(['adopterProfile'])->findOrFail($id);

        if ($user->id === auth()->id()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('You cannot delete your own admin account.'),
            ]);

            return back();
        }

        DB::transaction(function () use ($user): void {
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
            'type' => 'info',
            'message' => __('User account and all related records deleted successfully.'),
        ]);

        return back();
    }
}
