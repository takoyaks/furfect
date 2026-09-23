<?php

namespace App\Models;

use Database\Factories\ApplicationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $reference_number
 * @property int $user_id
 * @property int $pet_id
 * @property float $dss_score
 * @property bool $fast_track_eligible
 * @property array<string, mixed>|null $dss_breakdown
 * @property string $status
 * @property int|null $staff_id
 * @property string|null $staff_decision
 * @property string|null $staff_notes
 * @property Carbon|null $reviewed_at
 * @property Carbon|null $target_sla_at
 * @property int|null $mao_officer_id
 * @property string|null $mao_decision
 * @property string|null $mao_remarks
 * @property array<string, bool>|null $mao_checklist
 * @property Carbon $submitted_at
 * @property Carbon|null $resolved_at
 * @property Carbon|null $pickup_deadline_at
 * @property Carbon|null $released_at
 * @property int|null $releasing_officer_id
 * @property string|null $releasing_notes
 * @property array<string, bool>|null $release_checklist
 * @property string|null $certificate_number
 */
class Application extends Model
{
    /** @use HasFactory<ApplicationFactory> */
    use HasFactory;

    protected $fillable = [
        'reference_number',
        'user_id',
        'pet_id',
        'dss_score',
        'fast_track_eligible',
        'dss_breakdown',
        'status',
        'staff_id',
        'staff_decision',
        'staff_notes',
        'reviewed_at',
        'target_sla_at',
        'mao_officer_id',
        'mao_decision',
        'mao_remarks',
        'mao_checklist',
        'submitted_at',
        'resolved_at',
        'pickup_deadline_at',
        'released_at',
        'releasing_officer_id',
        'releasing_notes',
        'release_checklist',
        'certificate_number',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'dss_score' => 'decimal:2',
            'fast_track_eligible' => 'boolean',
            'dss_breakdown' => 'array',
            'mao_checklist' => 'array',
            'release_checklist' => 'array',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'target_sla_at' => 'datetime',
            'resolved_at' => 'datetime',
            'pickup_deadline_at' => 'datetime',
            'released_at' => 'datetime',
        ];
    }

    /**
     * Auto-generate a reference number on creation.
     */
    protected static function booted(): void
    {
        static::creating(function (Application $application): void {
            if (empty($application->reference_number)) {
                $year = $application->submitted_at ? Carbon::parse($application->submitted_at)->format('Y') : now()->format('Y');
                $count = self::where('reference_number', 'like', "APP-{$year}-%")->count() + 1;
                $refNumber = sprintf('APP-%s-%04d', $year, $count);
                while (self::where('reference_number', $refNumber)->exists()) {
                    $count++;
                    $refNumber = sprintf('APP-%s-%04d', $year, $count);
                }
                $application->reference_number = $refNumber;
            }
        });
    }

    /**
     * Record a timeline audit event for this application.
     *
     * @param  array<string, mixed>  $metadata
     */
    public function logTimeline(
        string $stage,
        string $action,
        string $title,
        ?string $description = null,
        ?User $actor = null,
        array $metadata = []
    ): ApplicationTimeline {
        $actorRole = 'system';
        if ($actor) {
            if ($actor->hasRole('admin')) {
                $actorRole = 'admin';
            } elseif ($actor->hasRole('mao_officer')) {
                $actorRole = 'mao_officer';
            } elseif ($actor->hasRole('shelter_staff')) {
                $actorRole = 'shelter_staff';
            } elseif ($actor->hasRole('adopter')) {
                $actorRole = 'adopter';
            }
        }

        return $this->timelines()->create([
            'actor_id' => $actor?->id,
            'actor_name' => $actor?->name ?? 'FurFect DSS Workflow Engine',
            'actor_role' => $actorRole,
            'stage' => $stage,
            'action' => $action,
            'title' => $title,
            'description' => $description,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Generate an official Municipal Adoption Certificate number.
     */
    public function generateCertificateNumber(): string
    {
        if (empty($this->certificate_number)) {
            $year = now()->format('Y');
            $certNumber = sprintf('CERT-MAO-%s-%04d', $year, $this->id);
            $this->certificate_number = $certNumber;
            $this->save();
        }

        return $this->certificate_number;
    }

    /**
     * Check if the SLA target has been breached.
     */
    public function isSlaBreached(): bool
    {
        if (in_array($this->status, ['approved', 'rejected', 'completed', 'unclaimed'])) {
            return false;
        }

        return $this->target_sla_at !== null && $this->target_sla_at->isPast();
    }

    /**
     * @return HasMany<ApplicationTimeline, $this>
     */
    public function timelines(): HasMany
    {
        return $this->hasMany(ApplicationTimeline::class)->orderBy('created_at', 'asc');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function adopter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
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

    /**
     * @return BelongsTo<User, $this>
     */
    public function releasingOfficer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'releasing_officer_id');
    }
}
