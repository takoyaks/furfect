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
        $query = Application::with(['adopter.adopterProfile', 'pet.shelter']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('year') && $request->input('year') !== 'all') {
            $query->whereYear('submitted_at', (int) $request->input('year'));
        }

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search): void {
                $q->where('reference_number', 'like', "%{$search}%")
                    ->orWhereHas('adopter', function ($adopterQ) use ($search): void {
                        $adopterQ->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('pet', function ($petQ) use ($search): void {
                        $petQ->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $sort = $request->input('sort', 'newest');
        match ($sort) {
            'oldest' => $query->oldest('submitted_at'),
            'dss_high' => $query->orderByDesc('dss_score'),
            'dss_low' => $query->orderBy('dss_score'),
            default => $query->latest('submitted_at'),
        };

        $applications = $query->paginate(10)->withQueryString();

        // Resolve selected application
        $selectedId = $request->input('selected');
        $selectedApplication = null;

        if ($selectedId) {
            $selectedApplication = Application::with([
                'adopter.adopterProfile',
                'adopter.latestDiditVerification',
                'adopter.lifestyleProfile',
                'pet.photos',
                'pet.shelter',
                'staff',
                'maoOfficer',
                'releasingOfficer',
                'timelines.actor',
            ])->find($selectedId);
        }

        if (! $selectedApplication && $applications->isNotEmpty()) {
            $firstId = $applications->first()->id;
            $selectedApplication = Application::with([
                'adopter.adopterProfile',
                'adopter.latestDiditVerification',
                'adopter.lifestyleProfile',
                'pet.photos',
                'pet.shelter',
                'staff',
                'maoOfficer',
                'releasingOfficer',
                'timelines.actor',
            ])->find($firstId);
        }

        $dssMatch = null;
        $competingApplications = collect();
        $adopterTrackRecord = null;

        if ($selectedApplication) {
            $dssMatch = DssMatchScore::where('user_id', $selectedApplication->user_id)
                ->where('pet_id', $selectedApplication->pet_id)
                ->first();

            $competingApplications = Application::where('pet_id', $selectedApplication->pet_id)
                ->where('id', '!=', $selectedApplication->id)
                ->whereIn('status', ['pending', 'under_review', 'mao_audit'])
                ->with(['adopter.adopterProfile', 'adopter.lifestyleProfile'])
                ->orderByDesc('dss_score')
                ->get();

            $adopterHistory = Application::where('user_id', $selectedApplication->user_id)
                ->where('id', '!=', $selectedApplication->id)
                ->with(['pet.shelter'])
                ->latest('submitted_at')
                ->get();

            $adopterTrackRecord = [
                'total_applications' => Application::where('user_id', $selectedApplication->user_id)->count(),
                'prior_adopted_count' => $adopterHistory->where('status', 'approved')->count(),
                'prior_adopted_pets' => $adopterHistory->where('status', 'approved')->values(),
                'prior_rejected_count' => $adopterHistory->where('status', 'rejected')->count(),
                'surrendered_pet' => $selectedApplication->adopter?->adopterProfile?->surrendered_pet ?? false,
                'had_pets_before' => $selectedApplication->adopter?->adopterProfile?->had_pets_before ?? 'none',
                'previous_pet_notes' => $selectedApplication->adopter?->adopterProfile?->previous_pet_notes,
                'pet_stay' => $selectedApplication->adopter?->adopterProfile?->pet_stay ?? 'inside',
            ];
        }

        return Inertia::render('shelter/applications/index', [
            'applications' => $applications,
            'selectedApplication' => $selectedApplication,
            'dssMatch' => $dssMatch,
            'competingApplications' => $competingApplications,
            'adopterTrackRecord' => $adopterTrackRecord,
            'filters' => [
                'status' => $request->input('status', 'all'),
                'search' => $request->input('search', ''),
                'sort' => $sort,
                'year' => $request->input('year', 'all'),
                'selected' => $selectedApplication?->id,
            ],
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
            'releasingOfficer',
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

    /**
     * Confirm the physical handover and release of the pet to the adopter.
     */
    public function confirmRelease(Request $request, int $id): RedirectResponse
    {
        $application = Application::with(['pet', 'adopter.adopterProfile'])->findOrFail($id);

        if ($application->status !== 'approved') {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('Only approved applications can be confirmed for pet release.'),
            ]);

            return back();
        }

        $request->validate([
            'notes' => ['nullable', 'string', 'max:2000'],
            'checklist' => ['nullable', 'array'],
            'checklist.*' => ['boolean'],
        ]);

        $actor = $request->user();
        $notes = $request->input('notes');
        $checklist = $request->input('checklist', []);

        $application->update([
            'status' => 'completed',
            'released_at' => now(),
            'releasing_officer_id' => $actor->id,
            'releasing_notes' => $notes,
            'release_checklist' => $checklist,
        ]);

        // Keep pet status permanently adopted
        $application->pet->update(['status' => 'adopted']);

        $adopterName = $application->adopter?->adopterProfile?->full_name
            ?? $application->adopter?->name
            ?? 'Authorized Adopter';

        $application->logTimeline(
            stage: 'completed',
            action: 'pet_released',
            title: 'Pet Handover Confirmed — Adoption Completed',
            description: "Pet {$application->pet->name} was officially released and turned over to {$adopterName}. Physical custody transferred and municipal registry confirmed.",
            actor: $actor,
            metadata: [
                'released_at' => now()->toIso8601String(),
                'releasing_officer' => $actor->name,
                'releasing_notes' => $notes,
                'checklist' => $checklist,
            ]
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __("Pet :name successfully marked as released and handed over to the adopter!", ['name' => $application->pet->name]),
        ]);

        return back();
    }

    /**
     * Mark an approved adoption application as unclaimed if the 7-day pickup deadline expired.
     */
    public function markUnclaimed(Request $request, int $id): RedirectResponse
    {
        $application = Application::with(['pet', 'adopter'])->findOrFail($id);

        if ($application->status !== 'approved') {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('Only approved applications can be marked as unclaimed.'),
            ]);

            return back();
        }

        $request->validate([
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $actor = $request->user();
        $notes = $request->input('notes');

        $application->update([
            'status' => 'unclaimed',
            'releasing_notes' => $notes,
        ]);

        // Return pet to available catalog
        $application->pet->update(['status' => 'available']);

        $application->logTimeline(
            stage: 'closed',
            action: 'adoption_unclaimed',
            title: 'Adoption Forfeited — Pet Unclaimed',
            description: $notes ?: "Adopter failed to pick up {$application->pet->name} within the scheduled pickup deadline. Pet returned to available catalog.",
            actor: $actor,
            metadata: [
                'reason' => 'Unclaimed after deadline',
                'notes' => $notes,
            ]
        );

        Inertia::flash('toast', [
            'type' => 'warning',
            'message' => __("Application marked as unclaimed. :name has been returned to the available catalog.", ['name' => $application->pet->name]),
        ]);

        return back();
    }
}
