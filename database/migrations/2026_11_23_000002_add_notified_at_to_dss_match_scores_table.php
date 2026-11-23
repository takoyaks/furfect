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
        Schema::table('dss_match_scores', function (Blueprint $table): void {
            $table->timestamp('notified_at')->nullable()->after('computed_at');
            $table->index(['pet_id', 'total_score']);
            $table->index(['user_id', 'total_score']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dss_match_scores', function (Blueprint $table): void {
            $table->dropIndex(['pet_id', 'total_score']);
            $table->dropIndex(['user_id', 'total_score']);
            $table->dropColumn('notified_at');
        });
    }
};
