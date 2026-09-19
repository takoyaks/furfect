<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\Application;
use App\Models\LandingPageConfig;
use App\Models\Pet;
use App\Models\User;
use App\Services\BreedMaskerService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class PageController extends Controller
{
    /**
     * Display the dynamic Home / Landing page.
     */
    public function home(Request $request): Response
    {
        $config = LandingPageConfig::active();

        $featuredPets = Pet::with(['photos', 'shelter'])
            ->where('status', 'available')
            ->latest('listed_at')
            ->take(6)
            ->get();

        $featuredPets->transform(function (Pet $pet) {
            $pet->breed = __('Hidden');
            $pet->description = BreedMaskerService::mask((string) $pet->description);

            return $pet;
        });

        $announcements = Announcement::where('is_published', true)
            ->latest('published_at')
            ->take(3)
            ->get();

        $stats = [
            'available_pets' => Pet::where('status', 'available')->count(),
            'adopted_pets' => Pet::where('status', 'adopted')->count(),
            'total_adopters' => Role::where('name', 'adopter')->exists()
                ? User::role('adopter')->count()
                : 0,
        ];

        // Pass active application for adopter dashboard banner
        $activeApplication = null;
        $user = $request->user();
        if ($user && $user->hasRole('adopter')) {
            $activeApplication = Application::where('user_id', $user->id)
                ->with('pet:id,name')
                ->whereIn('status', ['pending', 'under_review', 'mao_audit', 'approved'])
                ->latest('submitted_at')
                ->first(['id', 'pet_id', 'status', 'dss_score', 'reference_number', 'submitted_at', 'target_sla_at', 'pickup_deadline_at', 'certificate_number']);
        }

        return Inertia::render('dashboard', [
            'config' => $config,
            'featuredPets' => $featuredPets,
            'announcements' => $announcements,
            'stats' => $stats,
            'activeApplication' => $activeApplication,
        ]);
    }

    /**
     * Display the How It Works page.
     */
    public function howItWorks(): Response
    {
        $config = LandingPageConfig::active();

        return Inertia::render('how-it-works', [
            'config' => $config,
        ]);
    }

    /**
     * Display the Announcements listing page.
     */
    public function announcements(Request $request): Response
    {
        $config = LandingPageConfig::active();

        $query = Announcement::where('is_published', true);

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->filled('search')) {
            $search = (string) $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%");
            });
        }

        $announcements = $query->latest('published_at')
            ->paginate(9)
            ->withQueryString();

        $categories = Announcement::where('is_published', true)
            ->distinct()
            ->pluck('category');

        return Inertia::render('announcements/index', [
            'config' => $config,
            'announcements' => $announcements,
            'categories' => $categories,
            'filters' => [
                'category' => $request->category ?? 'all',
                'search' => $request->search ?? '',
            ],
        ]);
    }

    /**
     * Display a specific announcement detail page.
     */
    public function announcementShow(int $id): Response
    {
        $config = LandingPageConfig::active();

        $announcement = Announcement::where('is_published', true)->findOrFail($id);

        $recentAnnouncements = Announcement::where('is_published', true)
            ->where('id', '!=', $announcement->id)
            ->latest('published_at')
            ->take(4)
            ->get();

        return Inertia::render('announcements/show', [
            'config' => $config,
            'announcement' => $announcement,
            'recentAnnouncements' => $recentAnnouncements,
        ]);
    }

    /**
     * Display the About Us page.
     */
    public function about(): Response
    {
        $config = LandingPageConfig::active();

        return Inertia::render('about', [
            'config' => $config,
        ]);
    }
}
