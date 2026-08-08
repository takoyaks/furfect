<?php

namespace Database\Factories;

use App\Models\Application;
use App\Models\Pet;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Application>
 */
class ApplicationFactory extends Factory
{
    protected $model = Application::class;

    public function definition(): array
    {
        $year = date('Y');
        $count = Application::count() + 1;

        return [
            'reference_number' => sprintf('APP-%s-%04d', $year, $count),
            'user_id' => User::factory(),
            'pet_id' => Pet::factory(),
            'dss_score' => $this->faker->randomFloat(2, 30, 100),
            'status' => $this->faker->randomElement(['pending', 'under_review', 'mao_audit', 'approved', 'rejected']),
            'submitted_at' => $this->faker->dateTimeBetween('-3 months', 'now'),
        ];
    }

    public function pending(): static
    {
        return $this->state(['status' => 'pending']);
    }

    public function underReview(): static
    {
        return $this->state(['status' => 'under_review']);
    }

    public function approved(): static
    {
        return $this->state([
            'status' => 'approved',
            'staff_decision' => 'suitable',
            'mao_decision' => 'approved',
            'resolved_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state([
            'status' => 'rejected',
            'mao_decision' => 'rejected',
            'mao_remarks' => 'Housing situation assessed as insufficient for this pet.',
            'resolved_at' => now(),
        ]);
    }
}
