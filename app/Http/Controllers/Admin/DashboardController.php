<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Pet;
use App\Models\Shelter;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the Admin panel dashboard overview with statistics and analytics graphs.
     */
    public function index(): Response
    {
        $pendingApplications = Application::where('status', 'pending')->count();
        $underReviewApplications = Application::where('status', 'under_review')->count();
        $maoAuditApplications = Application::where('status', 'mao_audit')->count();
        $approvedAdoptions = Application::where('status', 'approved')->count();
        $rejectedApplications = Application::where('status', 'rejected')->count();

        $petsAvailable = Pet::where('status', 'available')->count();
        $petsAdopted = Pet::where('status', 'adopted')->count();
        $totalPets = Pet::count();
        $totalUsers = User::count();
        $totalShelters = Shelter::count();

        // 1. Monthly Trends (Last 6 months: Submissions vs Approvals)
        $driver = DB::connection()->getDriverName();
        $subDateExpr = $driver === 'sqlite'
            ? "strftime('%Y-%m', submitted_at)"
            : "DATE_FORMAT(submitted_at, '%Y-%m')";

        $appDateExpr = $driver === 'sqlite'
            ? "strftime('%Y-%m', resolved_at)"
            : "DATE_FORMAT(resolved_at, '%Y-%m')";

        $months = collect(range(5, 0))->map(function ($i) {
            return Carbon::now()->subMonths($i)->format('Y-m');
        });

        $submissionsByMonth = Application::selectRaw("{$subDateExpr} as month, count(*) as count")
            ->whereNotNull('submitted_at')
            ->groupBy('month')
            ->pluck('count', 'month');

        $approvalsByMonth = Application::selectRaw("{$appDateExpr} as month, count(*) as count")
            ->where('status', 'approved')
            ->whereNotNull('resolved_at')
            ->groupBy('month')
            ->pluck('count', 'month');

        $monthlyTrends = $months->map(function ($m) use ($submissionsByMonth, $approvalsByMonth) {
            $formattedMonth = Carbon::createFromFormat('Y-m', $m)->format('M Y');

            return [
                'month' => $formattedMonth,
                'submitted' => (int) ($submissionsByMonth[$m] ?? 0),
                'approved' => (int) ($approvalsByMonth[$m] ?? 0),
            ];
        })->values();

        // 2. Application Status Pipeline Distribution
        $statusDistribution = [
            'pending' => $pendingApplications,
            'under_review' => $underReviewApplications,
            'mao_audit' => $maoAuditApplications,
            'approved' => $approvedAdoptions,
            'rejected' => $rejectedApplications,
        ];

        // 3. Species Demographics & Placement Status
        $speciesStats = [
            'dogs_available' => Pet::where('species', 'dog')->where('status', 'available')->count(),
            'dogs_adopted' => Pet::where('species', 'dog')->where('status', 'adopted')->count(),
            'cats_available' => Pet::where('species', 'cat')->where('status', 'available')->count(),
            'cats_adopted' => Pet::where('species', 'cat')->where('status', 'adopted')->count(),
        ];

        // 4. Shelter Comparison
        $shelterComparison = Shelter::withCount([
            'pets as total_pets_count',
            'pets as active_pets_count' => function ($q): void {
                $q->where('status', 'available');
            },
            'pets as adopted_pets_count' => function ($q): void {
                $q->where('status', 'adopted');
            },
        ])
            ->take(6)
            ->get()
            ->map(function ($shelter) {
                return [
                    'id' => $shelter->id,
                    'name' => $shelter->name,
                    'active_pets_count' => $shelter->active_pets_count ?? 0,
                    'adopted_pets_count' => $shelter->adopted_pets_count ?? 0,
                    'total_pets_count' => $shelter->total_pets_count ?? 0,
                ];
            });

        // 5. DSS Compatibility Score Tiers
        $dssScoreDistribution = [
            'high' => Application::where('dss_score', '>=', 80)->count(),
            'medium' => Application::whereBetween('dss_score', [50, 79.99])->count(),
            'low' => Application::where('dss_score', '<', 50)->whereNotNull('dss_score')->count(),
        ];

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
            'monthlyTrends' => $monthlyTrends,
            'statusDistribution' => $statusDistribution,
            'speciesStats' => $speciesStats,
            'shelterComparison' => $shelterComparison,
            'dssScoreDistribution' => $dssScoreDistribution,
        ]);
    }
}
