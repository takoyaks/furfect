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
            $table->string('tag_number')->nullable()->index()->after('breed'); // Physical collar tag, ear tag, or intake tag code
            $table->string('microchip_number')->nullable()->index()->after('tag_number'); // Microchip ID
            $table->string('housing_area')->nullable()->after('housing_compatible'); // Facility location/enclosure (e.g. Kennel Bay A-12, Cattery Pen 3)
            $table->text('housing_notes')->nullable()->after('housing_area'); // Cage placement or handling instructions
            $table->date('intake_date')->nullable()->after('housing_notes'); // Date admitted to shelter
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->dropColumn([
                'tag_number',
                'microchip_number',
                'housing_area',
                'housing_notes',
                'intake_date',
            ]);
        });
    }
};
