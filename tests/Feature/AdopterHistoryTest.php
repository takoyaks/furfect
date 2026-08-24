<?php

use App\Models\AdopterProfile;
use App\Models\Application;
use App\Models\LifestyleProfile;
use App\Models\Pet;
use App\Models\Shelter;
use App\Models\User;
use Spatie\Permission\Models\Role;

function createHistoryTestAdopter(string $name): User
{
    Role::firstOrCreate(['name' => 'adopter']);
    $user = User::factory()->create(['name' => $name]);
    $user->assignRole('adopter');

    AdopterProfile::create([
        'user_id' => $user->id,
        'full_name' => $name,
        'contact_number' => '09123456789',
        'date_of_birth' => '1995-05-15',
        'home_address' => 'Virac, Catanduanes',
        'valid_id_type' => 'National ID',
        'valid_id_number' => '1234-5678-9012',
        'had_pets_before' => 'had_before',
        'previous_pet_notes' => 'Cared for 2 rescue dogs for 8 years.',
        'surrendered_pet' => false,
        'adoption_reason' => 'Companionship',
        'adoption_reason_text' => 'Loving home in Virac.',
        'pet_stay' => 'inside',
        'profile_completed_at' => now(),
    ]);

    LifestyleProfile::create([
        'user_id' => $user->id,
        'housing_type' => 'house_with_yard',
        'has_aircon' => 'stable',
        'outdoor_access' => 'fully_fenced',
        'activity_level' => 'moderate',
        'work_schedule' => 'wfh',
        'household_size' => 2,
        'household_agrees' => true,
        'has_children' => 'none',
        'other_pets' => 'none',
        'pet_experience' => 'had_before',
        'monthly_income' => '40001_60000',
        'health_conditions' => [],
        'preferred_type' => 'dog',
        'preferred_gender' => 'none',
        'submitted_at' => now(),
    ]);

    return $user;
}

test('adopter can view comprehensive pet history page with adopted pets and certificates', function () {
    $shelter = Shelter::factory()->create();
    $adopter = createHistoryTestAdopter('Maria Santos');

    $pet1 = Pet::factory()->create(['shelter_id' => $shelter->id, 'name' => 'Bantay', 'status' => 'adopted']);
    $pet2 = Pet::factory()->create(['shelter_id' => $shelter->id, 'name' => 'Luna', 'status' => 'available']);

    // Approved application with certificate
    $app1 = Application::create([
        'user_id' => $adopter->id,
        'pet_id' => $pet1->id,
        'dss_score' => 95.0,
        'status' => 'approved',
        'certificate_number' => 'CERT-MAO-2026-0001',
        'submitted_at' => now()->subMonths(3),
        'resolved_at' => now()->subMonths(3)->addDays(3),
    ]);

    // Active application
    $app2 = Application::create([
        'user_id' => $adopter->id,
        'pet_id' => $pet2->id,
        'dss_score' => 88.0,
        'status' => 'pending',
        'submitted_at' => now()->subDay(),
    ]);

    $response = $this->actingAs($adopter)->get(route('history.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('adopter/history')
        ->has('adoptedPets', 1)
        ->has('allApplications', 2)
        ->where('adoptedPets.0.certificate_number', 'CERT-MAO-2026-0001')
        ->where('adopterProfile.full_name', 'Maria Santos')
        ->where('lifestyleProfile.housing_type', 'house_with_yard')
    );
});

test('shelter staff review dossier includes adopter municipal track record and welfare background', function () {
    Role::firstOrCreate(['name' => 'shelter_staff']);
    $shelter = Shelter::factory()->create();
    $adopter = createHistoryTestAdopter('Juan Dela Cruz');

    $petOld = Pet::factory()->create(['shelter_id' => $shelter->id, 'name' => 'Old Buddy', 'status' => 'adopted']);
    $petCurrent = Pet::factory()->create(['shelter_id' => $shelter->id, 'name' => 'New Rescue', 'status' => 'available']);

    // Prior approved adoption
    Application::create([
        'user_id' => $adopter->id,
        'pet_id' => $petOld->id,
        'dss_score' => 90.0,
        'status' => 'approved',
        'certificate_number' => 'CERT-MAO-2025-0012',
        'submitted_at' => now()->subYear(),
        'resolved_at' => now()->subYear()->addDays(2),
    ]);

    // Current application under review
    $currentApp = Application::create([
        'user_id' => $adopter->id,
        'pet_id' => $petCurrent->id,
        'dss_score' => 92.0,
        'status' => 'pending',
        'submitted_at' => now(),
    ]);

    $staff = User::factory()->create();
    $staff->assignRole('shelter_staff');

    $response = $this->actingAs($staff)->get(route('shelter.applications.show', $currentApp->id));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('shelter/applications/show')
        ->has('adopterTrackRecord')
        ->where('adopterTrackRecord.prior_adopted_count', 1)
        ->where('adopterTrackRecord.total_applications', 2)
        ->where('adopterTrackRecord.surrendered_pet', false)
    );
});

test('mao officer compliance dossier includes adopter track record for statutory audit', function () {
    Role::firstOrCreate(['name' => 'mao_officer']);
    $shelter = Shelter::factory()->create();
    $adopter = createHistoryTestAdopter('Rosa Flores');

    $pet = Pet::factory()->create(['shelter_id' => $shelter->id, 'status' => 'available']);

    $application = Application::create([
        'user_id' => $adopter->id,
        'pet_id' => $pet->id,
        'dss_score' => 94.0,
        'status' => 'mao_audit',
        'submitted_at' => now()->subHours(2),
    ]);

    $maoOfficer = User::factory()->create();
    $maoOfficer->assignRole('mao_officer');

    $response = $this->actingAs($maoOfficer)->get(route('mao.applications.show', $application->id));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('mao/applications/show')
        ->has('adopterTrackRecord')
        ->where('adopterTrackRecord.surrendered_pet', false)
    );
});
