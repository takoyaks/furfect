<?php

use App\Models\AdopterProfile;
use App\Models\Application;
use App\Models\LifestyleProfile;
use App\Models\Pet;
use App\Models\Shelter;
use App\Models\User;
use App\Notifications\ApplicationStatusUpdatedNotification;
use Spatie\Permission\Models\Role;

function createMultiTestAdopter(string $name, string $income = '40001_60000'): User
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
        'surrendered_pet' => false,
        'adoption_reason' => 'Companionship',
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
        'monthly_income' => $income,
        'health_conditions' => [],
        'preferred_type' => 'dog',
        'preferred_gender' => 'none',
        'submitted_at' => now(),
    ]);

    return $user;
}

test('competing applications for 1 pet are displayed in shelter review dossier', function () {
    Role::firstOrCreate(['name' => 'shelter_staff']);
    $shelter = Shelter::factory()->create();
    $pet = Pet::factory()->create(['shelter_id' => $shelter->id, 'status' => 'available']);

    $adopter1 = createMultiTestAdopter('Applicant Alpha');
    $adopter2 = createMultiTestAdopter('Applicant Beta');

    $app1 = Application::create([
        'user_id' => $adopter1->id,
        'pet_id' => $pet->id,
        'dss_score' => 92.0,
        'status' => 'pending',
        'submitted_at' => now()->subHours(2),
    ]);

    $app2 = Application::create([
        'user_id' => $adopter2->id,
        'pet_id' => $pet->id,
        'dss_score' => 84.0,
        'status' => 'pending',
        'submitted_at' => now()->subHour(),
    ]);

    $staff = User::factory()->create();
    $staff->assignRole('shelter_staff');

    $response = $this->actingAs($staff)->get(route('shelter.applications.show', $app1->id));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('shelter/applications/show')
        ->has('competingApplications', 1)
        ->where('competingApplications.0.id', $app2->id)
    );
});

test('when primary application is endorsed to MAO, competing applicant is placed on priority standby', function () {
    Role::firstOrCreate(['name' => 'shelter_staff']);
    $shelter = Shelter::factory()->create();
    $pet = Pet::factory()->create(['shelter_id' => $shelter->id, 'status' => 'available']);

    $adopter1 = createMultiTestAdopter('Primary Candidate');
    $adopter2 = createMultiTestAdopter('Secondary Candidate');

    $app1 = Application::create([
        'user_id' => $adopter1->id,
        'pet_id' => $pet->id,
        'dss_score' => 95.0,
        'status' => 'pending',
        'submitted_at' => now()->subHours(3),
    ]);

    $app2 = Application::create([
        'user_id' => $adopter2->id,
        'pet_id' => $pet->id,
        'dss_score' => 80.0,
        'status' => 'pending',
        'submitted_at' => now()->subHours(2),
    ]);

    $staff = User::factory()->create();
    $staff->assignRole('shelter_staff');

    // Endorse primary applicant to MAO
    $this->actingAs($staff)->patch(route('shelter.applications.update', $app1->id), [
        'decision' => 'suitable',
        'notes' => 'Top candidate endorsed to MAO.',
    ]);

    $app1->refresh();
    $app2->refresh();

    expect($app1->status)->toBe('mao_audit');
    expect($app2->status)->toBe('pending');

    // Verify standby timeline event logged on secondary applicant
    $hasStandbyTimeline = $app2->timelines()->where('action', 'competing_standby')->exists();
    expect($hasStandbyTimeline)->toBeTrue();
});

test('when MAO approves primary candidate, competing applicant is gracefully resolved and offered alternative pet recommendations', function () {
    Role::firstOrCreate(['name' => 'mao_officer']);
    Role::firstOrCreate(['name' => 'admin']);
    $shelter = Shelter::factory()->create();
    $pet = Pet::factory()->create(['shelter_id' => $shelter->id, 'status' => 'available']);
    $alternativePet = Pet::factory()->create(['shelter_id' => $shelter->id, 'status' => 'available', 'name' => 'Friendly Buddy']);

    $adopter1 = createMultiTestAdopter('Adopted Candidate');
    $adopter2 = createMultiTestAdopter('Waiting Candidate');

    $app1 = Application::create([
        'user_id' => $adopter1->id,
        'pet_id' => $pet->id,
        'dss_score' => 95.0,
        'status' => 'mao_audit',
        'submitted_at' => now()->subHours(5),
    ]);

    $app2 = Application::create([
        'user_id' => $adopter2->id,
        'pet_id' => $pet->id,
        'dss_score' => 82.0,
        'status' => 'pending',
        'submitted_at' => now()->subHours(4),
    ]);

    $mao = User::factory()->create();
    $mao->assignRole('mao_officer');

    $this->actingAs($mao)->patch(route('mao.applications.update', $app1->id), [
        'decision' => 'approved',
        'remarks' => 'Statutory audit passed under RA 8485.',
        'checklist' => [
            'identity_verified' => true,
            'dss_score_acceptable' => true,
            'staff_recommendation' => true,
            'housing_appropriate' => true,
            'no_red_flags' => true,
        ],
    ]);

    $app1->refresh();
    $app2->refresh();
    $pet->refresh();

    expect($app1->status)->toBe('approved');
    expect($pet->status)->toBe('adopted');
    expect($app2->status)->toBe('rejected');

    // Verify secondary applicant has resolution timeline
    $hasResolvedTimeline = $app2->timelines()->where('action', 'adopted_by_other_candidate')->exists();
    expect($hasResolvedTimeline)->toBeTrue();

    // Verify application status page renders recommendations for adopter 2
    $response = $this->actingAs($adopter2)->get(route('application.show'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('application/status')
        ->has('recommendedPets')
    );
});

test('adopter can 1-click transfer application to a recommended alternative pet', function () {
    $shelter = Shelter::factory()->create();
    $altPet = Pet::factory()->create(['shelter_id' => $shelter->id, 'status' => 'available', 'name' => 'Daisy']);

    $adopter = createMultiTestAdopter('Transfer Applicant');

    $response = $this->actingAs($adopter)->post(route('application.transfer'), [
        'pet_id' => $altPet->id,
    ]);

    $response->assertRedirect(route('application.show'));

    $newApp = Application::where('user_id', $adopter->id)->where('pet_id', $altPet->id)->first();
    expect($newApp)->not->toBeNull();
    expect($newApp->status)->toBe('pending');
    expect($newApp->dss_score)->toBeGreaterThan(0);
});

test('when MAO rejects primary candidate, top waitlisted applicant is automatically promoted to active review queue', function () {
    Role::firstOrCreate(['name' => 'mao_officer']);
    Role::firstOrCreate(['name' => 'admin']);
    Role::firstOrCreate(['name' => 'shelter_staff']);
    $shelter = Shelter::factory()->create();
    $pet = Pet::factory()->create(['shelter_id' => $shelter->id, 'status' => 'available']);

    $adopter1 = createMultiTestAdopter('Failed Candidate');
    $adopter2 = createMultiTestAdopter('Promoted Candidate');

    $app1 = Application::create([
        'user_id' => $adopter1->id,
        'pet_id' => $pet->id,
        'dss_score' => 90.0,
        'status' => 'mao_audit',
        'submitted_at' => now()->subHours(6),
    ]);

    $app2 = Application::create([
        'user_id' => $adopter2->id,
        'pet_id' => $pet->id,
        'dss_score' => 88.0,
        'status' => 'pending',
        'submitted_at' => now()->subHours(5),
    ]);

    $mao = User::factory()->create();
    $mao->assignRole('mao_officer');

    $this->actingAs($mao)->patch(route('mao.applications.update', $app1->id), [
        'decision' => 'rejected',
        'remarks' => 'Failed fencing verification.',
        'checklist' => [
            'identity_verified' => true,
            'dss_score_acceptable' => false,
            'staff_recommendation' => false,
            'housing_appropriate' => false,
            'no_red_flags' => false,
        ],
    ]);

    $app1->refresh();
    $app2->refresh();
    $pet->refresh();

    expect($app1->status)->toBe('rejected');
    expect($pet->status)->toBe('available');
    expect($app2->status)->toBe('pending');

    // Verify promotion timeline event
    $hasPromotionTimeline = $app2->timelines()->where('action', 'promoted_from_waitlist')->exists();
    expect($hasPromotionTimeline)->toBeTrue();
});

test('adopter can voluntarily withdraw an active or standby application', function () {
    $shelter = Shelter::factory()->create();
    $pet = Pet::factory()->create(['shelter_id' => $shelter->id, 'status' => 'available']);

    $adopter = createMultiTestAdopter('Voluntary Withdrawer');

    $app = Application::create([
        'user_id' => $adopter->id,
        'pet_id' => $pet->id,
        'dss_score' => 88.0,
        'status' => 'pending',
        'submitted_at' => now()->subHour(),
    ]);

    $response = $this->actingAs($adopter)->post(route('application.withdraw'));
    $response->assertRedirect(route('pets.index'));

    $app->refresh();
    expect($app->status)->toBe('rejected');
    expect($app->staff_notes)->toContain('Voluntarily withdrawn');
});

test('notifications list is shared in Inertia props for instant dropdown view', function () {
    $shelter = Shelter::factory()->create();
    $pet = Pet::factory()->create(['shelter_id' => $shelter->id, 'status' => 'available']);

    $adopter = createMultiTestAdopter('Notify Receiver');

    $app = Application::create([
        'user_id' => $adopter->id,
        'pet_id' => $pet->id,
        'dss_score' => 90.0,
        'status' => 'pending',
        'submitted_at' => now(),
    ]);

    $adopter->notify(new ApplicationStatusUpdatedNotification($app, 'submitted_adopter'));

    $response = $this->actingAs($adopter)->get(route('application.show'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('notifications.list', 1)
        ->where('notifications.unreadCount', 1)
        ->where('notifications.list.0.data.title', "Application Submitted for {$pet->name}")
    );
});
