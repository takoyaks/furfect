<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('system_settings')->updateOrInsert(
            ['key' => 'pricing_enabled'],
            [
                'key' => 'pricing_enabled',
                'value' => '0',
                'type' => 'boolean',
                'label' => 'Enable Adoption Fee / Pricing Display',
                'description' => 'When disabled, adoption fees and pricing inputs will be hidden across the public catalog, pet details, shelter forms, and application views.',
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('system_settings')->where('key', 'pricing_enabled')->delete();
    }
};
