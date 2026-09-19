<?php

namespace App\Services;

use App\Models\DssMatchScore;
use App\Models\LifestyleProfile;
use App\Models\Pet;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Decision Support System (DSS) Matching Service.
 *
 * Implements the 8-Factor Weighted Multi-Criteria Decision Model from Criterion.pdf:
 *
 * 1. Lifestyle Compatibility (25%)
 * 2. Housing Compatibility (20%)
 * 3. Pet Needs & Care Capacity (15%)
 * 4. Experience Compatibility (10%)
 * 5. Other Pets Compatibility (10%)
 * 6. Family / Children Compatibility (10%)
 * 7. Age & Activity Compatibility (5%)
 * 8. Special Requirements (5%)
 * Total Weight = 100%
 */
class DssMatchingService
{
    /**
     * Compute and persist match scores for all available pets for a given user.
     *
     * @return Collection<int, DssMatchScore>
     */
    public function computeAllMatches(User $user): Collection
    {
        $lifestyle = $user->lifestyleProfile;

        if (! $lifestyle) {
            return collect();
        }

        $pets = Pet::where('status', 'available')->with(['photos', 'shelter'])->get();
        $scores = collect();

        DB::transaction(function () use ($user, $lifestyle, $pets, &$scores): void {
            foreach ($pets as $pet) {
                $result = $this->computeScore($lifestyle, $pet);

                $score = DssMatchScore::updateOrCreate(
                    ['user_id' => $user->id, 'pet_id' => $pet->id],
                    [
                        'total_score' => $result['total_score'],
                        'lifestyle_score' => $result['lifestyle_score'],
                        'housing_score' => $result['housing_score'],
                        'care_capacity_score' => $result['care_capacity_score'],
                        'experience_score' => $result['experience_score'],
                        'other_pets_score' => $result['other_pets_score'],
                        'family_children_score' => $result['family_children_score'],
                        'age_activity_score' => $result['age_activity_score'],
                        'special_requirements_score' => $result['special_requirements_score'],
                        'breakdown_details' => $result['breakdown_details'],
                        'fast_track_eligible' => $result['fast_track_eligible'],
                        // Legacy column compatibility
                        'living_score' => $result['housing_score'],
                        'health_score' => $result['special_requirements_score'],
                        'financial_score' => $result['care_capacity_score'],
                        'activity_score' => $result['lifestyle_score'],
                        'household_score' => $result['family_children_score'],
                        'preference_score' => $result['age_activity_score'],
                        'match_reasons' => $result['match_reasons'],
                        'mismatch_reasons' => $result['mismatch_reasons'],
                        'computed_at' => now(),
                    ]
                );

                $score->setRelation('pet', $pet);
                $scores->push($score);
            }
        });

        return $scores->sortByDesc('total_score')->values();
    }

    /**
     * Compute the 8-factor compatibility score between an adopter lifestyle profile and a pet.
     *
     * @return array{
     *   total_score: float,
     *   lifestyle_score: float,
     *   housing_score: float,
     *   care_capacity_score: float,
     *   experience_score: float,
     *   other_pets_score: float,
     *   family_children_score: float,
     *   age_activity_score: float,
     *   special_requirements_score: float,
     *   breakdown_details: array<string, mixed>,
     *   fast_track_eligible: bool,
     *   match_reasons: array<string>,
     *   mismatch_reasons: array<string>,
     *   living_score: float,
     *   health_score: float,
     *   financial_score: float,
     *   activity_score: float,
     *   household_score: float,
     *   preference_score: float
     * }
     */
    public function computeScore(LifestyleProfile $lifestyle, Pet $pet): array
    {
        $matchReasons = [];
        $mismatchReasons = [];
        $breakdownDetails = [];

        // 1. Lifestyle Compatibility (25%)
        $lifestyleScore = $this->scoreLifestyleCompatibility($lifestyle, $pet, $matchReasons, $mismatchReasons, $breakdownDetails);

        // 2. Housing Compatibility (20%)
        $housingScore = $this->scoreHousingCompatibility($lifestyle, $pet, $matchReasons, $mismatchReasons, $breakdownDetails);

        // 3. Pet Needs & Care Capacity (15%)
        $careCapacityScore = $this->scoreCareCapacity($lifestyle, $pet, $matchReasons, $mismatchReasons, $breakdownDetails);

        // 4. Experience Compatibility (10%)
        $experienceScore = $this->scoreExperienceCompatibility($lifestyle, $pet, $matchReasons, $mismatchReasons, $breakdownDetails);

        // 5. Other Pets Compatibility (10%)
        $otherPetsScore = $this->scoreOtherPetsCompatibility($lifestyle, $pet, $matchReasons, $mismatchReasons, $breakdownDetails);

        // 6. Family / Children Compatibility (10%)
        $familyChildrenScore = $this->scoreFamilyChildrenCompatibility($lifestyle, $pet, $matchReasons, $mismatchReasons, $breakdownDetails);

        // 7. Age & Activity Compatibility (5%)
        $ageActivityScore = $this->scoreAgeAndActivityCompatibility($lifestyle, $pet, $matchReasons, $mismatchReasons, $breakdownDetails);

        // 8. Special Requirements (5%)
        $specialRequirementsScore = $this->scoreSpecialRequirements($lifestyle, $pet, $matchReasons, $mismatchReasons, $breakdownDetails);

        // Pet Preferences Matching Checks (Transparent Adopter Alignment)
        if ($lifestyle->preferred_type && $lifestyle->preferred_type !== 'none' && $lifestyle->preferred_type === $pet->species) {
            $matchReasons[] = 'Matches your preferred pet species ('.ucfirst($pet->species).').';
        }

        if ($lifestyle->preferred_gender && $lifestyle->preferred_gender !== 'none' && $lifestyle->preferred_gender === $pet->gender) {
            $matchReasons[] = 'Matches your preferred pet gender ('.ucfirst($pet->gender).').';
        }

        if (! empty($lifestyle->preferred_size) && in_array($pet->size, $lifestyle->preferred_size)) {
            $matchReasons[] = 'Matches your preferred pet size ('.ucfirst($pet->size).').';
        }

        if (! empty($lifestyle->preferred_coat) && $pet->coat_color && in_array($pet->coat_color, $lifestyle->preferred_coat)) {
            $matchReasons[] = 'Matches your preferred coat/color ('.ucfirst($pet->coat_color).').';
        }

        // Health Status Highlights
        if ($pet->health_status) {
            $healthLower = strtolower($pet->health_status);
            if (str_contains($healthLower, 'neutered') || str_contains($healthLower, 'spayed')) {
                $matchReasons[] = 'Pet is altered (Spayed/Neutered) ensuring reproductive health and calm behavior.';
            }
            if (str_contains($healthLower, 'rabies')) {
                $matchReasons[] = 'Protected with Anti-Rabies vaccination compliant with RA 9482.';
            }
        }

        // Weighted total calculation (0–100%)
        $totalScore = round(
            ($lifestyleScore * 25.0) +
            ($housingScore * 20.0) +
            ($careCapacityScore * 15.0) +
            ($experienceScore * 10.0) +
            ($otherPetsScore * 10.0) +
            ($familyChildrenScore * 10.0) +
            ($ageActivityScore * 5.0) +
            ($specialRequirementsScore * 5.0),
            2
        );

        // Fast-track pre-evaluation rule: Total >= 85% with no severe mismatch in housing/experience/safety
        $fastTrackEligible = ($totalScore >= 85.0)
            && ($housingScore >= 0.75)
            && ($experienceScore >= 0.75)
            && ($otherPetsScore >= 0.50)
            && ($familyChildrenScore >= 0.50)
            && ($specialRequirementsScore >= 0.50);

        return [
            'total_score' => $totalScore,
            'lifestyle_score' => round($lifestyleScore * 100, 2),
            'housing_score' => round($housingScore * 100, 2),
            'care_capacity_score' => round($careCapacityScore * 100, 2),
            'experience_score' => round($experienceScore * 100, 2),
            'other_pets_score' => round($otherPetsScore * 100, 2),
            'family_children_score' => round($familyChildrenScore * 100, 2),
            'age_activity_score' => round($ageActivityScore * 100, 2),
            'special_requirements_score' => round($specialRequirementsScore * 100, 2),
            'breakdown_details' => $breakdownDetails,
            'fast_track_eligible' => $fastTrackEligible,
            'match_reasons' => array_values(array_unique($matchReasons)),
            'mismatch_reasons' => array_values(array_unique($mismatchReasons)),
            // Legacy aliases for backward compatibility
            'living_score' => round($housingScore * 100, 2),
            'health_score' => round($specialRequirementsScore * 100, 2),
            'financial_score' => round($careCapacityScore * 100, 2),
            'activity_score' => round($lifestyleScore * 100, 2),
            'household_score' => round($familyChildrenScore * 100, 2),
            'preference_score' => round($ageActivityScore * 100, 2),
        ];
    }

    // ─────────────────────────────────────────────────────────────
    // 1. Lifestyle Compatibility (25%)
    // Determines whether the pet's activity needs fit adopter lifestyle
    // 1.00 = excellent match | 0.75 = acceptable | 0.50 = limited | 0 = incompatible
    // ─────────────────────────────────────────────────────────────
    private function scoreLifestyleCompatibility(
        LifestyleProfile $lifestyle,
        Pet $pet,
        array &$matchReasons,
        array &$mismatchReasons,
        array &$breakdownDetails
    ): float {
        $activityScale = [
            'very_light' => 0,
            'light' => 1,
            'moderate' => 2,
            'very_active' => 3,
        ];

        $petEnergyScale = [
            'low' => 0,
            'light' => 1,
            'moderate' => 2,
            'high' => 3,
            'very_active' => 3,
        ];

        $userActivity = $activityScale[$lifestyle->activity_level ?? 'moderate'] ?? 2;
        $petEnergy = $petEnergyScale[$pet->energy_level ?? 'moderate'] ?? 2;
        $gap = abs($userActivity - $petEnergy);

        $schedule = $lifestyle->work_schedule ?? 'office';
        $score = 1.00;

        if ($gap === 0) {
            $score = 1.00;
            $matchReasons[] = 'Activity level and daily pace align excellently.';
        } elseif ($gap === 1) {
            $score = 0.75;
            $matchReasons[] = 'Acceptable activity level alignment.';
        } elseif ($gap === 2) {
            $score = 0.50;
            $mismatchReasons[] = 'Noticeable activity level difference (pet may need more exercise than current routine).';
        } else {
            $score = 0.00;
            $mismatchReasons[] = 'Very high energy vs. low activity — poor match';
        }

        // Long hours away with high energy pet adjustment
        if ($petEnergy >= 2 && in_array($schedule, ['shifting', 'office']) && $score > 0.50 && $schedule !== 'wfh' && $schedule !== 'student') {
            $score = 0.75;
            $mismatchReasons[] = 'Standard away-from-home schedule will require dedicated exercise time for this active pet.';
        } elseif (in_array($schedule, ['wfh', 'student'])) {
            $matchReasons[] = 'Flexible schedule allows quality companionship time.';
        }

        $breakdownDetails['lifestyle'] = [
            'score' => $score,
            'weight' => 25,
            'label' => 'Lifestyle Compatibility',
            'assessment' => $score >= 1.0 ? 'Excellent Match' : ($score >= 0.75 ? 'Acceptable' : ($score >= 0.50 ? 'Limited Compatibility' : 'Incompatible')),
            'details' => "Adopter Activity: {$lifestyle->activity_level}, Pet Energy: {$pet->energy_level}, Work Schedule: {$schedule}",
        ];

        return $score;
    }

    // ─────────────────────────────────────────────────────────────
    // 2. Housing Compatibility (20%)
    // Ensures pet can safely live in adopter residence
    // 1.00 = fully compatible | 0.75 = manageable | 0 = incompatible
    // ─────────────────────────────────────────────────────────────
    private function scoreHousingCompatibility(
        LifestyleProfile $lifestyle,
        Pet $pet,
        array &$matchReasons,
        array &$mismatchReasons,
        array &$breakdownDetails
    ): float {
        $housing = $lifestyle->housing_type ?? 'house_with_yard';
        $outdoor = $lifestyle->outdoor_access ?? 'none';
        $compatibleList = $pet->housing_compatible ?? [];

        // Check hard incompatibility
        if (! empty($compatibleList) && ! in_array($housing, $compatibleList)) {
            $mismatchReasons[] = "Housing type ({$housing}) is not designated as suitable for this pet.";
            $breakdownDetails['housing'] = [
                'score' => 0.00,
                'weight' => 20,
                'label' => 'Housing Compatibility',
                'assessment' => 'Incompatible',
                'details' => 'Residence type does not meet pet housing requirements.',
            ];

            return 0.00;
        }

        // Yard requirement check
        if ($pet->requires_yard && $outdoor === 'none') {
            $mismatchReasons[] = 'This pet strictly requires a yard/outdoor space, but no outdoor access is available.';
            $breakdownDetails['housing'] = [
                'score' => 0.00,
                'weight' => 20,
                'label' => 'Housing Compatibility',
                'assessment' => 'Incompatible',
                'details' => 'No yard access for a pet requiring yard space.',
            ];

            return 0.00;
        }

        if ($pet->requires_yard && $outdoor === 'not_fenced') {
            $mismatchReasons[] = 'Yard is present but not securely fenced; extra supervision needed.';
            $score = 0.75;
        } elseif ($pet->size === 'large' && in_array($housing, ['apartment', 'condo', 'rented_room'])) {
            $mismatchReasons[] = 'Large pet in an apartment or condo requires frequent outdoor walks.';
            $score = 0.75;
        } else {
            $matchReasons[] = 'Residence and outdoor environment are fully compatible.';
            $score = 1.00;
        }

        $breakdownDetails['housing'] = [
            'score' => $score,
            'weight' => 20,
            'label' => 'Housing Compatibility',
            'assessment' => $score >= 1.0 ? 'Fully Compatible' : 'Manageable Space',
            'details' => "Housing: {$housing}, Yard Access: {$outdoor}, Pet Size: {$pet->size}",
        ];

        return $score;
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Pet Needs & Care Capacity (15%)
    // Checks whether adopter can provide required care
    // 1.00 / 0.75 / 0.50 / 0.00
    // ─────────────────────────────────────────────────────────────
    private function scoreCareCapacity(
        LifestyleProfile $lifestyle,
        Pet $pet,
        array &$matchReasons,
        array &$mismatchReasons,
        array &$breakdownDetails
    ): float {
        $incomeMap = [
            'below_10000' => 1,
            '10000_20000' => 2,
            '20001_40000' => 3,
            '40001_60000' => 4,
            '60001_100000' => 5,
            'above_100000' => 6,
        ];

        $incomeTier = $incomeMap[$lifestyle->monthly_income ?? '20001_40000'] ?? 3;
        $score = 1.00;

        if ($incomeTier >= 3) {
            $score = 1.00;
            $matchReasons[] = 'Stable financial capacity to cover routine care, premium nutrition, and emergency veterinary needs.';
        } elseif ($incomeTier === 2) {
            // 10k-20k
            if ($pet->size === 'large') {
                $score = 0.75;
                $mismatchReasons[] = 'Large breed maintenance costs may require careful budgeting.';
            } else {
                $score = 1.00;
                $matchReasons[] = 'Adequate income for small/medium pet care.';
            }
        } else {
            // Below 10k
            if ($pet->size === 'large') {
                $score = 0.50;
                $mismatchReasons[] = 'Income may be limited for long-term large pet veterinary and dietary costs.';
            } else {
                $score = 0.75;
                $mismatchReasons[] = 'Budgeting required for pet food and annual vaccinations.';
            }
        }

        // Maintenance Level Adjustment
        $maintenance = $pet->maintenance_level ?? 'medium';
        if ($maintenance === 'high') {
            if ($incomeTier <= 2) {
                $score = max(0.25, $score - 0.25);
                $mismatchReasons[] = 'High-maintenance pet requires elevated grooming, specialized diet, and healthcare expenditures.';
            } else {
                $matchReasons[] = 'Well-prepared to support high-maintenance pet grooming and specialized care routines.';
            }
        } elseif ($maintenance === 'low') {
            $matchReasons[] = 'Low-maintenance pet fits effortlessly into daily household commitments.';
        }

        $breakdownDetails['care_capacity'] = [
            'score' => $score,
            'weight' => 15,
            'label' => 'Pet Needs & Care Capacity',
            'assessment' => $score >= 1.0 ? 'High Capacity' : ($score >= 0.75 ? 'Adequate Capacity' : 'Limited Capacity'),
            'details' => "Monthly Income Tier: {$lifestyle->monthly_income}, Pet Size: {$pet->size}, Maintenance Level: ".ucfirst($maintenance),
        ];

        return $score;
    }

    // ─────────────────────────────────────────────────────────────
    // 4. Experience Compatibility (10%)
    // Matches pet requirements with adopter's experience
    // 1.00 = suitable experience | 0.75 = some experience | 0.50 = beginner-compatible | 0 = unsuitable
    // ─────────────────────────────────────────────────────────────
    private function scoreExperienceCompatibility(
        LifestyleProfile $lifestyle,
        Pet $pet,
        array &$matchReasons,
        array &$mismatchReasons,
        array &$breakdownDetails
    ): float {
        $experience = $lifestyle->pet_experience ?? 'first_time';
        $requiresExp = $pet->requires_experience ?? false;

        if ($requiresExp && $experience === 'first_time') {
            $score = 0.00;
            $mismatchReasons[] = 'This pet requires an experienced handler with previous animal care history.';
        } elseif ($requiresExp && $experience === 'had_before') {
            $score = 0.75;
            $matchReasons[] = 'Adopter has previous pet ownership experience suitable for this pet.';
        } elseif ($experience === 'had_before' || $experience === 'currently_have') {
            $score = 1.00;
            $matchReasons[] = 'Experienced pet owner with established pet handling skills.';
        } else {
            // First time owner on non-experience-required pet
            $score = 0.50;
            $matchReasons[] = 'Beginner-friendly pet suitable for first-time adopters.';
        }

        $breakdownDetails['experience'] = [
            'score' => $score,
            'weight' => 10,
            'label' => 'Experience Compatibility',
            'assessment' => $score >= 1.0 ? 'Suitable Experience' : ($score >= 0.75 ? 'Moderate Experience' : ($score >= 0.50 ? 'Beginner-Compatible' : 'Unsuitable')),
            'details' => "Adopter Experience: {$experience}, Requires Experienced Handler: ".($requiresExp ? 'Yes' : 'No'),
        ];

        return $score;
    }

    // ─────────────────────────────────────────────────────────────
    // 5. Other Pets Compatibility (10%)
    // Considers existing animals in the household
    // 1.00 = compatible | 0.50 = unknown/conditional | 0 = incompatible
    // ─────────────────────────────────────────────────────────────
    private function scoreOtherPetsCompatibility(
        LifestyleProfile $lifestyle,
        Pet $pet,
        array &$matchReasons,
        array &$mismatchReasons,
        array &$breakdownDetails
    ): float {
        $otherPets = $lifestyle->other_pets ?? 'none';
        $requiresNoPets = $pet->requires_no_other_pets ?? false;

        if ($requiresNoPets && in_array($otherPets, ['dogs', 'cats', 'both', 'mixed'])) {
            $score = 0.00;
            $mismatchReasons[] = 'This pet must be the only animal in the home; conflict with existing household pets.';
        } elseif ($otherPets === 'none') {
            $score = 1.00;
            $matchReasons[] = 'Single-pet environment allows undivided attention and zero animal conflicts.';
        } elseif (! $requiresNoPets) {
            $score = 0.50;
            $matchReasons[] = 'Social introduction recommended with existing household pets.';
        } else {
            $score = 1.00;
        }

        $breakdownDetails['other_pets'] = [
            'score' => $score,
            'weight' => 10,
            'label' => 'Other Pets Compatibility',
            'assessment' => $score >= 1.0 ? 'Compatible' : ($score >= 0.50 ? 'Conditional Introduction Needed' : 'Incompatible'),
            'details' => "Existing Pets: {$otherPets}, Single-Pet Home Required: ".($requiresNoPets ? 'Yes' : 'No'),
        ];

        return $score;
    }

    // ─────────────────────────────────────────────────────────────
    // 6. Family / Children Compatibility (10%)
    // Determines suitability for household members
    // 1.00 = compatible | 0.50 = conditional | 0 = incompatible
    // ─────────────────────────────────────────────────────────────
    private function scoreFamilyChildrenCompatibility(
        LifestyleProfile $lifestyle,
        Pet $pet,
        array &$matchReasons,
        array &$mismatchReasons,
        array &$breakdownDetails
    ): float {
        $children = $lifestyle->has_children ?? 'none';
        $agrees = $lifestyle->household_agrees ?? true;
        $noChildren = $pet->requires_no_children ?? false;

        if (! $agrees) {
            $score = 0.00;
            $mismatchReasons[] = 'Not all household members currently agree to adopting a pet.';
        } elseif ($noChildren && in_array($children, ['young', 'older'])) {
            $score = 0.00;
            $mismatchReasons[] = 'Pet is not suited for homes with children.';
        } elseif ($children === 'young') {
            $score = 0.50;
            $matchReasons[] = 'Supervised interactions recommended around young children.';
        } else {
            $score = 1.00;
            $matchReasons[] = 'Household members are unified and safe for this companion animal.';
        }

        $breakdownDetails['family_children'] = [
            'score' => $score,
            'weight' => 10,
            'label' => 'Family & Children Compatibility',
            'assessment' => $score >= 1.0 ? 'Fully Compatible' : ($score >= 0.50 ? 'Conditional' : 'Incompatible'),
            'details' => "Children Present: {$children}, Household Agrees: ".($agrees ? 'Yes' : 'No').', No-Children Rule: '.($noChildren ? 'Yes' : 'No'),
        ];

        return $score;
    }

    // ─────────────────────────────────────────────────────────────
    // 7. Age & Activity Compatibility (5%)
    // Matches adopter preferences/capacity with pet age and activity
    // 1.00 / 0.75 / 0.50 / 0.00
    // ─────────────────────────────────────────────────────────────
    private function scoreAgeAndActivityCompatibility(
        LifestyleProfile $lifestyle,
        Pet $pet,
        array &$matchReasons,
        array &$mismatchReasons,
        array &$breakdownDetails
    ): float {
        $age = $pet->age_years ?? 1;
        $activity = $lifestyle->activity_level ?? 'moderate';

        $score = 1.00;

        // Puppies / kittens (< 1 yr) require high supervision and energy
        if ($age < 1 && $activity === 'very_light') {
            $score = 0.50;
            $mismatchReasons[] = 'Young puppy/kitten requires high supervision and daily training routine.';
        } elseif ($age >= 7 && $activity === 'very_active') {
            $score = 0.75;
            $matchReasons[] = 'Senior companion is calm, though adopter leads an active lifestyle.';
        } else {
            $score = 1.00;
            $matchReasons[] = "Pet age ({$age} yr) aligns well with household daily routine.";
        }

        $breakdownDetails['age_activity'] = [
            'score' => $score,
            'weight' => 5,
            'label' => 'Age & Activity Compatibility',
            'assessment' => $score >= 1.0 ? 'Well Aligned' : ($score >= 0.75 ? 'Manageable' : 'Moderate Difference'),
            'details' => "Pet Age: {$age} yrs, Adopter Activity: {$activity}",
        ];

        return $score;
    }

    // ─────────────────────────────────────────────────────────────
    // 8. Special Requirements (5%)
    // Checks medical, behavioral, or special-care requirements
    // 1.00 = can accommodate | 0.50 = conditional | 0 = cannot accommodate
    // ─────────────────────────────────────────────────────────────
    private function scoreSpecialRequirements(
        LifestyleProfile $lifestyle,
        Pet $pet,
        array &$matchReasons,
        array &$mismatchReasons,
        array &$breakdownDetails
    ): float {
        $conditions = $lifestyle->health_conditions ?? [];
        $hasAircon = $lifestyle->has_aircon ?? 'stable';
        $healthStatus = $pet->health_status ?? 'Vaccinated & Healthy';

        $score = 1.00;

        // Allergy check
        if (in_array('fur_allergy', $conditions) || in_array('skin_allergy', $conditions)) {
            $score = 0.50;
            $mismatchReasons[] = 'Allergy condition detected in household; regular grooming and hypoallergenic care required.';
        }

        // Climate sensitivity check for heavy-coated or brachycephalic pets
        if ($hasAircon === 'none' && str_contains(strtolower($healthStatus), 'heat sensitive')) {
            $score = 0.50;
            $mismatchReasons[] = 'Pet is heat-sensitive; shaded or well-ventilated space essential.';
        }

        if (empty($conditions)) {
            $matchReasons[] = 'No medical or allergy constraints preventing optimal care.';
        }

        $breakdownDetails['special_requirements'] = [
            'score' => $score,
            'weight' => 5,
            'label' => 'Special Requirements & Health',
            'assessment' => $score >= 1.0 ? 'Fully Accommodated' : ($score >= 0.50 ? 'Manageable Care Plan' : 'Constraint Conflict'),
            'details' => 'Household Health Notes: '.(empty($conditions) ? 'None' : implode(', ', $conditions)).", Pet Health: {$healthStatus}",
        ];

        return $score;
    }

    /**
     * Compute and retrieve the top alternative compatible pets for a user,
     * excluding a specific pet (e.g. when that pet was adopted by someone else).
     *
     * @return Collection<int, array{pet: Pet, dss: array}>
     */
    public function getTopAlternativeRecommendations(User $user, int $excludePetId, int $limit = 3): Collection
    {
        $lifestyle = $user->lifestyleProfile;

        if (! $lifestyle) {
            return collect();
        }

        $availablePets = Pet::where('status', 'available')
            ->where('id', '!=', $excludePetId)
            ->with(['photos', 'shelter'])
            ->get();

        $recommendations = collect();

        foreach ($availablePets as $pet) {
            $scoreData = $this->computeScore($lifestyle, $pet);

            $recommendations->push([
                'pet' => $pet,
                'total_score' => $scoreData['total_score'],
                'fast_track_eligible' => $scoreData['fast_track_eligible'],
                'match_reasons' => array_slice($scoreData['match_reasons'], 0, 2),
            ]);
        }

        return $recommendations
            ->sortByDesc('total_score')
            ->take($limit)
            ->values();
    }
}
