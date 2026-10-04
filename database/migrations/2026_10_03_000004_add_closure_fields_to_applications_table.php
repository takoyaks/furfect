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
        Schema::table('applications', function (Blueprint $table) {
            $table->string('close_reason', 100)->nullable()->after('status');
            $table->text('close_notes')->nullable()->after('close_reason');
            $table->timestamp('closed_at')->nullable()->after('close_notes');
            $table->foreignId('closed_by_id')->nullable()->after('closed_at')->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropForeign(['closed_by_id']);
            $table->dropColumn([
                'close_reason',
                'close_notes',
                'closed_at',
                'closed_by_id',
            ]);
        });
    }
};
