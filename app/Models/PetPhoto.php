<?php

namespace App\Models;

use App\Traits\DeletesMediaAssets;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property int $pet_id
 * @property string $photo_path
 * @property string $media_type
 * @property string|null $video_path
 * @property string|null $thumbnail_path
 * @property int|null $duration_seconds
 * @property bool $is_primary
 * @property int $sort_order
 */
class PetPhoto extends Model
{
    use DeletesMediaAssets;

    protected $fillable = [
        'pet_id',
        'photo_path',
        'media_type',
        'video_path',
        'thumbnail_path',
        'duration_seconds',
        'is_primary',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
            'sort_order' => 'integer',
            'duration_seconds' => 'integer',
        ];
    }

    /**
     * Get the photo full URL (or thumbnail full URL if video).
     *
     * @return Attribute<string|null, string|null>
     */
    protected function photoPath(): Attribute
    {
        return Attribute::make(
            get: function (?string $value, array $attributes) {
                $target = $value ?: ($attributes['thumbnail_path'] ?? null);

                return $target ? (str_starts_with($target, 'http://') || str_starts_with($target, 'https://') ? $target : (str_starts_with($target, '/storage/') ? $target : Storage::url($target))) : null;
            },
        );
    }

    /**
     * Get the video full URL.
     *
     * @return Attribute<string|null, string|null>
     */
    protected function videoPath(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => $value ? (str_starts_with($value, 'http://') || str_starts_with($value, 'https://') ? $value : (str_starts_with($value, '/storage/') ? $value : Storage::url($value))) : null,
        );
    }

    /**
     * Get the video thumbnail full URL.
     *
     * @return Attribute<string|null, string|null>
     */
    protected function thumbnailPath(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => $value ? (str_starts_with($value, 'http://') || str_starts_with($value, 'https://') ? $value : (str_starts_with($value, '/storage/') ? $value : Storage::url($value))) : null,
        );
    }

    /**
     * Check if this media item is a video.
     */
    public function isVideo(): bool
    {
        return $this->media_type === 'video';
    }

    /**
     * @return BelongsTo<Pet, $this>
     */
    public function pet(): BelongsTo
    {
        return $this->belongsTo(Pet::class);
    }

    protected static function booted(): void
    {
        static::updating(function (PetPhoto $photo): void {
            if ($photo->isDirty('photo_path')) {
                $oldPath = $photo->getRawOriginal('photo_path');
                if ($oldPath) {
                    static::deleteStoredMedia($oldPath);
                }
            }

            if ($photo->isDirty('video_path')) {
                $oldVideo = $photo->getRawOriginal('video_path');
                if ($oldVideo) {
                    static::deleteStoredMedia($oldVideo, ['resource_type' => 'video']);
                }
            }

            if ($photo->isDirty('thumbnail_path')) {
                $oldThumb = $photo->getRawOriginal('thumbnail_path');
                if ($oldThumb) {
                    static::deleteStoredMedia($oldThumb);
                }
            }
        });

        static::deleting(function (PetPhoto $photo): void {
            $rawVideo = $photo->getRawOriginal('video_path');
            if ($rawVideo) {
                static::deleteStoredMedia($rawVideo, ['resource_type' => 'video']);
            }

            $rawThumb = $photo->getRawOriginal('thumbnail_path');
            if ($rawThumb) {
                static::deleteStoredMedia($rawThumb);
            }

            $rawPath = $photo->getRawOriginal('photo_path');
            if ($rawPath) {
                static::deleteStoredMedia($rawPath);
            }
        });
    }
}
