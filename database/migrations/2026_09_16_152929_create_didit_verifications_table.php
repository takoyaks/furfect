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
        Schema::create('didit_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('adopter_profile_id')->nullable()->constrained('adopter_profiles')->nullOnDelete();
            $table->string('session_id')->unique();
            $table->string('session_token')->nullable()->index();
            $table->string('workflow_id')->nullable();
            $table->string('url')->nullable();
            $table->string('status')->default('pending')->index(); // pending, in_review, approved, declined, expired, abandoned, failed
            $table->string('id_verification_status')->nullable(); // approved, declined, warning, not_checked
            $table->string('liveness_status')->nullable(); // passed, failed, undetermined
            $table->decimal('liveness_score', 5, 2)->nullable();
            $table->string('face_match_status')->nullable(); // matched, mismatched, failed
            $table->decimal('face_match_score', 5, 2)->nullable(); // 0-100 similarity score
            $table->json('extracted_data')->nullable(); // OCR data: full_name, dob, doc_type, doc_number, expiry, etc.
            $table->json('raw_decision')->nullable(); // full Didit decision payload
            $table->json('failure_reasons')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('didit_verifications');
    }
};
