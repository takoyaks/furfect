<?php

namespace App\Http\Controllers\Shelter;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Pet;
use App\Models\Shelter;
use App\Services\ReportFilterService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function __construct(
        protected ReportFilterService $filterService
    ) {}

    /**
     * Display a summary of adoption reports for the shelter staff.
     */
    public function index(Request $request): Response
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

        // Pet metrics
        $petsAvailable = Pet::where('status', 'available')->count();
        $petsAdopted = Pet::where('status', 'adopted')->count();

        $shelters = Shelter::all();
        $activeFilters = $this->filterService->getActiveFilterDescriptions($request);

        return Inertia::render('shelter/reports/index', [
            'stats' => $stats,
            'speciesBreakdown' => $speciesBreakdown,
            'petMetrics' => [
                'pets_available' => $petsAvailable,
                'pets_adopted' => $petsAdopted,
            ],
            'applications' => $applications,
            'shelters' => $shelters,
            'filters' => $request->only([
                'search', 'status', 'shelter_id', 'species',
                'score_range', 'date_preset', 'date_from', 'date_to',
                'date_field', 'sort_by', 'sort_dir',
            ]),
            'activeFilterDescriptions' => $activeFilters,
        ]);
    }

    /**
     * Generate and download filtered PDF report for shelter staff.
     */
    public function downloadPdf(Request $request)
    {
        $baseQuery = Application::with(['adopter', 'pet.shelter']);
        $filteredQuery = $this->filterService->applyFilters(clone $baseQuery, $request);
        $applications = $filteredQuery->latest('submitted_at')->get();

        $kpis = $this->filterService->computeKpis(clone $filteredQuery);
        $activeFilters = $this->filterService->getActiveFilterDescriptions($request);

        $data = [
            'title' => __('Shelter Adoption Activity Report'),
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
            'generated_by' => $request->user()?->name ?? 'Shelter Staff',
            'user_role' => 'Shelter Staff Officer',
        ];

        $pdf = Pdf::loadView('reports.adoption', $data);

        return $pdf->download('shelter-adoption-report-'.now()->format('Y-m-d').'.pdf');
    }

    /**
     * Generate and download filtered CSV report for shelter staff.
     */
    public function downloadExcel(Request $request): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="shelter-adoption-report-'.now()->format('Y-m-d').'.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $baseQuery = Application::with(['adopter', 'pet.shelter']);
        $filteredQuery = $this->filterService->applyFilters(clone $baseQuery, $request);
        $applications = $filteredQuery->latest('submitted_at')->get();

        $callback = function () use ($applications): void {
            $file = fopen('php://output', 'w');
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
