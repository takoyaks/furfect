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
        Schema::table('adopter_profiles', function (Blueprint $table) {
            $table->string('id_document_back_path')->nullable()->after('id_document_name');
            $table->string('id_document_back_mime')->nullable()->after('id_document_back_path');
            $table->string('id_document_back_name')->nullable()->after('id_document_back_mime');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('adopter_profiles', function (Blueprint $table) {
            $table->dropColumn(['id_document_back_path', 'id_document_back_mime', 'id_document_back_name']);
        });
    }
};
