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
        Schema::create('pets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shelter_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->enum('species', ['dog', 'cat']);
            $table->string('breed')->nullable(); // Hidden from public browsing (DSS anti-bias)
            $table->unsignedTinyInteger('age_years')->default(0);
            $table->enum('gender', ['male', 'female']);
            $table->enum('size', ['small', 'medium', 'large']);
            $table->string('health_status')->nullable(); // e.g. Vaccinated, Neutered
            $table->json('temperament')->nullable(); // e.g. ["Friendly","Active"]
            $table->enum('energy_level', ['low', 'moderate', 'high', 'very_active'])->default('moderate');
            $table->boolean('requires_experience')->default(false);
            $table->boolean('requires_yard')->default(false);
            $table->boolean('requires_no_children')->default(false);
            $table->boolean('requires_no_other_pets')->default(false);
            $table->json('housing_compatible')->nullable(); // e.g. ["apartment","house_with_yard"]
            $table->decimal('adoption_fee', 10, 2)->default(0.00);
            $table->text('description')->nullable();
            $table->enum('status', ['available', 'adopted', 'archived'])->default('available');
            $table->timestamp('listed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pets');
    }
};
