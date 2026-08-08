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
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->string('reference_number')->unique(); // APP-YYYY-XXXX
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // Adopter
            $table->foreignId('pet_id')->constrained()->cascadeOnDelete();
            $table->decimal('dss_score', 5, 2)->default(0); // Snapshot at application time

            $table->enum('status', [
                'pending',
                'under_review',
                'mao_audit',
                'approved',
                'rejected',
            ])->default('pending');

            // Shelter Staff Review
            $table->foreignId('staff_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('staff_decision', ['suitable', 'not_suitable'])->nullable();
            $table->text('staff_notes')->nullable();
            $table->timestamp('reviewed_at')->nullable();

            // MAO Audit
            $table->foreignId('mao_officer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('mao_decision', ['approved', 'rejected'])->nullable();
            $table->text('mao_remarks')->nullable();
            $table->json('mao_checklist')->nullable(); // Compliance checklist items checked

            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
