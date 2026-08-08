<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $user_id
 * @property int $pet_id
 * @property float $total_score
 * @property float $living_score
 * @property float $health_score
 * @property float $financial_score
 * @property float $activity_score
 * @property float $household_score
 * @property float $preference_score
 * @property array<string>|null $match_reasons
 * @property array<string>|null $mismatch_reasons
 * @property \Illuminate\Support\Carbon $computed_at
 */
class DssMatchScore extends Model
{
    protected $fillable = [
        'user_id',
        'pet_id',
        'total_score',
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
