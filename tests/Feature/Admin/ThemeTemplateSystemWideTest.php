<?php

use App\Models\LandingPageConfig;
use App\Models\Shelter;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function (): void {
    $this->artisan('db:seed', ['--class' => 'RolesAndPermissionsSeeder']);
    $this->artisan('db:seed', ['--class' => 'SystemSettingsSeeder']);

    $this->admin = User::factory()->create();
    $this->admin->assignRole('admin');

    $this->shelterStaff = User::factory()->create();
    $this->shelterStaff->assignRole('shelter_staff');

    $this->mao = User::factory()->create();
    $this->mao->assignRole('mao_officer');

    $this->shelter = Shelter::factory()->create(['name' => 'Virac Animal Shelter']);
});

test('theme configuration is shared globally across admin, staff, mao, and public pages', function (): void {
    $config = LandingPageConfig::active();
    $config->update([
        'template_name' => 'honey_warm',
        'theme_color' => '#467235',
    ]);
    cache()->forget('active_theme_config');

    // 1. Public Landing Page
    $response = $this->get(route('home'));
    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->has('theme', fn (Assert $theme) => $theme
            ->where('template', 'honey_warm')
            ->where('primary_color', '#467235')
        )
    );

    // 2. Admin Dashboard
    $response = $this->actingAs($this->admin)->get(route('admin.dashboard'));
    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/dashboard')
        ->has('theme', fn (Assert $theme) => $theme
            ->where('template', 'honey_warm')
            ->where('primary_color', '#467235')
        )
    );

    // 3. Shelter Dashboard
    $response = $this->actingAs($this->shelterStaff)->get(route('shelter.dashboard'));
    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('shelter/dashboard')
        ->has('theme', fn (Assert $theme) => $theme
            ->where('template', 'honey_warm')
            ->where('primary_color', '#467235')
        )
    );

    // 4. MAO Dashboard
    $response = $this->actingAs($this->mao)->get(route('mao.dashboard'));
    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('mao/dashboard')
        ->has('theme', fn (Assert $theme) => $theme
            ->where('template', 'honey_warm')
            ->where('primary_color', '#467235')
        )
    );
});

test('updating theme template in cms builder immediately reflects system-wide in all portals', function (): void {
    $config = LandingPageConfig::active();

    // Admin updates theme template to "emerald_nature"
    $response = $this->actingAs($this->admin)->post(route('admin.cms.builder.update'), [
        'template_name' => 'emerald_nature',
        'theme_color' => '#059669',
        'hero_title' => $config->hero_title ?: 'Every Paw Deserves a Loving Home in Virac',
        'hero_subtitle' => $config->hero_subtitle ?: 'Automated adoption matchmaking',
        'hero_cta_text' => 'Browse Pets',
        'hero_cta_link' => '/pets',
        'section_settings' => [
            'show_hero' => true,
            'show_featured_pets' => true,
            'show_announcements' => true,
            'show_stats' => true,
            'show_how_it_works' => true,
            'show_shelter_info' => true,
        ],
    ]);

    $response->assertRedirect();

    // Verify Admin Portal immediately receives emerald_nature
    $this->actingAs($this->admin)->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('theme.template', 'emerald_nature')
            ->where('theme.primary_color', '#059669')
        );

    // Verify Shelter Staff Portal immediately receives emerald_nature
    $this->actingAs($this->shelterStaff)->get(route('shelter.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('theme.template', 'emerald_nature')
            ->where('theme.primary_color', '#059669')
        );

    // Verify MAO Portal immediately receives emerald_nature
    $this->actingAs($this->mao)->get(route('mao.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('theme.template', 'emerald_nature')
            ->where('theme.primary_color', '#059669')
        );
});
