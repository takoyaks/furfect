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
        Schema::table('landing_page_configs', function (Blueprint $table) {
            $table->string('about_title')->nullable();
            $table->text('about_mission')->nullable();
            $table->string('about_phone')->nullable();
            $table->string('about_email')->nullable();
            $table->string('about_location')->nullable();
            $table->string('about_hours')->nullable();
            $table->json('how_it_works_steps')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('landing_page_configs', function (Blueprint $table) {
            $table->dropColumn([
                'about_title',
                'about_mission',
                'about_phone',
                'about_email',
                'about_location',
                'about_hours',
                'how_it_works_steps',
            ]);
        });
    }
};
