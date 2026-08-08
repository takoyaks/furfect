<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Pet;
use App\Models\Shelter;
use Barrier;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * Display report dashboard for administrators.
     */
    public function index(Request $request): InertiaResponse
    {
        $totalApplications = Application::count();
        $approvedApplications = Application::where('status', 'approved')->count();
        $rejectedApplications = Application::where('status', 'rejected')->count();
        $pendingAudits = Application::where('status', 'mao_audit')->count();

        $shelters = Shelter::withCount([
            'pets as total_pets_count',
            'pets as active_pets_count' => function ($q): void {
                $q->where('status', 'available');
            }
        ])->get();

        $recentAdoptions = Application::with(['adopter', 'pet.shelter'])
            ->where('status', 'approved')
            ->latest('resolved_at')
            ->take(10)
            ->get();

        return Inertia::render('admin/reports/index', [
            'stats' => [
                'total_applications' => $totalApplications,
                'approved_applications' => $approvedApplications,
                'rejected_applications' => $rejectedApplications,
                'pending_audits' => $pendingAudits,
            ],
            'shelters' => $shelters,
            'recentAdoptions' => $recentAdoptions,
        ]);
    }

    /**
     * Generate and download PDF report.
     */
    public function downloadPdf(Request $request)
    {
        $applications = Application::with(['adopter', 'pet.shelter'])->latest('submitted_at')->get();

        $data = [
            'title' => __('Adoption Activity Summary Report'),
            'date' => now()->format('Y-m-d H:i:s'),
            'applications' => $applications,
            'total' => $applications->count(),
            'approved' => $applications->where('status', 'approved')->count(),
            'rejected' => $applications->where('status', 'rejected')->count(),
            'pending' => $applications->whereIn('status', ['pending', 'under_review', 'mao_audit'])->count(),
        ];

        $pdf = Pdf::loadView('reports.adoption', $data);

        return $pdf->download('furfect-adoption-report-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Generate and download Excel-compatible CSV report.
     */
    public function downloadExcel(Request $request): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="furfect-adoption-report-' . now()->format('Y-m-d') . '.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $applications = Application::with(['adopter', 'pet.shelter'])->latest('submitted_at')->get();

        $callback = function () use ($applications): void {
            $file = fopen('php://output', 'w');
            
            // UTF-8 BOM for proper Excel compatibility
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($file, [
                __('Reference Number'),
                __('Adopter Name'),
                __('Adopter Email'),
                __('Pet Name'),
                __('Shelter Name'),
                __('DSS Score (%)'),
                __('Status'),
                __('Submitted At'),
                __('Resolved At'),
            ]);

            foreach ($applications as $app) {
                fputcsv($file, [
                    $app->reference_number,
                    $app->adopter->name,
                    $app->adopter->email,
                    $app->pet->name,
                    $app->pet->shelter->name,
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
