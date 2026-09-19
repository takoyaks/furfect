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
use App\Services\CloudinaryService;
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
        $newStatus = $profile ? ! (bool) $profile->is_identity_verified : true;

        $profileData = [
            'is_identity_verified' => $newStatus,
            'identity_verified_at' => $newStatus ? now() : null,
            'identity_verification_provider' => $newStatus ? 'manual_admin' : null,
            'liveness_verified' => $newStatus,
            'face_match_score' => $newStatus ? 100.0 : null,
        ];

        if ($newStatus) {
            $profileData = array_merge([
                'full_name' => $profile?->full_name ?: $user->name,
                'contact_number' => $profile?->contact_number ?: ($user->phone ?: '09123456789'),
                'date_of_birth' => $profile?->date_of_birth ? $profile->date_of_birth->format('Y-m-d') : '2000-01-01',
                'home_address' => $profile?->home_address ?: 'General Santos City',
                'valid_id_type' => $profile?->valid_id_type ?: 'Philippine Identification (PhilID / ePhilID)',
                'valid_id_number' => $profile?->valid_id_number ?: 'VERIFIED-MANUAL-ADMIN',
                'had_pets_before' => $profile?->had_pets_before ?: 'never',
                'surrendered_pet' => $profile?->surrendered_pet ?? false,
                'adoption_reason' => $profile?->adoption_reason ?: 'Companionship',
                'adoption_reason_text' => $profile?->adoption_reason_text ?: 'Admin Verified Adopter',
                'pet_stay' => $profile?->pet_stay ?: 'inside',
            ], $profileData);

            $profile = AdopterProfile::updateOrCreate(
                ['user_id' => $user->id],
                $profileData
            );

            DiditVerification::where('user_id', $user->id)->update([
                'adopter_profile_id' => $profile->id,
                'status' => 'approved',
                'id_verification_status' => 'approved',
                'liveness_status' => 'passed',
                'face_match_status' => 'matched',
                'face_match_score' => 100.0,
                'liveness_score' => 100.0,
                'verified_at' => now(),
            ]);

            if (! DiditVerification::where('user_id', $user->id)->exists()) {
                DiditVerification::create([
                    'user_id' => $user->id,
                    'adopter_profile_id' => $profile->id,
                    'session_id' => 'manual_admin_'.$user->id.'_'.time(),
                    'status' => 'approved',
                    'id_verification_status' => 'approved',
                    'liveness_status' => 'passed',
                    'face_match_status' => 'matched',
                    'face_match_score' => 100.0,
                    'liveness_score' => 100.0,
                    'verified_at' => now(),
                ]);
            }
        } else {
            if ($profile) {
                $profile->update($profileData);
            }

            DiditVerification::where('user_id', $user->id)->update([
                'status' => 'declined',
                'verified_at' => null,
            ]);
        }

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
                    $cloudinary = app(CloudinaryService::class);
                    if ($user->adopterProfile->id_document_path) {
                        if (str_starts_with($user->adopterProfile->id_document_path, 'http')) {
                            $cloudinary->delete($user->adopterProfile->id_document_path);
                        } elseif (Storage::disk('public')->exists($user->adopterProfile->id_document_path)) {
                            Storage::disk('public')->delete($user->adopterProfile->id_document_path);
                        }
                    }
                    if ($user->adopterProfile->id_document_back_path) {
                        if (str_starts_with($user->adopterProfile->id_document_back_path, 'http')) {
                            $cloudinary->delete($user->adopterProfile->id_document_back_path);
                        } elseif (Storage::disk('public')->exists($user->adopterProfile->id_document_back_path)) {
                            Storage::disk('public')->delete($user->adopterProfile->id_document_back_path);
                        }
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
            $cloudinary = app(CloudinaryService::class);

            if ($user->adopterProfile) {
                if ($user->adopterProfile->id_document_path) {
                    if (str_starts_with($user->adopterProfile->id_document_path, 'http')) {
                        $cloudinary->delete($user->adopterProfile->id_document_path);
                    } elseif (Storage::disk('public')->exists($user->adopterProfile->id_document_path)) {
                        Storage::disk('public')->delete($user->adopterProfile->id_document_path);
                    }
                }
                if ($user->adopterProfile->id_document_back_path) {
                    if (str_starts_with($user->adopterProfile->id_document_back_path, 'http')) {
                        $cloudinary->delete($user->adopterProfile->id_document_back_path);
                    } elseif (Storage::disk('public')->exists($user->adopterProfile->id_document_back_path)) {
                        Storage::disk('public')->delete($user->adopterProfile->id_document_back_path);
                    }
                }
            }

            if ($user->avatar) {
                if (str_starts_with($user->avatar, 'http')) {
                    $cloudinary->delete($user->avatar);
                } elseif (Storage::disk('public')->exists($user->avatar)) {
                    Storage::disk('public')->delete($user->avatar);
                }
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
