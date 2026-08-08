<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Seed roles and permissions for FurFect Match.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // Pet management
            'view-pets',
            'create-pets',
            'edit-pets',
            'archive-pets',

            // Application management
            'view-applications',
            'review-applications', // Shelter staff: mark suitable/not-suitable
            'audit-applications',  // MAO: final approve/reject

            // User management
            'manage-users',

            // Shelter management
            'manage-shelters',

            // Reports
            'generate-reports',
            'export-reports',

            // System settings
            'manage-settings',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create roles and assign permissions

        // Adopter — basic browsing and applying
        $adopter = Role::firstOrCreate(['name' => 'adopter']);
        $adopter->syncPermissions([
            'view-pets',
            'view-applications',
        ]);

        // Shelter Staff — manage their shelter's pets and review applications
        $shelterStaff = Role::firstOrCreate(['name' => 'shelter_staff']);
        $shelterStaff->syncPermissions([
            'view-pets',
            'create-pets',
            'edit-pets',
            'archive-pets',
            'view-applications',
            'review-applications',
            'generate-reports',
        ]);

        // MAO Officer — audit and final decision
        $maoOfficer = Role::firstOrCreate(['name' => 'mao_officer']);
        $maoOfficer->syncPermissions([
            'view-pets',
            'view-applications',
            'audit-applications',
            'generate-reports',
            'export-reports',
        ]);

        // Admin — full access
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $admin->syncPermissions(Permission::all());

        $this->command->info('Roles and permissions seeded successfully.');
    }
}
