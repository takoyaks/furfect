<?php

use App\Models\AdopterProfile;
use App\Models\DiditVerification;
use App\Models\User;
use App\Services\DiditVerificationService;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

beforeEach(function (): void {
    Role::firstOrCreate(['name' => 'adopter']);
    Role::firstOrCreate(['name' => 'shelter_staff']);
    Role::firstOrCreate(['name' => 'mao_officer']);
    Role::firstOrCreate(['name' => 'admin']);
    $this->artisan('db:seed', ['--class' => 'SystemSettingsSeeder']);
});

test('adopter can initialize an automated identity verification session', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('adopter');

    Http::fake([
        'https://verification.didit.me/v3/session/' => Http::response([
            'session_id' => 'test-session-uuid-1234',
            'session_token' => 'tok_abc123',
            'url' => 'https://verify.didit.me/session/tok_abc123',
            'status' => 'Not Started',
            'workflow_id' => '1b25598a-4af1-416a-8dc4-a95c03159b98',
        ], 201),
    ]);

    $response = $this->actingAs($user)->postJson(route('identity.verification.session'), [
        'return_to' => 'onboarding',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'session_id' => 'test-session-uuid-1234',
            'session_token' => 'tok_abc123',
            'url' => 'https://verify.didit.me/session/tok_abc123',
        ]);

    $verification = DiditVerification::where('session_id', 'test-session-uuid-1234')->first();
    expect($verification)->not->toBeNull();
    expect($verification->user_id)->toBe($user->id);
    expect($verification->status)->toBe('pending');
});

test('session creation returns error when external credits are exhausted', function () {
    $user = User::factory()->create(['name' => 'Kerbie Test', 'email_verified_at' => now()]);
    $user->assignRole('adopter');

    Http::fake([
        'https://verification.didit.me/v3/session/' => Http::response([
            'detail' => 'You don\'t have enough credits to perform this request. Please top up at https://business.didit.me',
        ], 400),
    ]);

    $response = $this->actingAs($user)->postJson(route('identity.verification.session'), [
        'return_to' => 'onboarding',
    ]);

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
        ]);
});

test('session creation gracefully falls back to mock sandbox in testing when api key is not set', function () {
    config(['services.didit.api_key' => '']);

    $user = User::factory()->create(['name' => 'Mock User', 'email_verified_at' => now()]);
    $user->assignRole('adopter');

    $response = $this->actingAs($user)->postJson(route('identity.verification.session'), [
        'return_to' => 'onboarding',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
        ]);

    $verification = $user->latestDiditVerification;
    expect($verification)->not->toBeNull();
    expect($verification->session_id)->toStartWith('mock_');

    $callbackResponse = $this->actingAs($user)->get(route('identity.verification.callback', [
        'session_id' => $verification->session_id,
        'return_to' => 'onboarding',
    ]));

    $callbackResponse->assertRedirect(route('onboarding.personal.edit'));
    expect($user->fresh()->isIdentityVerified())->toBeTrue();
});

test('webhook processes approved ID verification, passive liveness, and 1:1 face match', function () {
    $user = User::factory()->create([
        'name' => 'Maria Santos',
        'email_verified_at' => now(),
    ]);
    $user->assignRole('adopter');

    $verification = DiditVerification::create([
        'user_id' => $user->id,
        'session_id' => 'sess_approved_5678',
        'status' => 'pending',
    ]);

    $webhookPayload = [
        'session_id' => 'sess_approved_5678',
        'vendor_data' => "furfect_user_{$user->id}",
        'status' => 'Approved',
        'ocr' => [
            'status' => 'approved',
            'document_type' => 'Philippine Identification (PhilID / ePhilID)',
            'document_number' => '1234-5678-9012-3456',
            'full_name' => 'Maria Santos',
            'date_of_birth' => '1995-08-20',
            'address' => 'Barangay Lagao, General Santos City',
            'issuing_country' => 'PH',
        ],
        'liveness' => [
            'status' => 'passed',
            'score' => 99.5,
        ],
        'face_match' => [
            'status' => 'matched',
            'score' => 98.4,
        ],
    ];

    $response = $this->postJson(route('identity.verification.webhook'), $webhookPayload);

    $response->assertOk()
        ->assertJson(['status' => 'success']);

    $verification->refresh();
    expect($verification->status)->toBe('approved');
    expect($verification->isApproved())->toBeTrue();
    expect($verification->isLivenessPassed())->toBeTrue();
    expect($verification->isFaceMatched())->toBeTrue();
    expect($verification->face_match_score)->toBe(98.4);
    expect($verification->liveness_score)->toBe(99.5);

    $profile = $user->fresh()->adopterProfile;
    expect($profile)->not->toBeNull();
    expect($profile->is_identity_verified)->toBeTrue();
    expect($profile->liveness_verified)->toBeTrue();
    expect($profile->face_match_score)->toBe(98.4);
    expect($profile->valid_id_number)->toBe('1234-5678-9012-3456');
    expect($profile->valid_id_type)->toBe('Philippine Identification (PhilID / ePhilID)');
});

test('webhook rejects invalid signature when webhook secret is configured', function () {
    Config::set('services.didit.webhook_secret', 'super_secret_webhook_key');

    $payload = [
        'session_id' => 'test-fake-session',
        'status' => 'Approved',
    ];

    $rawContent = json_encode($payload);
    $fakeSignature = 'invalid_hmac_hash';

    $response = $this->call(
        'POST',
        route('identity.verification.webhook'),
        [],
        [],
        [],
        [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_SIGNATURE_V2' => $fakeSignature,
            'HTTP_X_TIMESTAMP' => time(),
        ],
        $rawContent
    );

    $response->assertStatus(401);
});

test('webhook accepts valid HMAC-SHA256 signature when secret is configured', function () {
    $secret = 'test_webhook_signing_key';
    Config::set('services.didit.webhook_secret', $secret);

    $user = User::factory()->create(['email_verified_at' => now()]);
    $verification = DiditVerification::create([
        'user_id' => $user->id,
        'session_id' => 'sess_signed_123',
        'status' => 'pending',
    ]);

    $payload = [
        'session_id' => 'sess_signed_123',
        'status' => 'Approved',
        'face_match' => ['status' => 'matched', 'score' => 97.0],
        'liveness' => ['status' => 'passed', 'score' => 99.0],
    ];

    $rawContent = json_encode($payload);
    $timestamp = time();
    $signature = hash_hmac('sha256', $rawContent, $secret);

    $response = $this->call(
        'POST',
        route('identity.verification.webhook'),
        [],
        [],
        [],
        [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_SIGNATURE_V2' => $signature,
            'HTTP_X_TIMESTAMP' => $timestamp,
        ],
        $rawContent
    );

    $response->assertOk()
        ->assertJson(['status' => 'success']);

    $verification->refresh();
    expect($verification->isApproved())->toBeTrue();
});

test('adopter callback syncs decision and redirects with success toast', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('adopter');

    $verification = DiditVerification::create([
        'user_id' => $user->id,
        'session_id' => 'sess_callback_test',
        'status' => 'pending',
    ]);

    Http::fake([
        'https://verification.didit.me/v3/session/sess_callback_test/decision/' => Http::response([
            'session_id' => 'sess_callback_test',
            'status' => 'Approved',
            'face_match' => ['status' => 'matched', 'score' => 96.0],
            'liveness' => ['status' => 'passed', 'score' => 98.0],
        ], 200),
    ]);

    $response = $this->actingAs($user)->get(route('identity.verification.callback', [
        'session_id' => 'sess_callback_test',
        'return_to' => 'onboarding',
    ]));

    $response->assertRedirect(route('onboarding.personal.edit'));

    $verification->refresh();
    expect($verification->isApproved())->toBeTrue();
    expect($user->fresh()->adopterProfile->is_identity_verified)->toBeTrue();
});

test('status endpoint returns verified identity and biometric scores', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('adopter');

    $profile = AdopterProfile::create([
        'user_id' => $user->id,
        'full_name' => 'Juan Dela Cruz',
        'contact_number' => '09123456789',
        'date_of_birth' => '1992-04-10',
        'home_address' => 'General Santos City',
        'valid_id_type' => 'PhilID',
        'valid_id_number' => '9876-5432-1098-7654',
        'is_identity_verified' => true,
        'liveness_verified' => true,
        'face_match_score' => 99.2,
        'had_pets_before' => 'never',
        'surrendered_pet' => false,
        'adoption_reason' => 'Companionship',
        'adoption_reason_text' => 'Rescue home',
        'pet_stay' => 'inside',
    ]);

    $response = $this->actingAs($user)->getJson(route('identity.verification.status'));

    $response->assertOk()
        ->assertJson([
            'is_verified' => true,
            'liveness_verified' => true,
            'face_match_score' => 99.2,
        ]);
});

test('onboarding ekyc screen can be rendered for authenticated adopter', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('adopter');

    $response = $this->actingAs($user)->get(route('onboarding.ekyc.show'));

    $response->assertOk();
});

test('unauthenticated external redirect to callback restores session from DiditVerification record', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('adopter');

    $verification = DiditVerification::create([
        'user_id' => $user->id,
        'session_id' => 'sess_cross_site_redirect',
        'status' => 'pending',
    ]);

    Http::fake([
        'https://verification.didit.me/v3/session/sess_cross_site_redirect/decision/' => Http::response([
            'session_id' => 'sess_cross_site_redirect',
            'status' => 'Approved',
            'face_match' => ['status' => 'matched', 'score' => 95.0],
            'liveness' => ['status' => 'passed', 'score' => 99.0],
        ], 200),
    ]);

    // Perform request as GUEST (simulating lost session cookie on cross-site redirect)
    $response = $this->get(route('identity.verification.callback', [
        'session_id' => 'sess_cross_site_redirect',
        'return_to' => 'onboarding',
    ]));

    $response->assertRedirect(route('onboarding.personal.edit'));
    $this->assertAuthenticatedAs($user);
    expect($user->fresh()->adopterProfile->is_identity_verified)->toBeTrue();
});

test('verified adopter visiting ekyc screen is automatically redirected to personal info step 2', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('adopter');

    AdopterProfile::create([
        'user_id' => $user->id,
        'full_name' => 'Juan Dela Cruz',
        'contact_number' => '09123456789',
        'date_of_birth' => '1992-04-10',
        'home_address' => 'General Santos City',
        'valid_id_type' => 'PhilID',
        'valid_id_number' => '9876-5432-1098-7654',
        'is_identity_verified' => true,
        'liveness_verified' => true,
        'face_match_score' => 99.0,
        'had_pets_before' => 'never',
        'surrendered_pet' => false,
        'adoption_reason' => 'Companionship',
        'adoption_reason_text' => 'Rescue home',
        'pet_stay' => 'inside',
    ]);

    $response = $this->actingAs($user)->get(route('onboarding.ekyc.show'));

    $response->assertRedirect(route('onboarding.personal.edit'));
});

test('unverified adopter cannot access step 2 personal info and is redirected to ekyc', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('adopter');

    $response = $this->actingAs($user)->get(route('onboarding.personal.edit'));

    $response->assertRedirect(route('onboarding.ekyc.show'));
});

test('unverified adopter cannot access step 3 lifestyle quiz and is redirected to ekyc', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('adopter');

    $response = $this->actingAs($user)->get(route('onboarding.lifestyle.edit'));

    $response->assertRedirect(route('onboarding.ekyc.show'));
});

test('process decision deeply extracts v3 payload details, genuine ID number and encrypts images', function () {
    Storage::fake('local');
    Http::fake([
        'https://example.com/front.jpg' => Http::response('FAKE_FRONT_IMAGE_CONTENT', 200, ['Content-Type' => 'image/jpeg']),
        'https://example.com/back.jpg' => Http::response('FAKE_BACK_IMAGE_CONTENT', 200, ['Content-Type' => 'image/jpeg']),
    ]);

    $user = User::factory()->create(['name' => 'Kerbie Villanueva', 'email_verified_at' => now()]);
    $user->assignRole('adopter');

    $verification = DiditVerification::create([
        'user_id' => $user->id,
        'session_id' => 'sess_deep_v3_test',
        'status' => 'pending',
    ]);

    $v3Payload = [
        'session_id' => 'sess_deep_v3_test',
        'status' => 'Approved',
        'id_verifications' => [
            [
                'document_type' => 'Driver\'s License',
                'document_subtype' => 'DRIVER_LICENSE_GENERIC',
                'document_number' => 'E0623001225',
                'full_name' => 'Kerbie Ramirez Villanueva',
                'first_name' => 'Kerbie Ramirez',
                'last_name' => 'Villanueva',
                'date_of_birth' => '2000-06-28',
                'formatted_address' => 'Angeles Street, Cavinitan, Virac, Catanduanes, Philippines',
                'issuing_state_name' => 'Philippines',
                'front_image' => 'https://example.com/front.jpg',
                'back_image' => 'https://example.com/back.jpg',
            ],
        ],
        'liveness_checks' => [
            [
                'status' => 'Approved',
                'score' => 99.8,
            ],
        ],
        'face_matches' => [
            [
                'status' => 'Approved',
                'score' => 76.52,
            ],
        ],
    ];

    $service = app(DiditVerificationService::class);
    $service->processDecision($v3Payload, 'sess_deep_v3_test');

    $profile = $user->fresh()->adopterProfile;
    expect($profile)->not->toBeNull();
    expect($profile->is_identity_verified)->toBeTrue();
    expect($profile->valid_id_number)->toBe('E0623001225');
    expect($profile->valid_id_type)->toBe('Driver\'s License');
    expect($profile->full_name)->toBe('Kerbie Ramirez Villanueva');
    expect($profile->date_of_birth->format('Y-m-d'))->toBe('2000-06-28');
    expect($profile->home_address)->toBe('Angeles Street, Cavinitan, Virac, Catanduanes, Philippines');
    expect($profile->face_match_score)->toBe(76.52);
    expect($profile->liveness_verified)->toBeTrue();
    expect($profile->hasFrontIdDocument())->toBeTrue();
    expect($profile->hasBackIdDocument())->toBeTrue();

    // Verify encrypted images exist on disk
    Storage::disk('local')->assertExists($profile->id_document_path);
    Storage::disk('local')->assertExists($profile->id_document_back_path);
});
