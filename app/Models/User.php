<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password'])]
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
        ];
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
     * Check if the adopter onboarding is complete (both profile steps done).
     */
    public function hasCompletedOnboarding(): bool
    {
        return $this->adopterProfile !== null
            && $this->adopterProfile->profile_completed_at !== null
            && $this->lifestyleProfile !== null
            && $this->lifestyleProfile->submitted_at !== null;
    }
}
