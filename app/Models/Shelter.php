<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string $type
 * @property string $location
 * @property string $contact
 * @property string|null $email
 * @property string $status
 */
class Shelter extends Model
{
    /** @use HasFactory<\Database\Factories\ShelterFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'location',
        'contact',
        'email',
        'status',
    ];

    /**
     * @return HasMany<Pet, $this>
     */
    public function pets(): HasMany
    {
        return $this->hasMany(Pet::class);
    }
}
