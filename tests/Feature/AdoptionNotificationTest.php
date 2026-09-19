<?php

use App\Models\AdopterProfile;
use App\Models\Application;
use App\Models\LifestyleProfile;
use App\Models\Pet;
use App\Models\Shelter;
use App\Models\User;
use App\Notifications\ApplicationStatusUpdatedNotification;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;

function createNotificationAdopter(): User
{
    Role::firstOrCreate(['name' => 'adopter']);
    $user = User::factory()->create();
    $user->assignRole('adopter');

    AdopterProfile::create([
        'user_id' => $user->id,
        'full_name' => 'Jane Adopter',
        'contact_number' => '09123456789',
        'date_of_birth' => '1996-03-20',
        'home_address' => 'Virac, Catanduanes',
        'valid_id_type' => 'Driver License',
        'valid_id_number' => 'N01-12-345678',
        'had_pets_before' => 'had_before',
        'surrendered_pet' => false,
        'adoption_reason' => 'Companionship',
        'adoption_reason_text' => 'Loving home for a shelter dog.',
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

function createStaffUser(string $role): User
{
    Role::firstOrCreate(['name' => $role]);
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

test('application submission notifies adopter and shelter staff', function () {
    Notification::fake();

    $adopter = createNotificationAdopter();
    $staff = createStaffUser('shelter_staff');
    $shelter = Shelter::factory()->create();
    $pet = Pet::factory()->create(['shelter_id' => $shelter->id, 'status' => 'available']);

    $response = $this->actingAs($adopter)->post(route('application.store'), [
        'pet_id' => $pet->id,
    ]);

    $response->assertRedirect(route('application.show'));

    Notification::assertSentTo(
        $adopter,
        ApplicationStatusUpdatedNotification::class,
        fn ($n) => $n->event === 'submitted_adopter'
    );

    Notification::assertSentTo(
        $staff,
        ApplicationStatusUpdatedNotification::class,
        fn ($n) => $n->event === 'submitted_staff'
    );
});

test('shelter staff endorsement notifies adopter and mao officers', function () {
    Notification::fake();

    $adopter = createNotificationAdopter();
    $staff = createStaffUser('shelter_staff');
    $maoOfficer = createStaffUser('mao_officer');
    $shelter = Shelter::factory()->create();
    $pet = Pet::factory()->create(['shelter_id' => $shelter->id, 'status' => 'available']);

    $application = Application::create([
        'user_id' => $adopter->id,
        'pet_id' => $pet->id,
        'dss_score' => 92.0,
        'status' => 'pending',
        'submitted_at' => now(),
    ]);

    $response = $this->actingAs($staff)->patch(route('shelter.applications.update', $application->id), [
        'decision' => 'suitable',
        'notes' => 'Great applicant and safe environment.',
    ]);

    $response->assertRedirect(route('shelter.applications.index'));

    Notification::assertSentTo(
        $adopter,
        ApplicationStatusUpdatedNotification::class,
        fn ($n) => $n->event === 'shelter_endorsed_adopter'
    );

    Notification::assertSentTo(
        $maoOfficer,
        ApplicationStatusUpdatedNotification::class,
        fn ($n) => $n->event === 'mao_audit_pending'
    );
});

test('mao officer approval notifies adopter with certificate and shelter staff', function () {
    Notification::fake();

    $adopter = createNotificationAdopter();
    $staff = createStaffUser('shelter_staff');
    $maoOfficer = createStaffUser('mao_officer');
    $shelter = Shelter::factory()->create();
    $pet = Pet::factory()->create(['shelter_id' => $shelter->id, 'status' => 'available']);

    $application = Application::create([
        'user_id' => $adopter->id,
        'pet_id' => $pet->id,
        'dss_score' => 92.0,
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
        'remarks' => 'Applicant complies with all municipal animal welfare guidelines.',
        'checklist' => $checklist,
    ]);

    $response->assertRedirect(route('mao.applications.index'));

    Notification::assertSentTo(
        $adopter,
        ApplicationStatusUpdatedNotification::class,
        fn ($n) => $n->event === 'mao_approved_adopter'
    );

    Notification::assertSentTo(
        $staff,
        ApplicationStatusUpdatedNotification::class,
        fn ($n) => $n->event === 'mao_approved_staff'
    );
});

test('notification center api lists, marks read and marks all read', function () {
    $adopter = createNotificationAdopter();
    $shelter = Shelter::factory()->create();
    $pet = Pet::factory()->create(['shelter_id' => $shelter->id, 'status' => 'available']);

    $application = Application::create([
        'user_id' => $adopter->id,
        'pet_id' => $pet->id,
        'dss_score' => 85.0,
        'status' => 'pending',
        'submitted_at' => now(),
    ]);

    // Send real database notification
    $adopter->notify(new ApplicationStatusUpdatedNotification($application, 'submitted_adopter'));

    expect($adopter->unreadNotifications()->count())->toBe(1);

    // List notifications API
    $response = $this->actingAs($adopter)->getJson(route('notifications.index'));
    $response->assertOk()
        ->assertJsonStructure([
            'notifications' => [
                '*' => ['id', 'data', 'read_at', 'created_at', 'created_at_iso'],
            ],
            'unread_count',
        ])
        ->assertJsonPath('unread_count', 1);

    $notificationId = $response->json('notifications.0.id');

    // Mark specific notification as read
    $markResponse = $this->actingAs($adopter)->postJson(route('notifications.read', $notificationId));
    $markResponse->assertOk()->assertJson(['success' => true]);

    $adopter->refresh();
    expect($adopter->unreadNotifications()->count())->toBe(0);

    // Create another notification and test mark all as read
    $adopter->notify(new ApplicationStatusUpdatedNotification($application, 'shelter_endorsed_adopter'));
    expect($adopter->unreadNotifications()->count())->toBe(1);

    $markAllResponse = $this->actingAs($adopter)->postJson(route('notifications.read-all'));
    $markAllResponse->assertOk()->assertJson(['success' => true]);

    $adopter->refresh();
    expect($adopter->unreadNotifications()->count())->toBe(0);
});
