<?php

use App\Models\Pet;
use App\Models\Shelter;
use App\Models\User;
use Spatie\Permission\Models\Role;

function createShelterStaffForPetTest(): User
{
    Role::firstOrCreate(['name' => 'shelter_staff']);
    $user = User::factory()->create();
    $user->assignRole('shelter_staff');

    return $user;
}

function createAdminForPetTest(): User
{
    Role::firstOrCreate(['name' => 'admin']);
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

test('shelter staff can create a pet with identity tags and housing area details', function () {
    $staff = createShelterStaffForPetTest();
    $shelter = Shelter::factory()->create();

    $petData = [
        'shelter_id' => $shelter->id,
        'name' => 'Bantay',
        'species' => 'dog',
        'breed' => 'Aspin',
        'tag_number' => 'TAG-D-2026-089',
        'microchip_number' => '900115800412345',
        'age_years' => 2,
        'gender' => 'male',
        'size' => 'medium',
        'health_status' => 'Vaccinated & Neutered',
        'temperament' => ['Friendly', 'Calm'],
        'energy_level' => 'moderate',
        'requires_experience' => false,
        'requires_yard' => true,
        'requires_no_children' => false,
        'requires_no_other_pets' => false,
        'housing_compatible' => ['house_with_yard', 'apartment'],
        'housing_area' => 'Kennel Bay A-12',
        'housing_notes' => 'Quiet corner cage near exercise run.',
        'intake_date' => '2026-08-01',
        'adoption_fee' => 0.00,
        'description' => 'A gentle and loyal dog.',
    ];

    $response = $this->actingAs($staff)->post(route('shelter.pets.store'), $petData);
    $response->assertRedirect(route('shelter.pets.index'));

    $pet = Pet::where('name', 'Bantay')->first();
    expect($pet)->not->toBeNull();
    expect($pet->tag_number)->toBe('TAG-D-2026-089');
    expect($pet->microchip_number)->toBe('900115800412345');
    expect($pet->housing_area)->toBe('Kennel Bay A-12');
    expect($pet->housing_notes)->toBe('Quiet corner cage near exercise run.');
    expect($pet->intake_date->format('Y-m-d'))->toBe('2026-08-01');
});

test('shelter staff can update pet identity and housing area details', function () {
    $staff = createShelterStaffForPetTest();
    $shelter = Shelter::factory()->create();
    $pet = Pet::factory()->create([
        'shelter_id' => $shelter->id,
        'name' => 'Muning',
        'species' => 'cat',
        'tag_number' => 'TAG-C-001',
        'housing_area' => 'Cattery Pen 1',
    ]);

    $updateData = [
        'shelter_id' => $shelter->id,
        'name' => 'Muning',
        'species' => 'cat',
        'breed' => 'Domestic Short Hair',
        'tag_number' => 'TAG-C-001-RELOCATED',
        'microchip_number' => '985141002345678',
        'age_years' => 1,
        'gender' => 'female',
        'size' => 'small',
        'health_status' => 'Vaccinated',
        'temperament' => ['Affectionate'],
        'energy_level' => 'low',
        'requires_experience' => false,
        'requires_yard' => false,
        'requires_no_children' => false,
        'requires_no_other_pets' => false,
        'housing_compatible' => ['apartment', 'condo'],
        'housing_area' => 'Cattery Room 2 - Pen B',
        'housing_notes' => 'Upper tier enclosure.',
        'intake_date' => '2026-08-10',
        'adoption_fee' => 0.00,
        'description' => 'Sweet indoor cat.',
        'status' => 'available',
    ];

    $response = $this->actingAs($staff)->post(route('shelter.pets.update', $pet->id), $updateData);
    $response->assertRedirect(route('shelter.pets.index'));

    $pet->refresh();
    expect($pet->tag_number)->toBe('TAG-C-001-RELOCATED');
    expect($pet->microchip_number)->toBe('985141002345678');
    expect($pet->housing_area)->toBe('Cattery Room 2 - Pen B');
    expect($pet->housing_notes)->toBe('Upper tier enclosure.');
    expect($pet->intake_date->format('Y-m-d'))->toBe('2026-08-10');
});

test('shelter staff can search pets by tag number or housing area', function () {
    $staff = createShelterStaffForPetTest();
    $shelter = Shelter::factory()->create();

    $pet1 = Pet::factory()->create([
        'shelter_id' => $shelter->id,
        'name' => 'Rocky',
        'tag_number' => 'TAG-LOC-999',
        'housing_area' => 'Isolation Ward 3',
    ]);

    $pet2 = Pet::factory()->create([
        'shelter_id' => $shelter->id,
        'name' => 'Luna',
        'tag_number' => 'TAG-LOC-111',
        'housing_area' => 'General Kennel B',
    ]);

    // Search by tag number
    $responseTag = $this->actingAs($staff)->get(route('shelter.pets.index', ['search' => 'TAG-LOC-999']));
    $responseTag->assertOk();
    $responseTag->assertSee('Rocky');
    $responseTag->assertDontSee('Luna');

    // Search by housing area
    $responseArea = $this->actingAs($staff)->get(route('shelter.pets.index', ['search' => 'Isolation Ward']));
    $responseArea->assertOk();
    $responseArea->assertSee('Rocky');
    $responseArea->assertDontSee('Luna');
});

test('admin can search pets by microchip number or housing area', function () {
    $admin = createAdminForPetTest();
    $shelter = Shelter::factory()->create();

    $pet = Pet::factory()->create([
        'shelter_id' => $shelter->id,
        'name' => 'Bruno',
        'microchip_number' => '900999888777666',
        'housing_area' => 'Quarantine Pen 5',
    ]);

    $response = $this->actingAs($admin)->get(route('admin.pets.index', ['search' => '900999888777666']));
    $response->assertOk();
    $response->assertSee('Bruno');
});
