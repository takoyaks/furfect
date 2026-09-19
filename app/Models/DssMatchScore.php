<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int $pet_id
 * @property float $total_score
 * @property float $lifestyle_score
 * @property float $housing_score
 * @property float $care_capacity_score
 * @property float $experience_score
 * @property float $other_pets_score
 * @property float $family_children_score
 * @property float $age_activity_score
 * @property float $special_requirements_score
 * @property array<string, mixed>|null $breakdown_details
 * @property bool $fast_track_eligible
 * @property array<string>|null $match_reasons
 * @property array<string>|null $mismatch_reasons
 * @property Carbon $computed_at
 */
class DssMatchScore extends Model
{
    protected $fillable = [
        'user_id',
        'pet_id',
        'total_score',
        // 8 official criteria
        'lifestyle_score',
        'housing_score',
        'care_capacity_score',
        'experience_score',
        'other_pets_score',
        'family_children_score',
        'age_activity_score',
        'special_requirements_score',
        'breakdown_details',
        'fast_track_eligible',
        // Legacy compatibility
        'living_score',
        'health_score',
        'financial_score',
        'activity_score',
        'household_score',
        'preference_score',
        'match_reasons',
        'mismatch_reasons',
        'computed_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'total_score' => 'decimal:2',
            'lifestyle_score' => 'decimal:2',
            'housing_score' => 'decimal:2',
            'care_capacity_score' => 'decimal:2',
            'experience_score' => 'decimal:2',
            'other_pets_score' => 'decimal:2',
            'family_children_score' => 'decimal:2',
            'age_activity_score' => 'decimal:2',
            'special_requirements_score' => 'decimal:2',
            'breakdown_details' => 'array',
            'fast_track_eligible' => 'boolean',
            'living_score' => 'decimal:2',
            'health_score' => 'decimal:2',
            'financial_score' => 'decimal:2',
            'activity_score' => 'decimal:2',
            'household_score' => 'decimal:2',
            'preference_score' => 'decimal:2',
            'match_reasons' => 'array',
            'mismatch_reasons' => 'array',
            'computed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Pet, $this>
     */
    public function pet(): BelongsTo
    {
        return $this->belongsTo(Pet::class);
    }
}
