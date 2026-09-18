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
        $query = Application::with(['adopter', 'pet.shelter'])->latest('submitted_at');

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
        ])->findOrFail($id);

        return Inertia::render('admin/applications/show', [
            'application' => $application,
        ]);
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
