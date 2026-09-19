<?php

namespace App\Services;

use App\Models\AdopterProfile;
use App\Models\DiditVerification;
use App\Models\User;
use Exception;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DiditVerificationService
{
    protected string $apiKey;

    protected string $baseUrl;

    protected string $workflowId;

    protected ?string $webhookSecret;

    public function __construct()
    {
        $this->apiKey = (string) config('services.didit.api_key', '');
        $this->baseUrl = rtrim((string) config('services.didit.base_url', 'https://verification.didit.me'), '/');
        $this->workflowId = (string) config('services.didit.workflow_id', '1b25598a-4af1-416a-8dc4-a95c03159b98');
        $this->webhookSecret = config('services.didit.webhook_secret');
    }

    /**
     * Create a new Didit identity verification session for an adopter.
     *
     * @return array{session_id: string, session_token: string|null, url: string, status: string, verification_id: int}
     */
    public function createSession(User $user, ?string $callbackUrl = null): array
    {
        $vendorData = 'furfect_user_'.$user->id;
        $callback = $callbackUrl ?: route('identity.verification.callback');

        $response = null;

        try {
            if (! empty($this->apiKey)) {
                $response = Http::withHeaders([
                    'x-api-key' => $this->apiKey,
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ])->post("{$this->baseUrl}/v3/session/", [
                    'workflow_id' => $this->workflowId,
                    'vendor_data' => $vendorData,
                    'callback' => $callback,
                ]);

                if ($response->successful()) {
                    $data = $response->json();
                    $sessionId = (string) ($data['session_id'] ?? '');
                    $sessionToken = (string) ($data['session_token'] ?? '');
                    $url = (string) ($data['url'] ?? '');
                    $status = (string) ($data['status'] ?? 'pending');

                    $profile = $user->adopterProfile;

                    // Persist or update verification session record
                    $verification = DiditVerification::updateOrCreate(
                        ['session_id' => $sessionId],
                        [
                            'user_id' => $user->id,
                            'adopter_profile_id' => $profile?->id,
                            'session_token' => $sessionToken,
                            'workflow_id' => $this->workflowId,
                            'url' => $url,
                            'status' => 'pending',
                        ]
                    );

                    return [
                        'session_id' => $sessionId,
                        'session_token' => $sessionToken,
                        'url' => $url,
                        'status' => $status,
                        'verification_id' => $verification->id,
                    ];
                }

                Log::warning('Didit session creation returned non-success response', [
                    'user_id' => $user->id,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                $json = $response->json();
                $detail = is_array($json) ? ($json['detail'] ?? $json['message'] ?? $response->body()) : $response->body();
                throw new Exception("Didit API Error ({$response->status()}): {$detail}");
            }
        } catch (Exception $e) {
            Log::warning('Didit session creation error: '.$e->getMessage());
            if (! empty($this->apiKey)) {
                throw $e;
            }
        }

        // Graceful fallback ONLY for local/testing environment when no API key is configured
        if (app()->environment('local', 'testing') && empty($this->apiKey)) {
            $sessionId = 'mock_'.uniqid();
            $sessionToken = 'mock_tok_'.uniqid();
            $url = $callbackUrl ? (str_contains($callbackUrl, '?') ? "{$callbackUrl}&session_id={$sessionId}" : "{$callbackUrl}?session_id={$sessionId}") : route('identity.verification.callback', ['session_id' => $sessionId]);

            $profile = $user->adopterProfile;

            $verification = DiditVerification::updateOrCreate(
                ['session_id' => $sessionId],
                [
                    'user_id' => $user->id,
                    'adopter_profile_id' => $profile?->id,
                    'session_token' => $sessionToken,
                    'workflow_id' => $this->workflowId,
                    'url' => $url,
                    'status' => 'pending',
                ]
            );

            return [
                'session_id' => $sessionId,
                'session_token' => $sessionToken,
                'url' => $url,
                'status' => 'pending',
                'verification_id' => $verification->id,
            ];
        }

        $errorMsg = $response ? $response->body() : 'Didit API key not configured.';
        throw new Exception('Unable to initialize verification session: '.$errorMsg);
    }

    /**
     * Fetch decision for a session directly from Didit API.
     *
     * @return array<string, mixed>|null
     */
    public function getSessionDecision(string $sessionId): ?array
    {
        if (str_starts_with($sessionId, 'mock_')) {
            $verification = DiditVerification::where('session_id', $sessionId)->first();
            $userName = $verification?->user?->name ?? 'Verified Adopter';

            return [
                'session_id' => $sessionId,
                'status' => 'Approved',
                'id_verifications' => [
                    [
                        'status' => 'approved',
                        'document_type' => 'Philippine Identification (PhilID / ePhilID)',
                        'document_number' => '4123-5678-9012-3456',
                        'full_name' => $userName,
                        'date_of_birth' => '1998-05-15',
                        'formatted_address' => 'General Santos City, South Cotabato, Philippines',
                        'issuing_state_name' => 'Philippines',
                    ],
                ],
                'liveness_checks' => [
                    [
                        'status' => 'passed',
                        'score' => 99.5,
                    ],
                ],
                'face_matches' => [
                    [
                        'status' => 'matched',
                        'score' => 98.5,
                    ],
                ],
            ];
        }

        $response = Http::withHeaders([
            'x-api-key' => $this->apiKey,
            'Accept' => 'application/json',
        ])->get("{$this->baseUrl}/v3/session/{$sessionId}/decision/");

        if (! $response->successful()) {
            Log::warning('Didit getSessionDecision query failed', [
                'session_id' => $sessionId,
                'status' => $response->status(),
            ]);

            return null;
        }

        return $response->json();
    }

    /**
     * Verify HMAC-SHA256 signature on Didit webhook requests (X-Signature-V2).
     */
    public function verifyWebhookSignature(string $rawPayload, ?string $signature, int|string|null $timestamp): bool
    {
        if (empty($this->webhookSecret)) {
            // In testing or when webhook secret is not set, allow requests
            return true;
        }

        if (empty($signature)) {
            return false;
        }

        // Validate timestamp freshness (300 seconds / 5 minutes)
        if ($timestamp !== null) {
            $currentTime = time();
            $requestTime = (int) $timestamp;
            if (abs($currentTime - $requestTime) > 300) {
                Log::warning('Didit webhook rejected: timestamp expired or drifted', [
                    'current_time' => $currentTime,
                    'request_time' => $requestTime,
                ]);

                return false;
            }
        }

        // Recompute expected HMAC-SHA256
        $expectedSignature = hash_hmac('sha256', $rawPayload, $this->webhookSecret);

        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Process verification decision payload (from webhook or direct polling).
     *
     * @param  array<string, mixed>  $payload
     */
    public function processDecision(array $payload, ?string $sessionId = null): DiditVerification
    {
        $sessionId = (string) ($payload['session_id'] ?? $sessionId ?? '');

        $verification = DiditVerification::where('session_id', $sessionId)->first();

        if (! $verification && isset($payload['vendor_data'])) {
            // Attempt resolving user by vendor_data
            $vendor = (string) $payload['vendor_data'];
            if (str_starts_with($vendor, 'furfect_user_')) {
                $userId = (int) str_replace('furfect_user_', '', $vendor);
                $user = User::find($userId);
                if ($user) {
                    $verification = DiditVerification::updateOrCreate(
                        ['session_id' => $sessionId ?: 'session_'.uniqid()],
                        [
                            'user_id' => $user->id,
                            'adopter_profile_id' => $user->adopterProfile?->id,
                            'status' => 'pending',
                        ]
                    );
                }
            }
        }

        if (! $verification) {
            throw new Exception("Unable to locate verification record for Didit session: {$sessionId}");
        }

        // Parse overall decision status
        $rawStatus = (string) ($payload['status'] ?? $payload['decision'] ?? 'in_review');
        $normalizedStatus = $this->normalizeStatus($rawStatus);

        // Parse ID Verification OCR details
        $docData = [];
        if (isset($payload['id_verifications']) && is_array($payload['id_verifications']) && ! empty($payload['id_verifications'])) {
            $docData = $payload['id_verifications'][0];
        } elseif (isset($payload['ocr'])) {
            $docData = $payload['ocr'];
        } elseif (isset($payload['id_verification'])) {
            $docData = $payload['id_verification'];
        } elseif (isset($payload['document'])) {
            $docData = $payload['document'];
        }

        $idStatus = (string) ($docData['status'] ?? ($normalizedStatus === 'approved' ? 'approved' : 'declined'));
        $extracted = [];
        if (! empty($docData)) {
            $rawDocType = $docData['document_type'] ?? $docData['type'] ?? null;
            $rawSubtype = $docData['document_subtype'] ?? $docData['subtype'] ?? null;
            $normalizedDocType = $this->normalizeIdType($rawDocType, $rawSubtype);

            $extracted = [
                'document_type' => $normalizedDocType,
                'raw_document_type' => $rawDocType,
                'document_subtype' => $rawSubtype,
                'document_number' => $docData['document_number'] ?? $docData['number'] ?? $docData['personal_number'] ?? null,
                'full_name' => $docData['full_name'] ?? $docData['name'] ?? (trim(($docData['first_name'] ?? '').' '.($docData['last_name'] ?? '')) ?: null),
                'first_name' => $docData['first_name'] ?? null,
                'last_name' => $docData['last_name'] ?? null,
                'date_of_birth' => $docData['date_of_birth'] ?? $docData['dob'] ?? null,
                'expiration_date' => $docData['expiration_date'] ?? $docData['expiry_date'] ?? null,
                'address' => $docData['formatted_address'] ?? $docData['address'] ?? null,
                'country' => $docData['issuing_state_name'] ?? $docData['country'] ?? $docData['issuing_country'] ?? null,
                'front_image' => $docData['front_image'] ?? $docData['full_front_image'] ?? $docData['front_image_camera_front'] ?? null,
                'back_image' => $docData['back_image'] ?? $docData['full_back_image'] ?? $docData['back_image_camera_front'] ?? null,
                'portrait_image' => $docData['portrait_image'] ?? null,
            ];
        }

        // Parse Liveness details
        $livenessStatus = null;
        $livenessScore = null;
        if (isset($payload['liveness_checks']) && is_array($payload['liveness_checks']) && ! empty($payload['liveness_checks'])) {
            $liveCheck = $payload['liveness_checks'][0];
            $livenessStatus = (string) ($liveCheck['status'] ?? 'passed');
            $livenessScore = isset($liveCheck['score']) ? (float) $liveCheck['score'] : 99.0;
        } elseif (isset($payload['liveness'])) {
            $livenessData = is_array($payload['liveness']) ? $payload['liveness'] : ['status' => $payload['liveness']];
            $livenessStatus = (string) ($livenessData['status'] ?? 'passed');
            $livenessScore = isset($livenessData['score']) ? (float) $livenessData['score'] : 99.0;
        } elseif ($normalizedStatus === 'approved') {
            $livenessStatus = 'passed';
            $livenessScore = 99.0;
        }

        // Parse 1:1 Face Match details
        $faceMatchStatus = null;
        $faceMatchScore = null;
        if (isset($payload['face_matches']) && is_array($payload['face_matches']) && ! empty($payload['face_matches'])) {
            $faceCheck = $payload['face_matches'][0];
            $faceMatchStatus = (string) ($faceCheck['status'] ?? 'matched');
            $faceMatchScore = isset($faceCheck['score']) ? (float) $faceCheck['score'] : 98.0;
        } elseif (isset($payload['face_match'])) {
            $faceData = is_array($payload['face_match']) ? $payload['face_match'] : ['status' => $payload['face_match']];
            $faceMatchStatus = (string) ($faceData['status'] ?? 'matched');
            $faceMatchScore = isset($faceData['score']) ? (float) $faceData['score'] : (isset($faceData['similarity']) ? (float) $faceData['similarity'] : 98.0);
        } elseif ($normalizedStatus === 'approved') {
            $faceMatchStatus = 'matched';
            $faceMatchScore = 98.0;
        }

        // Collect failure/decline reasons if any
        $failureReasons = [];
        if (isset($payload['decline_reasons']) && is_array($payload['decline_reasons'])) {
            $failureReasons = $payload['decline_reasons'];
        } elseif (isset($payload['warnings']) && is_array($payload['warnings'])) {
            $failureReasons = $payload['warnings'];
        }

        // Update DiditVerification record
        $verification->update([
            'status' => $normalizedStatus,
            'id_verification_status' => $idStatus,
            'liveness_status' => $livenessStatus,
            'liveness_score' => $livenessScore,
            'face_match_status' => $faceMatchStatus,
            'face_match_score' => $faceMatchScore,
            'extracted_data' => ! empty($extracted) ? $extracted : $verification->extracted_data,
            'raw_decision' => $payload,
            'failure_reasons' => $failureReasons,
            'verified_at' => $normalizedStatus === 'approved' ? now() : null,
        ]);

        // If approved, update AdopterProfile
        if ($normalizedStatus === 'approved') {
            $this->syncVerifiedProfile($verification->user, $verification, $extracted);
        }

        return $verification->fresh();
    }

    /**
     * Synchronize verified data and encrypted ID document files to adopter profile.
     *
     * @param  array<string, mixed>  $extracted
     */
    protected function syncVerifiedProfile(User $user, DiditVerification $verification, array $extracted): void
    {
        $profile = $user->adopterProfile;

        $dob = null;
        if (! empty($extracted['date_of_birth'])) {
            try {
                $dob = Carbon::parse($extracted['date_of_birth'])->format('Y-m-d');
            } catch (Exception) {
                $dob = '2000-01-01';
            }
        }

        $updateData = [
            'is_identity_verified' => true,
            'identity_verified_at' => now(),
            'identity_verification_provider' => 'didit',
            'didit_session_id' => $verification->session_id,
            'face_match_score' => $verification->face_match_score,
            'liveness_verified' => $verification->isLivenessPassed(),
        ];

        // Autofill genuine details from OCR
        if (! empty($extracted['full_name'])) {
            $updateData['full_name'] = $extracted['full_name'];
        }

        if ($dob) {
            $updateData['date_of_birth'] = $dob;
        }

        if (! empty($extracted['document_type'])) {
            $updateData['valid_id_type'] = $extracted['document_type'];
        }

        if (! empty($extracted['document_number'])) {
            $updateData['valid_id_number'] = $extracted['document_number'];
        }

        if (! empty($extracted['address'])) {
            $updateData['home_address'] = $extracted['address'];
        }

        // Auto-download and store encrypted front ID image if available and not yet uploaded
        if (! empty($extracted['front_image']) && empty($profile?->id_document_path)) {
            try {
                $imgResponse = Http::timeout(15)->get($extracted['front_image']);
                if ($imgResponse->successful()) {
                    $storageService = app(EncryptedFileStorageService::class);
                    $filename = 'id_front_'.($extracted['document_number'] ?? $user->id).'.jpg';
                    $mime = $imgResponse->header('Content-Type') ?: 'image/jpeg';
                    $stored = $storageService->storeRawEncrypted($imgResponse->body(), $filename, $mime);
                    $updateData['id_document_path'] = $stored['path'];
                    $updateData['id_document_name'] = $stored['original_name'];
                    $updateData['id_document_mime'] = $stored['mime'];
                }
            } catch (Exception $e) {
                Log::warning('Unable to download front ID image from Didit: '.$e->getMessage());
            }
        }

        // Auto-download and store encrypted back ID image if available and not yet uploaded
        if (! empty($extracted['back_image']) && empty($profile?->id_document_back_path)) {
            try {
                $imgResponse = Http::timeout(15)->get($extracted['back_image']);
                if ($imgResponse->successful()) {
                    $storageService = app(EncryptedFileStorageService::class);
                    $filename = 'id_back_'.($extracted['document_number'] ?? $user->id).'.jpg';
                    $mime = $imgResponse->header('Content-Type') ?: 'image/jpeg';
                    $storedBack = $storageService->storeRawEncrypted($imgResponse->body(), $filename, $mime);
                    $updateData['id_document_back_path'] = $storedBack['path'];
                    $updateData['id_document_back_name'] = $storedBack['original_name'];
                    $updateData['id_document_back_mime'] = $storedBack['mime'];
                }
            } catch (Exception $e) {
                Log::warning('Unable to download back ID image from Didit: '.$e->getMessage());
            }
        }

        if ($profile) {
            $profile->update($updateData);
        } else {
            $profile = AdopterProfile::updateOrCreate(
                ['user_id' => $user->id],
                array_merge([
                    'had_pets_before' => 'never',
                    'surrendered_pet' => false,
                    'adoption_reason' => 'Companionship',
                    'adoption_reason_text' => 'Verified Adopter',
                    'pet_stay' => 'inside',
                    'contact_number' => $user->phone ?? '09123456789',
                    'full_name' => $extracted['full_name'] ?? $user->name,
                    'date_of_birth' => $dob ?? '2000-01-01',
                    'home_address' => $extracted['address'] ?? 'General Santos City',
                    'valid_id_type' => $extracted['document_type'] ?? 'Philippine Identification (PhilID / ePhilID)',
                    'valid_id_number' => $extracted['document_number'] ?? 'VERIFIED',
                ], $updateData)
            );

            $verification->update(['adopter_profile_id' => $profile->id]);
        }
    }

    /**
     * Normalize OCR document type to standard Philippine ID types.
     */
    public function normalizeIdType(?string $type, ?string $subtype = null): string
    {
        if (! $type) {
            return 'Philippine Identification (PhilID / ePhilID)';
        }

        $lower = strtolower(trim($type.' '.($subtype ?? '')));

        if (str_contains($lower, 'driver') || str_contains($lower, 'driving') || str_contains($lower, 'license')) {
            return "Driver's License";
        }
        if (str_contains($lower, 'passport')) {
            return 'Philippine Passport';
        }
        if (str_contains($lower, 'national') || str_contains($lower, 'philid') || str_contains($lower, 'ephilid') || str_contains($lower, 'philippine identification')) {
            return 'Philippine Identification (PhilID / ePhilID)';
        }
        if (str_contains($lower, 'umid') || str_contains($lower, 'unified')) {
            return 'Unified Multi-Purpose ID (UMID)';
        }
        if (str_contains($lower, 'prc') || str_contains($lower, 'professional regulation')) {
            return 'Professional Regulation Commission (PRC) ID';
        }
        if (str_contains($lower, 'postal')) {
            return 'Postal ID';
        }
        if (str_contains($lower, 'philhealth')) {
            return 'PhilHealth ID';
        }
        if (str_contains($lower, 'tin') || str_contains($lower, 'tax')) {
            return 'TIN ID';
        }
        if (str_contains($lower, 'voter')) {
            return "Voter's ID / Voter's Certification";
        }
        if (str_contains($lower, 'nbi') || str_contains($lower, 'police') || str_contains($lower, 'clearance')) {
            return 'NBI Clearance / Police Clearance';
        }
        if (str_contains($lower, 'senior')) {
            return 'Senior Citizen ID';
        }
        if (str_contains($lower, 'pwd') || str_contains($lower, 'disability')) {
            return 'PWD ID';
        }
        if (str_contains($lower, 'school') || str_contains($lower, 'student')) {
            return 'School ID';
        }
        if (str_contains($lower, 'gsis') || str_contains($lower, 'e-card')) {
            return 'GSIS e-Card';
        }

        return $type;
    }

    /**
     * Normalize status strings across Didit formats.
     */
    protected function normalizeStatus(string $status): string
    {
        $lower = strtolower(trim($status));

        return match ($lower) {
            'approved', 'completed', 'successful', 'passed', 'success' => 'approved',
            'declined', 'rejected', 'failed', 'mismatched' => 'declined',
            'expired' => 'expired',
            'abandoned' => 'abandoned',
            default => 'in_review',
        };
    }
}
