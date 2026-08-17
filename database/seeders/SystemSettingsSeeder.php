<?php

namespace Database\Seeders;

use App\Models\SystemSetting;
use Illuminate\Database\Seeder;

class SystemSettingsSeeder extends Seeder
{
    /**
     * Seed default system settings.
     */
    public function run(): void
    {
        $settings = [
            [
                'key' => 'reapply_cooldown_days',
                'value' => '0',
                'type' => 'integer',
                'label' => 'Re-apply Cooldown (Days)',
                'description' => 'Number of days an adopter must wait before re-applying after rejection. Set to 0 to allow immediate re-application.',
            ],
            [
                'key' => 'max_active_applications',
                'value' => '1',
                'type' => 'integer',
                'label' => 'Maximum Active Applications',
                'description' => 'Maximum number of simultaneous active applications an adopter can have.',
            ],
            [
                'key' => 'dss_minimum_score',
                'value' => '50',
                'type' => 'integer',
                'label' => 'Minimum DSS Score to Apply (%)',
                'description' => 'Minimum DSS compatibility score required before an adopter can submit an application.',
            ],
            [
                'key' => 'lifestyle_lock_months',
                'value' => '3',
                'type' => 'integer',
                'label' => 'Lifestyle Profile Lock Duration (Months)',
                'description' => 'How many months the lifestyle profile is locked after submission.',
            ],
            [
                'key' => 'featured_pets_count',
                'value' => '4',
                'type' => 'integer',
                'label' => 'Featured Pets on Homepage',
                'description' => 'Number of featured pets shown on the public landing page.',
            ],
            [
                'key' => 'app_name',
                'value' => 'Furfect Match',
                'type' => 'string',
                'label' => 'Application Name',
                'description' => 'The display name of the application.',
            ],
            [
                'key' => 'shelter_name',
                'value' => 'Virac Animal Shelter',
                'type' => 'string',
                'label' => 'Partner Shelter Name',
                'description' => 'Name of the primary partner animal shelter.',
            ],
            [
                'key' => 'mao_office_name',
                'value' => 'Municipal Agriculture Office of Virac',
                'type' => 'string',
                'label' => 'MAO Office Name',
                'description' => 'Name of the Municipal Agriculture Office responsible for final audit.',
            ],
            [
                'key' => 'pricing_enabled',
                'value' => '0',
                'type' => 'boolean',
                'label' => 'Enable Adoption Fee / Pricing Display',
                'description' => 'When disabled, adoption fees and pricing inputs will be hidden across the public catalog, pet details, shelter forms, and application views.',
            ],
        ];

        foreach ($settings as $setting) {
            SystemSetting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }

        $this->command->info('System settings seeded successfully.');
    }
}
