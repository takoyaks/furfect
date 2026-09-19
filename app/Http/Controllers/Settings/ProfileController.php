<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\AdopterProfile;
use App\Services\CloudinaryService;
use App\Services\EncryptedFileStorageService;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $adopterProfile = $user->adopterProfile;

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'adopterProfile' => $adopterProfile ? [
                'id' => $adopterProfile->id,
                'full_name' => $adopterProfile->full_name,
                'contact_number' => $adopterProfile->contact_number,
                'date_of_birth' => $adopterProfile->date_of_birth ? $adopterProfile->date_of_birth->format('Y-m-d') : null,
                'home_address' => $adopterProfile->home_address,
                'valid_id_type' => $adopterProfile->valid_id_type,
                'valid_id_number' => $adopterProfile->valid_id_number,
                'has_id_document' => $adopterProfile->hasFrontIdDocument(),
                'id_document_name' => $adopterProfile->id_document_name,
                'has_id_document_back' => $adopterProfile->hasBackIdDocument(),
                'id_document_back_name' => $adopterProfile->id_document_back_name,
                'is_identity_verified' => (bool) $adopterProfile->is_identity_verified,
                'identity_verified_at' => $adopterProfile->identity_verified_at?->toIso8601String(),
                'face_match_score' => $adopterProfile->face_match_score,
                'liveness_verified' => (bool) $adopterProfile->liveness_verified,
                'front_preview_url' => $adopterProfile->id_document_path ? route('adopter.id-document.show', ['profile' => $adopterProfile->id, 'side' => 'front']) : null,
                'back_preview_url' => $adopterProfile->id_document_back_path ? route('adopter.id-document.show', ['profile' => $adopterProfile->id, 'side' => 'back']) : null,
            ] : null,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request, EncryptedFileStorageService $fileStorage, CloudinaryService $cloudinary): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        // Handle avatar removal
        if ($request->boolean('remove_avatar')) {
            $rawAvatar = $user->getRawOriginal('avatar');
            if ($rawAvatar) {
                if (str_starts_with($rawAvatar, 'http://') || str_starts_with($rawAvatar, 'https://')) {
                    $cloudinary->delete($rawAvatar);
                } elseif (Storage::disk('public')->exists($rawAvatar)) {
                    Storage::disk('public')->delete($rawAvatar);
                }
            }
            $user->avatar = null;
        }

        // Handle avatar upload
        if ($request->hasFile('avatar')) {
            $rawAvatar = $user->getRawOriginal('avatar');
            if ($rawAvatar) {
                if (str_starts_with($rawAvatar, 'http://') || str_starts_with($rawAvatar, 'https://')) {
                    $cloudinary->delete($rawAvatar);
                } elseif (Storage::disk('public')->exists($rawAvatar)) {
                    Storage::disk('public')->delete($rawAvatar);
                }
            }

            if ($cloudinary->isConfigured()) {
                $upload = $cloudinary->upload($request->file('avatar'), 'avatars');
                $user->avatar = $upload['secure_url'];
            } else {
                $path = $request->file('avatar')->store('avatars', 'public');
                $user->avatar = $path;
            }
        }

        $user->fill([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'bio' => $validated['bio'] ?? null,
        ]);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        // Handle Adopter Profile synchronization if user has an adopter profile or submitted adopter verification details
        $hasAdopterInput = $request->has('valid_id_type')
            || $request->has('valid_id_number')
            || $request->has('date_of_birth')
            || $request->hasFile('id_document')
            || $request->hasFile('id_document_back');

        $adopterProfile = $user->adopterProfile;

        if ($adopterProfile || $hasAdopterInput) {
            $adopterData = [
                'full_name' => $user->name,
                'contact_number' => $user->phone ?? ($adopterProfile?->contact_number ?? ''),
                'home_address' => $user->address ?? ($adopterProfile?->home_address ?? ''),
            ];

            if ($request->filled('date_of_birth')) {
                $adopterData['date_of_birth'] = $validated['date_of_birth'];
            }

            if ($request->filled('valid_id_type')) {
                $adopterData['valid_id_type'] = $validated['valid_id_type'];
            }

            if ($request->filled('valid_id_number')) {
                $adopterData['valid_id_number'] = $validated['valid_id_number'];
            }

            // Handle front ID file upload if provided
            if ($request->hasFile('id_document')) {
                if ($adopterProfile?->id_document_path) {
                    if (str_starts_with($adopterProfile->id_document_path, 'http')) {
                        $cloudinary->delete($adopterProfile->id_document_path);
                    } else {
                        $fileStorage->deleteFile($adopterProfile->id_document_path);
                    }
                }

                if ($cloudinary->isConfigured()) {
                    $upload = $cloudinary->upload($request->file('id_document'), 'id_documents');
                    $adopterData['id_document_path'] = $upload['secure_url'];
                    $adopterData['id_document_mime'] = $request->file('id_document')->getMimeType() ?: 'image/jpeg';
                    $adopterData['id_document_name'] = $request->file('id_document')->getClientOriginalName();
                } else {
                    $stored = $fileStorage->storeEncrypted($request->file('id_document'), 'id_documents');
                    $adopterData['id_document_path'] = $stored['path'];
                    $adopterData['id_document_mime'] = $stored['mime'];
                    $adopterData['id_document_name'] = $stored['original_name'];
                }
            }

            // Handle back ID file upload if provided
            if ($request->hasFile('id_document_back')) {
                if ($adopterProfile?->id_document_back_path) {
                    if (str_starts_with($adopterProfile->id_document_back_path, 'http')) {
                        $cloudinary->delete($adopterProfile->id_document_back_path);
                    } else {
                        $fileStorage->deleteFile($adopterProfile->id_document_back_path);
                    }
                }

                if ($cloudinary->isConfigured()) {
                    $upload = $cloudinary->upload($request->file('id_document_back'), 'id_documents');
                    $adopterData['id_document_back_path'] = $upload['secure_url'];
                    $adopterData['id_document_back_mime'] = $request->file('id_document_back')->getMimeType() ?: 'image/jpeg';
                    $adopterData['id_document_back_name'] = $request->file('id_document_back')->getClientOriginalName();
                } else {
                    $storedBack = $fileStorage->storeEncrypted($request->file('id_document_back'), 'id_documents');
                    $adopterData['id_document_back_path'] = $storedBack['path'];
                    $adopterData['id_document_back_mime'] = $storedBack['mime'];
                    $adopterData['id_document_back_name'] = $storedBack['original_name'];
                }
            }

            AdopterProfile::updateOrCreate(
                ['user_id' => $user->id],
                $adopterData
            );
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
