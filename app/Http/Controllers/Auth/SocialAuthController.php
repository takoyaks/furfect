<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Spatie\Permission\Models\Role;

class SocialAuthController extends Controller
{
    /**
     * Redirect the user to the Google OAuth authentication page.
     */
    public function redirectToGoogle(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Obtain the user information from Google and authenticate.
     */
    public function handleGoogleCallback(Request $request): RedirectResponse
    {
        try {
            /** @var \Laravel\Socialite\Two\User $googleUser */
            $googleUser = Socialite::driver('google')->user();
        } catch (\Throwable $e) {
            Log::warning('Google OAuth callback failed', [
                'message' => $e->getMessage(),
            ]);

            return redirect()->route('login')->withErrors([
                'email' => 'Unable to authenticate with Google. Please try again or use your password.',
            ]);
        }

        $googleId = (string) $googleUser->getId();
        $email = strtolower(trim((string) $googleUser->getEmail()));
        $name = trim((string) ($googleUser->getName() ?? $googleUser->getNickname() ?? 'Adopter'));
        $avatar = $googleUser->getAvatar();

        if (empty($email)) {
            return redirect()->route('login')->withErrors([
                'email' => 'No email address was provided by your Google account.',
            ]);
        }

        // 1. Resolve user: check by google_id first, then fallback to email for seamless account linking
        $user = User::where('google_id', $googleId)->first();

        if (! $user) {
            $user = User::where('email', $email)->first();

            if ($user) {
                $user->google_id = $googleId;
            }
        }

        // 2. Security audit: block suspended accounts immediately
        if ($user && $user->isSuspended()) {
            $reason = $user->suspended_reason ?: 'Administrative review';

            return redirect()->route('login')->withErrors([
                'email' => "Your account has been suspended. Reason: {$reason}. Please contact municipal animal welfare administration.",
            ]);
        }

        // 3. Create new adopter account if user does not exist
        if (! $user) {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'google_id' => $googleId,
                'avatar' => $avatar,
                'email_verified_at' => now(),
                'password' => Hash::make(Str::random(32)),
                'failed_login_attempts' => 0,
            ]);

            Role::firstOrCreate(['name' => 'adopter']);
            $user->assignRole('adopter');
        } else {
            // Existing user: mark email verified via Google if not already verified
            if (! $user->email_verified_at) {
                $user->email_verified_at = now();
            }

            if (! $user->avatar && $avatar) {
                $user->avatar = $avatar;
            }

            $user->failed_login_attempts = 0;
            $user->lockout_until = null;
            $user->save();
        }

        // 4. Authenticate user and regenerate session
        Auth::login($user, remember: true);
        $request->session()->regenerate();

        // 5. Role-based routing aligned with application standards
        if ($user->hasRole('admin')) {
            return redirect()->route('admin.dashboard');
        }

        if ($user->hasRole('shelter_staff')) {
            return redirect()->route('shelter.pets.index');
        }

        if ($user->hasRole('mao_staff')) {
            return redirect()->route('mao.dashboard');
        }

        if (! $user->hasAnyRole(['admin', 'shelter_staff', 'mao_staff']) && ! $user->adopterProfile?->profile_completed_at) {
            return redirect()->route('onboarding.personal.edit');
        }

        return redirect()->intended(config('fortify.home', '/dashboard'));
    }
}
