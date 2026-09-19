<?php

namespace App\Http\Controllers;

use App\Models\AdopterProfile;
use App\Models\SystemSetting;
use App\Services\DiditVerificationService;
use App\Services\EncryptedFileStorageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdopterProfileController extends Controller
{
    /**
     * Show the onboarding step 1 (eKYC / Identity Verification) page.
     */
    public function ekyc(Request $request, DiditVerificationService $service): Response|RedirectResponse
    {
        $ekycEnabled = (bool) SystemSetting::get('ekyc_enabled', true);
        if (! $ekycEnabled) {
            return to_route('onboarding.personal.edit');
        }

        $user = $request->user();

        // If already verified (e.g. manual admin approval or completed Didit), automatically proceed to next step
        if ($user->isIdentityVerified()) {
            return to_route('onboarding.personal.edit');
        }

        $verification = $user->latestDiditVerification;

        // Proactively query live decision from Didit if verification was pending/unresolved
        if ($verification && $verification->session_id && ! $verification->isApproved()) {
            try {
                $decision = $service->getSessionDecision($verification->session_id);
                if ($decision && ! empty($decision) && ! in_array(strtolower($decision['status'] ?? ''), ['not started', 'not_started'])) {
                    $verification = $service->processDecision($decision, $verification->session_id);
                }
            } catch (\Exception) {
                // Continue with cached state
            }
        }

        // If verified after decision query, proceed to next step
        if ($user->fresh()->isIdentityVerified() || ($verification && $verification->isApproved())) {
            return to_route('onboarding.personal.edit');
        }

        $profile = $user->fresh()->adopterProfile;

        return Inertia::render('onboarding/ekyc', [
            'profile' => $profile ? [
                'id' => $profile->id,
                'full_name' => $profile->full_name,
                'valid_id_type' => $profile->valid_id_type,
                'valid_id_number' => $profile->valid_id_number,
                'date_of_birth' => $profile->date_of_birth ? $profile->date_of_birth->format('Y-m-d') : null,
                'is_identity_verified' => (bool) $profile->is_identity_verified,
                'identity_verified_at' => $profile->identity_verified_at?->toIso8601String(),
                'face_match_score' => $profile->face_match_score,
                'liveness_verified' => (bool) $profile->liveness_verified,
            ] : null,
            'verification' => $verification ? [
                'id' => $verification->id,
                'status' => $verification->status,
                'face_match_score' => $verification->face_match_score,
                'face_match_status' => $verification->face_match_status,
                'liveness_status' => $verification->liveness_status,
                'id_verification_status' => $verification->id_verification_status,
                'extracted_data' => $verification->extracted_data,
                'failure_reasons' => $verification->failure_reasons,
            ] : null,
            'userName' => $user->name,
            'ekycEnabled' => $ekycEnabled,
        ]);
    }

    /**
     * Show the onboarding step 2 (personal info) form.
     */
    public function edit(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        $ekycEnabled = (bool) SystemSetting::get('ekyc_enabled', true);

        // Require eKYC verification before accessing Step 2 if eKYC is enabled
        if ($ekycEnabled && ! $user->isIdentityVerified()) {
            Inertia::flash('toast', [
                'type' => 'info',
                'message' => __('Please complete eKYC identity verification first.'),
            ]);

            return to_route('onboarding.ekyc.show');
        }

        $profile = $user->adopterProfile;

        return Inertia::render('onboarding/personal-info', [
            'profile' => $profile ? array_merge($profile->toArray(), [
                'date_of_birth' => $profile->date_of_birth ? $profile->date_of_birth->format('Y-m-d') : '',
                'has_id_document' => $profile->hasIdDocument(),
                'id_document_name' => $profile->id_document_name,
                'has_id_document_back' => $profile->hasBackIdDocument(),
                'id_document_back_name' => $profile->id_document_back_name,
                'is_identity_verified' => (bool) $profile->is_identity_verified,
                'identity_verified_at' => $profile->identity_verified_at?->toIso8601String(),
                'face_match_score' => $profile->face_match_score,
                'liveness_verified' => (bool) $profile->liveness_verified,
                'front_preview_url' => $profile->id_document_path ? route('adopter.id-document.show', ['profile' => $profile->id, 'side' => 'front']) : null,
                'back_preview_url' => $profile->id_document_back_path ? route('adopter.id-document.show', ['profile' => $profile->id, 'side' => 'back']) : null,
            ]) : null,
            'userName' => $user->name,
            'ekycEnabled' => $ekycEnabled,
        ]);
    }

    /**
     * Store or update the adopter's personal info.
     */
    public function store(Request $request, EncryptedFileStorageService $fileStorage): RedirectResponse
    {
        $user = $request->user();
        $ekycEnabled = (bool) SystemSetting::get('ekyc_enabled', true);

        // Require eKYC verification before submitting Step 2 if eKYC is enabled
        if ($ekycEnabled && ! $user->isIdentityVerified()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('eKYC identity verification is required before submitting your personal information.'),
            ]);

            return to_route('onboarding.ekyc.show');
        }

        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'contact_number' => ['required', 'string', 'max:50'],
            'date_of_birth' => ['required', 'date', 'before:today'],
            'home_address' => ['required', 'string', 'max:1000'],
            'valid_id_type' => ['required', 'string', 'max:150'],
            'valid_id_number' => ['required', 'string', 'max:100'],
            'id_document' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'], // max 5MB (Front side)
            'id_document_back' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'], // max 5MB (Back side)
            'had_pets_before' => ['required', 'string', 'in:currently_have,had_before,never'],
            'previous_pet_notes' => ['nullable', 'string', 'max:2000'],
            'surrendered_pet' => ['required', 'boolean'],
            'adoption_reason' => ['required', 'string', 'max:100'],
            'adoption_reason_text' => ['required', 'string', 'max:2000'],
            'pet_stay' => ['required', 'string', 'in:inside,outdoors,both'],
            'terms_read' => ['required', 'accepted'],
            'info_confirmed' => ['required', 'accepted'],
        ], [
            'terms_read.accepted' => 'You must confirm that you have read the adoption terms and conditions.',
            'info_confirmed.accepted' => 'You must confirm that all information provided is accurate and correct.',
            'id_document.max' => 'The front ID document size must not exceed 5MB.',
            'id_document.mimes' => 'The front ID document must be an image (JPG, PNG) or PDF.',
            'id_document_back.max' => 'The back ID document size must not exceed 5MB.',
            'id_document_back.mimes' => 'The back ID document must be an image (JPG, PNG) or PDF.',
        ]);

        unset($validated['terms_read'], $validated['info_confirmed']);

        $existingProfile = $user->adopterProfile;

        // Handle front ID encrypted file upload if provided
        if ($request->hasFile('id_document')) {
            if ($existingProfile?->id_document_path) {
                $fileStorage->deleteFile($existingProfile->id_document_path);
            }

            $stored = $fileStorage->storeEncrypted($request->file('id_document'), 'id_documents');
            $validated['id_document_path'] = $stored['path'];
            $validated['id_document_mime'] = $stored['mime'];
            $validated['id_document_name'] = $stored['original_name'];
        }

        // Handle back ID encrypted file upload if provided
        if ($request->hasFile('id_document_back')) {
            if ($existingProfile?->id_document_back_path) {
                $fileStorage->deleteFile($existingProfile->id_document_back_path);
            }

            $storedBack = $fileStorage->storeEncrypted($request->file('id_document_back'), 'id_documents');
            $validated['id_document_back_path'] = $storedBack['path'];
            $validated['id_document_back_mime'] = $storedBack['mime'];
            $validated['id_document_back_name'] = $storedBack['original_name'];
        }

        unset($validated['id_document'], $validated['id_document_back']);

        AdopterProfile::updateOrCreate(
            ['user_id' => $user->id],
            array_merge($validated, [
                'profile_completed_at' => now(),
            ])
        );

        // Flash message
        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Step 1 Personal Information saved successfully.'),
        ]);

        return to_route('onboarding.lifestyle.edit');
    }

    /**
     * Securely stream decrypted ID document for authorized reviewers or the owner.
     * Supports optional query parameter ?side=front|back (default: front)
     */
    public function viewIdDocument(Request $request, string|int $profile, EncryptedFileStorageService $fileStorage): \Symfony\Component\HttpFoundation\Response
    {
        $profileModel = AdopterProfile::where('id', $profile)
            ->orWhere('user_id', $profile)
            ->firstOrFail();

        $user = $request->user();

        // Authorization check: User must own the profile OR be staff/admin
        $isOwner = $user && $user->id === $profileModel->user_id;
        $isStaff = $user && ($user->hasRole('admin') || $user->hasRole('mao_officer') || $user->hasRole('shelter_staff'));

        if (! $isOwner && ! $isStaff) {
            abort(403, 'Unauthorized to view this identification document.');
        }

        $side = $request->query('side', 'front');

        if ($side === 'back') {
            if (! $profileModel->id_document_back_path) {
                abort(404, 'No back-side identification document uploaded.');
            }

            return $fileStorage->streamDecrypted(
                $profileModel->id_document_back_path,
                $profileModel->id_document_back_name ?: 'id_document_back',
                $profileModel->id_document_back_mime ?: 'image/jpeg'
            );
        }

        if (! $profileModel->id_document_path) {
            abort(404, 'No identification document uploaded.');
        }

        return $fileStorage->streamDecrypted(
            $profileModel->id_document_path,
            $profileModel->id_document_name ?: 'id_document_front',
            $profileModel->id_document_mime ?: 'image/jpeg'
        );
    }
}
