<?php

namespace App\Http\Controllers\Shelter;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Services\CloudinaryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    /**
     * Display a listing of announcements for shelter staff.
     */
    public function index(Request $request): Response
    {
        $query = Announcement::query();

        if ($request->filled('search')) {
            $query->where('title', 'like', '%'.$request->search.'%')
                ->orWhere('category', 'like', '%'.$request->search.'%');
        }

        $announcements = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('shelter/cms/announcements/index', [
            'announcements' => $announcements,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Store a newly created announcement.
     */
    public function store(Request $request, CloudinaryService $cloudinary): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'content' => ['required', 'string', 'max:5000'],
            'is_published' => ['required', 'boolean'],
            'image' => ['nullable', 'image', 'max:4096'],
            'video' => ['nullable', 'file', 'mimetypes:video/mp4,video/quicktime,video/webm', 'max:51200'],
            'video_thumbnail' => ['nullable', 'image', 'max:4096'],
            'video_duration' => ['nullable', 'integer', 'min:1', 'max:600'],
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            if ($cloudinary->isConfigured()) {
                $upload = $cloudinary->upload($request->file('image'), 'announcements');
                $imagePath = $upload['secure_url'];
            } else {
                $imagePath = $request->file('image')->store('announcements', 'public');
            }
        }

        $videoPath = null;
        $videoThumbnailPath = null;
        if ($request->hasFile('video')) {
            if ($request->hasFile('video_thumbnail')) {
                if ($cloudinary->isConfigured()) {
                    $thumbUpload = $cloudinary->upload($request->file('video_thumbnail'), 'announcements/thumbnails');
                    $videoThumbnailPath = $thumbUpload['secure_url'];
                } else {
                    $videoThumbnailPath = $request->file('video_thumbnail')->store('announcements/thumbnails', 'public');
                }
            }

            if ($cloudinary->isConfigured()) {
                $upload = $cloudinary->uploadVideo($request->file('video'), 'announcements/videos');
                $videoPath = $cloudinary->getOptimizedVideoUrl($upload['secure_url']);
                if (! $videoThumbnailPath) {
                    $videoThumbnailPath = $cloudinary->getVideoPosterUrl($upload['secure_url']);
                }
            } else {
                $videoPath = $request->file('video')->store('announcements/videos', 'public');
            }
        }

        Announcement::create([
            'title' => $validated['title'],
            'slug' => Str::slug($validated['title']).'-'.Str::random(5),
            'category' => $validated['category'],
            'content' => $validated['content'],
            'image_path' => $imagePath,
            'video_path' => $videoPath,
            'video_thumbnail_path' => $videoThumbnailPath,
            'video_duration' => $request->input('video_duration'),
            'is_published' => $validated['is_published'],
            'published_at' => $validated['is_published'] ? now() : null,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Announcement created successfully.'),
        ]);

        return redirect()->route('shelter.cms.announcements.index');
    }

    /**
     * Update an existing announcement.
     */
    public function update(Request $request, int $id, CloudinaryService $cloudinary): RedirectResponse
    {
        $announcement = Announcement::findOrFail($id);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'content' => ['required', 'string', 'max:5000'],
            'is_published' => ['required', 'boolean'],
            'image' => ['nullable', 'image', 'max:4096'],
            'video' => ['nullable', 'file', 'mimetypes:video/mp4,video/quicktime,video/webm', 'max:51200'],
            'video_thumbnail' => ['nullable', 'image', 'max:4096'],
            'video_duration' => ['nullable', 'integer', 'min:1', 'max:600'],
            'delete_video' => ['nullable', 'boolean'],
        ]);

        $imagePath = $announcement->getRawOriginal('image_path');
        if ($request->hasFile('image')) {
            if ($cloudinary->isConfigured()) {
                $upload = $cloudinary->upload($request->file('image'), 'announcements');
                $imagePath = $upload['secure_url'];
            } else {
                $imagePath = $request->file('image')->store('announcements', 'public');
            }
        }

        $wasPublished = $announcement->is_published;
        $isPublished = (bool) $validated['is_published'];
        $publishedAt = $announcement->published_at;

        if (! $wasPublished && $isPublished) {
            $publishedAt = now();
        }

        $updateData = [
            'title' => $validated['title'],
            'category' => $validated['category'],
            'content' => $validated['content'],
            'image_path' => $imagePath,
            'is_published' => $isPublished,
            'published_at' => $publishedAt,
        ];

        // Handle video deletion
        if ($request->boolean('delete_video') && ! $request->hasFile('video')) {
            $updateData['video_path'] = null;
            $updateData['video_thumbnail_path'] = null;
            $updateData['video_duration'] = null;
        }

        if ($request->hasFile('video')) {
            $videoThumbnailPath = null;
            if ($request->hasFile('video_thumbnail')) {
                if ($cloudinary->isConfigured()) {
                    $thumbUpload = $cloudinary->upload($request->file('video_thumbnail'), 'announcements/thumbnails');
                    $videoThumbnailPath = $thumbUpload['secure_url'];
                } else {
                    $videoThumbnailPath = $request->file('video_thumbnail')->store('announcements/thumbnails', 'public');
                }
            }

            if ($cloudinary->isConfigured()) {
                $upload = $cloudinary->uploadVideo($request->file('video'), 'announcements/videos');
                $updateData['video_path'] = $cloudinary->getOptimizedVideoUrl($upload['secure_url']);
                $updateData['video_thumbnail_path'] = $videoThumbnailPath ?: $cloudinary->getVideoPosterUrl($upload['secure_url']);
            } else {
                $updateData['video_path'] = $request->file('video')->store('announcements/videos', 'public');
                $updateData['video_thumbnail_path'] = $videoThumbnailPath;
            }
            $updateData['video_duration'] = $request->input('video_duration');
        }

        $announcement->update($updateData);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Announcement updated successfully.'),
        ]);

        return redirect()->route('shelter.cms.announcements.index');
    }

    /**
     * Delete an announcement.
     */
    public function destroy(int $id): RedirectResponse
    {
        $announcement = Announcement::findOrFail($id);

        $announcement->delete();

        Inertia::flash('toast', [
            'type' => 'info',
            'message' => __('Announcement removed.'),
        ]);

        return redirect()->route('shelter.cms.announcements.index');
    }
}
