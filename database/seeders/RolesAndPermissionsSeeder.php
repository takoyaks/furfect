<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Seed roles and permissions for FurFect Match.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

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

        // MAO Staff — audit and final decision
        $maoStaff = Role::firstOrCreate(['name' => 'mao_staff']);
        $maoStaff->syncPermissions([
            'view-pets',
            'view-applications',
            'audit-applications',
            'generate-reports',
            'export-reports',
        ]);

        // Clean up legacy mao_officer role if present
        $legacyRole = Role::where('name', 'mao_officer')->first();
        if ($legacyRole) {
            foreach ($legacyRole->users as $legacyUser) {
                $legacyUser->assignRole('mao_staff');
            }
            $legacyRole->delete();
        }

        // Admin — full access
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $admin->syncPermissions(Permission::all());

        $this->command->info('Roles and permissions seeded successfully.');
    }
}
