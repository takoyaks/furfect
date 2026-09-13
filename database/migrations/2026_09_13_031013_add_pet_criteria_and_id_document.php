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
        Schema::table('pets', function (Blueprint $table) {
            $table->enum('maintenance_level', ['low', 'medium', 'high'])->default('medium')->after('energy_level');
            $table->enum('coat_color', ['black', 'white', 'brown', 'mixed', 'golden', 'other'])->nullable()->after('size');
        });

        Schema::table('adopter_profiles', function (Blueprint $table) {
            $table->string('id_document_path')->nullable()->after('valid_id_number');
            $table->string('id_document_mime')->nullable()->after('id_document_path');
            $table->string('id_document_name')->nullable()->after('id_document_mime');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->dropColumn(['maintenance_level', 'coat_color']);
        });

        Schema::table('adopter_profiles', function (Blueprint $table) {
            $table->dropColumn(['id_document_path', 'id_document_mime', 'id_document_name']);
        });
    }
};
