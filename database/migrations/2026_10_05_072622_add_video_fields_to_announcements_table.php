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
        Schema::table('announcements', function (Blueprint $table) {
            $table->string('video_path')->nullable()->after('image_path');
            $table->string('video_thumbnail_path')->nullable()->after('video_path');
            $table->unsignedSmallInteger('video_duration')->nullable()->after('video_thumbnail_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropColumn(['video_path', 'video_thumbnail_path', 'video_duration']);
        });
    }
};
