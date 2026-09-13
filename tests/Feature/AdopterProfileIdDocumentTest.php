<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

beforeEach(function (): void {
    Role::firstOrCreate(['name' => 'adopter']);
    Role::firstOrCreate(['name' => 'shelter_staff']);
    Role::firstOrCreate(['name' => 'mao_officer']);
    Role::firstOrCreate(['name' => 'admin']);
    $this->artisan('db:seed', ['--class' => 'SystemSettingsSeeder']);
});

test('adopter can upload front and back valid ID images with encryption', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $user->assignRole('adopter');

    $frontFile = UploadedFile::fake()->image('id_front.jpg', 600, 400);
    $backFile = UploadedFile::fake()->image('id_back.jpg', 600, 400);

    $response = $this->actingAs($user)->post(route('onboarding.personal.store'), [
        'full_name' => 'Juan Dela Cruz',
        'contact_number' => '09171234567',
        'date_of_birth' => '1990-05-15',
        'home_address' => 'Barangay San Pedro, Virac',
        'valid_id_type' => 'Driver\'s License',
        'valid_id_number' => 'D01-23-456789',
        'id_document' => $frontFile,
        'id_document_back' => $backFile,
        'had_pets_before' => 'had_before',
        'previous_pet_notes' => 'Had a rescue dog for 7 years',
        'surrendered_pet' => false,
        'adoption_reason' => 'Companionship',
        'adoption_reason_text' => 'We want to give a shelter pet a loving forever home.',
        'pet_stay' => 'inside',
        'terms_read' => true,
        'info_confirmed' => true,
    ]);

    $response->assertRedirect(route('onboarding.lifestyle.edit'));

    $profile = $user->fresh()->adopterProfile;
    expect($profile)->not->toBeNull();
    expect($profile->id_document_path)->not->toBeNull();
    expect($profile->id_document_back_path)->not->toBeNull();
    expect($profile->hasFrontIdDocument())->toBeTrue();
    expect($profile->hasBackIdDocument())->toBeTrue();

    // Verify encrypted file exists on disk
    Storage::disk('local')->assertExists($profile->id_document_path);
    Storage::disk('local')->assertExists($profile->id_document_back_path);

    // Verify raw file is encrypted and does not contain plain binary image header
    $rawFront = Storage::disk('local')->get($profile->id_document_path);
    expect($rawFront)->not->toContain('JFIF');
});

test('adopter can view their own front and back decrypted ID documents', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $user->assignRole('adopter');

    $frontFile = UploadedFile::fake()->image('my_front.jpg', 400, 300);
    $backFile = UploadedFile::fake()->image('my_back.jpg', 400, 300);

    $this->actingAs($user)->post(route('onboarding.personal.store'), [
        'full_name' => 'Maria Santos',
        'contact_number' => '09181234567',
        'date_of_birth' => '1992-08-20',
        'home_address' => 'Virac, Catanduanes',
        'valid_id_type' => 'Philippine Passport',
        'valid_id_number' => 'P1234567B',
        'id_document' => $frontFile,
        'id_document_back' => $backFile,
        'had_pets_before' => 'never',
        'surrendered_pet' => false,
        'adoption_reason' => 'Companionship',
        'adoption_reason_text' => 'Loving home',
        'pet_stay' => 'inside',
        'terms_read' => true,
        'info_confirmed' => true,
    ]);

    $profile = $user->fresh()->adopterProfile;

    // View front side
    $frontResponse = $this->actingAs($user)->get(route('adopter.id-document.show', [
        'profile' => $profile->id,
        'side' => 'front',
    ]));
    $frontResponse->assertOk();
    $frontResponse->assertHeader('Content-Type', 'image/jpeg');

    // View back side
    $backResponse = $this->actingAs($user)->get(route('adopter.id-document.show', [
        'profile' => $profile->id,
        'side' => 'back',
    ]));
    $backResponse->assertOk();
    $backResponse->assertHeader('Content-Type', 'image/jpeg');
});

test('unauthorized user cannot view another adopters ID document', function () {
    Storage::fake('local');

    $user1 = User::factory()->create();
    $user1->assignRole('adopter');

    $user2 = User::factory()->create();
    $user2->assignRole('adopter');

    $file = UploadedFile::fake()->image('id.jpg', 400, 300);

    $this->actingAs($user1)->post(route('onboarding.personal.store'), [
        'full_name' => 'User One',
        'contact_number' => '09181234567',
        'date_of_birth' => '1992-08-20',
        'home_address' => 'Virac',
        'valid_id_type' => 'School ID',
        'valid_id_number' => 'SCH-001',
        'id_document' => $file,
        'had_pets_before' => 'never',
        'surrendered_pet' => false,
        'adoption_reason' => 'Companionship',
        'adoption_reason_text' => 'Loving home',
        'pet_stay' => 'inside',
        'terms_read' => true,
        'info_confirmed' => true,
    ]);

    $profile1 = $user1->fresh()->adopterProfile;

    $response = $this->actingAs($user2)->get(route('adopter.id-document.show', [
        'profile' => $profile1->id,
        'side' => 'front',
    ]));

    $response->assertStatus(403);
});

test('shelter staff, mao officer, and admin can inspect applicant ID document', function () {
    Storage::fake('local');

    $adopter = User::factory()->create();
    $adopter->assignRole('adopter');

    $file = UploadedFile::fake()->image('id.jpg', 400, 300);

    $this->actingAs($adopter)->post(route('onboarding.personal.store'), [
        'full_name' => 'Applicant Test',
        'contact_number' => '09181234567',
        'date_of_birth' => '1992-08-20',
        'home_address' => 'Virac',
        'valid_id_type' => 'School ID',
        'valid_id_number' => 'SCH-001',
        'id_document' => $file,
        'had_pets_before' => 'never',
        'surrendered_pet' => false,
        'adoption_reason' => 'Companionship',
        'adoption_reason_text' => 'Loving home',
        'pet_stay' => 'inside',
        'terms_read' => true,
        'info_confirmed' => true,
    ]);

    $profile = $adopter->fresh()->adopterProfile;

    // Test shelter_staff
    $staff = User::factory()->create();
    $staff->assignRole('shelter_staff');
    $resStaff = $this->actingAs($staff)->get(route('adopter.id-document.show', [
        'profile' => $profile->id,
        'side' => 'front',
    ]));
    $resStaff->assertOk();

    // Test mao_officer
    $mao = User::factory()->create();
    $mao->assignRole('mao_officer');
    $resMao = $this->actingAs($mao)->get(route('adopter.id-document.show', [
        'profile' => $profile->id,
        'side' => 'front',
    ]));
    $resMao->assertOk();

    // Test admin
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $resAdmin = $this->actingAs($admin)->get(route('adopter.id-document.show', [
        'profile' => $profile->id,
        'side' => 'front',
    ]));
    $resAdmin->assertOk();
});
