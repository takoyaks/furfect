<?php

use App\Models\LifestyleProfile;
use App\Models\Pet;
use App\Models\Shelter;
use App\Services\DssMatchingService;

beforeEach(function (): void {
    $this->service = app(DssMatchingService::class);
    $this->shelter = Shelter::factory()->create();
});

function makeLifestyleFor8(array $overrides = []): LifestyleProfile
{
    return new LifestyleProfile(array_merge([
        'user_id' => 1,
        'housing_type' => 'house_with_yard',
        'has_aircon' => 'stable',
        'outdoor_access' => 'fully_fenced',
        'activity_level' => 'moderate',
        'work_schedule' => 'wfh',
        'household_size' => 2,
        'household_agrees' => true,
        'has_children' => 'none',
        'other_pets' => 'none',
        'occupation' => 'Professional',
        'monthly_income' => '40001_60000',
        'pet_experience' => 'had_before',
        'health_conditions' => [],
        'preferred_type' => 'dog',
        'preferred_size' => ['medium'],
        'preferred_gender' => 'none',
        'preferred_coat' => null,
    ], $overrides));
}

function makePetFor8(Shelter $shelter, array $overrides = []): Pet
{
    return new Pet(array_merge([
        'shelter_id' => $shelter->id,
        'name' => 'CriterionPet',
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

test('8-factor DSS produces score between 0 and 100 with all 8 criteria', function () {
    $lifestyle = makeLifestyleFor8();
    $pet = makePetFor8($this->shelter);

    $result = $this->service->computeScore($lifestyle, $pet);

    expect($result['total_score'])->toBeGreaterThanOrEqual(0.0)
        ->toBeLessThanOrEqual(100.0);

    expect($result)->toHaveKeys([
        'lifestyle_score',
        'housing_score',
        'care_capacity_score',
        'experience_score',
        'other_pets_score',
        'family_children_score',
        'age_activity_score',
        'special_requirements_score',
        'breakdown_details',
        'fast_track_eligible',
    ]);
});

test('total score equals weighted sum of all 8 criteria from Criterion.pdf', function () {
    $lifestyle = makeLifestyleFor8();
    $pet = makePetFor8($this->shelter);

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

test('fast-track eligibility is true for ideal adopter with >= 85 score', function () {
    $lifestyle = makeLifestyleFor8([
        'housing_type' => 'house_with_yard',
        'outdoor_access' => 'fully_fenced',
        'activity_level' => 'moderate',
        'work_schedule' => 'wfh',
        'monthly_income' => '40001_60000',
        'pet_experience' => 'had_before',
        'household_agrees' => true,
        'has_children' => 'none',
        'other_pets' => 'none',
        'health_conditions' => [],
    ]);

    $pet = makePetFor8($this->shelter, [
        'energy_level' => 'moderate',
        'requires_yard' => false,
        'requires_experience' => false,
    ]);

    $result = $this->service->computeScore($lifestyle, $pet);

    expect($result['total_score'])->toBeGreaterThanOrEqual(85.0);
    expect($result['fast_track_eligible'])->toBeTrue();
});

test('lifestyle compatibility scores 0 for incompatible activity gap', function () {
    $lifestyle = makeLifestyleFor8(['activity_level' => 'very_light']);
    $pet = makePetFor8($this->shelter, ['energy_level' => 'very_active']);

    $result = $this->service->computeScore($lifestyle, $pet);

    expect($result['lifestyle_score'])->toBe(0.0);
    expect($result['mismatch_reasons'])->toContain('Very high energy vs. low activity — poor match');
});

test('housing compatibility scores 0 when pet requires yard but adopter has none', function () {
    $lifestyle = makeLifestyleFor8(['outdoor_access' => 'none', 'housing_type' => 'apartment']);
    $pet = makePetFor8($this->shelter, ['requires_yard' => true]);

    $result = $this->service->computeScore($lifestyle, $pet);

    expect($result['housing_score'])->toBe(0.0);
    expect($result['mismatch_reasons'])->toContain('This pet strictly requires a yard/outdoor space, but no outdoor access is available.');
});

test('experience compatibility scores 0 when pet requires experience but adopter is first-timer', function () {
    $lifestyle = makeLifestyleFor8(['pet_experience' => 'first_time']);
    $pet = makePetFor8($this->shelter, ['requires_experience' => true]);

    $result = $this->service->computeScore($lifestyle, $pet);

    expect($result['experience_score'])->toBe(0.0);
    expect($result['mismatch_reasons'])->toContain('This pet requires an experienced handler with previous animal care history.');
});

test('other pets compatibility scores 0 when pet requires no other pets but household has pets', function () {
    $lifestyle = makeLifestyleFor8(['other_pets' => 'dogs']);
    $pet = makePetFor8($this->shelter, ['requires_no_other_pets' => true]);

    $result = $this->service->computeScore($lifestyle, $pet);

    expect($result['other_pets_score'])->toBe(0.0);
    expect($result['mismatch_reasons'])->toContain('This pet must be the only animal in the home; conflict with existing household pets.');
});

test('family children compatibility scores 0 when household members disagree', function () {
    $lifestyle = makeLifestyleFor8(['household_agrees' => false]);
    $pet = makePetFor8($this->shelter);

    $result = $this->service->computeScore($lifestyle, $pet);

    expect($result['family_children_score'])->toBe(0.0);
    expect($result['mismatch_reasons'])->toContain('Not all household members currently agree to adopting a pet.');
});
