<?php

use App\Models\AdopterProfile;
use App\Models\Application;
use App\Models\LifestyleProfile;
use App\Models\Pet;
use App\Models\Shelter;
use App\Models\User;
use App\Services\BreedMaskerService;
use Spatie\Permission\Models\Role;

// ── Unit tests for BreedMaskerService ──────────────────────────────────────

test('breed masker replaces breed name with asterisks in description', function () {
    $masked = BreedMaskerService::mask('The Birman cat is a large and affectionate breed.');
    expect($masked)->not->toContain('Birman');
    expect($masked)->toContain('******');
});

test('breed masker replaces multi-word breed names', function () {
    $masked = BreedMaskerService::mask('My Maine Coon is very fluffy.');
    expect($masked)->not->toContain('Maine Coon');
    // Each word gets asterisks: "Maine" -> "*****", "Coon" -> "****"
    expect($masked)->toContain('*****');
});

test('breed masker is case insensitive', function () {
    $masked = BreedMaskerService::mask('The siamese cat is vocal.');
    expect($masked)->not->toContain('siamese');
});

test('breed masker does not mask unrelated text', function () {
    $description = 'This is a friendly and playful dog who loves walks.';
    $masked = BreedMaskerService::mask($description);
    expect($masked)
        ->toContain('friendly')
        ->toContain('playful')
        ->toContain('walks');
});

test('breed masker masks multiple breeds in a single description', function () {
    $masked = BreedMaskerService::mask('A Poodle and a Beagle play together.');
    expect($masked)->not->toContain('Poodle');
    expect($masked)->not->toContain('Beagle');
});

// ── HTTP integration tests ─────────────────────────────────────────────────

/**
 * Create a fully onboarded adopter user (both profile steps complete).
 */
function makeOnboardedAdopter(): User
{
    Role::firstOrCreate(['name' => 'adopter']);
    $user = User::factory()->create();
    $user->assignRole('adopter');

    AdopterProfile::create([
        'user_id' => $user->id,
        'full_name' => 'Test Adopter',
        'contact_number' => '09123456789',
        'date_of_birth' => '1995-01-01',
        'home_address' => 'Virac, Catanduanes',
        'valid_id_type' => 'National ID',
        'valid_id_number' => '12345',
        'had_pets_before' => 'never',
        'surrendered_pet' => false,
        'adoption_reason' => 'Companionship',
        'adoption_reason_text' => 'I love animals.',
        'pet_stay' => 'inside',
        'profile_completed_at' => now(),
    ]);

    LifestyleProfile::create([
        'user_id' => $user->id,
        'housing_type' => 'apartment',
        'has_aircon' => 'stable',
        'outdoor_access' => 'none',
        'activity_level' => 'moderate',
        'work_schedule' => 'office',
        'household_size' => 2,
        'household_agrees' => true,
        'has_children' => 'none',
        'other_pets' => 'none',
        'pet_experience' => 'first_time',
        'preferred_type' => 'none',
        'preferred_gender' => 'none',
        'submitted_at' => now(),
    ]);

    return $user;
}

test('pet catalog hides breed as Hidden for adopter', function () {
    $user = makeOnboardedAdopter();
    $shelter = Shelter::first() ?? Shelter::factory()->create();

    $pet = Pet::factory()->create([
        'shelter_id' => $shelter->id,
        'breed' => 'Birman',
        'description' => 'The Birman cat is a large and affectionate cat.',
        'status' => 'available',
    ]);

    $response = $this->actingAs($user)->get(route('pets.index'));

    $response->assertOk();

    $pets = $response->original->getData()['page']['props']['pets']['data'];
    $petData = collect($pets)->firstWhere('id', $pet->id);

    if ($petData) {
        expect($petData['breed'])->toBe('Hidden');
        expect($petData['description'])->not->toContain('Birman');
    }
});

test('approved adopter sees real breed on pet show page', function () {
    $user = makeOnboardedAdopter();
    $shelter = Shelter::first() ?? Shelter::factory()->create();

    $pet = Pet::factory()->create([
        'shelter_id' => $shelter->id,
        'breed' => 'Birman',
        'description' => 'The Birman cat is a large and affectionate cat.',
        'status' => 'available',
    ]);

    // Create approved application for this user+pet
    Application::factory()->create([
        'user_id' => $user->id,
        'pet_id' => $pet->id,
        'status' => 'approved',
    ]);

    $response = $this->actingAs($user)->get(route('pets.show', $pet->id));

    $response->assertOk();

    $props = $response->original->getData()['page']['props'];
    expect($props['isApproved'])->toBeTrue();
    expect($props['pet']['breed'])->toBe('Birman');
    expect($props['pet']['description'])->toContain('Birman');
});

test('non-approved adopter sees Hidden breed on pet show page', function () {
    $user = makeOnboardedAdopter();
    $shelter = Shelter::first() ?? Shelter::factory()->create();

    $pet = Pet::factory()->create([
        'shelter_id' => $shelter->id,
        'breed' => 'Birman',
        'description' => 'The Birman cat is a large and affectionate cat.',
        'status' => 'available',
    ]);

    $response = $this->actingAs($user)->get(route('pets.show', $pet->id));

    $response->assertOk();

    $props = $response->original->getData()['page']['props'];
    expect($props['isApproved'])->toBeFalse();
    expect($props['pet']['breed'])->toBe('Hidden');
    expect($props['pet']['description'])->not->toContain('Birman');
});
