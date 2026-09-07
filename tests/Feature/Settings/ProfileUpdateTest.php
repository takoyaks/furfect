<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('profile page is displayed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('profile.edit'));

    $response->assertOk();
});

test('profile information can be updated', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '+63 912 345 6789',
            'address' => '123 Main St, City',
            'bio' => 'A passionate pet lover with dog training experience.',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $user->refresh();

    expect($user->name)->toBe('Test User');
    expect($user->email)->toBe('test@example.com');
    expect($user->phone)->toBe('+63 912 345 6789');
    expect($user->address)->toBe('123 Main St, City');
    expect($user->bio)->toBe('A passionate pet lover with dog training experience.');
    expect($user->email_verified_at)->toBeNull();
});

test('user can upload an avatar profile picture', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $file = UploadedFile::fake()->image('avatar.jpg', 200, 200);

    $response = $this
        ->actingAs($user)
        ->post(route('profile.update'), [
            '_method' => 'patch',
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $file,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $user->refresh();

    expect($user->getRawOriginal('avatar'))->not->toBeNull();
    Storage::disk('public')->assertExists($user->getRawOriginal('avatar'));
    expect($user->avatar)->toContain('/storage/');
});

test('user can remove their avatar profile picture', function () {
    Storage::fake('public');

    $avatarPath = 'avatars/test-old-avatar.jpg';
    Storage::disk('public')->put($avatarPath, 'dummy content');

    $user = User::factory()->create([
        'avatar' => $avatarPath,
    ]);

    $response = $this
        ->actingAs($user)
        ->post(route('profile.update'), [
            '_method' => 'patch',
            'name' => $user->name,
            'email' => $user->email,
            'remove_avatar' => true,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $user->refresh();

    expect($user->getRawOriginal('avatar'))->toBeNull();
    Storage::disk('public')->assertMissing($avatarPath);
});

test('email verification status is unchanged when the email address is unchanged', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Test User',
            'email' => $user->email,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    expect($user->refresh()->email_verified_at)->not->toBeNull();
});

test('appearance settings redirects to profile settings', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('appearance.edit'));

    $response->assertRedirect(route('profile.edit'));
});

test('user can delete their account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('home'));

    $this->assertGuest();
    expect($user->fresh())->toBeNull();
});

test('correct password must be provided to delete account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from(route('profile.edit'))
        ->delete(route('profile.destroy'), [
            'password' => 'wrong-password',
        ]);

    $response
        ->assertSessionHasErrors('password')
        ->assertRedirect(route('profile.edit'));

    expect($user->fresh())->not->toBeNull();
});
