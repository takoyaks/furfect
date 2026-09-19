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
        Schema::table('dss_match_scores', function (Blueprint $table) {
            // 8 official criteria from Criterion.pdf
            $table->decimal('lifestyle_score', 5, 2)->default(0)->after('total_score'); // 25%
            $table->decimal('housing_score', 5, 2)->default(0)->after('lifestyle_score'); // 20%
            $table->decimal('care_capacity_score', 5, 2)->default(0)->after('housing_score'); // 15%
            $table->decimal('experience_score', 5, 2)->default(0)->after('care_capacity_score'); // 10%
            $table->decimal('other_pets_score', 5, 2)->default(0)->after('experience_score'); // 10%
            $table->decimal('family_children_score', 5, 2)->default(0)->after('other_pets_score'); // 10%
            $table->decimal('age_activity_score', 5, 2)->default(0)->after('family_children_score'); // 5%
            $table->decimal('special_requirements_score', 5, 2)->default(0)->after('age_activity_score'); // 5%

            // Structured breakdown details & Fast-track flag
            $table->json('breakdown_details')->nullable()->after('special_requirements_score');
            $table->boolean('fast_track_eligible')->default(false)->after('breakdown_details');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dss_match_scores', function (Blueprint $table) {
            $table->dropColumn([
                'lifestyle_score',
                'housing_score',
                'care_capacity_score',
                'experience_score',
                'other_pets_score',
                'family_children_score',
                'age_activity_score',
                'special_requirements_score',
                'breakdown_details',
                'fast_track_eligible',
            ]);
        });
    }
};
