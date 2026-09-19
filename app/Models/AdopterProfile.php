<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $full_name
 * @property string $contact_number
 * @property string $date_of_birth
 * @property string $home_address
 * @property string $valid_id_type
 * @property string $valid_id_number
 * @property string|null $id_document_path
 * @property string|null $id_document_mime
 * @property string|null $id_document_name
 * @property string|null $id_document_back_path
 * @property string|null $id_document_back_mime
 * @property string|null $id_document_back_name
 * @property string $had_pets_before
 * @property string|null $previous_pet_notes
 * @property bool $surrendered_pet
 * @property string $adoption_reason
 * @property string|null $adoption_reason_text
 * @property string $pet_stay
 * @property bool $is_identity_verified
 * @property Carbon|null $identity_verified_at
 * @property string|null $identity_verification_provider
 * @property string|null $didit_session_id
 * @property float|null $face_match_score
 * @property bool $liveness_verified
 * @property Carbon|null $profile_completed_at
 */
class AdopterProfile extends Model
{
    protected $fillable = [
        'user_id',
        'full_name',
        'contact_number',
        'date_of_birth',
        'home_address',
        'valid_id_type',
        'valid_id_number',
        'id_document_path',
        'id_document_mime',
        'id_document_name',
        'id_document_back_path',
        'id_document_back_mime',
        'id_document_back_name',
        'is_identity_verified',
        'identity_verified_at',
        'identity_verification_provider',
        'didit_session_id',
        'face_match_score',
        'liveness_verified',
        'had_pets_before',
        'previous_pet_notes',
        'surrendered_pet',
        'adoption_reason',
        'adoption_reason_text',
        'pet_stay',
        'profile_completed_at',
    ];

    public function hasIdDocument(): bool
    {
        return ! empty($this->id_document_path) || ! empty($this->id_document_back_path) || $this->is_identity_verified;
    }

    public function hasFrontIdDocument(): bool
    {
        return ! empty($this->id_document_path);
    }

    public function hasBackIdDocument(): bool
    {
        return ! empty($this->id_document_back_path);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'surrendered_pet' => 'boolean',
            'is_identity_verified' => 'boolean',
            'liveness_verified' => 'boolean',
            'face_match_score' => 'float',
            'identity_verified_at' => 'datetime',
            'profile_completed_at' => 'datetime',
            'date_of_birth' => 'date',
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
     * @return HasMany<DiditVerification, $this>
     */
    public function diditVerifications(): HasMany
    {
        return $this->hasMany(DiditVerification::class);
    }
}
