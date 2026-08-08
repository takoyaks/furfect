<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $reference_number
 * @property int $user_id
 * @property int $pet_id
 * @property float $dss_score
 * @property string $status
 * @property int|null $staff_id
 * @property string|null $staff_decision
 * @property string|null $staff_notes
 * @property Carbon|null $reviewed_at
 * @property int|null $mao_officer_id
 * @property string|null $mao_decision
 * @property string|null $mao_remarks
 * @property array<string, bool>|null $mao_checklist
 * @property Carbon $submitted_at
 * @property Carbon|null $resolved_at
 */
class Application extends Model
{
    /** @use HasFactory<\Database\Factories\ApplicationFactory> */
    use HasFactory;

    protected $fillable = [
        'reference_number',
        'user_id',
        'pet_id',
        'dss_score',
        'status',
        'staff_id',
        'staff_decision',
        'staff_notes',
        'reviewed_at',
        'mao_officer_id',
        'mao_decision',
        'mao_remarks',
        'mao_checklist',
        'submitted_at',
        'resolved_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'dss_score' => 'decimal:2',
            'mao_checklist' => 'array',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    /**
     * Auto-generate a reference number on creation.
     */
    protected static function booted(): void
    {
        static::creating(function (Application $application): void {
            if (empty($application->reference_number)) {
                $year = now()->format('Y');
                $count = self::whereYear('submitted_at', $year)->count() + 1;
                $application->reference_number = sprintf('APP-%s-%04d', $year, $count);
            }
        });
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function adopter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * @return BelongsTo<Pet, $this>
     */
    public function pet(): BelongsTo
    {
        return $this->belongsTo(Pet::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function staff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function maoOfficer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mao_officer_id');
    }
}
