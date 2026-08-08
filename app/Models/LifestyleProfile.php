<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $housing_type
 * @property string $has_aircon
 * @property string $outdoor_access
 * @property string $activity_level
 * @property string $work_schedule
 * @property int $household_size
 * @property bool $household_agrees
 * @property string $has_children
 * @property string $other_pets
 * @property string|null $occupation
 * @property string|null $monthly_income
 * @property string $pet_experience
 * @property array<string>|null $health_conditions
 * @property string $preferred_type
 * @property array<string>|null $preferred_size
 * @property string $preferred_gender
 * @property array<string>|null $preferred_coat
 * @property Carbon|null $submitted_at
 * @property Carbon|null $locked_until
 */
class LifestyleProfile extends Model
{
    protected $fillable = [
        'user_id',
        'housing_type',
        'has_aircon',
        'outdoor_access',
        'activity_level',
        'work_schedule',
        'household_size',
        'household_agrees',
        'has_children',
        'other_pets',
        'occupation',
        'monthly_income',
        'pet_experience',
        'health_conditions',
        'preferred_type',
        'preferred_size',
        'preferred_gender',
        'preferred_coat',
        'submitted_at',
        'locked_until',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'household_agrees' => 'boolean',
            'health_conditions' => 'array',
            'preferred_size' => 'array',
            'preferred_coat' => 'array',
            'submitted_at' => 'datetime',
            'locked_until' => 'datetime',
            'household_size' => 'integer',
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
     * Whether this profile is currently locked from editing.
     */
    public function isLocked(): bool
    {
        return $this->locked_until !== null && $this->locked_until->isFuture();
    }
}
