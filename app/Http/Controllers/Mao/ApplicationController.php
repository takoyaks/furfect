<?php

namespace App\Http\Controllers\Mao;

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
     * Display a listing of applications awaiting MAO audit.
     */
    public function index(Request $request): Response
    {
        $query = Application::with(['adopter.adopterProfile', 'pet.shelter'])
            ->whereIn('status', ['mao_audit', 'approved', 'rejected'])
            ->latest('submitted_at');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        } else {
            // Default to showing pending audits first
            $query->orderByRaw("CASE WHEN status = 'mao_audit' THEN 0 ELSE 1 END");
        }

        $applications = $query->paginate(10)->withQueryString();

        return Inertia::render('mao/applications/index', [
            'applications' => $applications,
            'filters' => $request->only(['status']),
        ]);
    }

    /**
     * Show the statutory compliance audit dashboard for an application.
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

        $dssMatch = DssMatchScore::where('user_id', $application->user_id)
            ->where('pet_id', $application->pet_id)
            ->first();

        // Fetch adopter's municipal adoption track record
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

        $defaultChecklist = $this->evaluateStatutoryCompliance($application, $dssMatch, $adopterTrackRecord);

        return Inertia::render('mao/applications/show', [
            'application' => $application,
            'dssMatch' => $dssMatch,
            'adopterTrackRecord' => $adopterTrackRecord,
            'defaultChecklist' => $defaultChecklist,
        ]);
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
     * Finalize the compliance audit with official approval or rejection, certificate issuance, and audit trail logging.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $application = Application::with(['pet'])->findOrFail($id);

        if ($application->status !== 'mao_audit') {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('This application is not in the MAO compliance audit stage.'),
            ]);

            return to_route('mao.applications.index');
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

        // 7-day pickup deadline for approved adoptions
        $pickupDeadline = $decision === 'approved' ? now()->addDays(7) : null;

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

        // Generate official certificate number on approval
        if ($status === 'approved') {
            $certNum = $application->generateCertificateNumber();
            $application->pet->update(['status' => 'adopted']);

            $application->logTimeline(
                stage: 'resolved',
                action: 'mao_approved',
                title: 'Municipal Compliance Approved — Adoption Certificate Issued',
                description: "Municipal Agriculture Office (MAO) officially approved the adoption under RA 8485 Animal Welfare guidelines. Certificate #{$certNum} generated. 7-Day pickup scheduled.",
                actor: $actor,
                metadata: [
                    'certificate_number' => $certNum,
                    'pickup_deadline' => $pickupDeadline->toIso8601String(),
                    'remarks' => $remarks,
                    'checklist_summary' => $checklist,
                ]
            );

            // Gracefully resolve competing applications with alternative recommendations
            app(MultiApplicationResolutionService::class)->handlePrimaryApprovedByMao($application);
        } else {
            $application->pet->update(['status' => 'available']);

            $application->logTimeline(
                stage: 'resolved',
                action: 'mao_rejected',
                title: 'MAO Compliance Audit Disapproved',
                description: $remarks ?: 'Application did not satisfy Municipal Animal Welfare compliance standards.',
                actor: $actor,
                metadata: [
                    'remarks' => $remarks,
                    'checklist_summary' => $checklist,
                ]
            );

            // Promote top waitlisted candidate to active review queue
            app(MultiApplicationResolutionService::class)->handlePrimaryRejectedByMao($application);
        }

        // Dispatch notifications to adopter and shelter staff
        app(AdoptionNotificationService::class)->notifyMaoDecision($application, $decision);

        $message = $decision === 'approved'
            ? __('Application has been officially APPROVED. Digital Adoption Pass and certificate issued to adopter.')
            : __('Application has been officially REJECTED.');

        Inertia::flash('toast', [
            'type' => $decision === 'approved' ? 'success' : 'info',
            'message' => $message,
        ]);

        return to_route('mao.applications.index');
    }
}
