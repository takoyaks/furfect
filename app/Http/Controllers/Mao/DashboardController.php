<?php

namespace App\Http\Controllers\Mao;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Pet;
use App\Models\Shelter;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
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
        $underReviewCount = Application::where('status', 'under_review')->count();
        $pendingInitialCount = Application::where('status', 'pending')->count();

        $passRate = $totalApplications > 0
            ? round(($approvedCount / $totalApplications) * 100, 1)
            : 0;

        $rejectionRate = $totalApplications > 0
            ? round(($rejectedCount / $totalApplications) * 100, 1)
            : 0;

        $avgDssScore = round((float) Application::whereNotNull('dss_score')->avg('dss_score'), 1);

        // 2. Municipal Shelter Capacity & Compliance breakdown
        $shelters = Shelter::withCount([
            'pets as total_pets_count',
            'pets as active_pets_count' => function ($q): void {
                $q->where('status', 'available');
            },
            'pets as adopted_pets_count' => function ($q): void {
                $q->where('status', 'adopted');
            },
        ])->get()->map(function ($s) {
            return [
                'id' => $s->id,
                'name' => $s->name,
                'location' => $s->location,
                'active_pets_count' => $s->active_pets_count ?? 0,
                'adopted_pets_count' => $s->adopted_pets_count ?? 0,
                'total_pets_count' => $s->total_pets_count ?? 0,
                'status' => $s->status,
            ];
        });

        // 3. Monthly compliance decision trends (Last 6 months)
        $driver = DB::connection()->getDriverName();
        $dateExpr = $driver === 'sqlite'
            ? "strftime('%Y-%m', resolved_at)"
            : "DATE_FORMAT(resolved_at, '%Y-%m')";

        $months = collect(range(5, 0))->map(function ($i) {
            return Carbon::now()->subMonths($i)->format('Y-m');
        });

        $approvalsByMonth = Application::selectRaw("{$dateExpr} as month, count(*) as count")
            ->where('status', 'approved')
            ->whereNotNull('resolved_at')
            ->groupBy('month')
            ->pluck('count', 'month');

        $rejectionsByMonth = Application::selectRaw("{$dateExpr} as month, count(*) as count")
            ->where('status', 'rejected')
            ->whereNotNull('resolved_at')
            ->groupBy('month')
            ->pluck('count', 'month');

        $monthlyTrends = $months->map(function ($m) use ($approvalsByMonth, $rejectionsByMonth) {
            $formattedMonth = Carbon::createFromFormat('Y-m', $m)->format('M Y');

            return [
                'month' => $formattedMonth,
                'approved' => (int) ($approvalsByMonth[$m] ?? 0),
                'rejected' => (int) ($rejectionsByMonth[$m] ?? 0),
            ];
        })->values();

        // 4. Status & Audit Distribution
        $statusDistribution = [
            'approved' => $approvedCount,
            'rejected' => $rejectedCount,
            'mao_audit' => $pendingAuditsCount,
            'under_review' => $underReviewCount,
            'pending' => $pendingInitialCount,
        ];

        // 5. Species Demographics & Placement Status
        $dogsAvailable = Pet::where('species', 'dog')->where('status', 'available')->count();
        $dogsAdopted = Pet::where('species', 'dog')->where('status', 'adopted')->count();
        $catsAvailable = Pet::where('species', 'cat')->where('status', 'available')->count();
        $catsAdopted = Pet::where('species', 'cat')->where('status', 'adopted')->count();

        $speciesStats = [
            'dogs_available' => $dogsAvailable,
            'dogs_adopted' => $dogsAdopted,
            'cats_available' => $catsAvailable,
            'cats_adopted' => $catsAdopted,
        ];

        // 6. DSS Compatibility Distribution
        $dssScoreDistribution = [
            'high' => Application::where('dss_score', '>=', 80)->count(),
            'medium' => Application::whereBetween('dss_score', [50, 79.99])->count(),
            'low' => Application::where('dss_score', '<', 50)->whereNotNull('dss_score')->count(),
        ];

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
            'monthlyTrends' => $monthlyTrends,
            'statusDistribution' => $statusDistribution,
            'shelters' => $shelters,
            'speciesStats' => $speciesStats,
            'dssScoreDistribution' => $dssScoreDistribution,
        ]);
    }
}
