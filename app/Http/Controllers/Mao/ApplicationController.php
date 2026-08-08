<?php

namespace App\Http\Controllers\Mao;

use App\Http\Controllers\Controller;
use App\Models\Application;
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
        $query = Application::with(['adopter', 'pet.shelter'])
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
     * Show the compliance audit dashboard for a specific application.
     */
    public function show(int $id): Response
    {
        $application = Application::with([
            'adopter.adopterProfile',
            'adopter.lifestyleProfile',
            'pet.photos',
            'pet.shelter',
            'staff',
        ])->findOrFail($id);

        return Inertia::render('mao/applications/show', [
            'application' => $application,
            // Default checklist structure
            'defaultChecklist' => [
                'identity_verified' => [
                    'label' => __('Applicant identity verified'),
                    'description' => __('Name, address, and contact details match submitted ID document.'),
                ],
                'dss_score_acceptable' => [
                    'label' => __('DSS score acceptable (>= 60%)'),
                    'description' => __('Compatibility score meets minimum standard for selected pet.'),
                ],
                'staff_recommendation' => [
                    'label' => __('Staff recommendation reviewed'),
                    'description' => __('Shelter staff has marked the application as suitable.'),
                ],
                'housing_appropriate' => [
                    'label' => __('Housing appropriate for pet'),
                    'description' => __('Assessed space matches pet size and energy level requirements.'),
                ],
                'no_red_flags' => [
                    'label' => __('No red flags in application'),
                    'description' => __('No past history of animal abuse, neglect, or quick surrenders.'),
                ],
            ],
        ]);
    }

    /**
     * Finalize the compliance audit with approval or rejection.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $application = Application::findOrFail($id);

        if ($application->status !== 'mao_audit') {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('This application is not in the MAO compliance audit stage.')
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

        $status = $decision === 'approved' ? 'approved' : 'rejected';

        $application->update([
            'status' => $status,
            'mao_officer_id' => $request->user()->id,
            'mao_decision' => $decision,
            'mao_remarks' => $remarks,
            'mao_checklist' => $checklist,
            'resolved_at' => now(),
        ]);

        // Update the pet status based on final outcome
        if ($status === 'approved') {
            $application->pet->update(['status' => 'adopted']);
        } else {
            $application->pet->update(['status' => 'available']);
        }

        $message = $decision === 'approved'
            ? __('Application has been officially APPROVED. Adopter has been notified.')
            : __('Application has been officially REJECTED.');

        Inertia::flash('toast', [
            'type' => $decision === 'approved' ? 'success' : 'info',
            'message' => $message,
        ]);

        return to_route('mao.applications.index');
    }
}
