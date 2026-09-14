<?php

namespace App\Http\Controllers\Shelter;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
    public function store(Request $request): RedirectResponse
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
            $imagePath = $request->file('image')->store('announcements', 'public');
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
            'message' => __('Announcement created successfully.'),
        ]);

        return redirect()->route('shelter.cms.announcements.index');
    }

    /**
     * Update an existing announcement.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $announcement = Announcement::findOrFail($id);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'content' => ['required', 'string', 'max:5000'],
            'is_published' => ['required', 'boolean'],
            'image' => ['nullable', 'image', 'max:4096'],
        ]);

        $imagePath = $announcement->image_path;
        if ($request->hasFile('image')) {
            if ($imagePath && Storage::disk('public')->exists($imagePath)) {
                Storage::disk('public')->delete($imagePath);
            }
            $imagePath = $request->file('image')->store('announcements', 'public');
        }

        $wasPublished = $announcement->is_published;
        $isPublished = (bool) $validated['is_published'];
        $publishedAt = $announcement->published_at;

        if (! $wasPublished && $isPublished) {
            $publishedAt = now();
        }

        $announcement->update([
            'title' => $validated['title'],
            'category' => $validated['category'],
            'content' => $validated['content'],
            'image_path' => $imagePath,
            'is_published' => $isPublished,
            'published_at' => $publishedAt,
        ]);

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

        if ($announcement->image_path && Storage::disk('public')->exists($announcement->image_path)) {
            Storage::disk('public')->delete($announcement->image_path);
        }

        $announcement->delete();

        Inertia::flash('toast', [
            'type' => 'info',
            'message' => __('Announcement removed.'),
        ]);

        return redirect()->route('shelter.cms.announcements.index');
    }
}
