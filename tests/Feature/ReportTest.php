<?php

use App\Models\Application;
use App\Models\Pet;
use App\Models\Shelter;
use App\Models\User;
use Illuminate\Support\Carbon;

beforeEach(function (): void {
    $this->artisan('db:seed', ['--class' => 'RolesAndPermissionsSeeder']);
    $this->artisan('db:seed', ['--class' => 'SystemSettingsSeeder']);

    $this->admin = User::factory()->create();
    $this->admin->assignRole('admin');

    $this->staff = User::factory()->create();
    $this->staff->assignRole('shelter_staff');

    $this->mao = User::factory()->create();
    $this->mao->assignRole('mao_officer');

    $this->shelterA = Shelter::factory()->create(['name' => 'Virac Central Shelter']);
    $this->shelterB = Shelter::factory()->create(['name' => 'San Andres Rescue']);

    $this->dog = Pet::factory()->create([
        'shelter_id' => $this->shelterA->id,
        'species' => 'dog',
        'name' => 'Brownie Dog',
        'status' => 'available',
    ]);

    $this->cat = Pet::factory()->create([
        'shelter_id' => $this->shelterB->id,
        'species' => 'cat',
        'name' => 'Mimi Cat',
        'status' => 'available',
    ]);

    $this->adopter = User::factory()->create(['name' => 'Juana Dela Cruz', 'email' => 'juana@example.com']);
    $this->adopter->assignRole('adopter');

    // Create 2 applications: one approved for Dog, one rejected for Cat
    $this->app1 = Application::create([
        'user_id' => $this->adopter->id,
        'pet_id' => $this->dog->id,
        'reference_number' => 'APP-TEST-DOG-001',
        'status' => 'approved',
        'dss_score' => 88.5,
        'submitted_at' => Carbon::now()->subDays(2),
        'resolved_at' => Carbon::now()->subDay(),
    ]);

    $this->app2 = Application::create([
        'user_id' => $this->adopter->id,
        'pet_id' => $this->cat->id,
        'reference_number' => 'APP-TEST-CAT-002',
        'status' => 'rejected',
        'dss_score' => 45.0,
        'submitted_at' => Carbon::now()->subDays(5),
        'resolved_at' => Carbon::now()->subDays(4),
    ]);
});

test('admin can access reports index and view computed kpis', function (): void {
    $response = $this->actingAs($this->admin)
        ->get(route('admin.reports.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/reports/index')
        ->has('stats')
        ->where('stats.total_applications', 2)
        ->where('stats.approved_applications', 1)
        ->where('stats.rejected_applications', 1)
        ->where('stats.approval_rate', fn ($rate) => (float) $rate === 50.0)
        ->has('applications.data', 2)
    );
});

test('admin can filter reports by status', function (): void {
    $response = $this->actingAs($this->admin)
        ->get(route('admin.reports.index', ['status' => 'approved']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/reports/index')
        ->where('stats.total_applications', 1)
        ->where('stats.approved_applications', 1)
        ->where('stats.rejected_applications', 0)
        ->has('applications.data', 1)
        ->where('applications.data.0.reference_number', 'APP-TEST-DOG-001')
    );
});

test('admin can filter reports by pet species', function (): void {
    $response = $this->actingAs($this->admin)
        ->get(route('admin.reports.index', ['species' => 'cat']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/reports/index')
        ->where('stats.total_applications', 1)
        ->where('stats.rejected_applications', 1)
        ->has('applications.data', 1)
        ->where('applications.data.0.reference_number', 'APP-TEST-CAT-002')
    );
});

test('admin can filter reports by dss score range', function (): void {
    $response = $this->actingAs($this->admin)
        ->get(route('admin.reports.index', ['score_range' => 'high']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/reports/index')
        ->where('stats.total_applications', 1)
        ->has('applications.data', 1)
        ->where('applications.data.0.reference_number', 'APP-TEST-DOG-001')
    );
});

test('admin can filter reports by search keyword', function (): void {
    $response = $this->actingAs($this->admin)
        ->get(route('admin.reports.index', ['search' => 'Brownie']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/reports/index')
        ->where('stats.total_applications', 1)
        ->has('applications.data', 1)
        ->where('applications.data.0.reference_number', 'APP-TEST-DOG-001')
    );
});

test('admin can download filtered pdf report', function (): void {
    $response = $this->actingAs($this->admin)
        ->get(route('admin.reports.pdf', ['status' => 'approved']));

    $response->assertOk();
    $response->assertHeader('content-type', 'application/pdf');
});

test('admin can download filtered excel csv report', function (): void {
    $response = $this->actingAs($this->admin)
        ->get(route('admin.reports.excel', ['species' => 'dog']));

    $response->assertOk();
    $this->assertStringContainsString('text/csv', (string) $response->headers->get('content-type'));
});

test('shelter staff can view shelter reports with active pet inventory', function (): void {
    $response = $this->actingAs($this->staff)
        ->get(route('shelter.reports.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('shelter/reports/index')
        ->has('petMetrics')
        ->has('stats')
        ->has('applications')
    );
});

test('mao officer can view compliance audit reports', function (): void {
    $response = $this->actingAs($this->mao)
        ->get(route('mao.reports.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('mao/reports/index')
        ->has('stats')
        ->has('applications')
        ->has('shelters')
    );
});
