<?php

use App\Models\Application;
use App\Models\Pet;
use App\Models\Shelter;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

beforeEach(function (): void {
    $this->artisan('db:seed', ['--class' => 'RolesAndPermissionsSeeder']);
    $this->artisan('db:seed', ['--class' => 'SystemSettingsSeeder']);

    $this->shelter = Shelter::factory()->create();
    $this->pet = Pet::factory()->create([
        'shelter_id' => $this->shelter->id,
        'status' => 'available',
    ]);

    $this->adopter = User::factory()->create([
        'password' => Hash::make('password'),
    ]);
    $this->adopter->assignRole('adopter');

    $this->adopter->adopterProfile()->create([
        'full_name' => 'Test Adopter',
        'contact_number' => '09123456789',
        'date_of_birth' => '1995-01-01',
        'home_address' => 'Virac, Catanduanes',
        'valid_id_type' => 'Passport',
        'valid_id_number' => 'P1234567A',
        'adoption_reason' => 'companionship',
        'is_identity_verified' => true,
        'profile_completed_at' => now(),
    ]);

    $this->adopter->lifestyleProfile()->create([
        'housing_type' => 'house_with_yard',
        'has_aircon' => 'stable',
        'outdoor_access' => 'fully_fenced',
        'activity_level' => 'moderate',
        'work_schedule' => 'wfh',
        'household_size' => 2,
        'household_agrees' => true,
        'has_children' => 'none',
        'other_pets' => 'none',
        'monthly_income' => '40001_60000',
        'pet_experience' => 'first_time',
        'submitted_at' => now(),
    ]);

    $this->mao = User::factory()->create();
    $this->mao->assignRole('mao_staff');

    $this->admin = User::factory()->create();
    $this->admin->assignRole('admin');

    $this->shelterStaff = User::factory()->create();
    $this->shelterStaff->assignRole('shelter_staff');
});

test('adopter cannot apply for a new pet within 3 months of completed adoption', function (): void {
    // Simulate completed adoption 1 month ago
    Application::factory()->create([
        'user_id' => $this->adopter->id,
        'pet_id' => Pet::factory()->create(['shelter_id' => $this->shelter->id, 'status' => 'adopted'])->id,
        'status' => 'completed',
        'released_at' => now()->subMonth(),
    ]);

    $response = $this->actingAs($this->adopter)->post(route('application.store'), [
        'pet_id' => $this->pet->id,
    ]);

    $response->assertRedirect(route('application.show'));
    $this->assertDatabaseMissing('applications', [
        'user_id' => $this->adopter->id,
        'pet_id' => $this->pet->id,
    ]);
});

test('adopter can apply for a pet after the 3-month cooldown period has elapsed', function (): void {
    // Simulate completed adoption 4 months ago
    Application::factory()->create([
        'user_id' => $this->adopter->id,
        'pet_id' => Pet::factory()->create(['shelter_id' => $this->shelter->id, 'status' => 'adopted'])->id,
        'status' => 'completed',
        'released_at' => now()->subMonths(4),
    ]);

    $response = $this->actingAs($this->adopter)->post(route('application.store'), [
        'pet_id' => $this->pet->id,
    ]);

    $response->assertRedirect(route('application.show'));
    $this->assertDatabaseHas('applications', [
        'user_id' => $this->adopter->id,
        'pet_id' => $this->pet->id,
        'status' => 'pending',
    ]);
});

test('pass print counter increments and records timeline event', function (): void {
    $application = Application::factory()->create([
        'user_id' => $this->adopter->id,
        'pet_id' => $this->pet->id,
        'status' => 'approved',
        'pass_print_count' => 0,
    ]);

    // First print by MAO officer
    $response = $this->actingAs($this->mao)->postJson(route('applications.record-pass-print', $application->id));
    $response->assertOk()
        ->assertJson([
            'success' => true,
            'pass_print_count' => 1,
        ]);

    $application->refresh();
    expect($application->pass_print_count)->toBe(1);

    // Second print by Admin
    $response2 = $this->actingAs($this->admin)->postJson(route('applications.record-pass-print', $application->id));
    $response2->assertOk()
        ->assertJson([
            'success' => true,
            'pass_print_count' => 2,
        ]);

    $application->refresh();
    expect($application->pass_print_count)->toBe(2);
});

test('certificate print counter increments and records timeline event', function (): void {
    $application = Application::factory()->create([
        'user_id' => $this->adopter->id,
        'pet_id' => $this->pet->id,
        'status' => 'approved',
        'certificate_print_count' => 0,
    ]);

    // First print by MAO officer
    $response = $this->actingAs($this->mao)->postJson(route('applications.record-certificate-print', $application->id));
    $response->assertOk()
        ->assertJson([
            'success' => true,
            'certificate_print_count' => 1,
        ]);

    $application->refresh();
    expect($application->certificate_print_count)->toBe(1);

    // Second print by Admin
    $response2 = $this->actingAs($this->admin)->postJson(route('applications.record-certificate-print', $application->id));
    $response2->assertOk()
        ->assertJson([
            'success' => true,
            'certificate_print_count' => 2,
        ]);

    $application->refresh();
    expect($application->certificate_print_count)->toBe(2);
});

test('admin and mao staff can update certificate signatories configuration up to 4 signatories', function (): void {
    $signatories = [
        [
            'id' => 'sig-1',
            'name' => 'Dr. Jane Smith, DVM',
            'position' => 'Municipal Veterinarian',
            'title' => 'Virac MAO',
            'signature_url' => 'https://res.cloudinary.com/demo/image/upload/sample.png',
            'enabled' => true,
        ],
        [
            'id' => 'sig-2',
            'name' => 'Hon. Samuel Doe',
            'position' => 'Municipal Mayor',
            'title' => 'LGU Virac',
            'signature_url' => '',
            'enabled' => true,
        ],
        [
            'id' => 'sig-3',
            'name' => 'Maria Santos',
            'position' => 'Shelter Manager',
            'title' => 'AHWS Shelter',
            'signature_url' => '',
            'enabled' => false,
        ],
    ];

    $response = $this->actingAs($this->mao)->postJson(route('certificate-signatories.update'), [
        'signatories' => $signatories,
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'signatories' => $signatories,
        ]);

    $stored = SystemSetting::get('certificate_signatories');
    expect($stored)->toBeArray()
        ->and(count($stored))->toBe(3)
        ->and($stored[0]['name'])->toBe('Dr. Jane Smith, DVM')
        ->and($stored[2]['enabled'])->toBeFalse();
});

test('shelter staff cannot update certificate signatories', function (): void {
    $response = $this->actingAs($this->shelterStaff)->postJson(route('certificate-signatories.update'), [
        'signatories' => [
            [
                'id' => 'sig-1',
                'name' => 'Unauthorized Staff',
                'position' => 'Staff',
                'title' => 'Virac Shelter',
                'signature_url' => '',
                'enabled' => true,
            ],
        ],
    ]);

    $response->assertForbidden();
});

test('admin can delete a signature image via delete-signature endpoint', function (): void {
    $response = $this->actingAs($this->admin)->postJson(route('certificate-signatories.delete-signature'), [
        'signature_url' => 'https://res.cloudinary.com/demo/image/upload/sample_sig.png',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
        ]);
});

test('updating signatories cleans up removed signatures', function (): void {
    SystemSetting::set('certificate_signatories', [
        [
            'id' => 'sig-1',
            'name' => 'Dr. Jane Smith',
            'position' => 'Veterinarian',
            'title' => 'Virac MAO',
            'signature_url' => 'https://res.cloudinary.com/demo/image/upload/old_sig.png',
            'enabled' => true,
        ],
    ]);

    // Update with signature cleared
    $response = $this->actingAs($this->admin)->postJson(route('certificate-signatories.update'), [
        'signatories' => [
            [
                'id' => 'sig-1',
                'name' => 'Dr. Jane Smith',
                'position' => 'Veterinarian',
                'title' => 'Virac MAO',
                'signature_url' => '',
                'enabled' => true,
            ],
        ],
    ]);

    $response->assertOk();
    $stored = SystemSetting::get('certificate_signatories');
    expect(empty($stored[0]['signature_url']))->toBeTrue();
});

test('shelter screening requires notes when marking as suitable', function (): void {
    $application = Application::factory()->create([
        'user_id' => $this->adopter->id,
        'pet_id' => $this->pet->id,
        'status' => 'pending',
    ]);

    // Attempt without notes
    $response = $this->actingAs($this->shelterStaff)
        ->patch(route('shelter.applications.update', $application->id), [
            'decision' => 'suitable',
            'notes' => '',
        ]);

    $response->assertSessionHasErrors(['notes']);

    // Attempt with notes
    $successResponse = $this->actingAs($this->shelterStaff)
        ->patch(route('shelter.applications.update', $application->id), [
            'decision' => 'suitable',
            'notes' => 'Candidate meets all screening criteria.',
        ]);

    $successResponse->assertSessionHasNoErrors();
    $this->assertDatabaseHas('applications', [
        'id' => $application->id,
        'status' => 'mao_audit',
        'staff_decision' => 'suitable',
        'staff_notes' => 'Candidate meets all screening criteria.',
    ]);
});

test('shelter screening does not require notes when marking as not suitable', function (): void {
    $application = Application::factory()->create([
        'user_id' => $this->adopter->id,
        'pet_id' => $this->pet->id,
        'status' => 'pending',
    ]);

    $response = $this->actingAs($this->shelterStaff)
        ->patch(route('shelter.applications.update', $application->id), [
            'decision' => 'not_suitable',
            'notes' => '',
        ]);

    $response->assertSessionHasNoErrors();
    $this->assertDatabaseHas('applications', [
        'id' => $application->id,
        'status' => 'rejected',
        'staff_decision' => 'not_suitable',
    ]);
});

test('mao audit requires remarks when approving application', function (): void {
    $application = Application::factory()->create([
        'user_id' => $this->adopter->id,
        'pet_id' => $this->pet->id,
        'status' => 'mao_audit',
    ]);

    // Attempt without remarks
    $response = $this->actingAs($this->mao)
        ->patch(route('mao.applications.update', $application->id), [
            'decision' => 'approved',
            'remarks' => '',
            'checklist' => [
                'identity_verified' => true,
                'dss_score_acceptable' => true,
                'staff_recommendation' => true,
                'housing_appropriate' => true,
                'no_red_flags' => true,
            ],
        ]);

    $response->assertSessionHasErrors(['remarks']);

    // Attempt with remarks
    $successResponse = $this->actingAs($this->mao)
        ->patch(route('mao.applications.update', $application->id), [
            'decision' => 'approved',
            'remarks' => 'All statutory compliance points verified.',
            'checklist' => [
                'identity_verified' => true,
                'dss_score_acceptable' => true,
                'staff_recommendation' => true,
                'housing_appropriate' => true,
                'no_red_flags' => true,
            ],
        ]);

    $successResponse->assertSessionHasNoErrors();
    $this->assertDatabaseHas('applications', [
        'id' => $application->id,
        'status' => 'approved',
        'mao_decision' => 'approved',
        'mao_remarks' => 'All statutory compliance points verified.',
    ]);
});

test('admin application update requires notes when endorsing as suitable', function (): void {
    $application = Application::factory()->create([
        'user_id' => $this->adopter->id,
        'pet_id' => $this->pet->id,
        'status' => 'pending',
    ]);

    $response = $this->actingAs($this->admin)
        ->patch(route('admin.applications.update', $application->id), [
            'decision' => 'suitable',
            'notes' => '',
        ]);

    $response->assertSessionHasErrors(['notes']);
});

test('admin mao audit requires remarks when approving application', function (): void {
    $application = Application::factory()->create([
        'user_id' => $this->adopter->id,
        'pet_id' => $this->pet->id,
        'status' => 'mao_audit',
    ]);

    $response = $this->actingAs($this->admin)
        ->post(route('admin.applications.audit', $application->id), [
            'decision' => 'approved',
            'remarks' => '',
            'checklist' => [
                'identity_verified' => true,
            ],
        ]);

    $response->assertSessionHasErrors(['remarks']);
});
