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
        // 1. Create application_timelines table for detailed audit trails
        Schema::create('application_timelines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('actor_name')->nullable();
            $table->string('actor_role')->nullable(); // 'system', 'adopter', 'shelter_staff', 'mao_officer', 'admin'
            $table->string('stage'); // 'submitted', 'screening', 'mao_audit', 'resolved'
            $table->string('action'); // e.g. 'application_submitted', 'shelter_marked_suitable', 'shelter_rejected', 'mao_approved', 'mao_rejected'
            $table->string('title');
            $table->text('description')->nullable();
            $table->json('metadata')->nullable(); // Checklist snapshots, SLA details, reasons
            $table->timestamps();
        });

        // 2. Enhance applications table with SLA, fast-track, and certificate details
        Schema::table('applications', function (Blueprint $table) {
            $table->boolean('fast_track_eligible')->default(false)->after('dss_score');
            $table->timestamp('target_sla_at')->nullable()->after('reviewed_at');
            $table->timestamp('pickup_deadline_at')->nullable()->after('resolved_at');
            $table->string('certificate_number')->nullable()->unique()->after('pickup_deadline_at');
            $table->json('dss_breakdown')->nullable()->after('dss_score');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('application_timelines');

        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn([
                'fast_track_eligible',
                'target_sla_at',
                'pickup_deadline_at',
                'certificate_number',
                'dss_breakdown',
            ]);
        });
    }
};
