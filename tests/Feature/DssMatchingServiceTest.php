<?php

use App\Models\LifestyleProfile;
use App\Models\Pet;
use App\Models\Shelter;
use App\Services\DssMatchingService;

beforeEach(function (): void {
    $this->service = app(DssMatchingService::class);
    $this->shelter = Shelter::factory()->create();
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: creates a baseline lifestyle profile (average adopter in apartment)
// ─────────────────────────────────────────────────────────────────────────────
function makeLifestyle(array $overrides = []): LifestyleProfile
{
    return new LifestyleProfile(array_merge([
        'user_id' => 1,
        'housing_type' => 'apartment',
        'has_aircon' => 'stable',
        'outdoor_access' => 'none',
        'activity_level' => 'moderate',
        'work_schedule' => 'office',
        'household_size' => 2,
        'household_agrees' => true,
        'has_children' => 'none',
        'other_pets' => 'none',
        'occupation' => 'Teacher',
        'monthly_income' => '20001_40000',
        'pet_experience' => 'had_before',
        'health_conditions' => [],
        'preferred_type' => 'none',
        'preferred_size' => null,
        'preferred_gender' => 'none',
        'preferred_coat' => null,
    ], $overrides));
}

function makePet(Shelter $shelter, array $overrides = []): Pet
{
    return new Pet(array_merge([
        'shelter_id' => $shelter->id,
        'name' => 'TestPet',
        'species' => 'dog',
        'breed' => 'Mixed',
        'age_years' => 2,
        'gender' => 'male',
        'size' => 'medium',
        'energy_level' => 'moderate',
        'requires_experience' => false,
        'requires_yard' => false,
        'requires_no_children' => false,
        'requires_no_other_pets' => false,
        'housing_compatible' => ['apartment', 'condo', 'house_with_yard', 'house_no_yard'],
        'adoption_fee' => 0.00,
        'status' => 'available',
    ], $overrides));
}

// ─────────────────────────────────────────────────────────────────────────────
// Total score weight validation
// ─────────────────────────────────────────────────────────────────────────────

it('produces a score between 0 and 100', function (): void {
    $lifestyle = makeLifestyle();
    $pet = makePet($this->shelter);

    $result = $this->service->computeScore($lifestyle, $pet);

    expect($result['total_score'])->toBeGreaterThanOrEqual(0.0)
        ->toBeLessThanOrEqual(100.0);
});

it('scores a perfect-match adopter and pet near 100', function (): void {
    $lifestyle = makeLifestyle([
        'housing_type' => 'house_with_yard',
        'outdoor_access' => 'fully_fenced',
        'activity_level' => 'moderate',
        'monthly_income' => '40001_60000',
        'health_conditions' => [],
    ]);

    $pet = makePet($this->shelter, [
        'size' => 'medium',
        'energy_level' => 'moderate',
        'requires_yard' => false,
        'housing_compatible' => ['house_with_yard', 'apartment'],
    ]);

    $result = $this->service->computeScore($lifestyle, $pet);

    expect($result['total_score'])->toBeGreaterThan(80.0);
});

// ─────────────────────────────────────────────────────────────────────────────
// Living Situation (25%)
// ─────────────────────────────────────────────────────────────────────────────

it('deducts points when pet requires yard but adopter has no outdoor access', function (): void {
    $lifestyle = makeLifestyle(['outdoor_access' => 'none', 'housing_type' => 'apartment']);
    $petWithYard = makePet($this->shelter, ['requires_yard' => true, 'housing_compatible' => ['house_with_yard']]);
    $petNoYard = makePet($this->shelter, ['requires_yard' => false, 'housing_compatible' => ['apartment', 'house_with_yard']]);

    $withYard = $this->service->computeScore($lifestyle, $petWithYard);
    $noYard = $this->service->computeScore($lifestyle, $petNoYard);

    expect($withYard['living_score'])->toBeLessThan($noYard['living_score']);
});

it('deducts points for large dog in apartment', function (): void {
    $lifestyle = makeLifestyle(['housing_type' => 'apartment']);
    $largeDog = makePet($this->shelter, ['size' => 'large', 'housing_compatible' => ['house_with_yard']]);
    $smallDog = makePet($this->shelter, ['size' => 'small', 'housing_compatible' => ['apartment', 'house_with_yard']]);

    $large = $this->service->computeScore($lifestyle, $largeDog);
    $small = $this->service->computeScore($lifestyle, $smallDog);

    expect($large['living_score'])->toBeLessThan($small['living_score']);
});

// ─────────────────────────────────────────────────────────────────────────────
// Health Considerations (20%)
// ─────────────────────────────────────────────────────────────────────────────

it('deducts heavily for fur allergy adopter', function (): void {
    $healthy = makeLifestyle(['health_conditions' => []]);
    $allergic = makeLifestyle(['health_conditions' => ['fur_allergy']]);
    $pet = makePet($this->shelter);

    $healthyResult = $this->service->computeScore($healthy, $pet);
    $allergicResult = $this->service->computeScore($allergic, $pet);

    expect($allergicResult['health_score'])->toBeLessThan($healthyResult['health_score']);
});

it('gives full health score to adopter with no conditions', function (): void {
    $lifestyle = makeLifestyle(['health_conditions' => []]);
    $pet = makePet($this->shelter);

    $result = $this->service->computeScore($lifestyle, $pet);

    expect($result['health_score'])->toBe(100.0);
});

// ─────────────────────────────────────────────────────────────────────────────
// Activity Level (15%)
// ─────────────────────────────────────────────────────────────────────────────

it('scores perfectly when activity levels match and schedule is flexible', function (): void {
    // WFH schedule + matching moderate energy = no deductions
    $lifestyle = makeLifestyle(['activity_level' => 'moderate', 'work_schedule' => 'wfh']);
    $pet = makePet($this->shelter, ['energy_level' => 'moderate']);

    $result = $this->service->computeScore($lifestyle, $pet);

    expect($result['activity_score'])->toBe(100.0);
});

it('deducts heavily when very-active pet meets very-light adopter', function (): void {
    $lifestyle = makeLifestyle(['activity_level' => 'very_light']);
    $pet = makePet($this->shelter, ['energy_level' => 'very_active']);

    $result = $this->service->computeScore($lifestyle, $pet);

    expect($result['activity_score'])->toBeLessThan(40.0);
    expect($result['mismatch_reasons'])->toContain('Very high energy vs. low activity — poor match');
});

// ─────────────────────────────────────────────────────────────────────────────
// Financial Capacity (20%)
// ─────────────────────────────────────────────────────────────────────────────

it('deducts for first-time owner with pet requiring experience', function (): void {
    $firstTime = makeLifestyle(['pet_experience' => 'first_time']);
    $experienced = makeLifestyle(['pet_experience' => 'experienced_multiple']);

    $pet = makePet($this->shelter, ['requires_experience' => true]);

    $firstResult = $this->service->computeScore($firstTime, $pet);
    $expResult = $this->service->computeScore($experienced, $pet);

    expect($firstResult['experience_score'])->toBeLessThan($expResult['experience_score']);
    expect($firstResult['mismatch_reasons'])->toContain('This pet requires an experienced handler with previous animal care history.');
});

// ─────────────────────────────────────────────────────────────────────────────
// Household Composition (10%)
// ─────────────────────────────────────────────────────────────────────────────

it('deducts when pet requires no children but adopter has young children', function (): void {
    $withChildren = makeLifestyle(['has_children' => 'young']);
    $noChildren = makeLifestyle(['has_children' => 'none']);

    $pet = makePet($this->shelter, ['requires_no_children' => true]);

    $withResult = $this->service->computeScore($withChildren, $pet);
    $noResult = $this->service->computeScore($noChildren, $pet);

    expect($withResult['household_score'])->toBeLessThan($noResult['household_score']);
    expect($withResult['mismatch_reasons'])->toContain('Pet is not suited for homes with children.');
});

// ─────────────────────────────────────────────────────────────────────────────
// Weighted total score consistency
// ─────────────────────────────────────────────────────────────────────────────

it('total score equals weighted sum of factor scores', function (): void {
    $lifestyle = makeLifestyle();
    $pet = makePet($this->shelter);

    $result = $this->service->computeScore($lifestyle, $pet);

    $expected = round(
        ($result['lifestyle_score'] * 0.25)
        + ($result['housing_score'] * 0.20)
        + ($result['care_capacity_score'] * 0.15)
        + ($result['experience_score'] * 0.10)
        + ($result['other_pets_score'] * 0.10)
        + ($result['family_children_score'] * 0.10)
        + ($result['age_activity_score'] * 0.05)
        + ($result['special_requirements_score'] * 0.05),
        2
    );

    expect($result['total_score'])->toBe($expected);
});
