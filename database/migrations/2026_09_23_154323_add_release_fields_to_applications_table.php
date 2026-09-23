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
        Schema::table('applications', function (Blueprint $table) {
            $table->timestamp('released_at')->nullable()->after('pickup_deadline_at');
            $table->foreignId('releasing_officer_id')->nullable()->after('released_at')->constrained('users')->nullOnDelete();
            $table->text('releasing_notes')->nullable()->after('releasing_officer_id');
            $table->json('release_checklist')->nullable()->after('releasing_notes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropConstrainedForeignId('releasing_officer_id');
            $table->dropColumn(['released_at', 'releasing_notes', 'release_checklist']);
        });
    }
};
