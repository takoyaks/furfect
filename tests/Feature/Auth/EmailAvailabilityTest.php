<?php

use App\Models\User;

test('email availability endpoint reports available for unused email', function () {
    $response = $this->getJson(route('email.check', ['email' => 'newuser@example.com']));

    $response->assertOk()
        ->assertJson([
            'available' => true,
            'message' => 'Email address is available.',
        ]);
});

test('email availability endpoint reports unavailable for existing email regardless of case', function () {
    User::factory()->create([
        'email' => 'registered@example.com',
    ]);

    $response = $this->getJson(route('email.check', ['email' => 'REGISTERED@example.com']));

    $response->assertOk()
        ->assertJson([
            'available' => false,
            'message' => 'This email address is already registered. Please log in or use a different email.',
        ]);
});

test('email availability endpoint rejects invalid email', function () {
    $response = $this->getJson(route('email.check', ['email' => 'not-an-email']));

    $response->assertStatus(422)
        ->assertJson([
            'available' => false,
            'message' => 'Please provide a valid email address.',
        ]);
});

test('email availability endpoint allows ignoring user id', function () {
    $user = User::factory()->create([
        'email' => 'self@example.com',
    ]);

    $response = $this->getJson(route('email.check', [
        'email' => 'self@example.com',
        'ignore_id' => $user->id,
    ]));

    $response->assertOk()
        ->assertJson([
            'available' => true,
            'message' => 'Email address is available.',
        ]);
});
