<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Application;
use App\Models\Pet;
use App\Models\Shelter;
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
        $pendingApplications = Application::where('status', 'pending')->count();
        $underReviewApplications = Application::where('status', 'under_review')->count();
        $maoAuditApplications = Application::where('status', 'mao_audit')->count();
        $approvedAdoptions = Application::where('status', 'approved')->count();

        $petsAvailable = Pet::where('status', 'available')->count();
        $petsAdopted = Pet::where('status', 'adopted')->count();
        $totalPets = Pet::count();
        $totalUsers = User::count();
        $totalShelters = Shelter::count();

        // Recent applications list
        $recentApplications = Application::with([
            'adopter.adopterProfile',
            'pet.shelter',
            'pet.photos',
        ])
            ->latest('submitted_at')
            ->take(6)
            ->get();

        // Recent pets added
        $recentPets = Pet::with(['photos', 'shelter'])
            ->latest('created_at')
            ->take(4)
            ->get();

        // Recent published announcements
        $recentAnnouncements = Announcement::where('is_published', true)
            ->latest('published_at')
            ->take(3)
            ->get();

        return Inertia::render('admin/dashboard', [
            'metrics' => [
                'pending_applications' => $pendingApplications,
                'under_review_applications' => $underReviewApplications,
                'mao_audit_applications' => $maoAuditApplications,
                'approved_adoptions' => $approvedAdoptions,
                'pets_available' => $petsAvailable,
                'pets_adopted' => $petsAdopted,
                'total_pets' => $totalPets,
                'total_users' => $totalUsers,
                'total_shelters' => $totalShelters,
            ],
            'recentApplications' => $recentApplications,
            'recentPets' => $recentPets,
            'recentAnnouncements' => $recentAnnouncements,
        ]);
    }
}
