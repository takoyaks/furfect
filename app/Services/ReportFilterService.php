<?php

namespace App\Services;

use App\Models\Application;
use App\Models\Shelter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ReportFilterService
{
    /**
     * Apply filter criteria to an Application Eloquent query.
     *
     * @param  Builder<Application>  $query
     * @return Builder<Application>
     */
    public function applyFilters(Builder $query, Request $request): Builder
    {
        // 1. Keyword search (Reference #, Adopter Name, Adopter Email, Pet Name)
        if ($request->filled('search')) {
            $search = trim((string) $request->input('search'));
            $query->where(function (Builder $q) use ($search): void {
                $q->where('reference_number', 'like', "%{$search}%")
                    ->orWhereHas('adopter', function (Builder $userQ) use ($search): void {
                        $userQ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('pet', function (Builder $petQ) use ($search): void {
                        $petQ->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // 2. Status filter
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $status = (string) $request->input('status');
            $query->where('status', $status);
        }

        // 3. Shelter filter
        if ($request->filled('shelter_id') && $request->input('shelter_id') !== 'all') {
            $shelterId = (int) $request->input('shelter_id');
            $query->whereHas('pet', function (Builder $petQ) use ($shelterId): void {
                $petQ->where('shelter_id', $shelterId);
            });
        }

        // 4. Pet Species filter (dog / cat)
        if ($request->filled('species') && $request->input('species') !== 'all') {
            $species = (string) $request->input('species');
            $query->whereHas('pet', function (Builder $petQ) use ($species): void {
                $petQ->where('species', $species);
            });
        }

        // 5. DSS Score range filter
        if ($request->filled('score_range') && $request->input('score_range') !== 'all') {
            $range = (string) $request->input('score_range');
            match ($range) {
                'high' => $query->where('dss_score', '>=', 80),
                'moderate' => $query->whereBetween('dss_score', [50, 79.99]),
                'low' => $query->where('dss_score', '<', 50),
                default => null,
            };
        }

        // 6. Date Range filter (Preset or Custom From/To)
        $dateField = $request->input('date_field', 'submitted_at');
        if (! in_array($dateField, ['submitted_at', 'resolved_at'])) {
            $dateField = 'submitted_at';
        }

        $preset = $request->input('date_preset', 'all');

        if ($preset !== 'all' && $preset !== 'custom') {
            match ($preset) {
                'today' => $query->whereDate($dateField, Carbon::today()),
                'this_week' => $query->whereBetween($dateField, [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]),
                'this_month' => $query->whereBetween($dateField, [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()]),
                'last_month' => $query->whereBetween($dateField, [Carbon::now()->subMonth()->startOfMonth(), Carbon::now()->subMonth()->endOfMonth()]),
                'this_year' => $query->whereBetween($dateField, [Carbon::now()->startOfYear(), Carbon::now()->endOfYear()]),
                default => null,
            };
        } elseif ($preset === 'custom' || ($request->filled('date_from') || $request->filled('date_to'))) {
            if ($request->filled('date_from')) {
                $query->whereDate($dateField, '>=', $request->input('date_from'));
            }
            if ($request->filled('date_to')) {
                $query->whereDate($dateField, '<=', $request->input('date_to'));
            }
        }

        return $query;
    }

    /**
     * Compute KPI statistics from a filtered Application query.
     *
     * @param  Builder<Application>  $query
     * @return array<string, mixed>
     */
    public function computeKpis(Builder $query): array
    {
        $cloned = clone $query;

        $total = $cloned->count();
        $approved = (clone $query)->where('status', 'approved')->count();
        $rejected = (clone $query)->where('status', 'rejected')->count();
        $pending = (clone $query)->whereIn('status', ['pending', 'under_review', 'mao_audit'])->count();
        $avgScore = round((float) (clone $query)->avg('dss_score'), 1);

        $approvalRate = $total > 0 ? round(($approved / $total) * 100, 1) : 0;
        $rejectionRate = $total > 0 ? round(($rejected / $total) * 100, 1) : 0;

        return [
            'total_applications' => $total,
            'approved_applications' => $approved,
            'rejected_applications' => $rejected,
            'pending_applications' => $pending,
            'approval_rate' => $approvalRate,
            'rejection_rate' => $rejectionRate,
            'avg_dss_score' => $avgScore,
        ];
    }

    /**
     * Compute species adoption breakdown (Dogs vs Cats).
     *
     * @param  Builder<Application>  $query
     * @return array{dogs: int, cats: int}
     */
    public function computeSpeciesBreakdown(Builder $query): array
    {
        $dogs = (clone $query)->whereHas('pet', function (Builder $petQ): void {
            $petQ->where('species', 'dog');
        })->count();

        $cats = (clone $query)->whereHas('pet', function (Builder $petQ): void {
            $petQ->where('species', 'cat');
        })->count();

        return [
            'dogs' => $dogs,
            'cats' => $cats,
        ];
    }

    /**
     * Return human-readable active filter labels for report headings and PDF headers.
     *
     * @return array<string, string>
     */
    public function getActiveFilterDescriptions(Request $request): array
    {
        $filters = [];

        if ($request->filled('search')) {
            $filters['Keyword'] = '"'.$request->input('search').'"';
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $filters['Status'] = ucfirst((string) $request->input('status'));
        }

        if ($request->filled('shelter_id') && $request->input('shelter_id') !== 'all') {
            $shelter = Shelter::find($request->input('shelter_id'));
            if ($shelter) {
                $filters['Shelter'] = $shelter->name;
            }
        }

        if ($request->filled('species') && $request->input('species') !== 'all') {
            $filters['Species'] = ucfirst((string) $request->input('species')).'s';
        }

        if ($request->filled('score_range') && $request->input('score_range') !== 'all') {
            $filters['DSS Score'] = match ($request->input('score_range')) {
                'high' => '80%+ (High)',
                'moderate' => '50% - 79% (Moderate)',
                'low' => 'Below 50%',
                default => 'All',
            };
        }

        if ($request->filled('date_preset') && $request->input('date_preset') !== 'all') {
            $preset = (string) $request->input('date_preset');
            $filters['Period'] = match ($preset) {
                'today' => 'Today',
                'this_week' => 'This Week',
                'this_month' => 'This Month',
                'last_month' => 'Last Month',
                'this_year' => 'This Year',
                'custom' => ($request->input('date_from', 'Start').' to '.$request->input('date_to', 'End')),
                default => 'Custom',
            };
        } elseif ($request->filled('date_from') || $request->filled('date_to')) {
            $filters['Period'] = ($request->input('date_from', 'Start').' to '.$request->input('date_to', 'End'));
        }

        return $filters;
    }
}
