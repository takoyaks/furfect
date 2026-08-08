<?php

use App\Models\Pet;
use App\Models\Shelter;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin']);
    Role::firstOrCreate(['name' => 'shelter_staff']);
    Role::firstOrCreate(['name' => 'adopter']);
});

test('guest cannot view create pet page', function () {
    $response = $this->get(route('shelter.pets.create'));

    $response->assertRedirect('/login');
});

test('admin can view create pet page', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $response = $this->actingAs($admin)->get(route('shelter.pets.create'));

    $response->assertStatus(200);
});

test('admin can create a new pet listing with photo upload', function () {
    Storage::fake('public');

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $shelter = Shelter::factory()->create(['status' => 'active']);

    $photo = UploadedFile::fake()->image('dog.jpg', 600, 600);

    $response = $this->actingAs($admin)->post(route('shelter.pets.store'), [
        'shelter_id' => $shelter->id,
        'name' => 'Buster',
        'species' => 'dog',
        'breed' => 'Golden Retriever',
        'age_years' => 2,
        'gender' => 'male',
        'size' => 'large',
        'health_status' => 'Vaccinated & Healthy',
        'temperament' => ['Friendly', 'Playful'],
        'energy_level' => 'high',
        'requires_experience' => false,
        'requires_yard' => true,
        'requires_no_children' => false,
        'requires_no_other_pets' => false,
        'housing_compatible' => ['house_with_yard', 'rural'],
        'adoption_fee' => 1500,
        'description' => 'Buster is a fun-loving Golden Retriever who loves running outdoors.',
        'photos' => [$photo],
    ]);

    $response->assertRedirect(route('shelter.pets.index'));

    $this->assertDatabaseHas('pets', [
        'shelter_id' => $shelter->id,
        'name' => 'Buster',
        'species' => 'dog',
        'gender' => 'male',
        'status' => 'available',
    ]);

    $pet = Pet::where('name', 'Buster')->first();
    expect($pet)->not->toBeNull();
    expect($pet->photos)->toHaveCount(1);
    expect($pet->photos->first()->is_primary)->toBeTrue();
});
