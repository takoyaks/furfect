<?php

use App\Models\AdopterProfile;
use App\Models\LifestyleProfile;
use App\Models\User;

beforeEach(function (): void {
    $this->artisan('db:seed', ['--class' => 'RolesAndPermissionsSeeder']);
    $this->artisan('db:seed', ['--class' => 'SystemSettingsSeeder']);

    $this->adopter = User::factory()->create();
    $this->adopter->assignRole('adopter');

    AdopterProfile::create([
        'user_id' => $this->adopter->id,
        'full_name' => 'Test Adopter',
        'contact_number' => '09123456789',
        'date_of_birth' => '1995-01-01',
        'home_address' => 'Virac, Catanduanes',
        'valid_id_type' => 'National ID',
        'valid_id_number' => '12345',
        'had_pets_before' => 'never',
        'surrendered_pet' => false,
        'adoption_reason' => 'Companionship',
        'adoption_reason_text' => 'I love animals.',
        'pet_stay' => 'inside',
        'is_identity_verified' => true,
        'profile_completed_at' => now(),
    ]);
});

it('locks lifestyle profile editing for 3 months after submission', function (): void {
    $lifestyle = LifestyleProfile::create([
        'user_id' => $this->adopter->id,
        'housing_type' => 'apartment',
        'has_aircon' => 'stable',
        'outdoor_access' => 'none',
        'activity_level' => 'moderate',
        'work_schedule' => 'office',
        'household_size' => 2,
        'household_agrees' => true,
        'has_children' => 'none',
        'other_pets' => 'none',
        'monthly_income' => '20001_40000',
        'pet_experience' => 'had_before',
        'submitted_at' => now(),
        'locked_until' => now()->addMonths(3),
    ]);

    expect($lifestyle->isLocked())->toBeTrue();

    // Attempting to post updates when locked should result in redirection back/error
    $response = $this->actingAs($this->adopter)
        ->post(route('onboarding.lifestyle.store'), [
            'housing_type' => 'rural',
            'has_aircon' => 'stable',
            'outdoor_access' => 'fully_fenced',
            'activity_level' => 'very_active',
            'work_schedule' => 'wfh',
            'household_size' => 2,
            'household_agrees' => true,
            'has_children' => 'none',
            'other_pets' => 'none',
            'monthly_income' => '40001_60000',
            'pet_experience' => 'experienced_multiple',
        ]);

    $response->assertRedirect(route('onboarding.lifestyle.edit'));
});

it('can submit lifestyle profile with preferred pet gender and compute matches', function (): void {
    $response = $this->actingAs($this->adopter)
        ->post(route('onboarding.lifestyle.store'), [
            'housing_type' => 'house_with_yard',
            'has_aircon' => 'stable',
            'outdoor_access' => 'fully_fenced',
            'activity_level' => 'moderate',
            'work_schedule' => 'wfh',
            'household_size' => 2,
            'household_agrees' => true,
            'has_children' => 'none',
            'other_pets' => 'none',
            'monthly_income' => '40001_60000',
            'pet_experience' => 'had_before',
            'preferred_type' => 'dog',
            'preferred_gender' => 'female',
            'preferred_size' => ['medium'],
        ]);

    $response->assertRedirect(route('matches.index'));

    $this->assertDatabaseHas('lifestyle_profiles', [
        'user_id' => $this->adopter->id,
        'preferred_gender' => 'female',
        'preferred_type' => 'dog',
    ]);
});
