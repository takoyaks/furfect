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
        Schema::table('pet_photos', function (Blueprint $table) {
            $table->string('media_type', 20)->default('image')->after('photo_path');
            $table->string('video_path')->nullable()->after('media_type');
            $table->string('thumbnail_path')->nullable()->after('video_path');
            $table->unsignedSmallInteger('duration_seconds')->nullable()->after('thumbnail_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pet_photos', function (Blueprint $table) {
            $table->dropColumn(['media_type', 'video_path', 'thumbnail_path', 'duration_seconds']);
        });
    }
};
