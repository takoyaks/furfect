<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Services\CloudinaryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    /**
     * Display a listing of announcements.
     */
    public function index(Request $request): Response
    {
        $query = Announcement::query();

        if ($request->filled('search')) {
            $query->where('title', 'like', '%'.$request->search.'%')
                ->orWhere('category', 'like', '%'.$request->search.'%');
        }

        $announcements = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('admin/cms/announcements/index', [
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

        Announcement::create([
            'title' => $validated['title'],
            'slug' => Str::slug($validated['title']).'-'.Str::random(5),
            'category' => $validated['category'],
            'content' => $validated['content'],
            'image_path' => $imagePath,
            'is_published' => $validated['is_published'],
            'published_at' => $validated['is_published'] ? now() : null,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Announcement published successfully.'),
        ]);

        return back();
    }

    /**
     * Update the specified announcement.
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
        ]);

        if ($request->hasFile('image')) {
            $rawImage = $announcement->getRawOriginal('image_path');
            if ($rawImage) {
                if (str_starts_with($rawImage, 'http://') || str_starts_with($rawImage, 'https://')) {
                    $cloudinary->delete($rawImage);
                } elseif (Storage::disk('public')->exists($rawImage)) {
                    Storage::disk('public')->delete($rawImage);
                }
            }

            if ($cloudinary->isConfigured()) {
                $upload = $cloudinary->upload($request->file('image'), 'announcements');
                $announcement->image_path = $upload['secure_url'];
            } else {
                $announcement->image_path = $request->file('image')->store('announcements', 'public');
            }
        }

        $announcement->update([
            'title' => $validated['title'],
            'category' => $validated['category'],
            'content' => $validated['content'],
            'is_published' => $validated['is_published'],
            'published_at' => $validated['is_published'] ? ($announcement->published_at ?? now()) : null,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Announcement updated successfully.'),
        ]);

        return back();
    }

    /**
     * Remove the specified announcement.
     */
    public function destroy(int $id, CloudinaryService $cloudinary): RedirectResponse
    {
        $announcement = Announcement::findOrFail($id);

        $rawImage = $announcement->getRawOriginal('image_path');
        if ($rawImage) {
            if (str_starts_with($rawImage, 'http://') || str_starts_with($rawImage, 'https://')) {
                $cloudinary->delete($rawImage);
            } elseif (Storage::disk('public')->exists($rawImage)) {
                Storage::disk('public')->delete($rawImage);
            }
        }

        $announcement->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Announcement deleted successfully.'),
        ]);

        return back();
    }
}
