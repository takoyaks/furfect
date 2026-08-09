<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
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
