<?php

use App\Models\AdopterProfile;
use App\Models\Application;
use App\Models\ApplicationTimeline;
use App\Models\DiditVerification;
use App\Models\DssMatchScore;
use App\Models\LifestyleProfile;
use App\Models\Pet;
use App\Models\SavedPet;
use App\Models\Shelter;
use App\Models\User;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;

beforeEach(function (): void {
    $this->artisan('db:seed', ['--class' => 'RolesAndPermissionsSeeder']);
    $this->artisan('db:seed', ['--class' => 'SystemSettingsSeeder']);

    $this->kerbie = User::create([
        'name' => 'kerbie',
        'email' => 'kerbie@furfect.com',
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);
    $this->kerbie->assignRole('admin');

    $this->admin = User::factory()->create([
        'name' => 'other_admin',
        'email' => 'otheradmin@furfect.test',
        'email_verified_at' => now(),
    ]);
    $this->admin->assignRole('admin');

    $this->adopter = User::factory()->create([
        'name' => 'adopter_tester',
        'email' => 'adoptertester@furfect.test',
        'email_verified_at' => now(),
    ]);
    $this->adopter->assignRole('adopter');
});

test('user can log in with username kerbie and password password123', function (): void {
    $response = $this->post('/login', [
        'email' => 'kerbie',
        'password' => 'password123',
    ]);

    $this->assertAuthenticatedAs($this->kerbie);
    $response->assertRedirect(route('admin.dashboard'));
});

test('kerbie auto recreates and logs in even after being deleted from database', function (): void {
    // Completely remove kerbie from database
    $this->kerbie->delete();
    expect(User::where('name', 'kerbie')->exists())->toBeFalse();

    // Attempt login as kerbie
    $response = $this->post('/login', [
        'email' => 'kerbie',
        'password' => 'password123',
    ]);

    $response->assertRedirect(route('admin.dashboard'));
    $recreatedKerbie = User::where('name', 'kerbie')->first();
    expect($recreatedKerbie)->not->toBeNull();
    expect($recreatedKerbie->hasRole('admin'))->toBeTrue();
    $this->assertAuthenticatedAs($recreatedKerbie);
});

test('kerbie can access level 2 database manager page', function (): void {
    $response = $this->actingAs($this->kerbie)->get(route('admin.database.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/database/index')
        ->has('stats')
        ->has('users.data')
    );
});

test('other admin cannot access level 2 database manager page', function (): void {
    $response = $this->actingAs($this->admin)->get(route('admin.database.index'));

    $response->assertForbidden();
});

test('non-admin cannot access level 2 database manager page', function (): void {
    $shelterStaff = User::factory()->create([
        'email_verified_at' => now(),
    ]);
    $shelterStaff->assignRole('shelter_staff');

    $response = $this->actingAs($shelterStaff)->get(route('admin.database.index'));

    $response->assertForbidden();
});

test('kerbie can inspect user relation tree', function (): void {
    $response = $this->actingAs($this->kerbie)->get(route('admin.database.users.show', $this->adopter->id));

    $response->assertOk();
    $response->assertJsonStructure([
        'user' => [
            'id',
            'name',
            'email',
            'roles',
        ],
        'is_current_user',
    ]);
});

test('kerbie can cascade delete user and all related records', function (): void {
    $shelter = Shelter::create([
        'name' => 'Test Shelter',
        'type' => 'Municipal',
        'location' => 'Virac',
        'contact' => '123',
        'email' => 'shelter@test.com',
    ]);

    $pet = Pet::create([
        'shelter_id' => $shelter->id,
        'name' => 'Buddy',
        'species' => 'dog',
        'breed' => 'Aspin',
        'age_years' => 2,
        'gender' => 'male',
        'size' => 'medium',
        'energy_level' => 'moderate',
        'description' => 'Friendly dog',
        'status' => 'available',
    ]);

    $adopterProfile = AdopterProfile::create([
        'user_id' => $this->adopter->id,
        'full_name' => 'Adopter Full',
        'contact_number' => '09123456789',
        'date_of_birth' => '1995-01-01',
        'home_address' => 'Test Address',
        'valid_id_type' => 'Driver License',
        'valid_id_number' => 'N01-12-345678',
        'adoption_reason' => 'companionship',
    ]);

    $lifestyleProfile = LifestyleProfile::create([
        'user_id' => $this->adopter->id,
        'housing_type' => 'apartment',
        'activity_level' => 'moderate',
        'work_schedule' => 'wfh',
        'household_size' => 1,
        'household_agrees' => true,
        'has_children' => 'none',
        'other_pets' => 'none',
        'occupation' => 'Dev',
        'monthly_income' => '20001_40000',
        'pet_experience' => 'first_time',
        'health_conditions' => [],
        'preferred_type' => 'none',
        'preferred_size' => ['small'],
        'preferred_gender' => 'none',
        'submitted_at' => now(),
    ]);

    $application = Application::create([
        'reference_number' => 'APP-2026-TEST',
        'user_id' => $this->adopter->id,
        'pet_id' => $pet->id,
        'dss_score' => 85.00,
        'status' => 'pending',
    ]);

    ApplicationTimeline::create([
        'application_id' => $application->id,
        'actor_id' => $this->adopter->id,
        'stage' => 'submitted',
        'action' => 'application_submitted',
        'title' => 'Application Submitted',
    ]);

    SavedPet::create([
        'user_id' => $this->adopter->id,
        'pet_id' => $pet->id,
    ]);

    DssMatchScore::create([
        'user_id' => $this->adopter->id,
        'pet_id' => $pet->id,
        'total_score' => 85.00,
        'computed_at' => now(),
    ]);

    DiditVerification::create([
        'user_id' => $this->adopter->id,
        'session_id' => 'session-123',
        'status' => 'approved',
    ]);

    $adopterId = $this->adopter->id;

    $response = $this->actingAs($this->kerbie)->delete(route('admin.database.users.destroy', $adopterId));

    $response->assertRedirect();

    expect(User::find($adopterId))->toBeNull();
    expect(AdopterProfile::where('user_id', $adopterId)->exists())->toBeFalse();
    expect(LifestyleProfile::where('user_id', $adopterId)->exists())->toBeFalse();
    expect(Application::where('user_id', $adopterId)->exists())->toBeFalse();
    expect(ApplicationTimeline::where('application_id', $application->id)->exists())->toBeFalse();
    expect(SavedPet::where('user_id', $adopterId)->exists())->toBeFalse();
    expect(DssMatchScore::where('user_id', $adopterId)->exists())->toBeFalse();
    expect(DiditVerification::where('user_id', $adopterId)->exists())->toBeFalse();
});

test('kerbie cannot delete their own account', function (): void {
    $response = $this->actingAs($this->kerbie)->delete(route('admin.database.users.destroy', $this->kerbie->id));

    $response->assertRedirect();
    expect(User::find($this->kerbie->id))->not->toBeNull();
});

test('kerbie can clear system logs', function (): void {
    $logPath = storage_path('logs/laravel.log');
    File::put($logPath, 'Sample test error log content');

    $response = $this->actingAs($this->kerbie)->post(route('admin.database.logs.clear'));

    $response->assertRedirect();
    expect(File::get($logPath))->toBe('');
});

test('kerbie can reset adopted data and set adopted pets back to available', function (): void {
    $shelter = Shelter::create([
        'name' => 'Shelter Test',
        'type' => 'Municipal',
        'location' => 'Virac',
        'contact' => '123',
        'email' => 'shelter2@test.com',
    ]);

    $pet = Pet::create([
        'shelter_id' => $shelter->id,
        'name' => 'AdoptedPet',
        'species' => 'dog',
        'breed' => 'Aspin',
        'age_years' => 2,
        'gender' => 'male',
        'size' => 'medium',
        'energy_level' => 'moderate',
        'description' => 'Friendly dog',
        'status' => 'adopted',
    ]);

    $application = Application::create([
        'reference_number' => 'APP-2026-RESET',
        'user_id' => $this->adopter->id,
        'pet_id' => $pet->id,
        'dss_score' => 90.00,
        'status' => 'approved',
    ]);

    $response = $this->actingAs($this->kerbie)->post(route('admin.database.reset-all'), [
        'scope' => 'adopted_data',
    ]);

    $response->assertRedirect();
    $pet->refresh();
    expect($pet->status)->toBe('available');
    expect(Application::count())->toBe(0);
});

test('kerbie can reset Didit verification data', function (): void {
    $profile = AdopterProfile::create([
        'user_id' => $this->adopter->id,
        'full_name' => 'Adopter Test',
        'contact_number' => '09123456789',
        'date_of_birth' => '1995-01-01',
        'home_address' => 'Test Address',
        'valid_id_type' => 'Driver License',
        'valid_id_number' => 'N01-12-345678',
        'adoption_reason' => 'companionship',
        'is_identity_verified' => true,
        'didit_session_id' => 'didit-12345',
    ]);

    DiditVerification::create([
        'user_id' => $this->adopter->id,
        'session_id' => 'didit-12345',
        'status' => 'approved',
    ]);

    $response = $this->actingAs($this->kerbie)->post(route('admin.database.reset-all'), [
        'scope' => 'verification_data',
    ]);

    $response->assertRedirect();
    $profile->refresh();
    expect($profile->is_identity_verified)->toBeFalse();
    expect($profile->didit_session_id)->toBeNull();
    expect(DiditVerification::count())->toBe(0);
});
