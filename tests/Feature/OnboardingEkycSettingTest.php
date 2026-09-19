<?php

use App\Models\SystemSetting;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'adopter']);
    Role::firstOrCreate(['name' => 'admin']);
});

test('admin can toggle ekyc_enabled setting in system settings', function () {
    $admin = User::factory()->create(['email_verified_at' => now()]);
    $admin->assignRole('admin');

    SystemSetting::set('ekyc_enabled', '1');
    expect(SystemSetting::get('ekyc_enabled'))->toBeTrue();

    // Disable eKYC
    $response = $this->actingAs($admin)->patch(route('admin.settings.update'), [
        'ekyc_enabled' => '0',
    ]);

    $response->assertRedirect();
    expect(SystemSetting::get('ekyc_enabled'))->toBeFalse();

    // Re-enable eKYC
    $response = $this->actingAs($admin)->patch(route('admin.settings.update'), [
        'ekyc_enabled' => '1',
    ]);

    $response->assertRedirect();
    expect(SystemSetting::get('ekyc_enabled'))->toBeTrue();
});

test('when ekyc is enabled, unverified adopter is forced to complete ekyc step first', function () {
    SystemSetting::set('ekyc_enabled', '1');

    $adopter = User::factory()->create(['email_verified_at' => now()]);
    $adopter->assignRole('adopter');

    // Accessing personal info directly redirects to eKYC
    $response = $this->actingAs($adopter)->get(route('onboarding.personal.edit'));
    $response->assertRedirect(route('onboarding.ekyc.show'));

    // Accessing dashboard redirects to eKYC
    $dashboardResponse = $this->actingAs($adopter)->get(route('dashboard'));
    $dashboardResponse->assertRedirect(route('onboarding.ekyc.show'));

    // Submitting personal info without eKYC fails
    $postResponse = $this->actingAs($adopter)->post(route('onboarding.personal.store'), [
        'full_name' => 'Juan Dela Cruz',
        'contact_number' => '09123456789',
        'date_of_birth' => '1995-01-01',
        'home_address' => 'General Santos City',
        'valid_id_type' => 'Philippine Passport',
        'valid_id_number' => 'P1234567A',
        'had_pets_before' => 'never',
        'surrendered_pet' => 0,
        'adoption_reason' => 'Companionship',
        'adoption_reason_text' => 'I love pets',
        'pet_stay' => 'inside',
        'terms_read' => 1,
        'info_confirmed' => 1,
    ]);
    $postResponse->assertRedirect(route('onboarding.ekyc.show'));
});

test('when ekyc is disabled, adopter can bypass ekyc and complete onboarding directly', function () {
    SystemSetting::set('ekyc_enabled', '0');

    $adopter = User::factory()->create(['email_verified_at' => now()]);
    $adopter->assignRole('adopter');

    // Accessing eKYC page automatically forwards to personal info
    $ekycResponse = $this->actingAs($adopter)->get(route('onboarding.ekyc.show'));
    $ekycResponse->assertRedirect(route('onboarding.personal.edit'));

    // Adopter can view personal info page directly
    $personalResponse = $this->actingAs($adopter)->get(route('onboarding.personal.edit'));
    $personalResponse->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('onboarding/personal-info')
            ->where('ekycEnabled', false)
        );

    // Adopter can submit personal info directly without eKYC
    $postResponse = $this->actingAs($adopter)->post(route('onboarding.personal.store'), [
        'full_name' => 'Juan Dela Cruz',
        'contact_number' => '09123456789',
        'date_of_birth' => '1995-01-01',
        'home_address' => 'General Santos City',
        'valid_id_type' => 'Philippine Passport',
        'valid_id_number' => 'P1234567A',
        'had_pets_before' => 'never',
        'surrendered_pet' => 0,
        'adoption_reason' => 'Companionship',
        'adoption_reason_text' => 'I love pets',
        'pet_stay' => 'inside',
        'terms_read' => 1,
        'info_confirmed' => 1,
    ]);
    $postResponse->assertRedirect(route('onboarding.lifestyle.edit'));

    // Submit lifestyle profile
    $lifestyleResponse = $this->actingAs($adopter->fresh())->post(route('onboarding.lifestyle.store'), [
        'housing_type' => 'house_with_yard',
        'has_aircon' => 'stable',
        'outdoor_access' => 'fully_fenced',
        'activity_level' => 'moderate',
        'work_schedule' => 'wfh',
        'household_size' => 2,
        'household_agrees' => 1,
        'has_children' => 'none',
        'other_pets' => 'none',
        'monthly_income' => '40001_60000',
        'pet_experience' => 'first_time',
        'preferred_type' => 'dog',
        'preferred_gender' => 'male',
    ]);
    $lifestyleResponse->assertRedirect(route('matches.index'));

    // Confirm adopter has completed onboarding
    expect($adopter->fresh()->hasCompletedOnboarding())->toBeTrue();
});
