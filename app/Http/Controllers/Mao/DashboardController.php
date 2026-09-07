<?php

namespace App\Http\Controllers\Mao;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Pet;
use App\Models\Shelter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the Municipal Animal Welfare & Compliance analytical dashboard.
     */
    public function index(Request $request): Response
    {
        // 1. Core KPIs
        $totalApplications = Application::count();
        $pendingAuditsCount = Application::where('status', 'mao_audit')->count();
        $approvedCount = Application::where('status', 'approved')->count();
        $rejectedCount = Application::where('status', 'rejected')->count();

        $passRate = $totalApplications > 0
            ? round(($approvedCount / $totalApplications) * 100, 1)
            : 0;

        $rejectionRate = $totalApplications > 0
            ? round(($rejectedCount / $totalApplications) * 100, 1)
            : 0;

        $avgDssScore = round((float) Application::whereNotNull('dss_score')->avg('dss_score'), 1);

        // 2. Urgent applications requiring MAO approval
        $pendingApplications = Application::with([
            'adopter.adopterProfile',
            'pet.shelter',
            'pet.photos',
        ])
            ->where('status', 'mao_audit')
            ->orderBy('submitted_at', 'asc') // Oldest first to prioritize SLAs
            ->take(8)
            ->get();

        // 3. Recent certified approvals / resolved adoptions
        $recentResolved = Application::with([
            'adopter',
            'pet.shelter',
            'maoOfficer',
        ])
            ->whereIn('status', ['approved', 'rejected'])
            ->whereNotNull('resolved_at')
            ->latest('resolved_at')
            ->take(6)
            ->get();

        // 4. Municipal Shelter Capacity & Compliance breakdown
        $shelters = Shelter::withCount([
            'pets as total_pets_count',
            'pets as active_pets_count' => function ($q): void {
                $q->where('status', 'available');
            },
            'pets as adopted_pets_count' => function ($q): void {
                $q->where('status', 'adopted');
            },
        ])->get();

        // 5. Monthly adoption trends (database-agnostic)
        $driver = DB::connection()->getDriverName();
        $dateExpr = $driver === 'sqlite'
            ? "strftime('%Y-%m', resolved_at)"
            : "DATE_FORMAT(resolved_at, '%Y-%m')";

        $monthlyTrends = Application::selectRaw("{$dateExpr} as month, count(*) as count")
            ->where('status', 'approved')
            ->whereNotNull('resolved_at')
            ->groupBy('month')
            ->orderBy('month', 'desc')
            ->take(6)
            ->get()
            ->reverse()
            ->values();

        // 6. Species split
        $dogsAvailable = Pet::where('species', 'dog')->where('status', 'available')->count();
        $catsAvailable = Pet::where('species', 'cat')->where('status', 'available')->count();

        return Inertia::render('mao/dashboard', [
            'metrics' => [
                'total_applications' => $totalApplications,
                'pending_audits_count' => $pendingAuditsCount,
                'approved_count' => $approvedCount,
                'rejected_count' => $rejectedCount,
                'pass_rate' => $passRate,
                'rejection_rate' => $rejectionRate,
                'avg_dss_score' => $avgDssScore,
                'total_pets_available' => Pet::where('status', 'available')->count(),
                'total_pets_adopted' => Pet::where('status', 'adopted')->count(),
                'dogs_available' => $dogsAvailable,
                'cats_available' => $catsAvailable,
            ],
            'pendingApplications' => $pendingApplications,
            'recentResolved' => $recentResolved,
            'shelters' => $shelters,
            'monthlyTrends' => $monthlyTrends,
        ]);
    }
}
