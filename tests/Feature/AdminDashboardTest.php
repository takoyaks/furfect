<?php

use App\Models\Application;
use App\Models\Pet;
use App\Models\Shelter;
use App\Models\User;

beforeEach(function (): void {
    $this->artisan('db:seed', ['--class' => 'RolesAndPermissionsSeeder']);
    $this->artisan('db:seed', ['--class' => 'SystemSettingsSeeder']);

    $this->admin = User::factory()->create();
    $this->admin->assignRole('admin');

    $this->adopter = User::factory()->create();
    $this->adopter->assignRole('adopter');

    $this->shelter = Shelter::factory()->create(['name' => 'Virac Animal Shelter']);

    $this->pet = Pet::factory()->create([
        'shelter_id' => $this->shelter->id,
        'name' => 'Browny',
        'species' => 'dog',
        'status' => 'available',
    ]);
});

test('admin can access admin dashboard with metrics and graph analytics', function (): void {
    Application::create([
        'user_id' => $this->adopter->id,
        'pet_id' => $this->pet->id,
        'reference_number' => 'APP-ADM-001',
        'status' => 'pending',
        'dss_score' => 88.5,
        'submitted_at' => now(),
    ]);

    $response = $this->actingAs($this->admin)->get(route('admin.dashboard'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/dashboard')
        ->has('metrics')
        ->where('metrics.pending_applications', 1)
        ->where('metrics.pets_available', 1)
        ->has('monthlyTrends')
        ->has('statusDistribution')
        ->where('statusDistribution.pending', 1)
        ->has('speciesStats')
        ->has('shelterComparison')
        ->has('dssScoreDistribution')
    );
});

test('unauthenticated users cannot access admin dashboard', function (): void {
    $this->get(route('admin.dashboard'))->assertRedirect(route('login'));
});

test('adopter cannot access admin dashboard', function (): void {
    $this->adopter->adopterProfile()->create([
        'full_name' => 'Maria Cielo',
        'contact_number' => '09501234567',
        'date_of_birth' => '1995-03-15',
        'home_address' => 'Virac, Catanduanes',
        'valid_id_type' => 'National ID',
        'valid_id_number' => '1234',
        'adoption_reason' => 'companionship',
        'adoption_reason_text' => 'Companion',
        'is_identity_verified' => true,
        'profile_completed_at' => now(),
    ]);

    $this->adopter->lifestyleProfile()->create([
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
    ]);

    $this->actingAs($this->adopter)
        ->get(route('admin.dashboard'))
        ->assertForbidden();
});
