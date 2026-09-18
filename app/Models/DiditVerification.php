<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int|null $adopter_profile_id
 * @property string $session_id
 * @property string|null $session_token
 * @property string|null $workflow_id
 * @property string|null $url
 * @property string $status
 * @property string|null $id_verification_status
 * @property string|null $liveness_status
 * @property float|null $liveness_score
 * @property string|null $face_match_status
 * @property float|null $face_match_score
 * @property array<string, mixed>|null $extracted_data
 * @property array<string, mixed>|null $raw_decision
 * @property array<int, string>|null $failure_reasons
 * @property Carbon|null $verified_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class DiditVerification extends Model
{
    protected $fillable = [
        'user_id',
        'adopter_profile_id',
        'session_id',
        'session_token',
        'workflow_id',
        'url',
        'status',
        'id_verification_status',
        'liveness_status',
        'liveness_score',
        'face_match_status',
        'face_match_score',
        'extracted_data',
        'raw_decision',
        'failure_reasons',
        'verified_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'extracted_data' => 'array',
            'raw_decision' => 'array',
            'failure_reasons' => 'array',
            'liveness_score' => 'float',
            'face_match_score' => 'float',
            'verified_at' => 'datetime',
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
     * @return BelongsTo<AdopterProfile, $this>
     */
    public function adopterProfile(): BelongsTo
    {
        return $this->belongsTo(AdopterProfile::class);
    }

    public function isApproved(): bool
    {
        return in_array(strtolower($this->status), ['approved', 'completed', 'successful']);
    }

    public function isLivenessPassed(): bool
    {
        return in_array(strtolower((string) $this->liveness_status), ['passed', 'approved', 'successful', 'success'])
            || ($this->liveness_score !== null && $this->liveness_score >= 50.0);
    }

    public function isFaceMatched(): bool
    {
        return in_array(strtolower((string) $this->face_match_status), ['matched', 'approved', 'successful', 'success'])
            || ($this->face_match_score !== null && $this->face_match_score >= 50.0);
    }
}
