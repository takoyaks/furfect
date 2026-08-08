<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('lifestyle_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete()->unique();

            // Section 1: Living Situation (HIGH WEIGHT - 25%)
            $table->enum('housing_type', [
                'house_with_yard', 'apartment', 'condo',
                'house_no_yard', 'rented_room', 'rural',
            ]);
            $table->enum('has_aircon', [
                'stable', 'sometimes', 'none_electric', 'none_natural',
            ])->default('stable');
            $table->enum('outdoor_access', [
                'fully_fenced', 'not_fenced', 'none',
            ])->default('none');

            // Section 2: Daily Lifestyle (HIGH WEIGHT - 15%)
            $table->enum('activity_level', [
                'very_light', 'light', 'moderate', 'very_active',
            ])->default('moderate');
            $table->enum('work_schedule', [
                'wfh', 'office', 'shifting', 'student',
            ])->default('office');

            // Section 3: Household (MEDIUM WEIGHT - 10%)
            $table->unsignedTinyInteger('household_size')->default(1);
            $table->boolean('household_agrees')->default(true);
            $table->enum('has_children', [
                'none', 'young', 'older', 'teenagers',
            ])->default('none');
            $table->enum('other_pets', [
                'none', 'dogs', 'cats', 'both', 'mixed',
            ])->default('none');

            // Section 4: Financial Capacity (HIGH WEIGHT - 20%)
            $table->string('occupation')->nullable();
            $table->enum('monthly_income', [
                'below_10000', '10000_20000', '20001_40000',
                '40001_60000', '60001_100000', 'above_100000',
            ])->nullable();
            $table->enum('pet_experience', [
                'first_time', 'had_before', 'currently_have', 'experienced_multiple',
            ])->default('first_time');

            // Section 5: Health Considerations (HIGH WEIGHT - 20%)
            // JSON array of conditions: asthma, skin_allergy, fur_allergy, immunocompromised, anxiety, noise_sensitive
            $table->json('health_conditions')->nullable();

            // Section 6: Pet Preferences (LOW WEIGHT - 10% — soft filters only)
            $table->enum('preferred_type', ['dog', 'cat', 'none'])->default('none');
            $table->json('preferred_size')->nullable(); // ["small","medium"] or null
            $table->enum('preferred_gender', ['male', 'female', 'none'])->default('none');
            $table->json('preferred_coat')->nullable(); // ["golden","black"] or null

            // Locking
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('locked_until')->nullable(); // 3-month lock after submission
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lifestyle_profiles');
    }
};
