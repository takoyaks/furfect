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
 * Computes lifestyle compatibility scores between adopters and available pets.
 * Uses a weighted multi-factor scoring model as defined in the proposal.
 *
 * Factor Weights:
 *   - Living Situation      25%
 *   - Health Considerations 20%
 *   - Financial Capacity    20%
 *   - Activity Level        15%
 *   - Household Composition 10%
 *   - Pet Preferences       10% (soft filter — does not override DSS)
 */
class DssMatchingService
{
    /**
     * Compute and persist match scores for all available pets for a given user.
     * Scores are stored in dss_match_scores and replaced on recompute.
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
                        'living_score' => $result['living_score'],
                        'health_score' => $result['health_score'],
                        'financial_score' => $result['financial_score'],
                        'activity_score' => $result['activity_score'],
                        'household_score' => $result['household_score'],
                        'preference_score' => $result['preference_score'],
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
     * Compute a compatibility score between a lifestyle profile and a pet.
     *
     * @return array{
     *   total_score: float,
     *   living_score: float,
     *   health_score: float,
     *   financial_score: float,
     *   activity_score: float,
     *   household_score: float,
     *   preference_score: float,
     *   match_reasons: array<string>,
     *   mismatch_reasons: array<string>
     * }
     */
    public function computeScore(LifestyleProfile $lifestyle, Pet $pet): array
    {
        $matchReasons = [];
        $mismatchReasons = [];

        $livingScore = $this->scoreLivingSituation($lifestyle, $pet, $matchReasons, $mismatchReasons);
        $healthScore = $this->scoreHealthConsiderations($lifestyle, $pet, $matchReasons, $mismatchReasons);
        $financialScore = $this->scoreFinancialCapacity($lifestyle, $pet, $matchReasons, $mismatchReasons);
        $activityScore = $this->scoreActivityLevel($lifestyle, $pet, $matchReasons, $mismatchReasons);
        $householdScore = $this->scoreHouseholdComposition($lifestyle, $pet, $matchReasons, $mismatchReasons);
        $preferenceScore = $this->scorePreferences($lifestyle, $pet, $matchReasons, $mismatchReasons);

        $totalScore = round(
            ($livingScore * 0.25)
            + ($healthScore * 0.20)
            + ($financialScore * 0.20)
            + ($activityScore * 0.15)
            + ($householdScore * 0.10)
            + ($preferenceScore * 0.10),
            2
        );

        return [
            'total_score' => $totalScore,
            'living_score' => $livingScore,
            'health_score' => $healthScore,
            'financial_score' => $financialScore,
            'activity_score' => $activityScore,
            'household_score' => $householdScore,
            'preference_score' => $preferenceScore,
            'match_reasons' => $matchReasons,
            'mismatch_reasons' => $mismatchReasons,
        ];
    }

    // ─────────────────────────────────────────────────────────────
    // Section 1: Living Situation (25%)
    // ─────────────────────────────────────────────────────────────

    /**
     * @param  array<string>  $matchReasons
     * @param  array<string>  $mismatchReasons
     */
    private function scoreLivingSituation(
        LifestyleProfile $lifestyle,
        Pet $pet,
        array &$matchReasons,
        array &$mismatchReasons
    ): float {
        $score = 100.0;
        $deductions = [];

        // Housing compatibility
        $housingCompatible = $pet->housing_compatible ?? [];
        if (! empty($housingCompatible) && ! in_array($lifestyle->housing_type, $housingCompatible)) {
            $deductions[] = ['amount' => 40, 'reason' => 'Housing type not suitable for this pet'];
        } else {
            $matchReasons[] = 'Housing suitable for this pet';
        }

        // Yard requirement
        if ($pet->requires_yard && $lifestyle->outdoor_access === 'none') {
            $deductions[] = ['amount' => 35, 'reason' => 'Requires yard — no outdoor access'];
            $mismatchReasons[] = 'Requires yard — no outdoor access';
        } elseif ($pet->requires_yard && $lifestyle->outdoor_access === 'not_fenced') {
            $deductions[] = ['amount' => 15, 'reason' => 'Yard not securely fenced'];
        } elseif (! $pet->requires_yard) {
            $matchReasons[] = 'No yard required';
        }

        // Large/high-energy pets in small spaces
        if ($pet->size === 'large' && in_array($lifestyle->housing_type, ['apartment', 'condo', 'rented_room'])) {
            $deductions[] = ['amount' => 20, 'reason' => 'Large dog not suited for apartment'];
            $mismatchReasons[] = 'Large dog not suited for apartment';
        }

        $totalDeduction = min(array_sum(array_column($deductions, 'amount')), 100);
        foreach ($deductions as $d) {
            if (! in_array($d['reason'], $matchReasons)) {
                $mismatchReasons[] = $d['reason'];
            }
        }

        return max(0.0, $score - $totalDeduction);
    }

    // ─────────────────────────────────────────────────────────────
    // Section 2: Health Considerations (20%)
    // ─────────────────────────────────────────────────────────────

    /**
     * @param  array<string>  $matchReasons
     * @param  array<string>  $mismatchReasons
     */
    private function scoreHealthConsiderations(
        LifestyleProfile $lifestyle,
        Pet $pet,
        array &$matchReasons,
        array &$mismatchReasons
    ): float {
        $conditions = $lifestyle->health_conditions ?? [];
        $score = 100.0;
        $deductions = [];

        if (empty($conditions)) {
            $matchReasons[] = 'No health conditions detected';

            return $score;
        }

        // Fur/dander allergy — cats or dogs with heavy fur
        if (in_array('fur_allergy', $conditions) || in_array('skin_allergy', $conditions)) {
            $deductions[] = ['amount' => 50, 'reason' => 'Fur/dander allergy conflicts with this pet'];
            $mismatchReasons[] = 'Fur/dander allergy — may worsen symptoms';
        }

        // Asthma — pets with high dander
        if (in_array('asthma', $conditions)) {
            $deductions[] = ['amount' => 30, 'reason' => 'Asthma — consult vet before adopting'];
        }

        // Anxiety/phobia — high energy or large pets
        if (in_array('anxiety', $conditions) && $pet->energy_level === 'very_active') {
            $deductions[] = ['amount' => 20, 'reason' => 'Very active pet may not suit anxiety condition'];
            $mismatchReasons[] = 'Very active pet — may cause stress';
        }

        // Noise sensitivity — active/noisy dogs
        if (in_array('noise_sensitive', $conditions) && $pet->species === 'dog' && $pet->energy_level === 'very_active') {
            $deductions[] = ['amount' => 15, 'reason' => 'Active dog breed may be noisy'];
        }

        // Immunocompromised — assess risk but not disqualifying alone
        if (in_array('immunocompromised', $conditions)) {
            $deductions[] = ['amount' => 10, 'reason' => 'Immunocompromised — regular vet checks recommended'];
        }

        $totalDeduction = min(array_sum(array_column($deductions, 'amount')), 100);

        return max(0.0, $score - $totalDeduction);
    }

    // ─────────────────────────────────────────────────────────────
    // Section 3: Financial Capacity (20%)
    // ─────────────────────────────────────────────────────────────

    /**
     * @param  array<string>  $matchReasons
     * @param  array<string>  $mismatchReasons
     */
    private function scoreFinancialCapacity(
        LifestyleProfile $lifestyle,
        Pet $pet,
        array &$matchReasons,
        array &$mismatchReasons
    ): float {
        $score = 100.0;
        $deductions = [];

        // Income tiers mapped to numeric values (PHP)
        $incomeMap = [
            'below_10000' => 10000,
            '10000_20000' => 20000,
            '20001_40000' => 40000,
            '40001_60000' => 60000,
            '60001_100000' => 100000,
            'above_100000' => 150000,
        ];

        $income = $incomeMap[$lifestyle->monthly_income ?? 'below_10000'] ?? 10000;

        // Large pets cost more to maintain
        if ($pet->size === 'large' && $income < 20000) {
            $deductions[] = ['amount' => 30, 'reason' => 'Income may be insufficient for large pet maintenance'];
            $mismatchReasons[] = 'Income may be insufficient for large pet costs';
        } elseif ($pet->size === 'medium' && $income < 10000) {
            $deductions[] = ['amount' => 20, 'reason' => 'Income may be tight for medium pet maintenance'];
        }

        // Adoption fee affordability
        if ($pet->adoption_fee > 0 && $income < 15000) {
            $deductions[] = ['amount' => 15, 'reason' => 'Adoption fee may be difficult with current income'];
        }

        // Pet experience — first-time owners require more resources
        if ($lifestyle->pet_experience === 'first_time' && $pet->requires_experience) {
            $deductions[] = ['amount' => 25, 'reason' => 'Pet requires experienced owner'];
            $mismatchReasons[] = 'Not ideal for first-time owners';
        } elseif ($lifestyle->pet_experience === 'first_time') {
            // Slight penalty for first-timers on larger animals
            if ($pet->size !== 'small') {
                $deductions[] = ['amount' => 10, 'reason' => 'First-time owner — additional guidance recommended'];
            }
        } else {
            $matchReasons[] = 'Experience level suitable';
        }

        if (empty($deductions)) {
            $matchReasons[] = 'Income sufficient for maintenance';
        }

        $totalDeduction = min(array_sum(array_column($deductions, 'amount')), 100);

        return max(0.0, $score - $totalDeduction);
    }

    // ─────────────────────────────────────────────────────────────
    // Section 4: Activity Level & Schedule (15%)
    // ─────────────────────────────────────────────────────────────

    /**
     * @param  array<string>  $matchReasons
     * @param  array<string>  $mismatchReasons
     */
    private function scoreActivityLevel(
        LifestyleProfile $lifestyle,
        Pet $pet,
        array &$matchReasons,
        array &$mismatchReasons
    ): float {
        $score = 100.0;
        $deductions = [];

        // Energy compatibility matrix (aligned scale: 0=very_low/low, 1=light/moderate, 2=moderate/high, 3=very_active)
        $activityMap = [
            'very_light' => 0,
            'light' => 1,
            'moderate' => 2,
            'very_active' => 3,
        ];

        $petEnergyMap = [
            'low' => 0,
            'moderate' => 2,
            'high' => 3,
            'very_active' => 3,
        ];

        $userActivity = $activityMap[$lifestyle->activity_level] ?? 1;
        $petEnergy = $petEnergyMap[$pet->energy_level] ?? 1;
        $gap = abs($userActivity - $petEnergy);

        if ($gap === 0) {
            $matchReasons[] = 'Activity level aligns perfectly';
        } elseif ($gap === 1) {
            $deductions[] = ['amount' => 15, 'reason' => 'Minor activity level mismatch'];
        } elseif ($gap === 2) {
            $deductions[] = ['amount' => 35, 'reason' => 'Significant activity level mismatch'];
            $mismatchReasons[] = 'Activity level mismatch — pet needs more exercise';
        } else {
            $deductions[] = ['amount' => 60, 'reason' => 'Very high activity level mismatch'];
            $mismatchReasons[] = 'Very high energy vs. low activity — poor match';
        }

        // Work schedule — shifting/long hours away penalty for high-energy pets
        if ($pet->energy_level === 'very_active' && in_array($lifestyle->work_schedule, ['shifting', 'office'])) {
            $deductions[] = ['amount' => 15, 'reason' => 'Work schedule limits time for active pet'];
            $mismatchReasons[] = 'Long hours away — active pet needs more time';
        } elseif (in_array($lifestyle->work_schedule, ['wfh', 'student'])) {
            $matchReasons[] = 'Work schedule allows more time for pet';
        }

        $totalDeduction = min(array_sum(array_column($deductions, 'amount')), 100);

        return max(0.0, $score - $totalDeduction);
    }

    // ─────────────────────────────────────────────────────────────
    // Section 5: Household Composition (10%)
    // ─────────────────────────────────────────────────────────────

    /**
     * @param  array<string>  $matchReasons
     * @param  array<string>  $mismatchReasons
     */
    private function scoreHouseholdComposition(
        LifestyleProfile $lifestyle,
        Pet $pet,
        array &$matchReasons,
        array &$mismatchReasons
    ): float {
        $score = 100.0;
        $deductions = [];

        // Children compatibility
        if ($pet->requires_no_children && in_array($lifestyle->has_children, ['young', 'older'])) {
            $deductions[] = ['amount' => 40, 'reason' => 'Pet not suitable for households with children'];
            $mismatchReasons[] = 'Pet not suitable with young children';
        } elseif (! $pet->requires_no_children && $lifestyle->has_children !== 'none') {
            $matchReasons[] = 'Friendly with children';
        }

        // Other pets compatibility
        if ($pet->requires_no_other_pets) {
            if (in_array($lifestyle->other_pets, ['dogs', 'cats', 'both', 'mixed'])) {
                $deductions[] = ['amount' => 35, 'reason' => 'Pet does not get along with other animals'];
                $mismatchReasons[] = 'Not compatible with other pets';
            }
        } elseif ($lifestyle->other_pets === 'none') {
            $matchReasons[] = 'No other pets — manageable environment';
        }

        // Household consensus
        if (! $lifestyle->household_agrees) {
            $deductions[] = ['amount' => 10, 'reason' => 'Not all household members agree to adoption'];
        }

        $totalDeduction = min(array_sum(array_column($deductions, 'amount')), 100);

        return max(0.0, $score - $totalDeduction);
    }

    // ─────────────────────────────────────────────────────────────
    // Section 6: Pet Preferences (10% — soft filter)
    // ─────────────────────────────────────────────────────────────

    /**
     * @param  array<string>  $matchReasons
     * @param  array<string>  $mismatchReasons
     */
    private function scorePreferences(
        LifestyleProfile $lifestyle,
        Pet $pet,
        array &$matchReasons,
        array &$mismatchReasons
    ): float {
        $score = 100.0;

        // Type preference
        if ($lifestyle->preferred_type !== 'none' && $lifestyle->preferred_type !== $pet->species) {
            $score -= 40;
        } else {
            $matchReasons[] = 'Matches preferred pet type';
        }

        // Size preference
        $preferredSizes = $lifestyle->preferred_size ?? [];
        if (! empty($preferredSizes) && ! in_array($pet->size, $preferredSizes)) {
            $score -= 30;
        }

        // Gender preference
        if ($lifestyle->preferred_gender !== 'none' && $lifestyle->preferred_gender !== $pet->gender) {
            $score -= 20;
        }

        return max(0.0, $score);
    }
}
