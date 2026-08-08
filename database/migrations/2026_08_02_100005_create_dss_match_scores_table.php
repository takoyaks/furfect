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
        Schema::create('dss_match_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('pet_id')->constrained()->cascadeOnDelete();

            // Weighted factor scores (each 0–100)
            $table->decimal('total_score', 5, 2)->default(0);
            $table->decimal('living_score', 5, 2)->default(0);  // 25%
            $table->decimal('health_score', 5, 2)->default(0);  // 20%
            $table->decimal('financial_score', 5, 2)->default(0); // 20%
            $table->decimal('activity_score', 5, 2)->default(0); // 15%
            $table->decimal('household_score', 5, 2)->default(0); // 10%
            $table->decimal('preference_score', 5, 2)->default(0); // 10%

            // Human-readable reasons (array of matching/mismatching criteria)
            $table->json('match_reasons')->nullable();
            $table->json('mismatch_reasons')->nullable();

            $table->timestamp('computed_at');

            $table->unique(['user_id', 'pet_id']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dss_match_scores');
    }
};
