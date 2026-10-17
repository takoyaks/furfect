<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    /**
     * Display current system settings.
     */
    public function index(): Response
    {
        if (SystemSetting::count() === 0) {
            Artisan::call('db:seed', [
                '--class' => 'SystemSettingsSeeder',
                '--force' => true,
            ]);
        }

        $settings = SystemSetting::where('key', '!=', 'certificate_signatories')->get();
        $signatories = SystemSetting::get('certificate_signatories', []);

        return Inertia::render('admin/settings/index', [
            'settings' => $settings,
            'signatories' => is_array($signatories) ? $signatories : [],
        ]);
    }

    /**
     * Update settings.
     */
    public function update(Request $request): RedirectResponse
    {
        $rules = [];
        $settings = SystemSetting::where('key', '!=', 'certificate_signatories')->get();

        foreach ($settings as $setting) {
            $rules[$setting->key] = match ($setting->type) {
                'integer' => ['sometimes', 'nullable', 'integer'],
                'boolean' => ['sometimes', 'nullable'],
                default => ['sometimes', 'nullable', 'string'],
            };
        }

        $validated = $request->validate($rules);

        foreach ($settings as $setting) {
            if (! $request->has($setting->key)) {
                continue;
            }

            $value = $validated[$setting->key] ?? null;
            if ($setting->type === 'boolean' || str_ends_with($setting->key, '_enabled')) {
                $value = filter_var($request->input($setting->key), FILTER_VALIDATE_BOOLEAN) ? '1' : '0';
            }
            SystemSetting::set($setting->key, $value ?? '');
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('System settings updated successfully.'),
        ]);

        return back();
    }
}
