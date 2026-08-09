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
        Schema::create('landing_page_configs', function (Blueprint $table) {
            $table->id();
            $table->string('template_name')->default('honey_warm');
            $table->string('hero_title')->default('Find Your Perfect Companion');
            $table->text('hero_subtitle')->nullable();
            $table->string('hero_cta_text')->default('Browse Pets');
            $table->string('hero_cta_link')->default('/pets');
            $table->string('hero_image_path')->nullable();
            $table->json('section_settings')->nullable();
            $table->string('theme_color')->default('#D4A017');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('landing_page_configs');
    }
};
