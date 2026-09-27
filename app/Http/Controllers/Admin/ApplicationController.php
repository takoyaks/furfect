<?php

namespace App\Http\Controllers\Admin;

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
     * Display all applications with filtering and master-detail dossier.
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

        // Eager load full relations for all applications on the current page
        $applications->load([
            'adopter.adopterProfile',
            'adopter.latestDiditVerification',
            'adopter.lifestyleProfile',
            'pet.photos',
            'pet.shelter',
            'staff',
            'maoOfficer',
            'releasingOfficer',
            'timelines.actor',
        ]);

        $userIds = $applications->pluck('user_id')->unique()->filter()->values();
        $petIds = $applications->pluck('pet_id')->unique()->filter()->values();

        // Bulk load DSS match scores for all applications on this page
        $dssMatches = DssMatchScore::whereIn('user_id', $userIds)
            ->whereIn('pet_id', $petIds)
            ->get()
            ->keyBy(fn ($item) => "{$item->user_id}_{$item->pet_id}");

        // Bulk load competing applications for pet IDs on this page
        $competingByPet = Application::whereIn('pet_id', $petIds)
            ->whereIn('status', ['pending', 'under_review', 'mao_audit'])
            ->with(['adopter.adopterProfile', 'adopter.lifestyleProfile'])
            ->orderByDesc('dss_score')
            ->get()
            ->groupBy('pet_id');

        // Bulk load adopter history records for user IDs on this page
        $allAdopterHistory = Application::whereIn('user_id', $userIds)
            ->with(['pet.shelter'])
            ->latest('submitted_at')
            ->get()
            ->groupBy('user_id');

        $dossierData = [];
        foreach ($applications as $app) {
            $key = "{$app->user_id}_{$app->pet_id}";
            $dss = $dssMatches->get($key);

            $competing = ($competingByPet->get($app->pet_id) ?? collect())
                ->filter(fn ($c) => $c->id !== $app->id)
                ->values();

            $userHistory = ($allAdopterHistory->get($app->user_id) ?? collect())
                ->filter(fn ($h) => $h->id !== $app->id);

            $trackRecord = [
                'total_applications' => ($allAdopterHistory->get($app->user_id) ?? collect())->count(),
                'prior_adopted_count' => $userHistory->where('status', 'approved')->count(),
                'prior_adopted_pets' => $userHistory->where('status', 'approved')->values(),
                'prior_rejected_count' => $userHistory->where('status', 'rejected')->count(),
                'surrendered_pet' => $app->adopter?->adopterProfile?->surrendered_pet ?? false,
                'had_pets_before' => $app->adopter?->adopterProfile?->had_pets_before ?? 'none',
                'previous_pet_notes' => $app->adopter?->adopterProfile?->previous_pet_notes,
                'pet_stay' => $app->adopter?->adopterProfile?->pet_stay ?? 'inside',
            ];

            $dossierData[$app->id] = [
                'application' => $app,
                'dssMatch' => $dss,
                'competingApplications' => $competing,
                'adopterTrackRecord' => $trackRecord,
            ];
        }

        // Resolve initially selected application
        $selectedId = (int) $request->input('selected');
        if (! $selectedId || ! isset($dossierData[$selectedId])) {
            $selectedId = $applications->first()?->id;
        }

        $selectedBundle = $selectedId && isset($dossierData[$selectedId]) ? $dossierData[$selectedId] : null;

        return Inertia::render('admin/applications/index', [
            'applications' => $applications,
            'dossierData' => $dossierData,
            'selectedApplication' => $selectedBundle ? $selectedBundle['application'] : null,
            'dssMatch' => $selectedBundle ? $selectedBundle['dssMatch'] : null,
            'competingApplications' => $selectedBundle ? $selectedBundle['competingApplications'] : collect(),
            'adopterTrackRecord' => $selectedBundle ? $selectedBundle['adopterTrackRecord'] : null,
            'filters' => [
                'status' => $request->input('status', 'all'),
                'search' => $request->input('search', ''),
                'sort' => $sort,
                'year' => $request->input('year', 'all'),
                'selected' => $selectedId,
            ],
        ]);
    }

    /**
     * Display a specific application audit/details page.
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

        return Inertia::render('admin/applications/show', [
            'application' => $application,
        ]);
    }

    /**
     * Submit an administrative review decision (suitable/not suitable) on an application with automated MAO handoff and audit logging.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $application = Application::with(['pet'])->findOrFail($id);

        if ($application->status !== 'pending' && $application->status !== 'under_review') {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('This application has already been processed.'),
            ]);

            return to_route('admin.applications.index');
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
                title: 'Screening Passed (Admin Oversight)',
                description: "Administrator {$actor->name} verified applicant suitability. Application has been forwarded to the Municipal Agriculture Office (MAO) for statutory compliance audit.",
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
                title: 'Screening Disapproved (Admin Oversight)',
                description: $notes ?: 'Application did not meet adoption suitability criteria.',
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

        return to_route('admin.applications.index');
    }

    /**
     * Confirm the physical handover and release of the pet from admin panel.
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

        $application->pet->update(['status' => 'adopted']);

        $adopterName = $application->adopter?->adopterProfile?->full_name
            ?? $application->adopter?->name
            ?? 'Authorized Adopter';

        $application->logTimeline(
            stage: 'completed',
            action: 'pet_released',
            title: 'Pet Handover Confirmed (Admin Audit)',
            description: "Pet {$application->pet->name} was officially released to {$adopterName}. Release confirmed by Administrator {$actor->name}.",
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
            'message' => __("Pet :name successfully marked as released!", ['name' => $application->pet->name]),
        ]);

        return back();
    }

    /**
     * Mark an approved adoption application as unclaimed from admin panel.
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

        $application->pet->update(['status' => 'available']);

        $application->logTimeline(
            stage: 'closed',
            action: 'adoption_unclaimed',
            title: 'Adoption Forfeited — Pet Unclaimed',
            description: $notes ?: "Adopter failed to pick up {$application->pet->name} within the scheduled pickup deadline. Pet returned to available catalog by Administrator.",
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

    /**
     * Allow admin to override/update status or delete application.
     */
    public function destroy(int $id): RedirectResponse
    {
        $application = Application::findOrFail($id);

        // Re-enable pet status if deleting active application
        if (in_array($application->status, ['pending', 'under_review', 'mao_audit'])) {
            $application->pet->update(['status' => 'available']);
        }

        $application->delete();

        Inertia::flash('toast', [
            'type' => 'info',
            'message' => __('Application deleted successfully.'),
        ]);

        return back();
    }
}
