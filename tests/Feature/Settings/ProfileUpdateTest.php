<?php

use App\Models\AdopterProfile;
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

test('adopter personal information and ID particulars can be updated from settings', function () {
    $user = User::factory()->create([
        'name' => 'Original Name',
        'phone' => '09111111111',
        'address' => 'Old Address',
    ]);

    AdopterProfile::create([
        'user_id' => $user->id,
        'full_name' => 'Original Name',
        'contact_number' => '09111111111',
        'home_address' => 'Old Address',
        'date_of_birth' => '1995-05-15',
        'valid_id_type' => 'Philippine Passport',
        'valid_id_number' => 'P1234567A',
        'had_pets_before' => 'never',
        'surrendered_pet' => false,
        'adoption_reason' => 'Companionship',
        'adoption_reason_text' => 'Loving companion',
        'pet_stay' => 'inside',
    ]);

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Updated Name',
            'email' => $user->email,
            'phone' => '09999999999',
            'address' => 'New Barangay, City',
            'date_of_birth' => '1996-06-20',
            'valid_id_type' => "Driver's License",
            'valid_id_number' => 'N01-12-345678',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $user->refresh();
    $adopterProfile = $user->adopterProfile()->first();

    expect($user->name)->toBe('Updated Name');
    expect($user->phone)->toBe('09999999999');
    expect($user->address)->toBe('New Barangay, City');

    expect($adopterProfile->full_name)->toBe('Updated Name');
    expect($adopterProfile->contact_number)->toBe('09999999999');
    expect($adopterProfile->home_address)->toBe('New Barangay, City');
    expect($adopterProfile->valid_id_type)->toBe("Driver's License");
    expect($adopterProfile->valid_id_number)->toBe('N01-12-345678');
    expect($adopterProfile->date_of_birth->format('Y-m-d'))->toBe('1996-06-20');
});

test('adopter can upload new encrypted front and back ID files in settings', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    AdopterProfile::create([
        'user_id' => $user->id,
        'full_name' => $user->name,
        'contact_number' => '09123456789',
        'home_address' => 'Sample Address',
        'date_of_birth' => '1990-01-01',
        'valid_id_type' => "Driver's License",
        'valid_id_number' => 'D01-99-888888',
        'had_pets_before' => 'never',
        'surrendered_pet' => false,
        'adoption_reason' => 'Companionship',
        'adoption_reason_text' => 'Loving companion',
        'pet_stay' => 'inside',
    ]);

    $frontFile = UploadedFile::fake()->image('front-id.jpg', 600, 400);
    $backFile = UploadedFile::fake()->image('back-id.jpg', 600, 400);

    $response = $this
        ->actingAs($user)
        ->post(route('profile.update'), [
            '_method' => 'patch',
            'name' => $user->name,
            'email' => $user->email,
            'valid_id_type' => "Driver's License",
            'valid_id_number' => 'D01-99-888888',
            'id_document' => $frontFile,
            'id_document_back' => $backFile,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $adopterProfile = $user->adopterProfile()->first();

    expect($adopterProfile->id_document_path)->not->toBeNull();
    expect($adopterProfile->id_document_back_path)->not->toBeNull();
    expect($adopterProfile->id_document_name)->toBe('front-id.jpg');
    expect($adopterProfile->id_document_back_name)->toBe('back-id.jpg');

    Storage::disk('local')->assertExists($adopterProfile->id_document_path);
    Storage::disk('local')->assertExists($adopterProfile->id_document_back_path);
});
