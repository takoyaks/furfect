<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Pet;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the Admin panel dashboard overview with statistics.
     */
    public function index(): Response
    {
        $totalApplications = Application::count();
        $pendingReview = Application::where('status', 'pending')->count();
        $approvedApplications = Application::where('status', 'approved')->count();
        $petsAvailable = Pet::where('status', 'available')->count();

        // Recent applications list
        $recentApplications = Application::with(['adopter', 'pet.shelter'])
            ->latest('submitted_at')
            ->take(5)
            ->get();

        return Inertia::render('admin/dashboard', [
            'metrics' => [
                'total_applications' => $totalApplications,
                'pending_review' => $pendingReview,
                'approved_applications' => $approvedApplications,
                'pets_available' => $petsAvailable,
            ],
            'recentApplications' => $recentApplications,
        ]);
    }
}
