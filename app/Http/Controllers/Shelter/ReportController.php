<?php

namespace App\Http\Controllers\Shelter;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Pet;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    /**
     * Display a summary of adoption reports for the shelter staff.
     */
    public function index(Request $request): Response
    {
        // Adoption status metrics
        $totalApplications = Application::count();
        $pendingReview = Application::whereIn('status', ['pending', 'under_review'])->count();
        $approvedAdoptions = Application::where('status', 'approved')->count();
        $rejectedAdoptions = Application::where('status', 'rejected')->count();

        // Pet metrics
        $petsAvailable = Pet::where('status', 'available')->count();
        $petsAdopted = Pet::where('status', 'adopted')->count();

        // Recent adoption activities
        $recentAdoptions = Application::with(['adopter', 'pet'])
            ->where('status', 'approved')
            ->latest('resolved_at')
            ->take(10)
            ->get();

        return Inertia::render('shelter/reports/index', [
            'metrics' => [
                'total_applications' => $totalApplications,
                'pending_review' => $pendingReview,
                'approved_adoptions' => $approvedAdoptions,
                'rejected_adoptions' => $rejectedAdoptions,
                'pets_available' => $petsAvailable,
                'pets_adopted' => $petsAdopted,
            ],
            'recentAdoptions' => $recentAdoptions,
        ]);
    }
}
