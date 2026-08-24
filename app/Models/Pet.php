<?php

namespace App\Models;

use Database\Factories\PetFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $shelter_id
 * @property string $name
 * @property string $species
 * @property string|null $breed
 * @property int $age_years
 * @property string $gender
 * @property string $size
 * @property string|null $health_status
 * @property array<string>|null $temperament
 * @property string $energy_level
 * @property bool $requires_experience
 * @property bool $requires_yard
 * @property bool $requires_no_children
 * @property bool $requires_no_other_pets
 * @property array<string>|null $housing_compatible
 * @property float $adoption_fee
 * @property string|null $description
 * @property string $status
 * @property Carbon|null $listed_at
 */
class Pet extends Model
{
    /** @use HasFactory<PetFactory> */
    use HasFactory;

    protected $fillable = [
        'shelter_id',
        'name',
        'species',
        'breed',
        'tag_number',
        'microchip_number',
        'age_years',
        'gender',
        'size',
        'health_status',
        'temperament',
        'energy_level',
        'requires_experience',
        'requires_yard',
        'requires_no_children',
        'requires_no_other_pets',
        'housing_compatible',
        'housing_area',
        'housing_notes',
        'intake_date',
        'adoption_fee',
        'description',
        'status',
        'listed_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'temperament' => 'array',
            'housing_compatible' => 'array',
            'requires_experience' => 'boolean',
            'requires_yard' => 'boolean',
            'requires_no_children' => 'boolean',
            'requires_no_other_pets' => 'boolean',
            'adoption_fee' => 'decimal:2',
            'listed_at' => 'datetime',
            'intake_date' => 'date',
        ];
    }

    /**
     * @return BelongsTo<Shelter, $this>
     */
    public function shelter(): BelongsTo
    {
        return $this->belongsTo(Shelter::class);
    }

    /**
     * @return HasMany<PetPhoto, $this>
     */
    public function photos(): HasMany
    {
        return $this->hasMany(PetPhoto::class)->orderBy('sort_order');
    }

    /**
     * @return HasOne<PetPhoto, $this>
     */
    public function primaryPhoto(): HasOne
    {
        return $this->hasOne(PetPhoto::class)->where('is_primary', true);
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
}
