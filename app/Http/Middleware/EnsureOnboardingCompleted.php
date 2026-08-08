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
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Only enforce for authenticated adopters (users without staff/admin roles)
        if ($user && !$user->hasAnyRole(['admin', 'shelter_staff', 'mao_officer'])) {
            $currentRoute = $request->route()?->getName();

            // Exempt onboarding, auth verification, password confirmation, settings, and logout routes
            if (
                $request->is('onboarding/*', 'verification/*', 'password/*', 'settings/*', 'logout') ||
                in_array($currentRoute, [
                    'onboarding.personal.edit',
                    'onboarding.personal.store',
                    'onboarding.lifestyle.edit',
                    'onboarding.lifestyle.store',
                    'logout',
                    'verification.notice',
                    'verification.verify',
                    'verification.send',
                    'password.confirm',
                ])
            ) {
                return $next($request);
            }

            // Step 1 check: Personal information profile
            if (!$user->adopterProfile?->profile_completed_at) {
                return redirect()->route('onboarding.personal.edit');
            }

            // Step 2 check: Lifestyle quiz profile
            if (!$user->lifestyleProfile?->submitted_at) {
                return redirect()->route('onboarding.lifestyle.edit');
            }
        }

        return $next($request);
    }
}
