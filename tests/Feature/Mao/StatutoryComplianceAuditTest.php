<?php

use App\Models\AdopterProfile;
use App\Models\Application;
use App\Models\DssMatchScore;
use App\Models\LifestyleProfile;
use App\Models\Pet;
use App\Models\Shelter;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function (): void {
    $this->artisan('db:seed', ['--class' => 'RolesAndPermissionsSeeder']);
    $this->artisan('db:seed', ['--class' => 'SystemSettingsSeeder']);

    $this->mao = User::factory()->create();
    $this->mao->assignRole('mao_officer');

    $this->shelter = Shelter::factory()->create(['name' => 'Virac Animal Shelter']);

    $this->pet = Pet::factory()->create([
        'shelter_id' => $this->shelter->id,
        'species' => 'dog',
        'name' => 'Bantay',
        'status' => 'available',
        'requires_yard' => false,
    ]);
});

test('mao officer receives automated compliance checklist evaluations for qualified applicant', function (): void {
    $adopter = User::factory()->create();
    $adopter->assignRole('adopter');

    AdopterProfile::create([
        'user_id' => $adopter->id,
        'full_name' => 'Maria Santos',
        'contact_number' => '09123456789',
        'date_of_birth' => '1995-05-15',
        'home_address' => 'Virac, Catanduanes',
        'valid_id_type' => 'philippine_identification_card_philid',
        'valid_id_number' => '1234-5678-9012',
        'is_identity_verified' => true,
        'surrendered_pet' => false,
        'had_pets_before' => 'currently_have',
        'adoption_reason' => 'Companionship',
        'pet_stay' => 'inside',
    ]);

    LifestyleProfile::create([
        'user_id' => $adopter->id,
        'housing_type' => 'single_detached',
        'has_aircon' => 'living_room_only',
        'outdoor_access' => 'fenced_yard',
        'activity_level' => 'moderate',
        'work_schedule' => 'standard_office',
        'household_size' => 3,
        'household_agrees' => true,
        'has_children' => 'older_children',
        'other_pets' => 'dogs_only',
        'monthly_income' => '30k_50k',
        'pet_experience' => 'experienced',
        'submitted_at' => now(),
    ]);

    $application = Application::create([
        'user_id' => $adopter->id,
        'pet_id' => $this->pet->id,
        'reference_number' => 'APP-MAO-TEST-001',
        'status' => 'mao_audit',
        'dss_score' => 88.5,
        'staff_decision' => 'suitable',
        'submitted_at' => now()->subDay(),
    ]);

    DssMatchScore::create([
        'user_id' => $adopter->id,
        'pet_id' => $this->pet->id,
        'total_score' => 88.5,
        'housing_score' => 100.0,
        'lifestyle_score' => 85.0,
        'care_capacity_score' => 90.0,
        'experience_score' => 85.0,
        'other_pets_score' => 90.0,
        'family_children_score' => 90.0,
        'age_activity_score' => 80.0,
        'special_requirements_score' => 90.0,
        'computed_at' => now(),
    ]);

    $response = $this->actingAs($this->mao)->get(route('mao.applications.show', $application->id));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('mao/applications/show')
        ->has('defaultChecklist.identity_verified', fn (Assert $item) => $item
            ->where('auto_compliant', true)
            ->etc()
        )
        ->has('defaultChecklist.dss_score_acceptable', fn (Assert $item) => $item
            ->where('auto_compliant', true)
            ->etc()
        )
        ->has('defaultChecklist.staff_recommendation', fn (Assert $item) => $item
            ->where('auto_compliant', true)
            ->etc()
        )
        ->has('defaultChecklist.housing_appropriate', fn (Assert $item) => $item
            ->where('auto_compliant', true)
            ->etc()
        )
        ->has('defaultChecklist.no_red_flags', fn (Assert $item) => $item
            ->where('auto_compliant', true)
            ->etc()
        )
    );
});

test('statutory compliance checklist flags unverified identity, low dss score, and pet surrender', function (): void {
    $adopter = User::factory()->create();
    $adopter->assignRole('adopter');

    AdopterProfile::create([
        'user_id' => $adopter->id,
        'full_name' => 'Juan Dela Cruz',
        'contact_number' => '09987654321',
        'date_of_birth' => '1990-01-01',
        'home_address' => 'Virac, Catanduanes',
        'valid_id_type' => 'drivers_license',
        'valid_id_number' => 'D01-12-345678',
        'is_identity_verified' => false,
        'surrendered_pet' => true,
        'had_pets_before' => 'had_in_past',
        'adoption_reason' => 'Companionship',
        'pet_stay' => 'outside',
    ]);

    $yardRequiringPet = Pet::factory()->create([
        'shelter_id' => $this->shelter->id,
        'species' => 'dog',
        'name' => 'Hercules',
        'status' => 'available',
        'requires_yard' => true,
    ]);

    LifestyleProfile::create([
        'user_id' => $adopter->id,
        'housing_type' => 'apartment',
        'has_aircon' => 'none',
        'outdoor_access' => 'none',
        'activity_level' => 'very_light',
        'work_schedule' => 'standard_office',
        'household_size' => 1,
        'household_agrees' => true,
        'has_children' => 'no_children',
        'other_pets' => 'none',
        'monthly_income' => 'under_15k',
        'pet_experience' => 'beginner',
        'submitted_at' => now(),
    ]);

    $application = Application::create([
        'user_id' => $adopter->id,
        'pet_id' => $yardRequiringPet->id,
        'reference_number' => 'APP-MAO-FLAG-002',
        'status' => 'mao_audit',
        'dss_score' => 42.0,
        'staff_decision' => 'suitable',
        'submitted_at' => now()->subDay(),
    ]);

    $response = $this->actingAs($this->mao)->get(route('mao.applications.show', $application->id));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('mao/applications/show')
        ->where('defaultChecklist.identity_verified.auto_compliant', false)
        ->where('defaultChecklist.dss_score_acceptable.auto_compliant', false)
        ->where('defaultChecklist.staff_recommendation.auto_compliant', true)
        ->where('defaultChecklist.housing_appropriate.auto_compliant', false)
        ->where('defaultChecklist.no_red_flags.auto_compliant', false)
    );
});

test('mao officer can manually toggle and save compliance checklist overrides', function (): void {
    $adopter = User::factory()->create();
    $adopter->assignRole('adopter');

    AdopterProfile::create([
        'user_id' => $adopter->id,
        'full_name' => 'Elena Gomez',
        'contact_number' => '09112233445',
        'date_of_birth' => '1998-03-20',
        'home_address' => 'Virac, Catanduanes',
        'valid_id_type' => 'passport',
        'valid_id_number' => 'P1234567A',
        'is_identity_verified' => false,
        'surrendered_pet' => false,
        'had_pets_before' => 'none',
        'adoption_reason' => 'Guard Dog',
        'pet_stay' => 'inside',
    ]);

    $application = Application::create([
        'user_id' => $adopter->id,
        'pet_id' => $this->pet->id,
        'reference_number' => 'APP-MAO-OVERRIDE-003',
        'status' => 'mao_audit',
        'dss_score' => 75.0,
        'staff_decision' => 'suitable',
        'submitted_at' => now()->subDay(),
    ]);

    // MAO Officer manually checks all items after physically inspecting ID at the municipal desk
    $manualChecklist = [
        'identity_verified' => true,
        'dss_score_acceptable' => true,
        'staff_recommendation' => true,
        'housing_appropriate' => true,
        'no_red_flags' => true,
    ];

    $response = $this->actingAs($this->mao)->patch(route('mao.applications.update', $application->id), [
        'decision' => 'approved',
        'remarks' => 'Applicant presented physical national ID at MAO office. Compliance confirmed.',
        'checklist' => $manualChecklist,
    ]);

    $response->assertRedirect(route('mao.applications.index'));

    $application->refresh();

    expect($application->status)->toBe('approved');
    expect($application->mao_decision)->toBe('approved');
    expect($application->mao_checklist)->toEqual($manualChecklist);
    expect($application->certificate_number)->not->toBeNull();
});
