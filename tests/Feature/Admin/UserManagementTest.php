<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

beforeEach(function (): void {
    $this->artisan('db:seed', ['--class' => 'RolesAndPermissionsSeeder']);
    $this->artisan('db:seed', ['--class' => 'SystemSettingsSeeder']);

    $this->admin = User::factory()->create([
        'name' => 'Admin User',
        'email' => 'admin@furfect.test',
    ]);
    $this->admin->assignRole('admin');

    $this->adopter = User::factory()->create([
        'name' => 'Adopter User',
        'email' => 'adopter@furfect.test',
        'password' => Hash::make('old-password-123'),
    ]);
    $this->adopter->assignRole('adopter');
});

test('admin can view users management page', function (): void {
    $response = $this->actingAs($this->admin)->get(route('admin.users.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/users/index')
        ->has('users.data')
    );
});

test('admin can reset another user password successfully', function (): void {
    $response = $this->actingAs($this->admin)->post(route('admin.users.reset-password', $this->adopter->id), [
        'password' => 'new-secure-password-456',
        'password_confirmation' => 'new-secure-password-456',
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    // Verify the user's password in database actually changed
    $this->adopter->refresh();
    expect(Hash::check('new-secure-password-456', $this->adopter->password))->toBeTrue();
    expect(Hash::check('old-password-123', $this->adopter->password))->toBeFalse();

    // Logout admin before logging in as the adopter
    auth()->logout();
    $this->flushSession();

    // Verify user can now authenticate with the new password
    $this->post('/login', [
        'email' => 'adopter@furfect.test',
        'password' => 'new-secure-password-456',
    ]);

    $this->assertAuthenticatedAs($this->adopter);
});

test('password reset fails when password is too short or not confirmed', function (): void {
    $response = $this->actingAs($this->admin)->post(route('admin.users.reset-password', $this->adopter->id), [
        'password' => 'short',
        'password_confirmation' => 'mismatch',
    ]);

    $response->assertSessionHasErrors(['password']);

    // Password must remain old password
    $this->adopter->refresh();
    expect(Hash::check('old-password-123', $this->adopter->password))->toBeTrue();
});

test('non-admin user cannot reset passwords', function (): void {
    $shelterStaff = User::factory()->create();
    $shelterStaff->assignRole('shelter_staff');

    $targetUser = User::factory()->create();

    $response = $this->actingAs($shelterStaff)->post(route('admin.users.reset-password', $targetUser->id), [
        'password' => 'unauthorized-pass-123',
        'password_confirmation' => 'unauthorized-pass-123',
    ]);

    $response->assertForbidden();
});

test('guest cannot reset passwords and is redirected to login', function (): void {
    $response = $this->post(route('admin.users.reset-password', $this->adopter->id), [
        'password' => 'unauthorized-pass-123',
        'password_confirmation' => 'unauthorized-pass-123',
    ]);

    $response->assertRedirect(route('login'));
});
