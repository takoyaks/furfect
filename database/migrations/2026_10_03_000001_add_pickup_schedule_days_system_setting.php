<?php

use App\Models\SystemSetting;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        SystemSetting::updateOrCreate(
            ['key' => 'pickup_schedule_days'],
            [
                'value' => '3',
                'type' => 'integer',
                'label' => 'Adoption Pick-up Schedule (Days)',
                'description' => 'Number of days an approved adopter has to pick up their pet before the pet is marked unclaimed and returned to available status.',
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        SystemSetting::where('key', 'pickup_schedule_days')->delete();
    }
};
