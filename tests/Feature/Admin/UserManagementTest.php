<?php

use App\Models\AdopterProfile;
use App\Models\LifestyleProfile;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

beforeEach(function (): void {
    $this->artisan('db:seed', ['--class' => 'RolesAndPermissionsSeeder']);
    $this->artisan('db:seed', ['--class' => 'SystemSettingsSeeder']);

    $this->admin = User::factory()->create([
        'name' => 'Admin User',
        'email' => 'admin@furfect.test',
        'email_verified_at' => now(),
    ]);
    $this->admin->assignRole('admin');

    $this->adopter = User::factory()->create([
        'name' => 'Adopter User',
        'email' => 'adopter@furfect.test',
        'password' => Hash::make('old-password-123'),
        'email_verified_at' => now(),
    ]);
    $this->adopter->assignRole('adopter');
});

test('admin can view users management page with subscribers tab by default', function (): void {
    $response = $this->actingAs($this->admin)->get(route('admin.users.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/users/index')
        ->where('tab', 'subscribers')
        ->has('users.data')
        ->has('counts.subscribers')
        ->has('counts.staff')
    );
});

test('admin can view staff tab in users management', function (): void {
    $response = $this->actingAs($this->admin)->get(route('admin.users.index', ['tab' => 'staff']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/users/index')
        ->where('tab', 'staff')
        ->has('users.data')
    );
});

test('admin can manually verify an adopter identity profile', function (): void {
    $profile = AdopterProfile::create([
        'user_id' => $this->adopter->id,
        'full_name' => 'Adopter Full Name',
        'contact_number' => '09123456789',
        'date_of_birth' => '1995-01-01',
        'home_address' => 'Test Address',
        'valid_id_type' => 'National ID',
        'valid_id_number' => '1234-5678',
        'adoption_reason' => 'companionship',
        'is_identity_verified' => false,
    ]);

    $response = $this->actingAs($this->admin)->post(route('admin.users.toggle-verification', $this->adopter->id));

    $response->assertRedirect();
    $profile->refresh();
    expect($profile->is_identity_verified)->toBeTrue();
    expect($profile->identity_verification_provider)->toBe('manual_admin');
    expect($profile->identity_verified_at)->not->toBeNull();
    expect($this->adopter->fresh()->isIdentityVerified())->toBeTrue();
});

test('admin can manually verify a brand new subscriber who has no profile record yet', function (): void {
    $newAdopter = User::factory()->create(['name' => 'Fresh User', 'email_verified_at' => now()]);
    $newAdopter->assignRole('adopter');

    expect($newAdopter->adopterProfile)->toBeNull();

    $response = $this->actingAs($this->admin)->post(route('admin.users.toggle-verification', $newAdopter->id));
    $response->assertRedirect();

    $newProfile = $newAdopter->fresh()->adopterProfile;
    expect($newProfile)->not->toBeNull();
    expect($newProfile->is_identity_verified)->toBeTrue();
    expect($newProfile->identity_verification_provider)->toBe('manual_admin');
    expect($newAdopter->fresh()->isIdentityVerified())->toBeTrue();
});

test('admin can revoke manual verification for an adopter', function (): void {
    $profile = AdopterProfile::create([
        'user_id' => $this->adopter->id,
        'full_name' => 'Adopter Full Name',
        'contact_number' => '09123456789',
        'date_of_birth' => '1995-01-01',
        'home_address' => 'Test Address',
        'valid_id_type' => 'National ID',
        'valid_id_number' => '1234-5678',
        'adoption_reason' => 'companionship',
        'is_identity_verified' => true,
        'identity_verified_at' => now(),
        'identity_verification_provider' => 'manual_admin',
    ]);

    $response = $this->actingAs($this->admin)->post(route('admin.users.toggle-verification', $this->adopter->id));

    $response->assertRedirect();
    $profile->refresh();
    expect($profile->is_identity_verified)->toBeFalse();
    expect($profile->identity_verified_at)->toBeNull();
    expect($this->adopter->fresh()->isIdentityVerified())->toBeFalse();
});

test('admin can reset subscriber lifestyle quiz', function (): void {
    LifestyleProfile::create([
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
        'submitted_at' => now(),
    ]);

    expect(LifestyleProfile::where('user_id', $this->adopter->id)->exists())->toBeTrue();

    $response = $this->actingAs($this->admin)->post(route('admin.users.reset-subscriber', $this->adopter->id), [
        'reset_type' => 'quiz',
    ]);

    $response->assertRedirect();
    expect(LifestyleProfile::where('user_id', $this->adopter->id)->exists())->toBeFalse();
});

test('admin can reset another user password successfully', function (): void {
    $response = $this->actingAs($this->admin)->post(route('admin.users.reset-password', $this->adopter->id), [
        'password' => 'new-secure-password-456',
        'password_confirmation' => 'new-secure-password-456',
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    $this->adopter->refresh();
    expect(Hash::check('new-secure-password-456', $this->adopter->password))->toBeTrue();
    expect(Hash::check('old-password-123', $this->adopter->password))->toBeFalse();
});

test('non-admin user cannot reset passwords or verify adopters', function (): void {
    $shelterStaff = User::factory()->create([
        'email_verified_at' => now(),
    ]);
    $shelterStaff->assignRole('shelter_staff');

    $targetUser = User::factory()->create();

    $response = $this->actingAs($shelterStaff)->post(route('admin.users.toggle-verification', $targetUser->id));
    $response->assertForbidden();

    $response2 = $this->actingAs($shelterStaff)->post(route('admin.users.reset-password', $targetUser->id), [
        'password' => 'unauthorized-pass-123',
        'password_confirmation' => 'unauthorized-pass-123',
    ]);
    $response2->assertForbidden();
});
