<?php

namespace App\Http\Controllers;

use App\Models\DssMatchScore;
use App\Services\DssMatchingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DssMatchController extends Controller
{
    /**
     * Display the DSS ranked match results for the authenticated user.
     */
    public function index(Request $request, DssMatchingService $dssService): Response
    {
        $user = $request->user();

        if (! $user->lifestyleProfile) {
            return Inertia::render('matches/index', [
                'hasProfile' => false,
                'matches' => [],
            ]);
        }

        // Make sure matches are computed/refreshed
        $matches = DssMatchScore::where('user_id', $user->id)
            ->with(['pet.photos', 'pet.shelter'])
            ->get()
            ->sortByDesc('total_score')
            ->values();

        // If no matches are found (e.g. new pets added), let's run the service compute method
        if ($matches->isEmpty()) {
            $dssService->computeAllMatches($user);
            $matches = DssMatchScore::where('user_id', $user->id)
                ->with(['pet.photos', 'pet.shelter'])
                ->get()
                ->sortByDesc('total_score')
                ->values();
        }

        return Inertia::render('matches/index', [
            'hasProfile' => true,
            'matches' => $matches,
            'lifestyle' => $user->lifestyleProfile,
        ]);
    }
}
