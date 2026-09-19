<?php

use App\Models\AdopterProfile;
use App\Models\Application;
use App\Models\LifestyleProfile;
use App\Models\Pet;
use App\Models\Shelter;
use App\Models\User;
use Spatie\Permission\Models\Role;

function createTestOnboardedAdopter(): User
{
    Role::firstOrCreate(['name' => 'adopter']);
    $user = User::factory()->create();
    $user->assignRole('adopter');

    AdopterProfile::create([
        'user_id' => $user->id,
        'full_name' => 'John Doe',
        'contact_number' => '09123456789',
        'date_of_birth' => '1995-05-15',
        'home_address' => 'Virac, Catanduanes',
        'valid_id_type' => 'National ID',
        'valid_id_number' => '1234-5678-9012',
        'had_pets_before' => 'had_before',
        'surrendered_pet' => false,
        'adoption_reason' => 'Companionship',
        'adoption_reason_text' => 'Loving home for a rescued pet.',
        'pet_stay' => 'inside',
        'is_identity_verified' => true,
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

function createTestStaff(string $role): User
{
    Role::firstOrCreate(['name' => $role]);
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

test('submitting application computes 8-factor DSS score, initializes SLA and logs timeline', function () {
    $adopter = createTestOnboardedAdopter();
    $shelter = Shelter::factory()->create();
    $pet = Pet::factory()->create([
        'shelter_id' => $shelter->id,
        'status' => 'available',
    ]);

    $response = $this->actingAs($adopter)->post(route('application.store'), [
        'pet_id' => $pet->id,
    ]);

    $response->assertRedirect(route('application.show'));

    $application = Application::where('user_id', $adopter->id)->where('pet_id', $pet->id)->first();
    expect($application)->not->toBeNull();
    expect((float) $application->dss_score)->toBeGreaterThan(0);
    expect($application->target_sla_at)->not->toBeNull();
    expect($application->status)->toBe('pending');

    // Check timeline event
    $timelines = $application->timelines;
    expect($timelines)->toHaveCount(1);
    expect($timelines->first()->action)->toBe('application_submitted');
});

test('shelter staff marking suitable transitions application to mao_audit and logs timeline', function () {
    $adopter = createTestOnboardedAdopter();
    $staff = createTestStaff('shelter_staff');
    $shelter = Shelter::factory()->create();
    $pet = Pet::factory()->create(['shelter_id' => $shelter->id, 'status' => 'available']);

    $application = Application::create([
        'user_id' => $adopter->id,
        'pet_id' => $pet->id,
        'dss_score' => 88.0,
        'status' => 'pending',
        'submitted_at' => now(),
    ]);

    $response = $this->actingAs($staff)->patch(route('shelter.applications.update', $application->id), [
        'decision' => 'suitable',
        'notes' => 'Great home environment and reliable adopter.',
    ]);

    $response->assertRedirect(route('shelter.applications.index'));

    $application->refresh();
    expect($application->status)->toBe('mao_audit');
    expect($application->staff_decision)->toBe('suitable');
    expect($application->staff_id)->toBe($staff->id);

    $timelines = $application->timelines;
    expect($timelines->pluck('action'))->toContain('shelter_marked_suitable');
});

test('mao officer approval issues adoption certificate, sets 7-day pickup and marks pet adopted', function () {
    $adopter = createTestOnboardedAdopter();
    $maoOfficer = createTestStaff('mao_officer');
    $shelter = Shelter::factory()->create();
    $pet = Pet::factory()->create(['shelter_id' => $shelter->id, 'status' => 'available']);

    $application = Application::create([
        'user_id' => $adopter->id,
        'pet_id' => $pet->id,
        'dss_score' => 90.0,
        'status' => 'mao_audit',
        'submitted_at' => now(),
    ]);

    $checklist = [
        'identity_verified' => true,
        'dss_score_acceptable' => true,
        'staff_recommendation' => true,
        'housing_appropriate' => true,
        'no_red_flags' => true,
    ];

    $response = $this->actingAs($maoOfficer)->patch(route('mao.applications.update', $application->id), [
        'decision' => 'approved',
        'remarks' => 'Applicant complies with all RA 8485 guidelines.',
        'checklist' => $checklist,
    ]);

    $response->assertRedirect(route('mao.applications.index'));

    $application->refresh();
    $pet->refresh();

    expect($application->status)->toBe('approved');
    expect($application->certificate_number)->not->toBeNull();
    expect($application->certificate_number)->toContain('CERT-MAO-');
    expect($application->pickup_deadline_at)->not->toBeNull();
    expect($pet->status)->toBe('adopted');

    $timelines = $application->timelines;
    expect($timelines->pluck('action'))->toContain('mao_approved');
});

test('mao officer rejection releases pet back to available and logs disapproval', function () {
    $adopter = createTestOnboardedAdopter();
    $maoOfficer = createTestStaff('mao_officer');
    $shelter = Shelter::factory()->create();
    $pet = Pet::factory()->create(['shelter_id' => $shelter->id, 'status' => 'available']);

    $application = Application::create([
        'user_id' => $adopter->id,
        'pet_id' => $pet->id,
        'dss_score' => 50.0,
        'status' => 'mao_audit',
        'submitted_at' => now(),
    ]);

    $checklist = [
        'identity_verified' => true,
        'dss_score_acceptable' => false,
        'staff_recommendation' => true,
        'housing_appropriate' => false,
        'no_red_flags' => true,
    ];

    $response = $this->actingAs($maoOfficer)->patch(route('mao.applications.update', $application->id), [
        'decision' => 'rejected',
        'remarks' => 'Space constraints violate minimum municipal pet housing standards.',
        'checklist' => $checklist,
    ]);

    $response->assertRedirect(route('mao.applications.index'));

    $application->refresh();
    $pet->refresh();

    expect($application->status)->toBe('rejected');
    expect($pet->status)->toBe('available');

    $timelines = $application->timelines;
    expect($timelines->pluck('action'))->toContain('mao_rejected');
});
