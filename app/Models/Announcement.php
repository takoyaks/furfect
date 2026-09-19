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
        'is_published',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    /**
     * Get the announcement image URL.
     *
     * @return Attribute<string|null, string|null>
     */
    protected function imagePath(): Attribute
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
