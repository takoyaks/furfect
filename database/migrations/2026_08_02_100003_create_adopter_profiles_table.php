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
        Schema::create('adopter_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete()->unique();
            $table->string('full_name');
            $table->string('contact_number');
            $table->date('date_of_birth');
            $table->string('home_address');
            $table->string('valid_id_type');
            $table->string('valid_id_number');
            $table->enum('had_pets_before', ['currently_have', 'had_before', 'never'])->default('never');
            $table->text('previous_pet_notes')->nullable();
            $table->boolean('surrendered_pet')->default(false);
            $table->string('adoption_reason'); // e.g. companionship, family_children, security, emotional_support, other
            $table->text('adoption_reason_text')->nullable();
            $table->enum('pet_stay', ['inside', 'outdoors', 'both'])->default('inside');
            $table->timestamp('profile_completed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('adopter_profiles');
    }
};
