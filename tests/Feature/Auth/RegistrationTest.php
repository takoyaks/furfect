<?php

use App\Models\User;
use Laravel\Fortify\Features;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::registration());
});

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'TEST@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'terms_agreed' => '1',
        'captcha_verified' => '1',
    ]);

    $this->assertAuthenticated();
    $this->assertDatabaseHas('users', [
        'email' => 'test@example.com',
    ]);
    $response->assertRedirect(route('onboarding.personal.edit', absolute: false));
});

test('registration rejects duplicate email with custom message', function () {
    User::factory()->create([
        'email' => 'existing@example.com',
    ]);

    $response = $this->post(route('register.store'), [
        'name' => 'Another User',
        'email' => 'EXISTING@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'terms_agreed' => '1',
        'captcha_verified' => '1',
    ]);

    $response->assertSessionHasErrors([
        'email' => 'This email address is already registered. Please log in or use a different email.',
    ]);
    $this->assertGuest();
});
