<?php

namespace Database\Seeders;

use App\Models\AdopterProfile;
use App\Models\Application;
use App\Models\LifestyleProfile;
use App\Models\Pet;
use App\Models\PetPhoto;
use App\Models\Shelter;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SampleDataSeeder extends Seeder
{
    /**
     * Seed sample data for development and testing.
     */
    public function run(): void
    {
        // ── Admin User ─────────────────────────────────────────────
        $admin = User::firstOrCreate(
            ['email' => 'admin@furfect.com'],
            [
                'name' => 'Admin User Baltazar',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $admin->assignRole('admin');

        // ── Virac Animal Shelter ───────────────────────────────────
        $shelter = Shelter::firstOrCreate(
            ['name' => 'Virac Animal Shelter'],
            [
                'type' => 'Municipal Animal Shelter',
                'location' => 'Virac, Catanduanes',
                'contact' => '0950-321-7654',
                'email' => 'virac.shelter@gmail.com',
                'status' => 'active',
            ]
        );

        // ── Shelter Staff ──────────────────────────────────────────
        $shelterStaff = User::firstOrCreate(
            ['email' => 'lizabel@gmail.com'],
            [
                'name' => 'Staff Lizabel Reyes',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $shelterStaff->assignRole('shelter_staff');

        // ── MAO Officer ────────────────────────────────────────────
        $maoOfficer = User::firstOrCreate(
            ['email' => 'mao@virac.gov.ph'],
            [
                'name' => 'MAO Officer Romero',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $maoOfficer->assignRole('mao_officer');

        // ── Sample Adopter ─────────────────────────────────────────
        $adopter = User::firstOrCreate(
            ['email' => 'mariacielo@gmail.com'],
            [
                'name' => 'Maria Cielo',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $adopter->assignRole('adopter');

        AdopterProfile::firstOrCreate(
            ['user_id' => $adopter->id],
            [
                'full_name' => 'Maria Cielo',
                'contact_number' => '09501234567',
                'date_of_birth' => '1995-03-15',
                'home_address' => 'Purok 3, Barangay Concepcion, Virac, Catanduanes',
                'valid_id_type' => 'National ID',
                'valid_id_number' => '1234-5678-9012',
                'had_pets_before' => 'had_before',
                'previous_pet_notes' => 'Had a dog for 5 years, rehomed due to moving abroad.',
                'surrendered_pet' => false,
                'adoption_reason' => 'companionship',
                'adoption_reason_text' => 'I live alone and would love the company of a furry friend.',
                'pet_stay' => 'inside',
                'profile_completed_at' => now(),
            ]
        );

        LifestyleProfile::firstOrCreate(
            ['user_id' => $adopter->id],
            [
                'housing_type' => 'apartment',
                'has_aircon' => 'stable',
                'outdoor_access' => 'none',
                'activity_level' => 'moderate',
                'work_schedule' => 'office',
                'household_size' => 2,
                'household_agrees' => true,
                'has_children' => 'none',
                'other_pets' => 'none',
                'occupation' => 'Teacher',
                'monthly_income' => '20001_40000',
                'pet_experience' => 'had_before',
                'health_conditions' => [],
                'preferred_type' => 'none',
                'preferred_size' => ['small', 'medium'],
                'preferred_gender' => 'none',
                'preferred_coat' => null,
                'submitted_at' => now(),
                'locked_until' => now()->addMonths(3),
            ]
        );

        // ── Sample Pets ────────────────────────────────────────────
        $pets = [
            [
                'name' => 'Choppy',
                'species' => 'dog',
                'breed' => 'Mixed Breed',
                'age_years' => 2,
                'gender' => 'male',
                'size' => 'medium',
                'health_status' => 'Vaccinated, Neutered',
                'temperament' => ['Friendly', 'Active'],
                'energy_level' => 'moderate',
                'requires_experience' => false,
                'requires_yard' => false,
                'requires_no_children' => false,
                'requires_no_other_pets' => false,
                'housing_compatible' => ['apartment', 'house_with_yard', 'house_no_yard', 'condo'],
                'adoption_fee' => 0.00,
                'description' => 'Choppy is a playful and affectionate dog who loves people and gets along well with other pets. He is house-trained, knows basic commands, and would thrive in an active household.',
                'status' => 'available',
                'listed_at' => now()->subDays(30),
            ],
            [
                'name' => 'Bon Bon',
                'species' => 'dog',
                'breed' => 'Aspin',
                'age_years' => 1,
                'gender' => 'male',
                'size' => 'small',
                'health_status' => 'Vaccinated',
                'temperament' => ['Calm', 'Indoor'],
                'energy_level' => 'low',
                'requires_experience' => false,
                'requires_yard' => false,
                'requires_no_children' => false,
                'requires_no_other_pets' => false,
                'housing_compatible' => ['apartment', 'condo', 'house_with_yard', 'house_no_yard', 'rented_room'],
                'adoption_fee' => 0.00,
                'description' => 'Bon Bon is a gentle and laid-back dog that adapts easily to small living spaces. He is quiet, loves cuddles, and is great for first-time pet owners.',
                'status' => 'available',
                'listed_at' => now()->subDays(25),
            ],
            [
                'name' => 'Belo',
                'species' => 'dog',
                'breed' => 'Labrador',
                'age_years' => 3,
                'gender' => 'male',
                'size' => 'large',
                'health_status' => 'Vaccinated',
                'temperament' => ['Playful', 'Loyal'],
                'energy_level' => 'very_active',
                'requires_experience' => true,
                'requires_yard' => true,
                'requires_no_children' => false,
                'requires_no_other_pets' => false,
                'housing_compatible' => ['house_with_yard', 'rural'],
                'adoption_fee' => 0.00,
                'description' => 'Belo is a loyal and energetic Labrador who needs an active family with a yard. He loves outdoor activities, playing fetch, and swimming.',
                'status' => 'available',
                'listed_at' => now()->subDays(20),
            ],
            [
                'name' => 'Peppermint',
                'species' => 'cat',
                'breed' => 'Puspin',
                'age_years' => 2,
                'gender' => 'male',
                'size' => 'small',
                'health_status' => 'Vaccinated, Neutered',
                'temperament' => ['Sweet', 'Shy'],
                'energy_level' => 'low',
                'requires_experience' => false,
                'requires_yard' => false,
                'requires_no_children' => true,
                'requires_no_other_pets' => false,
                'housing_compatible' => ['apartment', 'condo', 'house_no_yard', 'house_with_yard'],
                'adoption_fee' => 500.00,
                'description' => 'Peppermint is a sweet and gentle cat who loves quiet environments and indoor living. He is calm around people and tends to bond closely with one owner.',
                'status' => 'available',
                'listed_at' => now()->subDays(15),
            ],
            [
                'name' => 'Muffy',
                'species' => 'cat',
                'breed' => 'Siamese',
                'age_years' => 2,
                'gender' => 'male',
                'size' => 'small',
                'health_status' => 'Vaccinated, Spayed',
                'temperament' => ['Friendly', 'Active'],
                'energy_level' => 'moderate',
                'requires_experience' => false,
                'requires_yard' => false,
                'requires_no_children' => false,
                'requires_no_other_pets' => false,
                'housing_compatible' => ['apartment', 'condo', 'house_with_yard', 'house_no_yard'],
                'adoption_fee' => 500.00,
                'description' => 'Muffy is a beautiful Siamese cat with bright blue eyes. She is vocal, affectionate, and loves interactive play. Great for families who want an engaged companion.',
                'status' => 'adopted',
                'listed_at' => now()->subDays(60),
            ],
            [
                'name' => 'Melon',
                'species' => 'cat',
                'breed' => 'Persian',
                'age_years' => 1,
                'gender' => 'female',
                'size' => 'small',
                'health_status' => 'Vaccinated',
                'temperament' => ['Friendly', 'Active'],
                'energy_level' => 'moderate',
                'requires_experience' => false,
                'requires_yard' => false,
                'requires_no_children' => false,
                'requires_no_other_pets' => false,
                'housing_compatible' => ['apartment', 'condo', 'house_with_yard', 'house_no_yard'],
                'adoption_fee' => 500.00,
                'description' => 'Melon is a fluffy and friendly Persian cat who loves lounging in sunny spots and being groomed. She gets along well with other calm cats.',
                'status' => 'available',
                'listed_at' => now()->subDays(10),
            ],
        ];

        foreach ($pets as $petData) {
            Pet::firstOrCreate(
                ['name' => $petData['name'], 'shelter_id' => $shelter->id],
                array_merge($petData, ['shelter_id' => $shelter->id])
            );
        }

        $this->command->info('Sample data seeded successfully.');
        $this->command->table(
            ['Role', 'Email', 'Password'],
            [
                ['Admin', 'admin@furfect.com', 'password'],
                ['Shelter Staff', 'lizabel@gmail.com', 'password'],
                ['MAO Officer', 'mao@virac.gov.ph', 'password'],
                ['Adopter', 'mariacielo@gmail.com', 'password'],
            ]
        );
    }
}
