<?php

namespace Database\Factories;

use App\Models\Pet;
use App\Models\Shelter;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Pet>
 */
class PetFactory extends Factory
{
    protected $model = Pet::class;

    /** @var array<string> */
    private array $dogTemperaments = ['Friendly', 'Active', 'Calm', 'Playful', 'Loyal', 'Indoor', 'Gentle'];

    /** @var array<string> */
    private array $catTemperaments = ['Sweet', 'Shy', 'Calm', 'Playful', 'Friendly', 'Indoor', 'Active'];

    public function definition(): array
    {
        $species = $this->faker->randomElement(['dog', 'cat']);
        $temperaments = $species === 'dog' ? $this->dogTemperaments : $this->catTemperaments;
        $selectedTemperaments = $this->faker->randomElements($temperaments, $this->faker->numberBetween(1, 3));

        return [
            'shelter_id' => Shelter::factory(),
            'name' => $this->faker->firstName(),
            'species' => $species,
            'breed' => $species === 'dog' ? $this->faker->randomElement(['Aspin', 'Labrador', 'Puspin', 'Mixed Breed', 'Askal']) : $this->faker->randomElement(['Puspin', 'Siamese', 'Persian', 'Mixed']),
            'age_years' => $this->faker->numberBetween(0, 10),
            'gender' => $this->faker->randomElement(['male', 'female']),
            'size' => $this->faker->randomElement(['small', 'medium', 'large']),
            'health_status' => $this->faker->randomElement(['Vaccinated', 'Vaccinated, Neutered', 'Vaccinated, Spayed', null]),
            'maintenance_level' => $this->faker->randomElement(['low', 'medium', 'high']),
            'coat_color' => $this->faker->randomElement(['black', 'white', 'brown', 'mixed', 'golden', 'other']),
            'temperament' => $selectedTemperaments,
            'energy_level' => $this->faker->randomElement(['low', 'moderate', 'high', 'very_active']),
            'requires_experience' => $this->faker->boolean(20),
            'requires_yard' => $this->faker->boolean(30),
            'requires_no_children' => $this->faker->boolean(15),
            'requires_no_other_pets' => $this->faker->boolean(20),
            'housing_compatible' => $this->faker->randomElements(['house_with_yard', 'apartment', 'condo', 'house_no_yard', 'rural'], $this->faker->numberBetween(2, 4)),
            'adoption_fee' => $this->faker->randomElement([0.00, 0.00, 500.00, 500.00, 250.00]),
            'description' => $this->faker->paragraph(3),
            'status' => 'available',
            'listed_at' => $this->faker->dateTimeBetween('-6 months', 'now'),
        ];
    }

    public function available(): static
    {
        return $this->state(['status' => 'available']);
    }

    public function adopted(): static
    {
        return $this->state(['status' => 'adopted']);
    }

    public function dog(): static
    {
        return $this->state(['species' => 'dog']);
    }

    public function cat(): static
    {
        return $this->state(['species' => 'cat']);
    }
}
