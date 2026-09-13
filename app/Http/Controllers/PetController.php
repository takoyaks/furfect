<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\DssMatchScore;
use App\Models\Pet;
use App\Services\BreedMaskerService;
use App\Services\DssMatchingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PetController extends Controller
{
    /**
     * Display a listing of available pets with filters.
     */
    public function index(Request $request): Response
    {
        $query = Pet::where('status', 'available')->with(['photos', 'shelter']);

        // Filters
        if ($request->filled('species') && $request->input('species') !== 'All types') {
            $query->where('species', $request->input('species'));
        }

        if ($request->filled('gender') && $request->input('gender') !== 'Any') {
            $query->where('gender', strtolower($request->input('gender')));
        }

        if ($request->filled('size') && $request->input('size') !== 'Any') {
            $query->where('size', strtolower($request->input('size')));
        }

        if ($request->filled('maintenance') && $request->input('maintenance') !== 'Any') {
            $query->where('maintenance_level', strtolower($request->input('maintenance')));
        }

        if ($request->filled('color') && $request->input('color') !== 'Any') {
            $query->where('coat_color', strtolower($request->input('color')));
        }

        if ($request->filled('age') && $request->input('age') !== 'All ages') {
            $age = $request->input('age');
            if ($age === 'Puppy/Kitten (Under 1 yr)') {
                $query->where('age_years', '<', 1);
            } elseif ($age === 'Young (1-3 yrs)') {
                $query->where('age_years', '>=', 1)->where('age_years', '<=', 3);
            } elseif ($age === 'Adult (3-7 yrs)') {
                $query->where('age_years', '>', 3)->where('age_years', '<=', 7);
            } elseif ($age === 'Senior (7+ yrs)') {
                $query->where('age_years', '>', 7);
            }
        }

        if ($request->filled('fee')) {
            $fee = $request->input('fee');
            if ($fee === 'free') {
                $query->where('adoption_fee', 0);
            } elseif ($fee === 'paid') {
                $query->where('adoption_fee', '>', 0);
            }
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $pets = $query->latest('listed_at')->paginate(12)->withQueryString();

        // Anti-breed bias: hide breed and mask breed mentions in description
        $pets->getCollection()->transform(function (Pet $pet) {
            $pet->breed = __('Hidden');
            $pet->description = BreedMaskerService::mask((string) $pet->description);

            return $pet;
        });

        // Get saved pets IDs if user logged in
        $savedPetIds = [];
        $dssScores = [];
        if ($user = $request->user()) {
            $savedPetIds = $user->savedPets()->pluck('pet_id')->toArray();
            $dssScores = DssMatchScore::where('user_id', $user->id)
                ->pluck('total_score', 'pet_id')
                ->toArray();
        }

        return Inertia::render('pets/index', [
            'pets' => $pets,
            'filters' => $request->only(['species', 'gender', 'size', 'maintenance', 'color', 'age', 'fee', 'search']),
            'savedPetIds' => $savedPetIds,
            'dssScores' => $dssScores,
        ]);
    }

    /**
     * Display a specific pet's details including DSS match details.
     */
    public function show(Request $request, int $id, DssMatchingService $dssService): Response
    {
        $pet = Pet::with(['photos', 'shelter'])->findOrFail($id);
        $user = $request->user();

        $dssData = null;
        $isSaved = false;
        $hasActiveApplication = false;
        $isApproved = false;

        // Store real breed & description before any masking
        $originalBreed = $pet->breed;
        $originalDescription = $pet->description;

        // Default: hide breed and mask description
        $pet->breed = __('Hidden');
        $pet->description = BreedMaskerService::mask((string) $originalDescription);

        if ($user) {
            $isSaved = $user->savedPets()->where('pet_id', $pet->id)->exists();
            $hasActiveApplication = $user->applications()
                ->whereIn('status', ['pending', 'under_review', 'mao_audit'])
                ->exists();

            // Check if this adopter has an approved application for this pet
            $isApproved = Application::where('user_id', $user->id)
                ->where('pet_id', $pet->id)
                ->where('status', 'approved')
                ->exists();

            if ($isApproved) {
                // Approved adopter: reveal real breed and unmasked description
                $pet->breed = $originalBreed;
                $pet->description = $originalDescription;
            }

            if ($user->lifestyleProfile) {
                // Fetch or calculate DSS match score details
                $score = DssMatchScore::where('user_id', $user->id)
                    ->where('pet_id', $pet->id)
                    ->first();

                if (! $score) {
                    $result = $dssService->computeScore($user->lifestyleProfile, $pet);
                    $score = DssMatchScore::create(array_merge($result, [
                        'user_id' => $user->id,
                        'pet_id' => $pet->id,
                        'computed_at' => now(),
                    ]));
                }

                $dssData = [
                    'total_score' => $score->total_score,
                    'lifestyle_score' => $score->lifestyle_score,
                    'housing_score' => $score->housing_score,
                    'care_capacity_score' => $score->care_capacity_score,
                    'experience_score' => $score->experience_score,
                    'other_pets_score' => $score->other_pets_score,
                    'family_children_score' => $score->family_children_score,
                    'age_activity_score' => $score->age_activity_score,
                    'special_requirements_score' => $score->special_requirements_score,
                    'breakdown_details' => $score->breakdown_details,
                    'fast_track_eligible' => $score->fast_track_eligible,
                    'match_reasons' => $score->match_reasons,
                    'mismatch_reasons' => $score->mismatch_reasons,
                    // Legacy support
                    'living_score' => $score->housing_score ?? $score->living_score,
                    'health_score' => $score->special_requirements_score ?? $score->health_score,
                    'financial_score' => $score->care_capacity_score ?? $score->financial_score,
                    'activity_score' => $score->lifestyle_score ?? $score->activity_score,
                    'household_score' => $score->family_children_score ?? $score->household_score,
                    'preference_score' => $score->age_activity_score ?? $score->preference_score,
                ];
            }
        }

        return Inertia::render('pets/show', [
            'pet' => $pet,
            'dssData' => $dssData,
            'isSaved' => $isSaved,
            'hasActiveApplication' => $hasActiveApplication,
            'isApproved' => $isApproved,
        ]);
    }
}
