<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Shelter;
use App\Services\ReportFilterService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function __construct(
        protected ReportFilterService $filterService
    ) {}

    /**
     * Display report dashboard with filters for administrators.
     */
    public function index(Request $request): InertiaResponse
    {
        $baseQuery = Application::query();
        $filteredQuery = $this->filterService->applyFilters(clone $baseQuery, $request);

        $stats = $this->filterService->computeKpis(clone $filteredQuery);
        $speciesBreakdown = $this->filterService->computeSpeciesBreakdown(clone $filteredQuery);

        $sortField = in_array($request->input('sort_by'), ['submitted_at', 'resolved_at', 'dss_score', 'status'])
            ? (string) $request->input('sort_by')
            : 'submitted_at';
        $sortDir = $request->input('sort_dir') === 'asc' ? 'asc' : 'desc';

        $applications = (clone $filteredQuery)
            ->with(['adopter.adopterProfile', 'pet.shelter', 'pet.photos'])
            ->orderBy($sortField, $sortDir)
            ->paginate(15)
            ->withQueryString();

        $shelters = Shelter::withCount([
            'pets as total_pets_count',
            'pets as active_pets_count' => function ($q): void {
                $q->where('status', 'available');
            },
        ])->get();

        $recentAdoptions = Application::with(['adopter', 'pet.shelter'])
            ->where('status', 'approved')
            ->latest('resolved_at')
            ->take(8)
            ->get();

        $activeFilters = $this->filterService->getActiveFilterDescriptions($request);

        return Inertia::render('admin/reports/index', [
            'stats' => $stats,
            'speciesBreakdown' => $speciesBreakdown,
            'applications' => $applications,
            'shelters' => $shelters,
            'recentAdoptions' => $recentAdoptions,
            'filters' => $request->only([
                'search', 'status', 'shelter_id', 'species',
                'score_range', 'date_preset', 'date_from', 'date_to',
                'date_field', 'sort_by', 'sort_dir',
            ]),
            'activeFilterDescriptions' => $activeFilters,
        ]);
    }

    /**
     * Generate and download filtered PDF report.
     */
    public function downloadPdf(Request $request)
    {
        $baseQuery = Application::with(['adopter', 'pet.shelter']);
        $filteredQuery = $this->filterService->applyFilters(clone $baseQuery, $request);
        $applications = $filteredQuery->latest('submitted_at')->get();

        $kpis = $this->filterService->computeKpis(clone $filteredQuery);
        $activeFilters = $this->filterService->getActiveFilterDescriptions($request);

        $data = [
            'title' => __('Adoption Activity Summary Report'),
            'date' => now()->format('Y-m-d H:i:s'),
            'applications' => $applications,
            'kpis' => $kpis,
            'total' => $kpis['total_applications'],
            'approved' => $kpis['approved_applications'],
            'rejected' => $kpis['rejected_applications'],
            'pending' => $kpis['pending_applications'],
            'approval_rate' => $kpis['approval_rate'],
            'avg_score' => $kpis['avg_dss_score'],
            'activeFilters' => $activeFilters,
        ];

        $pdf = Pdf::loadView('reports.adoption', $data);

        return $pdf->download('furfect-adoption-report-'.now()->format('Y-m-d').'.pdf');
    }

    /**
     * Generate and download filtered Excel-compatible CSV report.
     */
    public function downloadExcel(Request $request): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="furfect-adoption-report-'.now()->format('Y-m-d').'.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $baseQuery = Application::with(['adopter', 'pet.shelter']);
        $filteredQuery = $this->filterService->applyFilters(clone $baseQuery, $request);
        $applications = $filteredQuery->latest('submitted_at')->get();

        $callback = function () use ($applications): void {
            $file = fopen('php://output', 'w');

            // UTF-8 BOM for proper Excel compatibility
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($file, [
                __('Reference Number'),
                __('Adopter Name'),
                __('Adopter Email'),
                __('Pet Name'),
                __('Pet Species'),
                __('Shelter Name'),
                __('DSS Score (%)'),
                __('Status'),
                __('Submitted At'),
                __('Resolved At'),
            ]);

            foreach ($applications as $app) {
                fputcsv($file, [
                    $app->reference_number,
                    $app->adopter?->name ?? 'N/A',
                    $app->adopter?->email ?? 'N/A',
                    $app->pet?->name ?? 'N/A',
                    ucfirst((string) ($app->pet?->species ?? 'N/A')),
                    $app->pet?->shelter?->name ?? 'N/A',
                    $app->dss_score,
                    ucfirst($app->status),
                    $app->submitted_at ? $app->submitted_at->format('Y-m-d H:i:s') : '',
                    $app->resolved_at ? $app->resolved_at->format('Y-m-d H:i:s') : '',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
