<?php

namespace App\Http\Controllers;

use App\Models\DssMatchScore;
use App\Models\SystemSetting;
use App\Services\BreedMaskerService;
use App\Services\DssMatchingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DssMatchController extends Controller
{
    /**
     * Display matched available pets for the authenticated adopter without exposing DSS scores.
     */
    public function index(Request $request, DssMatchingService $dssService): Response
    {
        $user = $request->user();
        $lifestyle = $user->lifestyleProfile;

        if (! $lifestyle || ! $lifestyle->submitted_at) {
            return Inertia::render('matches/index', [
                'hasProfile' => false,
                'matches' => [],
                'lifestyle' => null,
                'hasActiveApplication' => false,
                'adoptionCooldown' => $user->getAdoptionCooldownStatus(),
            ]);
        }

        $dssService->syncMissingMatchesForUser($user);

        $minScore = (float) SystemSetting::get('dss_minimum_score', 50);

        $rawMatches = DssMatchScore::where('user_id', $user->id)
            ->where('total_score', '>=', $minScore)
            ->where('housing_score', '>', 0)
            ->whereHas('pet', fn ($q) => $q->where('status', 'available'))
            ->with(['pet.photos', 'pet.shelter'])
            ->orderByDesc('total_score')
            ->get();

        $matches = $rawMatches->map(function (DssMatchScore $match): array {
            $pet = $match->pet;

            if ($pet) {
                $pet->breed = __('Hidden');
                $pet->description = BreedMaskerService::mask((string) $pet->description);
            }

            return [
                'id' => $match->id,
                'pet_id' => $match->pet_id,
                'matched_at' => $match->computed_at?->toIso8601String(),
                'pet' => $pet ? [
                    'id' => $pet->id,
                    'name' => $pet->name,
                    'species' => $pet->species,
                    'age_years' => $pet->age_years,
                    'gender' => $pet->gender,
                    'size' => $pet->size,
                    'coat_color' => $pet->coat_color,
                    'energy_level' => $pet->energy_level,
                    'temperament' => $pet->temperament ?? [],
                    'adoption_fee' => $pet->adoption_fee,
                    'description' => $pet->description,
                    'photos' => $pet->photos,
                    'shelter' => $pet->shelter ? [
                        'name' => $pet->shelter->name,
                        'location' => $pet->shelter->location,
                    ] : null,
                ] : null,
            ];
        })->filter(fn (array $item) => $item['pet'] !== null)->values();

        $hasActiveApplication = $user->applications()
            ->whereIn('status', ['pending', 'under_review', 'mao_audit'])
            ->exists();

        return Inertia::render('matches/index', [
            'hasProfile' => true,
            'matches' => $matches,
            'lifestyle' => $lifestyle,
            'hasActiveApplication' => $hasActiveApplication,
            'adoptionCooldown' => $user->getAdoptionCooldownStatus(),
        ]);
    }
}
