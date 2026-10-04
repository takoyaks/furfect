<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string|null $google_id
 * @property string|null $avatar
 * @property string|null $phone
 * @property string|null $address
 * @property string|null $bio
 * @property Carbon|null $email_verified_at
 * @property string|null $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'name',
    'email',
    'email_verified_at',
    'google_id',
    'password',
    'avatar',
    'phone',
    'address',
    'bio',
    'failed_login_attempts',
    'suspended_at',
    'suspended_reason',
    'lockout_until',
])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'failed_login_attempts' => 'integer',
            'suspended_at' => 'datetime',
            'lockout_until' => 'datetime',
        ];
    }

    /**
     * Determine if the user is suspended or locked out.
     */
    public function isSuspended(): bool
    {
        if ($this->suspended_at !== null) {
            return true;
        }

        if ($this->lockout_until !== null && $this->lockout_until->isFuture()) {
            return true;
        }

        return false;
    }

    /**
     * Suspend the user account with a reason.
     */
    public function suspend(string $reason): void
    {
        $this->update([
            'suspended_at' => now(),
            'suspended_reason' => $reason,
        ]);
    }

    /**
     * Unsuspend and unlock the user account.
     */
    public function unsuspend(): void
    {
        $this->update([
            'failed_login_attempts' => 0,
            'suspended_at' => null,
            'suspended_reason' => null,
            'lockout_until' => null,
        ]);
    }

    /**
     * Get the user's avatar URL.
     *
     * @return Attribute<string|null, string|null>
     */
    protected function avatar(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => $value ? (str_starts_with($value, 'http') ? $value : (str_starts_with($value, '/storage/') ? $value : Storage::url($value))) : null,
        );
    }

    /**
     * @return HasOne<AdopterProfile, $this>
     */
    public function adopterProfile(): HasOne
    {
        return $this->hasOne(AdopterProfile::class);
    }

    /**
     * @return HasOne<LifestyleProfile, $this>
     */
    public function lifestyleProfile(): HasOne
    {
        return $this->hasOne(LifestyleProfile::class);
    }

    /**
     * @return HasMany<Application, $this>
     */
    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    /**
     * @return HasMany<DssMatchScore, $this>
     */
    public function matchScores(): HasMany
    {
        return $this->hasMany(DssMatchScore::class);
    }

    /**
     * @return HasMany<SavedPet, $this>
     */
    public function savedPets(): HasMany
    {
        return $this->hasMany(SavedPet::class);
    }

    /**
     * @return HasMany<DiditVerification, $this>
     */
    public function diditVerifications(): HasMany
    {
        return $this->hasMany(DiditVerification::class);
    }

    /**
     * @return HasOne<DiditVerification, $this>
     */
    public function latestDiditVerification(): HasOne
    {
        return $this->hasOne(DiditVerification::class)->latestOfMany();
    }

    /**
     * Check if user's identity is verified.
     */
    public function isIdentityVerified(): bool
    {
        if ((bool) ($this->adopterProfile?->is_identity_verified)) {
            return true;
        }

        if ($this->latestDiditVerification?->isApproved()) {
            return true;
        }

        return false;
    }

    /**
     * Check if the adopter onboarding is complete (eKYC if enabled, personal info, lifestyle quiz).
     */
    public function hasCompletedOnboarding(): bool
    {
        $ekycEnabled = (bool) SystemSetting::get('ekyc_enabled', true);
        $identityVerified = $ekycEnabled ? ((bool) ($this->adopterProfile?->is_identity_verified)) : true;

        return $this->adopterProfile !== null
            && $identityVerified
            && $this->adopterProfile->profile_completed_at !== null
            && $this->lifestyleProfile !== null
            && $this->lifestyleProfile->submitted_at !== null;
    }

    /**
     * Check if user has linked their Google account.
     */
    public function hasGoogleLinked(): bool
    {
        return ! empty($this->google_id);
    }
}
