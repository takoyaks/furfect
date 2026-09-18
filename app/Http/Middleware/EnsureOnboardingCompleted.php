<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOnboardingCompleted
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Only enforce for authenticated adopters (users without staff/admin roles)
        if ($user && ! $user->hasAnyRole(['admin', 'shelter_staff', 'mao_officer'])) {
            $currentRoute = $request->route()?->getName();

            // Exempt onboarding, identity verification, auth verification, password confirmation, settings, and logout routes
            if (
                $request->is('onboarding/*', 'identity/*', 'verification/*', 'password/*', 'settings/*', 'logout', 'adopter/*/id-document') ||
                in_array($currentRoute, [
                    'onboarding.ekyc.show',
                    'onboarding.personal.edit',
                    'onboarding.personal.store',
                    'onboarding.lifestyle.edit',
                    'onboarding.lifestyle.store',
                    'identity.verification.session',
                    'identity.verification.callback',
                    'identity.verification.status',
                    'adopter.id-document.show',
                    'logout',
                    'verification.notice',
                    'verification.verify',
                    'verification.send',
                    'password.confirm',
                ])
            ) {
                return $next($request);
            }

            // Step 1 check: eKYC Identity Verification
            if (! $user->isIdentityVerified()) {
                return redirect()->route('onboarding.ekyc.show');
            }

            // Step 2 check: Personal information profile
            if (! $user->adopterProfile?->profile_completed_at) {
                return redirect()->route('onboarding.personal.edit');
            }

            // Step 3 check: Lifestyle quiz profile
            if (! $user->lifestyleProfile?->submitted_at) {
                return redirect()->route('onboarding.lifestyle.edit');
            }
        }

        return $next($request);
    }
}
