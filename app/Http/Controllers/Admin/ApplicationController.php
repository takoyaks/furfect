<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\DssMatchScore;
use App\Models\SystemSetting;
use App\Notifications\ApplicationStatusUpdatedNotification;
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
        $query = Application::with([
            'adopter.adopterProfile',
            'adopter.lifestyleProfile',
            'adopter.latestDiditVerification',
            'pet.shelter',
        ]);

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
            'closedBy',
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

            $checklist = $this->evaluateStatutoryCompliance($app, $dss, $trackRecord);

            $dossierData[$app->id] = [
                'application' => $app,
                'dssMatch' => $dss,
                'competingApplications' => $competing,
                'adopterTrackRecord' => $trackRecord,
                'defaultChecklist' => $checklist,
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
            'defaultChecklist' => $selectedBundle ? $selectedBundle['defaultChecklist'] : null,
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

        $dss = DssMatchScore::where('user_id', $application->user_id)
            ->where('pet_id', $application->pet_id)
            ->first();

        $userHistory = Application::where('user_id', $application->user_id)
            ->where('id', '!=', $application->id)
            ->get();

        $trackRecord = [
            'total_applications' => $userHistory->count() + 1,
            'prior_adopted_count' => $userHistory->where('status', 'approved')->count(),
            'prior_adopted_pets' => $userHistory->where('status', 'approved')->values(),
            'prior_rejected_count' => $userHistory->where('status', 'rejected')->count(),
            'surrendered_pet' => $application->adopter?->adopterProfile?->surrendered_pet ?? false,
            'had_pets_before' => $application->adopter?->adopterProfile?->had_pets_before ?? 'none',
            'previous_pet_notes' => $application->adopter?->adopterProfile?->previous_pet_notes,
            'pet_stay' => $application->adopter?->adopterProfile?->pet_stay ?? 'inside',
        ];

        $defaultChecklist = $this->evaluateStatutoryCompliance($application, $dss, $trackRecord);

        return Inertia::render('admin/applications/show', [
            'application' => $application,
            'defaultChecklist' => $defaultChecklist,
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
            // When moving to MAO audit, set a fresh 3-day (72h) SLA timer for MAO compliance review
            'target_sla_at' => $status === 'mao_audit' ? now()->addDays(3) : null,
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
                description: "Administrator {$actor->name} verified applicant suitability. Application has been forwarded to the Municipal Agriculture Office (MAO) for statutory compliance audit (3 Days Review Window).",
                actor: $actor,
                metadata: [
                    'decision' => 'suitable',
                    'staff_notes' => $notes,
                    'forwarded_to' => 'Municipal Agriculture Office (MAO)',
                    'target_sla_hours' => 72,
                    'target_sla_days' => 3,
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
     * Compute automated statutory compliance evaluation for an application.
     *
     * @param  array<string, mixed>  $adopterTrackRecord
     * @return array<string, array{label: string, description: string, auto_compliant: bool, compliance_reason: string}>
     */
    protected function evaluateStatutoryCompliance(Application $application, ?DssMatchScore $dssMatch, array $adopterTrackRecord): array
    {
        $adopter = $application->adopter;
        $lifestyle = $adopter?->lifestyleProfile;
        $pet = $application->pet;

        // 1. Identity Verified (RA 9482)
        $isIdentityVerified = (bool) ($adopter?->isIdentityVerified());
        $identityReason = $isIdentityVerified
            ? __('Government ID and biometrics successfully verified (RA 9482 compliant).')
            : __('Applicant identity is unverified or awaiting valid government ID.');

        // 2. DSS Score >= 50% Threshold
        $dssScore = $dssMatch?->total_score ?? (float) ($application->dss_score ?? 0);
        $isDssAcceptable = $dssScore >= 50.0;
        $dssReason = $isDssAcceptable
            ? __('Compatibility score of :score% meets or exceeds municipal threshold (>= 50%).', ['score' => round($dssScore, 1)])
            : __('Compatibility score of :score% is below the required 50% municipal baseline.', ['score' => round($dssScore, 1)]);

        // 3. Shelter Staff Recommendation
        $isStaffEndorsed = in_array($application->staff_decision, ['suitable', 'approved'], true) || $application->status === 'mao_audit';
        $staffReason = $isStaffEndorsed
            ? __('Virac Animal Shelter staff completed initial interview and endorsed applicant as suitable.')
            : __('Shelter staff evaluation not marked as suitable or pending endorsement.');

        // 4. Housing & Living Environment (RA 8485)
        $housingScore = $dssMatch?->housing_score ?? 100.0;
        $yardRequirementMet = ! ($pet?->requires_yard && ($lifestyle?->outdoor_access ?? 'none') === 'none');
        $householdAgrees = $lifestyle?->household_agrees !== false;
        $isHousingAppropriate = ($housingScore >= 50.0) && $yardRequirementMet && $householdAgrees;

        if (! $yardRequirementMet) {
            $housingReason = __('Pet requires yard access, but applicant residence has no outdoor enclosure.');
        } elseif (! $householdAgrees) {
            $housingReason = __('Household agreement for pet adoption was not confirmed.');
        } elseif ($housingScore < 50.0) {
            $housingReason = __('Residence space compatibility score (:score%) does not satisfy pet criteria.', ['score' => round($housingScore, 1)]);
        } else {
            $housingReason = __('Living environment and outdoor containment verified suitable for :pet.', ['pet' => $pet?->name ?? __('pet')]);
        }

        // 5. No Red Flags (Surrender / Abuse History)
        $surrenderedPet = (bool) ($adopter?->adopterProfile?->surrendered_pet ?? false);
        $priorRejections = (int) ($adopterTrackRecord['prior_rejected_count'] ?? 0);
        $isNoRedFlags = (! $surrenderedPet) && ($priorRejections === 0);

        if ($surrenderedPet && $priorRejections > 0) {
            $redFlagReason = __('Warning: Disclosed prior pet surrender and has :count prior rejected application(s).', ['count' => $priorRejections]);
        } elseif ($surrenderedPet) {
            $redFlagReason = __('Warning: Applicant disclosed prior history of surrendering an animal.');
        } elseif ($priorRejections > 0) {
            $redFlagReason = __('Warning: Applicant has :count prior rejected adoption application(s).', ['count' => $priorRejections]);
        } else {
            $redFlagReason = __('Clean welfare track record (0 disclosed surrenders, 0 prior municipal rejections).');
        }

        return [
            'identity_verified' => [
                'label' => __('Applicant Identity Verified (RA 9482 Compliance)'),
                'description' => __('Government-issued ID matches submitted personal details and residency in Catanduanes.'),
                'auto_compliant' => $isIdentityVerified,
                'compliance_reason' => $identityReason,
            ],
            'dss_score_acceptable' => [
                'label' => __('DSS Multi-Factor Compatibility Met (>= 50% Threshold)'),
                'description' => __('8-Factor Decision Support System score confirms baseline compatibility with selected pet.'),
                'auto_compliant' => $isDssAcceptable,
                'compliance_reason' => $dssReason,
            ],
            'staff_recommendation' => [
                'label' => __('Shelter Staff Initial Assessment Endorsed'),
                'description' => __('Virac Animal Shelter staff completed initial interview and endorsed applicant suitability.'),
                'auto_compliant' => $isStaffEndorsed,
                'compliance_reason' => $staffReason,
            ],
            'housing_appropriate' => [
                'label' => __('Humane Living Environment & Security Verified (RA 8485)'),
                'description' => __('Residence environment meets space, safety, and outdoor containment standards.'),
                'auto_compliant' => $isHousingAppropriate,
                'compliance_reason' => $housingReason,
            ],
            'no_red_flags' => [
                'label' => __('No Animal Neglect or Abuse History'),
                'description' => __('Applicant has no record of municipal animal cruelty, illegal surrender, or abandonment violations.'),
                'auto_compliant' => $isNoRedFlags,
                'compliance_reason' => $redFlagReason,
            ],
        ];
    }

    /**
     * Conduct administrative compliance audit with final approval/rejection, certificate generation, and SLA resolution.
     */
    public function audit(Request $request, int $id): RedirectResponse
    {
        $application = Application::with(['pet'])->findOrFail($id);

        if ($application->status !== 'mao_audit') {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('This application is not in the compliance audit stage.'),
            ]);

            return to_route('admin.applications.index');
        }

        $request->validate([
            'decision' => ['required', 'string', 'in:approved,rejected'],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'checklist' => ['required', 'array'],
            'checklist.*' => ['boolean'],
        ]);

        $decision = $request->input('decision');
        $remarks = $request->input('remarks');
        $checklist = $request->input('checklist');
        $actor = $request->user();

        $status = $decision === 'approved' ? 'approved' : 'rejected';

        $pickupDays = (int) SystemSetting::get('pickup_schedule_days', 3);
        $pickupDeadline = $decision === 'approved' ? now()->addDays($pickupDays) : null;

        $application->update([
            'status' => $status,
            'mao_officer_id' => $actor->id,
            'mao_decision' => $decision,
            'mao_remarks' => $remarks,
            'mao_checklist' => $checklist,
            'resolved_at' => now(),
            'target_sla_at' => null,
            'pickup_deadline_at' => $pickupDeadline,
        ]);

        if ($status === 'approved') {
            $certNum = $application->generateCertificateNumber();
            $application->pet->update(['status' => 'adopted']);

            $application->logTimeline(
                stage: 'resolved',
                action: 'mao_approved',
                title: 'Municipal Compliance Approved (Admin Audit) — Adoption Certificate Issued',
                description: "Administrator {$actor->name} officially approved the adoption under municipal animal welfare guidelines. Certificate #{$certNum} generated. {$pickupDays}-Day pickup scheduled.",
                actor: $actor,
                metadata: [
                    'certificate_number' => $certNum,
                    'pickup_deadline' => $pickupDeadline->toIso8601String(),
                    'pickup_days' => $pickupDays,
                    'remarks' => $remarks,
                    'checklist_summary' => $checklist,
                ]
            );

            app(MultiApplicationResolutionService::class)->handlePrimaryApprovedByMao($application);
        } else {
            $application->pet->update(['status' => 'available']);

            $application->logTimeline(
                stage: 'resolved',
                action: 'mao_rejected',
                title: 'Compliance Audit Disapproved (Admin Audit)',
                description: $remarks ?: 'Application did not satisfy Municipal Animal Welfare compliance standards.',
                actor: $actor,
                metadata: [
                    'remarks' => $remarks,
                    'checklist_summary' => $checklist,
                ]
            );

            app(MultiApplicationResolutionService::class)->handlePrimaryRejectedByMao($application);
        }

        app(AdoptionNotificationService::class)->notifyMaoDecision($application, $decision);

        $message = $decision === 'approved'
            ? __('Application officially APPROVED by Admin. Digital Adoption Pass and certificate issued to adopter.')
            : __('Application officially REJECTED by Admin.');

        Inertia::flash('toast', [
            'type' => $decision === 'approved' ? 'success' : 'info',
            'message' => $message,
        ]);

        return back();
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
            'message' => __('Pet :name successfully marked as released!', ['name' => $application->pet->name]),
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

        if ($application->adopter) {
            $application->adopter->notify(new ApplicationStatusUpdatedNotification($application, 'unclaimed_adopter'));
        }

        Inertia::flash('toast', [
            'type' => 'warning',
            'message' => __('Application marked as unclaimed. :name has been returned to the available catalog.', ['name' => $application->pet->name]),
        ]);

        return back();
    }

    /**
     * Archive and close an application with a structured reason for accountability (No Hard Delete).
     */
    public function close(Request $request, int $id): RedirectResponse
    {
        $application = Application::with(['pet'])->findOrFail($id);

        $request->validate([
            'reason' => ['required', 'string', 'in:unclaimed_forfeited,screening_disapproved,compliance_disapproved,adopter_cancelled,sla_expired,duplicate_submission,other'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $actor = $request->user();
        $reason = $request->input('reason');
        $notes = $request->input('notes');

        $reasonLabels = [
            'unclaimed_forfeited' => __('Unclaimed / Pickup Deadline Expired'),
            'screening_disapproved' => __('Screening Suitability Disapproved'),
            'compliance_disapproved' => __('Statutory Compliance Audit Disapproved'),
            'adopter_cancelled' => __('Adopter Cancelled / Voluntarily Withdrawn'),
            'sla_expired' => __('SLA Processing Deadline Lapsed'),
            'duplicate_submission' => __('Duplicate Application Submission'),
            'other' => __('Other Administrative Cause'),
        ];

        $reasonLabel = $reasonLabels[$reason] ?? $reason;

        // If closing an application where pet is reserved/locked, return pet to available catalog
        if (in_array($application->status, ['pending', 'under_review', 'mao_audit', 'approved'])) {
            $application->pet->update(['status' => 'available']);
        }

        $application->update([
            'status' => 'archived',
            'close_reason' => $reason,
            'close_notes' => $notes,
            'closed_at' => now(),
            'closed_by_id' => $actor->id,
            'target_sla_at' => null,
        ]);

        $application->logTimeline(
            stage: 'archived',
            action: 'application_archived',
            title: 'Application Archived & Closed',
            description: "Application officially closed and permanently archived by {$actor->name}. Reason: {$reasonLabel}.".($notes ? " Notes: {$notes}" : ''),
            actor: $actor,
            metadata: [
                'reason' => $reason,
                'reason_label' => $reasonLabel,
                'notes' => $notes,
                'closed_at' => now()->toIso8601String(),
            ]
        );

        Inertia::flash('toast', [
            'type' => 'info',
            'message' => __('Application has been archived and closed (:reason). Pet returned to available catalog.', ['reason' => $reasonLabel]),
        ]);

        return back();
    }
}
