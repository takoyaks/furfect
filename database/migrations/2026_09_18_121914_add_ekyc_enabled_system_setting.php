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
            ['key' => 'ekyc_enabled'],
            [
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Enable Automated eKYC Identity Verification',
                'description' => 'When enabled, adopters must complete automated ID and facial biometric verification (Didit eKYC) before submitting personal details. When disabled, adopters proceed directly to personal information.',
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        SystemSetting::where('key', 'ekyc_enabled')->delete();
    }
};
