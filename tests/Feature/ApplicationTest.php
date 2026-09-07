<?php

use App\Models\Application;
use App\Models\Pet;
use App\Models\Shelter;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

beforeEach(function (): void {
    // Seed roles and permissions
    $this->artisan('db:seed', ['--class' => 'RolesAndPermissionsSeeder']);
    $this->artisan('db:seed', ['--class' => 'SystemSettingsSeeder']);

    $this->shelter = Shelter::factory()->create();
    $this->pet = Pet::factory()->create([
        'shelter_id' => $this->shelter->id,
        'status' => 'available',
    ]);

    $this->adopter = User::factory()->create([
        'password' => Hash::make('password'),
    ]);
    $this->adopter->assignRole('adopter');

    $this->staff = User::factory()->create();
    $this->staff->assignRole('shelter_staff');

    $this->mao = User::factory()->create();
    $this->mao->assignRole('mao_officer');
});

it('allows adopter to apply for a pet', function (): void {
    // Create personal info and lifestyle profiles to satisfy onboarding requirements
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
        ->post(route('application.store'), [
            'pet_id' => $this->pet->id,
        ]);

    $response->assertRedirect(route('application.show'));
    $this->assertDatabaseHas('applications', [
        'user_id' => $this->adopter->id,
        'pet_id' => $this->pet->id,
        'status' => 'pending',
    ]);
});

it('allows shelter staff to mark application as suitable forwarding to MAO', function (): void {
    $application = Application::factory()->create([
        'user_id' => $this->adopter->id,
        'pet_id' => $this->pet->id,
        'status' => 'pending',
    ]);

    $response = $this->actingAs($this->staff)
        ->patch(route('shelter.applications.update', $application->id), [
            'decision' => 'suitable',
            'notes' => 'Looking good',
        ]);

    $response->assertRedirect(route('shelter.applications.index'));
    $this->assertDatabaseHas('applications', [
        'id' => $application->id,
        'status' => 'mao_audit',
        'staff_id' => $this->staff->id,
        'staff_decision' => 'suitable',
    ]);
});

it('allows MAO officer to approve application updating pet status to adopted', function (): void {
    $application = Application::factory()->create([
        'user_id' => $this->adopter->id,
        'pet_id' => $this->pet->id,
        'status' => 'mao_audit',
    ]);

    $response = $this->actingAs($this->mao)
        ->patch(route('mao.applications.update', $application->id), [
            'decision' => 'approved',
            'remarks' => 'Everything matches',
            'checklist' => [
                'identity_verified' => true,
                'dss_score_acceptable' => true,
                'staff_recommendation' => true,
                'housing_appropriate' => true,
                'no_red_flags' => true,
            ],
        ]);

    $response->assertRedirect(route('mao.applications.index'));
    $this->assertDatabaseHas('applications', [
        'id' => $application->id,
        'status' => 'approved',
        'mao_officer_id' => $this->mao->id,
        'mao_decision' => 'approved',
    ]);

    $this->assertDatabaseHas('pets', [
        'id' => $this->pet->id,
        'status' => 'adopted',
    ]);
});

it('displays approved adoption status page with pass and certificate data', function (): void {
    $this->adopter->adopterProfile()->create([
        'full_name' => 'Maria Cielo',
        'contact_number' => '09501234567',
        'date_of_birth' => '1995-03-15',
        'home_address' => 'Virac, Catanduanes',
        'valid_id_type' => 'National ID',
        'valid_id_number' => '1234-5678-9012',
        'adoption_reason' => 'companionship',
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

    $application = Application::factory()->create([
        'user_id' => $this->adopter->id,
        'pet_id' => $this->pet->id,
        'status' => 'approved',
        'certificate_number' => 'CERT-MAO-2026-0099',
        'pickup_deadline_at' => now()->addDays(7),
        'resolved_at' => now(),
    ]);

    $response = $this->actingAs($this->adopter)
        ->get(route('application.show', ['id' => $application->id]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('application/status')
        ->has('application', fn ($app) => $app
            ->where('id', $application->id)
            ->where('status', 'approved')
            ->where('certificate_number', 'CERT-MAO-2026-0099')
            ->has('user.adopter_profile')
            ->etc()
        )
    );
});
