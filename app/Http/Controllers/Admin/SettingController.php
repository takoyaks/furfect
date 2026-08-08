<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    /**
     * Display current system settings.
     */
    public function index(): Response
    {
        $settings = SystemSetting::all();

        return Inertia::render('admin/settings/index', [
            'settings' => $settings,
        ]);
    }

    /**
     * Update settings.
     */
    public function update(Request $request): RedirectResponse
    {
        $rules = [];
        $settings = SystemSetting::all();

        foreach ($settings as $setting) {
            $rules[$setting->key] = $setting->type === 'integer'
                ? ['required', 'integer']
                : ['required', 'string'];
        }

        $validated = $request->validate($rules);

        foreach ($validated as $key => $value) {
            SystemSetting::set($key, $value);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('System settings updated successfully.')
        ]);

        return back();
    }
}
