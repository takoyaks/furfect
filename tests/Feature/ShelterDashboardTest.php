<?php

use App\Models\Announcement;
use App\Models\Application;
use App\Models\Pet;
use App\Models\Shelter;
use App\Models\User;

beforeEach(function (): void {
    $this->artisan('db:seed', ['--class' => 'RolesAndPermissionsSeeder']);
    $this->artisan('db:seed', ['--class' => 'SystemSettingsSeeder']);

    $this->shelterStaff = User::factory()->create();
    $this->shelterStaff->assignRole('shelter_staff');

    $this->adopter = User::factory()->create();
    $this->adopter->assignRole('adopter');

    $this->shelter = Shelter::factory()->create(['name' => 'Virac Animal Shelter']);

    $this->pet = Pet::factory()->create([
        'shelter_id' => $this->shelter->id,
        'name' => 'Browny',
        'status' => 'available',
    ]);
});

test('shelter staff can access shelter dashboard with metrics and graph analytics', function (): void {
    Application::create([
        'user_id' => $this->adopter->id,
        'pet_id' => $this->pet->id,
        'reference_number' => 'APP-TEST-001',
        'status' => 'pending',
        'dss_score' => 85.5,
        'submitted_at' => now(),
    ]);

    $response = $this->actingAs($this->shelterStaff)->get(route('shelter.dashboard'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('shelter/dashboard')
        ->has('metrics')
        ->where('metrics.pending_applications', 1)
        ->where('metrics.pets_available', 1)
        ->has('monthlyTrends')
        ->has('statusDistribution')
        ->where('statusDistribution.pending', 1)
        ->has('speciesStats')
        ->has('petStatusBreakdown')
        ->has('dssScoreDistribution')
    );
});

test('unauthenticated users and adopters cannot access shelter dashboard', function (): void {
    $this->get(route('shelter.dashboard'))->assertRedirect(route('login'));

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
        ->get(route('shelter.dashboard'))
        ->assertForbidden();
});

test('shelter staff can view, create, update, and delete announcements', function (): void {
    // 1. View announcements index
    $this->actingAs($this->shelterStaff)
        ->get(route('shelter.cms.announcements.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('shelter/cms/announcements/index'));

    // 2. Create announcement
    $storeResponse = $this->actingAs($this->shelterStaff)->post(route('shelter.cms.announcements.store'), [
        'title' => 'Adoption Fair 2026',
        'category' => 'Event',
        'content' => 'Join us at the Virac Plaza for our annual Adoption Fair.',
        'is_published' => true,
    ]);

    $storeResponse->assertRedirect(route('shelter.cms.announcements.index'));
    $this->assertDatabaseHas('announcements', [
        'title' => 'Adoption Fair 2026',
        'category' => 'Event',
        'is_published' => true,
    ]);

    $announcement = Announcement::where('title', 'Adoption Fair 2026')->firstOrFail();

    // 3. Update announcement
    $updateResponse = $this->actingAs($this->shelterStaff)->post(route('shelter.cms.announcements.update', $announcement->id), [
        'title' => 'Adoption Fair 2026 - Rescheduled',
        'category' => 'Event',
        'content' => 'The event has been moved to Sunday.',
        'is_published' => false,
    ]);

    $updateResponse->assertRedirect(route('shelter.cms.announcements.index'));
    $this->assertDatabaseHas('announcements', [
        'id' => $announcement->id,
        'title' => 'Adoption Fair 2026 - Rescheduled',
        'is_published' => false,
    ]);

    // 4. Delete announcement
    $deleteResponse = $this->actingAs($this->shelterStaff)->delete(route('shelter.cms.announcements.destroy', $announcement->id));
    $deleteResponse->assertRedirect(route('shelter.cms.announcements.index'));
    $this->assertDatabaseMissing('announcements', ['id' => $announcement->id]);
});
