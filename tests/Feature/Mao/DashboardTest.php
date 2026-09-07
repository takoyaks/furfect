<?php

use App\Models\Application;
use App\Models\Pet;
use App\Models\Shelter;
use App\Models\User;
use Illuminate\Support\Carbon;

beforeEach(function (): void {
    $this->artisan('db:seed', ['--class' => 'RolesAndPermissionsSeeder']);
    $this->artisan('db:seed', ['--class' => 'SystemSettingsSeeder']);

    $this->mao = User::factory()->create();
    $this->mao->assignRole('mao_officer');

    $this->adopter = User::factory()->create();
    $this->adopter->assignRole('adopter');

    $this->shelter = Shelter::factory()->create(['name' => 'Virac Animal Shelter']);

    $this->pet1 = Pet::factory()->create([
        'shelter_id' => $this->shelter->id,
        'species' => 'dog',
        'name' => 'Bantay',
        'status' => 'available',
    ]);

    $this->pet2 = Pet::factory()->create([
        'shelter_id' => $this->shelter->id,
        'species' => 'cat',
        'name' => 'Muning',
        'status' => 'available',
    ]);

    // Create 1 application awaiting MAO audit
    $this->pendingApp = Application::create([
        'user_id' => $this->adopter->id,
        'pet_id' => $this->pet1->id,
        'reference_number' => 'APP-MAO-AUDIT-001',
        'status' => 'mao_audit',
        'dss_score' => 85.0,
        'staff_decision' => 'suitable',
        'submitted_at' => Carbon::now()->subDays(2),
    ]);

    // Create 1 finalized approved application
    $this->approvedApp = Application::create([
        'user_id' => $this->adopter->id,
        'pet_id' => $this->pet2->id,
        'reference_number' => 'APP-MAO-APPR-002',
        'status' => 'approved',
        'dss_score' => 90.0,
        'staff_decision' => 'suitable',
        'mao_decision' => 'approved',
        'submitted_at' => Carbon::now()->subDays(10),
        'resolved_at' => Carbon::now()->subDays(5),
    ]);
});

test('mao officer can view mao analytics dashboard with pending audits and kpis', function (): void {
    $response = $this->actingAs($this->mao)
        ->get(route('mao.dashboard'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('mao/dashboard')
        ->has('metrics')
        ->where('metrics.total_applications', 2)
        ->where('metrics.pending_audits_count', 1)
        ->where('metrics.approved_count', 1)
        ->where('metrics.pass_rate', fn ($val) => (float) $val === 50.0)
        ->has('pendingApplications', 1)
        ->where('pendingApplications.0.reference_number', 'APP-MAO-AUDIT-001')
        ->has('shelters')
        ->has('recentResolved', 1)
    );
});

test('general adopter cannot access mao analytics dashboard', function (): void {
    $this->adopter->adopterProfile()->create([
        'full_name' => 'Maria Cielo',
        'contact_number' => '09501234567',
        'date_of_birth' => '1995-03-15',
        'home_address' => 'Virac, Catanduanes',
        'valid_id_type' => 'National ID',
        'valid_id_number' => '1234',
        'adoption_reason' => 'companionship',
        'adoption_reason_text' => 'Companion',
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

    $response = $this->actingAs($this->adopter)
        ->get(route('mao.dashboard'));

    $response->assertForbidden();
});

test('unauthenticated user is redirected from mao dashboard to login', function (): void {
    $response = $this->get(route('mao.dashboard'));

    $response->assertRedirect(route('login'));
});
