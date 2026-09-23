<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Application;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationController extends Controller
{
    /**
     * Display all applications with filtering.
     */
    public function index(Request $request): Response
    {
        $query = Application::with(['adopter.adopterProfile', 'pet.shelter'])->latest('submitted_at');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->whereHas('adopter', function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%");
            })->orWhere('reference_number', 'like', "%{$search}%");
        }

        $applications = $query->paginate(10)->withQueryString();

        return Inertia::render('admin/applications/index', [
            'applications' => $applications,
            'filters' => $request->only(['status', 'search']),
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
