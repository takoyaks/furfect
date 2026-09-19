<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LandingPageConfig;
use App\Services\CloudinaryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class LandingPageBuilderController extends Controller
{
    /**
     * Display the Landing Page Web App Builder editor.
     */
    public function index(): Response
    {
        $config = LandingPageConfig::active();

        return Inertia::render('admin/cms/builder', [
            'config' => $config,
            'templates' => [
                [
                    'id' => 'honey_warm',
                    'name' => 'Warm Honey (Default)',
                    'description' => 'A cozy, inviting palette with warm amber highlights, perfect for pet adoption.',
                    'primary_color' => '#D4A017',
                    'preview_badge' => 'Recommended',
                ],
                [
                    'id' => 'emerald_nature',
                    'name' => 'Emerald Nature',
                    'description' => 'Fresh green hues emphasizing outdoor life, rescue, and vitality.',
                    'primary_color' => '#059669',
                    'preview_badge' => 'Popular',
                ],
                [
                    'id' => 'modern_slate',
                    'name' => 'Modern Slate',
                    'description' => 'Sleek, minimalist dark-slate styling with high-contrast accent cards.',
                    'primary_color' => '#3B82F6',
                    'preview_badge' => 'Clean',
                ],
            ],
        ]);
    }

    /**
     * Update the Landing Page configuration settings.
     */
    public function update(Request $request, CloudinaryService $cloudinary): RedirectResponse
    {
        $config = LandingPageConfig::active();

        $validated = $request->validate([
            'template_name' => ['required', 'string', 'in:honey_warm,emerald_nature,modern_slate'],
            'hero_title' => ['required', 'string', 'max:255'],
            'hero_subtitle' => ['required', 'string', 'max:1000'],
            'hero_cta_text' => ['required', 'string', 'max:100'],
            'hero_cta_link' => ['required', 'string', 'max:255'],
            'theme_color' => ['required', 'string', 'max:50'],
            'section_settings' => ['required', 'array'],
            'hero_image' => ['nullable', 'image', 'max:4096'],
            'about_title' => ['nullable', 'string', 'max:255'],
            'about_mission' => ['nullable', 'string', 'max:2000'],
            'about_phone' => ['nullable', 'string', 'max:255'],
            'about_email' => ['nullable', 'string', 'max:255'],
            'about_location' => ['nullable', 'string', 'max:255'],
            'about_hours' => ['nullable', 'string', 'max:255'],
            'how_it_works_steps' => ['nullable', 'array'],
        ]);

        if ($request->hasFile('hero_image')) {
            $rawHero = $config->getRawOriginal('hero_image_path');
            if ($rawHero) {
                if (str_starts_with($rawHero, 'http://') || str_starts_with($rawHero, 'https://')) {
                    $cloudinary->delete($rawHero);
                } elseif (Storage::disk('public')->exists($rawHero)) {
                    Storage::disk('public')->delete($rawHero);
                }
            }

            if ($cloudinary->isConfigured()) {
                $upload = $cloudinary->upload($request->file('hero_image'), 'landing');
                $validated['hero_image_path'] = $upload['secure_url'];
            } else {
                $validated['hero_image_path'] = $request->file('hero_image')->store('landing', 'public');
            }
        }

        if (isset($validated['section_settings']) && is_array($validated['section_settings'])) {
            $normalized = [];
            foreach ($validated['section_settings'] as $key => $val) {
                $normalized[$key] = filter_var($val, FILTER_VALIDATE_BOOLEAN);
            }
            $validated['section_settings'] = $normalized;
        }

        unset($validated['hero_image']);

        $config->update($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Landing Page settings and CMS content updated successfully.'),
        ]);

        return back();
    }
}
