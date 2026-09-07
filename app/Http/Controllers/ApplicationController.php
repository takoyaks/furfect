<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\DssMatchScore;
use App\Models\Pet;
use App\Models\SystemSetting;
use App\Services\AdoptionNotificationService;
use App\Services\DssMatchingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationController extends Controller
{
    /**
     * Show the adopter's current active application status and tracking timeline.
     */
    public function show(Request $request, DssMatchingService $dssService): Response
    {
        $user = $request->user();
        $targetId = $request->query('id') ?? $request->query('application_id');

        $query = Application::where('user_id', $user->id)
            ->with([
                'user.adopterProfile',
                'pet.photos',
                'pet.shelter',
                'staff',
                'maoOfficer',
                'timelines.actor',
            ]);

        if ($targetId) {
            $application = (clone $query)->where('id', $targetId)->first();
        } else {
            // Load approved or active application first, fallback to latest
            $application = (clone $query)->whereIn('status', ['approved', 'mao_audit', 'under_review', 'pending'])
                ->latest('submitted_at')
                ->first() ?? (clone $query)->latest('submitted_at')->first();
        }

        $recommendedPets = collect();
        $isWaitlisted = false;

        if ($application) {
            // Check if application is in standby because another applicant for the same pet is in MAO audit
            if (in_array($application->status, ['pending', 'under_review'])) {
                $isWaitlisted = Application::where('pet_id', $application->pet_id)
                    ->where('id', '!=', $application->id)
                    ->where('status', 'mao_audit')
                    ->exists();
            }

            // If waitlisted or rejected or pet adopted, offer top alternative DSS matches
            if ($isWaitlisted || $application->status === 'rejected' || $application->pet->status === 'adopted') {
                $recommendedPets = $dssService->getTopAlternativeRecommendations($user, $application->pet_id, 3);
            }
        }

        return Inertia::render('application/status', [
            'application' => $application,
            'isWaitlisted' => $isWaitlisted,
            'recommendedPets' => $recommendedPets,
        ]);
    }

    /**
     * Transfer or reapply seamlessly to a recommended alternative pet with 1-click.
     */
    public function transfer(Request $request, DssMatchingService $dssService): RedirectResponse
    {
        $user = $request->user();

        $request->validate([
            'pet_id' => ['required', 'exists:pets,id'],
        ]);

        $petId = (int) $request->input('pet_id');
        $pet = Pet::findOrFail($petId);

        if ($pet->status !== 'available') {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('This pet is no longer available for adoption.'),
            ]);

            return back();
        }

        // Close any existing active/standby applications gracefully
        $existingActive = Application::where('user_id', $user->id)
            ->whereIn('status', ['pending', 'under_review'])
            ->get();

        foreach ($existingActive as $oldApp) {
            $oldApp->update([
                'status' => 'rejected',
                'staff_notes' => 'Application voluntarily transferred to another pet.',
                'resolved_at' => now(),
            ]);
            $oldApp->logTimeline(
                stage: 'resolved',
                action: 'voluntarily_transferred',
                title: 'Application Transferred to Another Pet',
                description: "Applicant opted to transfer adoption interest to {$pet->name}.",
                actor: $user
            );
        }

        $lifestyle = $user->lifestyleProfile;
        $dssResult = $lifestyle
            ? $dssService->computeScore($lifestyle, $pet)
            : ['total_score' => 0.0, 'fast_track_eligible' => false, 'breakdown_details' => []];

        $application = Application::create([
            'user_id' => $user->id,
            'pet_id' => $pet->id,
            'dss_score' => $dssResult['total_score'],
            'fast_track_eligible' => $dssResult['fast_track_eligible'] ?? false,
            'dss_breakdown' => $dssResult['breakdown_details'] ?? null,
            'status' => 'pending',
            'submitted_at' => now(),
            'target_sla_at' => now()->addHours(24),
        ]);

        $application->logTimeline(
            stage: 'submission',
            action: 'reapplied_alternative_match',
            title: 'Application Submitted for Selected Pet',
            description: "Application submitted for {$pet->name} with DSS match score of {$dssResult['total_score']}%.",
            actor: $user,
            metadata: [
                'dss_score' => $dssResult['total_score'],
                'transferred_from_recommendation' => true,
            ]
        );

        // Dispatch notifications
        app(AdoptionNotificationService::class)->notifyApplicationSubmitted($application);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __("Application successfully submitted for {$pet->name}!"),
        ]);

        return to_route('application.show');
    }

    /**
     * Voluntarily withdraw an active or standby application.
     */
    public function withdraw(Request $request): RedirectResponse
    {
        $user = $request->user();

        $application = Application::where('user_id', $user->id)
            ->whereIn('status', ['pending', 'under_review'])
            ->latest('submitted_at')
            ->first();

        if (! $application) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('No eligible active or standby application found to withdraw.'),
            ]);

            return back();
        }

        $application->update([
            'status' => 'rejected',
            'staff_notes' => 'Voluntarily withdrawn by applicant.',
            'resolved_at' => now(),
        ]);

        $application->logTimeline(
            stage: 'resolved',
            action: 'applicant_withdrawn',
            title: 'Application Voluntarily Withdrawn',
            description: 'Applicant opted to withdraw from the review/standby queue.',
            actor: $user
        );

        Inertia::flash('toast', [
            'type' => 'info',
            'message' => __('Application withdrawn. You can now apply for any available pet.'),
        ]);

        return to_route('pets.index');
    }

    /**
     * Submit a new adoption application for a pet with automated DSS score snapshot and timeline.
     */
    public function store(Request $request, DssMatchingService $dssService): RedirectResponse
    {
        $user = $request->user();

        // 1. Ensure onboarding is completed
        if (! $user->hasCompletedOnboarding()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('Please complete your personal profile and lifestyle quiz first.'),
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
                'message' => __('You already have an active application. You can only apply for one pet at a time.'),
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
                        'message' => __("You must wait {$remaining} more day(s) before applying again."),
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
                'message' => __('This pet is no longer available for adoption.'),
            ]);

            return to_route('pets.index');
        }

        // 4. Calculate DSS score snapshot
        $score = DssMatchScore::where('user_id', $user->id)
            ->where('pet_id', $pet->id)
            ->first();

        if (! $score && $user->lifestyleProfile) {
            $calc = $dssService->computeScore($user->lifestyleProfile, $pet);
            $score = DssMatchScore::create(array_merge($calc, [
                'user_id' => $user->id,
                'pet_id' => $pet->id,
                'computed_at' => now(),
            ]));
        }

        $dssScoreValue = $score ? (float) $score->total_score : 0.0;
        $fastTrackEligible = $score ? (bool) $score->fast_track_eligible : false;
        $dssBreakdown = $score ? $score->breakdown_details : null;

        // 5. Create application with 48h initial SLA target
        $application = Application::create([
            'user_id' => $user->id,
            'pet_id' => $pet->id,
            'dss_score' => $dssScoreValue,
            'fast_track_eligible' => $fastTrackEligible,
            'dss_breakdown' => $dssBreakdown,
            'status' => 'pending',
            'submitted_at' => now(),
            'target_sla_at' => now()->addHours(48),
        ]);

        // 6. Log initial submission in timeline audit trail
        $application->logTimeline(
            stage: 'submitted',
            action: 'application_submitted',
            title: 'Adoption Application Submitted',
            description: "Application successfully submitted with an automated DSS Compatibility Score of {$dssScoreValue}%.".($fastTrackEligible ? ' Fast-track screening recommended.' : ''),
            actor: $user,
            metadata: [
                'dss_score' => $dssScoreValue,
                'fast_track_eligible' => $fastTrackEligible,
                'pet_name' => $pet->name,
                'reference_number' => $application->reference_number,
            ]
        );

        // 7. Dispatch notifications to adopter and shelter staff
        app(AdoptionNotificationService::class)->notifyApplicationSubmitted($application);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Your application has been submitted successfully! Review tracking is now active.'),
        ]);

        return to_route('application.show');
    }
}
