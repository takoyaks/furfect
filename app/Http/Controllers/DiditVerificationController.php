<?php

namespace App\Http\Controllers;

use App\Models\DiditVerification;
use App\Services\DiditVerificationService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DiditVerificationController extends Controller
{
    /**
     * Create a new automated identity verification session.
     */
    public function createSession(Request $request, DiditVerificationService $service): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        try {
            $returnTo = $request->input('return_to', 'onboarding');
            $callbackUrl = route('identity.verification.callback', ['return_to' => $returnTo]);

            $sessionData = $service->createSession($user, $callbackUrl);

            return response()->json([
                'success' => true,
                'session_id' => $sessionData['session_id'],
                'session_token' => $sessionData['session_token'],
                'url' => $sessionData['url'],
                'status' => $sessionData['status'],
            ]);
        } catch (Exception $e) {
            Log::error('Identity verification session creation error: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Unable to initialize identity verification session: '.$e->getMessage(),
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Handle return redirect after completing identity verification.
     */
    public function callback(Request $request, DiditVerificationService $service): RedirectResponse
    {
        $sessionId = $request->query('session_id') ?? $request->query('session_token') ?? $request->query('verification_session_id');
        $returnTo = $request->query('return_to', 'onboarding');

        $verification = null;
        if ($sessionId) {
            $verification = DiditVerification::where('session_id', $sessionId)
                ->orWhere('session_token', $sessionId)
                ->first();
        }

        $user = $request->user();

        // Restore authenticated user session if lost during external redirect from Didit
        if (! $user && $verification && $verification->user) {
            Auth::login($verification->user);
            $user = $verification->user;
        }

        if (! $user) {
            return to_route('login');
        }

        if (! $verification) {
            $verification = $user->latestDiditVerification;
        }

        if ($verification && $verification->session_id) {
            // Always fetch latest decision from Didit on callback to guarantee immediate resolution
            try {
                $decision = $service->getSessionDecision($verification->session_id);
                if ($decision && ! empty($decision)) {
                    $verification = $service->processDecision($decision, $verification->session_id);
                }
            } catch (Exception $e) {
                Log::warning('Error querying Didit decision on callback: '.$e->getMessage());
            }
        }

        $user->refresh();

        if ($user->isIdentityVerified() || ($verification && $verification->isApproved())) {
            Inertia::flash('toast', [
                'type' => 'success',
                'message' => __('Identity and facial liveness verified successfully! Please review and complete your particulars in Step 2.'),
            ]);

            $targetRoute = $returnTo === 'settings' ? 'profile.edit' : 'onboarding.personal.edit';

            return to_route($targetRoute);
        }

        if ($verification && $verification->status === 'declined') {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('Identity verification could not be completed. Please ensure your ID is clear and your face matches the document.'),
            ]);
        } else {
            Inertia::flash('toast', [
                'type' => 'info',
                'message' => __('Identity verification is processing. Your status will update shortly.'),
            ]);
        }

        $fallbackRoute = $returnTo === 'settings' ? 'profile.edit' : 'onboarding.ekyc.show';

        return to_route($fallbackRoute);
    }

    /**
     * Fetch current user's identity verification status.
     */
    public function status(Request $request, DiditVerificationService $service): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $verification = $user->latestDiditVerification;
        $profile = $user->adopterProfile;

        // If not yet verified, proactively poll decision from Didit.
        // Skip for manual admin sessions (fake session IDs should not hit Didit API).
        $isManualAdminSession = $verification && str_starts_with((string) $verification->session_id, 'manual_admin_');

        if (! $user->isIdentityVerified() && $verification && $verification->session_id && ! $verification->isApproved() && ! $isManualAdminSession) {
            try {
                $decision = $service->getSessionDecision($verification->session_id);
                if ($decision && ! empty($decision) && ! in_array(strtolower($decision['status'] ?? ''), ['not started', 'not_started'])) {
                    $verification = $service->processDecision($decision, $verification->session_id);
                    $profile = $user->fresh()->adopterProfile;
                }
            } catch (Exception) {
                // Continue with cached status
            }
        }

        $isVerified = $user->isIdentityVerified() || ($verification && $verification->isApproved());

        return response()->json([
            'is_verified' => $isVerified,
            'verified_at' => $profile?->identity_verified_at?->toIso8601String() ?? ($verification?->verified_at?->toIso8601String()),
            'liveness_verified' => (bool) ($profile?->liveness_verified ?? $verification?->isLivenessPassed()),
            'face_match_score' => $profile?->face_match_score ?? $verification?->face_match_score,
            'verification_status' => $verification?->status ?? 'none',
            'extracted_data' => $verification?->extracted_data,
            'failure_reasons' => $verification?->failure_reasons,
        ]);
    }

    /**
     * Webhook endpoint for asynchronous verification notifications.
     */
    public function webhook(Request $request, DiditVerificationService $service): JsonResponse
    {
        $rawPayload = $request->getContent();
        $signature = $request->header('X-Signature-V2') ?? $request->header('X-Signature');
        $timestamp = $request->header('X-Timestamp');

        // Signature validation
        if (! $service->verifyWebhookSignature($rawPayload, $signature, $timestamp)) {
            Log::warning('Didit webhook signature verification failed', [
                'ip' => $request->ip(),
                'signature' => $signature,
                'timestamp' => $timestamp,
            ]);

            return response()->json(['error' => 'Invalid signature.'], 401);
        }

        $payload = $request->json()->all();

        try {
            $service->processDecision($payload);

            return response()->json(['status' => 'success']);
        } catch (Exception $e) {
            Log::error('Didit webhook processing error: '.$e->getMessage(), [
                'payload' => $payload,
            ]);

            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }
}
