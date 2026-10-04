<?php

use App\Models\User;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'adopter']);
    Role::firstOrCreate(['name' => 'admin']);
});

test('google oauth redirect route redirects to provider', function () {
    $response = $this->get(route('auth.google.redirect'));

    $response->assertRedirect();
    $this->assertStringContainsString('accounts.google.com', $response->getTargetUrl());
});

test('new user can register and log in via google callback', function () {
    $abstractUser = Mockery::mock(SocialiteUser::class);
    $abstractUser->shouldReceive('getId')->andReturn('google-unique-id-12345');
    $abstractUser->shouldReceive('getEmail')->andReturn('googleadopter@example.com');
    $abstractUser->shouldReceive('getName')->andReturn('Google Adopter');
    $abstractUser->shouldReceive('getNickname')->andReturn('gadopter');
    $abstractUser->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/avatar.jpg');

    $provider = Mockery::mock('Laravel\Socialite\Contracts\Provider');
    $provider->shouldReceive('user')->andReturn($abstractUser);

    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

    $response = $this->get(route('auth.google.callback'));

    $this->assertAuthenticated();
    $this->assertDatabaseHas('users', [
        'email' => 'googleadopter@example.com',
        'google_id' => 'google-unique-id-12345',
        'name' => 'Google Adopter',
    ]);

    $user = User::where('email', 'googleadopter@example.com')->first();
    expect($user->hasRole('adopter'))->toBeTrue();
    expect($user->email_verified_at)->not->toBeNull();

    $response->assertRedirect(route('onboarding.personal.edit', absolute: false));
});

test('existing user with same email links google_id seamlessly upon callback', function () {
    $existing = User::factory()->create([
        'email' => 'existing@example.com',
        'google_id' => null,
    ]);

    $abstractUser = Mockery::mock(SocialiteUser::class);
    $abstractUser->shouldReceive('getId')->andReturn('google-linked-id-999');
    $abstractUser->shouldReceive('getEmail')->andReturn('existing@example.com');
    $abstractUser->shouldReceive('getName')->andReturn('Existing User');
    $abstractUser->shouldReceive('getNickname')->andReturn('existing');
    $abstractUser->shouldReceive('getAvatar')->andReturn(null);

    $provider = Mockery::mock('Laravel\Socialite\Contracts\Provider');
    $provider->shouldReceive('user')->andReturn($abstractUser);

    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

    $response = $this->get(route('auth.google.callback'));

    $this->assertAuthenticatedAs($existing);
    expect($existing->fresh()->google_id)->toBe('google-linked-id-999');
});

test('suspended user is blocked from logging in via google', function () {
    $suspendedUser = User::factory()->create([
        'email' => 'suspended@example.com',
        'google_id' => 'google-suspended-777',
        'suspended_at' => now(),
        'suspended_reason' => 'Violation of terms',
    ]);

    $abstractUser = Mockery::mock(SocialiteUser::class);
    $abstractUser->shouldReceive('getId')->andReturn('google-suspended-777');
    $abstractUser->shouldReceive('getEmail')->andReturn('suspended@example.com');
    $abstractUser->shouldReceive('getName')->andReturn('Suspended User');
    $abstractUser->shouldReceive('getNickname')->andReturn('suspended');
    $abstractUser->shouldReceive('getAvatar')->andReturn(null);

    $provider = Mockery::mock('Laravel\Socialite\Contracts\Provider');
    $provider->shouldReceive('user')->andReturn($abstractUser);

    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

    $response = $this->get(route('auth.google.callback'));

    $this->assertGuest();
    $response->assertRedirect(route('login', absolute: false));
    $response->assertSessionHasErrors(['email']);
});
