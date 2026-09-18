<?php

use App\Models\AdopterProfile;
use App\Models\LifestyleProfile;
use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('un-onboarded users are redirected to onboarding ekyc page', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('onboarding.ekyc.show'));
});

test('authenticated users with completed onboarding can visit the dashboard', function () {
    $user = User::factory()->create();
    AdopterProfile::create([
        'user_id' => $user->id,
        'full_name' => 'Test User',
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
    LifestyleProfile::create([
        'user_id' => $user->id,
        'housing_type' => 'apartment',
        'has_aircon' => 'stable',
        'outdoor_access' => 'none',
        'activity_level' => 'moderate',
        'work_schedule' => 'office',
        'household_size' => 2,
        'household_agrees' => true,
        'has_children' => 'none',
        'other_pets' => 'none',
        'pet_experience' => 'first_time',
        'preferred_type' => 'none',
        'preferred_gender' => 'none',
        'submitted_at' => now(),
    ]);
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});
