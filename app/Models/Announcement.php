<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $title
 * @property string $slug
 * @property string $category
 * @property string $content
 * @property string|null $image_path
 * @property string|null $video_path
 * @property string|null $video_thumbnail_path
 * @property int|null $video_duration
 * @property bool $is_published
 * @property Carbon|null $published_at
 */
class Announcement extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'category',
        'content',
        'image_path',
        'video_path',
        'video_thumbnail_path',
        'video_duration',
        'is_published',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'published_at' => 'datetime',
            'video_duration' => 'integer',
        ];
    }

    /**
     * Get the announcement image URL (fallback to video thumbnail if present).
     *
     * @return Attribute<string|null, string|null>
     */
    protected function imagePath(): Attribute
    {
        return Attribute::make(
            get: function (?string $value, array $attributes) {
                $target = $value ?: ($attributes['video_thumbnail_path'] ?? null);

                return $target ? (str_starts_with($target, 'http://') || str_starts_with($target, 'https://') ? $target : (str_starts_with($target, '/storage/') ? $target : Storage::url($target))) : null;
            },
        );
    }

    /**
     * Get the announcement video full URL.
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
     * Get the announcement video thumbnail full URL.
     *
     * @return Attribute<string|null, string|null>
     */
    protected function videoThumbnailPath(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => $value ? (str_starts_with($value, 'http://') || str_starts_with($value, 'https://') ? $value : (str_starts_with($value, '/storage/') ? $value : Storage::url($value))) : null,
        );
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($announcement) {
            if (empty($announcement->slug)) {
                $announcement->slug = Str::slug($announcement->title).'-'.Str::random(5);
            }
            if (empty($announcement->published_at) && $announcement->is_published) {
                $announcement->published_at = now();
            }
        });
    }
}
