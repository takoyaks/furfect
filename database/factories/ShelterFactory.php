<?php

namespace Database\Factories;

use App\Models\Shelter;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Shelter>
 */
class ShelterFactory extends Factory
{
    protected $model = Shelter::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->company() . ' Animal Shelter',
            'type' => 'Municipal Animal Shelter',
            'location' => $this->faker->city() . ', Catanduanes',
            'contact' => '09' . $this->faker->numerify('#########'),
            'email' => $this->faker->safeEmail(),
            'status' => 'active',
        ];
    }
}
