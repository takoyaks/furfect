<?php

namespace App\Http\Controllers\Shelter;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\DssMatchScore;
use App\Services\AdoptionNotificationService;
use App\Services\MultiApplicationResolutionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationController extends Controller
{
    /**
     * Display a listing of applications for shelter staff.
     */
    public function index(Request $request): Response
    {
        $query = Application::with(['adopter.adopterProfile', 'pet.shelter'])->latest('submitted_at');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $applications = $query->paginate(10)->withQueryString();

        return Inertia::render('shelter/applications/index', [
            'applications' => $applications,
            'filters' => $request->only(['status']),
        ]);
    }

    /**
     * Display application details, adopter profile, lifestyle quiz answers, 8-factor DSS score, and full audit timeline.
     */
    public function show(int $id): Response
    {
        $application = Application::with([
            'adopter.adopterProfile',
            'adopter.latestDiditVerification',
            'adopter.lifestyleProfile',
            'pet.photos',
            'pet.shelter',
            'staff',
            'maoOfficer',
            'timelines.actor',
        ])->findOrFail($id);

        // Fetch the detailed DSS score record
        $dssMatch = DssMatchScore::where('user_id', $application->user_id)
            ->where('pet_id', $application->pet_id)
            ->first();

        // Fetch competing active applications for the same pet (ranked by DSS score)
        $competingApplications = Application::where('pet_id', $application->pet_id)
            ->where('id', '!=', $application->id)
            ->whereIn('status', ['pending', 'under_review', 'mao_audit'])
            ->with(['adopter.adopterProfile', 'adopter.lifestyleProfile'])
            ->orderByDesc('dss_score')
            ->get();

        // Fetch adopter's prior adoption track record & historical applications
        $adopterHistory = Application::where('user_id', $application->user_id)
            ->where('id', '!=', $application->id)
            ->with(['pet.shelter'])
            ->latest('submitted_at')
            ->get();

        $adopterTrackRecord = [
            'total_applications' => Application::where('user_id', $application->user_id)->count(),
            'prior_adopted_count' => $adopterHistory->where('status', 'approved')->count(),
            'prior_adopted_pets' => $adopterHistory->where('status', 'approved')->values(),
            'prior_rejected_count' => $adopterHistory->where('status', 'rejected')->count(),
            'surrendered_pet' => $application->adopter?->adopterProfile?->surrendered_pet ?? false,
            'had_pets_before' => $application->adopter?->adopterProfile?->had_pets_before ?? 'none',
            'previous_pet_notes' => $application->adopter?->adopterProfile?->previous_pet_notes,
            'pet_stay' => $application->adopter?->adopterProfile?->pet_stay ?? 'inside',
        ];

        return Inertia::render('shelter/applications/show', [
            'application' => $application,
            'dssMatch' => $dssMatch,
            'competingApplications' => $competingApplications,
            'adopterTrackRecord' => $adopterTrackRecord,
        ]);
    }

    /**
     * Submit a review decision (suitable/not suitable) on an application with automated MAO handoff and audit logging.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $application = Application::with(['pet'])->findOrFail($id);

        if ($application->status !== 'pending' && $application->status !== 'under_review') {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('This application has already been processed.'),
            ]);

            return to_route('shelter.applications.index');
        }

        $request->validate([
            'decision' => ['required', 'string', 'in:suitable,not_suitable'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $decision = $request->input('decision');
        $notes = $request->input('notes');
        $actor = $request->user();

        $status = $decision === 'suitable' ? 'mao_audit' : 'rejected';

        // Update application state
        $application->update([
            'status' => $status,
            'staff_id' => $actor->id,
            'staff_decision' => $decision,
            'staff_notes' => $notes,
            'reviewed_at' => now(),
            // When moving to MAO audit, set a fresh 48h SLA timer for MAO compliance review
            'target_sla_at' => $status === 'mao_audit' ? now()->addHours(48) : null,
            'resolved_at' => $status === 'rejected' ? now() : null,
        ]);

        // If rejected, release pet back to available
        if ($status === 'rejected') {
            $application->pet->update(['status' => 'available']);
        }

        // Record immutable audit timeline entry
        if ($decision === 'suitable') {
            $application->logTimeline(
                stage: 'screening',
                action: 'shelter_marked_suitable',
                title: 'Shelter Initial Screening Passed',
                description: 'Shelter staff verified applicant suitability. Application has been forwarded to the Municipal Agriculture Office (MAO) for statutory compliance audit.',
                actor: $actor,
                metadata: [
                    'decision' => 'suitable',
                    'staff_notes' => $notes,
                    'forwarded_to' => 'Municipal Agriculture Office (MAO)',
                    'target_sla_hours' => 48,
                ]
            );

            // Handle competing applicants: place on priority standby / waitlist
            app(MultiApplicationResolutionService::class)->handlePrimaryEndorsedToMao($application);
        } else {
            $application->logTimeline(
                stage: 'screening',
                action: 'shelter_rejected',
                title: 'Shelter Screening Disapproved',
                description: $notes ?: 'Application did not meet shelter adoption suitability criteria.',
                actor: $actor,
                metadata: [
                    'decision' => 'not_suitable',
                    'staff_notes' => $notes,
                ]
            );
        }

        // Dispatch notifications to adopter and MAO officers (if endorsed)
        app(AdoptionNotificationService::class)->notifyShelterDecision($application, $decision);

        $message = $decision === 'suitable'
            ? __('Application marked as SUITABLE and automatically forwarded to MAO Compliance Audit queue.')
            : __('Application rejected successfully.');

        Inertia::flash('toast', [
            'type' => $decision === 'suitable' ? 'success' : 'info',
            'message' => $message,
        ]);

        return to_route('shelter.applications.index');
    }
}
