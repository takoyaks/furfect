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
        Schema::table('adopter_profiles', function (Blueprint $table): void {
            $table->string('full_name')->nullable()->change();
            $table->string('contact_number')->nullable()->change();
            $table->date('date_of_birth')->nullable()->change();
            $table->string('home_address')->nullable()->change();
            $table->string('valid_id_type')->nullable()->change();
            $table->string('valid_id_number')->nullable()->change();
            $table->string('adoption_reason')->nullable()->change();
            $table->unsignedTinyInteger('draft_step')->default(1)->after('pet_stay');
        });

        Schema::table('lifestyle_profiles', function (Blueprint $table): void {
            $table->string('housing_type', 50)->nullable()->change();
            $table->string('work_schedule', 100)->default('frequently_at_home')->change();
            $table->string('work_schedule_other', 255)->nullable()->after('work_schedule');
            $table->unsignedTinyInteger('draft_step')->default(1)->after('preferred_coat');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('adopter_profiles', function (Blueprint $table): void {
            $table->dropColumn('draft_step');
            $table->string('full_name')->nullable(false)->change();
            $table->string('contact_number')->nullable(false)->change();
            $table->date('date_of_birth')->nullable(false)->change();
            $table->string('home_address')->nullable(false)->change();
            $table->string('valid_id_type')->nullable(false)->change();
            $table->string('valid_id_number')->nullable(false)->change();
            $table->string('adoption_reason')->nullable(false)->change();
        });

        Schema::table('lifestyle_profiles', function (Blueprint $table): void {
            $table->dropColumn(['work_schedule_other', 'draft_step']);
            $table->enum('housing_type', [
                'house_with_yard', 'apartment', 'condo',
                'house_no_yard', 'rented_room', 'rural',
            ])->nullable(false)->change();
            $table->enum('work_schedule', [
                'wfh', 'office', 'shifting', 'student',
            ])->default('office')->change();
        });
    }
};
