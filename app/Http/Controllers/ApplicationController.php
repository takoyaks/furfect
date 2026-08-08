<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\DssMatchScore;
use App\Models\Pet;
use App\Models\SystemSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationController extends Controller
{
    /**
     * Show the adopter's current active application status.
     */
    public function show(Request $request): Response
    {
        $user = $request->user();

        // Get the latest active or past application
        $application = Application::where('user_id', $user->id)
            ->with(['pet.photos', 'pet.shelter'])
            ->latest()
            ->first();

        return Inertia::render('application/status', [
            'application' => $application,
        ]);
    }

    /**
     * Submit a new adoption application for a pet.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        // 1. Ensure onboarding is completed
        if (! $user->hasCompletedOnboarding()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('Please complete your personal profile and lifestyle quiz first.')
            ]);
            return to_route('onboarding.personal.edit');
        }

        // 2. Check for active application limit
        $maxActive = SystemSetting::get('max_active_applications', 1);
        $activeCount = Application::where('user_id', $user->id)
            ->whereIn('status', ['pending', 'under_review', 'mao_audit'])
            ->count();

        if ($activeCount >= $maxActive) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('You already have an active application. You can only apply for one pet at a time.')
            ]);
            return to_route('application.show');
        }

        // 3. Check for reapply cooldown after rejection
        $lastApplication = Application::where('user_id', $user->id)
            ->where('status', 'rejected')
            ->latest('resolved_at')
            ->first();

        if ($lastApplication) {
            $cooldownDays = SystemSetting::get('reapply_cooldown_days', 0);
            if ($cooldownDays > 0) {
                $daysSinceRejection = now()->diffInDays($lastApplication->resolved_at);
                if ($daysSinceRejection < $cooldownDays) {
                    $remaining = $cooldownDays - $daysSinceRejection;
                    Inertia::flash('toast', [
                        'type' => 'error',
                        'message' => __("You must wait {$remaining} more day(s) before applying again.")
                    ]);
                    return to_route('pets.index');
                }
            }
        }

        $request->validate([
            'pet_id' => ['required', 'exists:pets,id'],
        ]);

        $petId = $request->input('pet_id');
        $pet = Pet::findOrFail($petId);

        if ($pet->status !== 'available') {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('This pet is no longer available for adoption.')
            ]);
            return to_route('pets.index');
        }

        // 4. Fetch the DSS compatibility score snapshot
        $score = DssMatchScore::where('user_id', $user->id)
            ->where('pet_id', $pet->id)
            ->first();

        $dssScoreValue = $score ? $score->total_score : 0.0;

        // 5. Create application
        $application = Application::create([
            'user_id' => $user->id,
            'pet_id' => $pet->id,
            'dss_score' => $dssScoreValue,
            'status' => 'pending',
            'submitted_at' => now(),
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Your application has been submitted successfully!')
        ]);

        return to_route('application.show');
    }
}
