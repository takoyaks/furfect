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
            $table->boolean('is_identity_verified')->default(false)->after('id_document_back_name');
            $table->timestamp('identity_verified_at')->nullable()->after('is_identity_verified');
            $table->string('identity_verification_provider')->nullable()->after('identity_verified_at');
            $table->string('didit_session_id')->nullable()->after('identity_verification_provider');
            $table->decimal('face_match_score', 5, 2)->nullable()->after('didit_session_id');
            $table->boolean('liveness_verified')->default(false)->after('face_match_score');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('adopter_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'is_identity_verified',
                'identity_verified_at',
                'identity_verification_provider',
                'didit_session_id',
                'face_match_score',
                'liveness_verified',
            ]);
        });
    }
};
