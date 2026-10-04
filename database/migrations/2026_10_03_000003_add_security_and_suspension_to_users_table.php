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
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedInteger('failed_login_attempts')->default(0)->after('password');
            $table->timestamp('suspended_at')->nullable()->after('failed_login_attempts');
            $table->string('suspended_reason', 500)->nullable()->after('suspended_at');
            $table->timestamp('lockout_until')->nullable()->after('suspended_reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'failed_login_attempts',
                'suspended_at',
                'suspended_reason',
                'lockout_until',
            ]);
        });
    }
};
