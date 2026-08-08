<?php

namespace App\Http\Controllers\Mao;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Pet;
use App\Models\Shelter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    /**
     * Display system-wide reports and statistics for MAO.
     */
    public function index(Request $request): Response
    {
        $totalApplications = Application::count();
        $approvedApplications = Application::where('status', 'approved')->count();
        $rejectedApplications = Application::where('status', 'rejected')->count();
        $pendingAudits = Application::where('status', 'mao_audit')->count();

        // Shelter statistics
        $shelters = Shelter::withCount([
            'pets as total_pets_count',
            'pets as active_pets_count' => function ($q): void {
                $q->where('status', 'available');
            }
        ])->get();

        // Monthly adoption success rates
        $monthlyAdoptions = Application::selectRaw("DATE_FORMAT(resolved_at, '%Y-%m') as month, count(*) as count")
            ->where('status', 'approved')
            ->whereNotNull('resolved_at')
            ->groupBy('month')
            ->orderBy('month', 'desc')
            ->take(12)
            ->get();

        return Inertia::render('mao/reports/index', [
            'stats' => [
                'total_applications' => $totalApplications,
                'approved_applications' => $approvedApplications,
                'rejected_applications' => $rejectedApplications,
                'pending_audits' => $pendingAudits,
            ],
            'shelters' => $shelters,
            'monthlyAdoptions' => $monthlyAdoptions,
        ]);
    }
}
