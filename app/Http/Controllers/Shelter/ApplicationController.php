<?php

namespace App\Http\Controllers\Shelter;

use App\Http\Controllers\Controller;
use App\Models\Application;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationController extends Controller
{
    /**
     * Display a listing of applications for the shelter staff.
     */
    public function index(Request $request): Response
    {
        // For now, shelter staff can see all applications (as per user settings choice)
        $query = Application::with(['adopter', 'pet.shelter'])->latest('submitted_at');

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
     * Display application details, adopter profile, lifestyle quiz answers, and DSS score.
     */
    public function show(int $id): Response
    {
        $application = Application::with([
            'adopter.adopterProfile',
            'adopter.lifestyleProfile',
            'pet.photos',
            'pet.shelter',
        ])->findOrFail($id);

        return Inertia::render('shelter/applications/show', [
            'application' => $application,
        ]);
    }

    /**
     * Submit a review decision (suitable/not suitable) on an application.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $application = Application::findOrFail($id);

        if ($application->status !== 'pending' && $application->status !== 'under_review') {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('This application has already been processed.')
            ]);
            return to_route('shelter.applications.index');
        }

        $request->validate([
            'decision' => ['required', 'string', 'in:suitable,not_suitable'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $decision = $request->input('decision');
        $notes = $request->input('notes');

        $status = $decision === 'suitable' ? 'mao_audit' : 'rejected';

        $application->update([
            'status' => $status,
            'staff_id' => $request->user()->id,
            'staff_decision' => $decision,
            'staff_notes' => $notes,
            'reviewed_at' => now(),
            'resolved_at' => $status === 'rejected' ? now() : null,
        ]);

        // If rejected, update the pet availability status back to available
        if ($status === 'rejected') {
            $application->pet->update(['status' => 'available']);
        }

        $message = $decision === 'suitable'
            ? __('Application marked as SUITABLE and forwarded to MAO Compliance Audit.')
            : __('Application rejected successfully.');

        Inertia::flash('toast', [
            'type' => $decision === 'suitable' ? 'success' : 'info',
            'message' => $message,
        ]);

        return to_route('shelter.applications.index');
    }
}
