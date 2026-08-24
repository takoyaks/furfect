<?php

namespace App\Http\Middleware;

use App\Models\Application;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        $notificationData = [];
        if ($user) {
            $roles = $user->getRoleNames()->toArray();

            $notificationData = [
                'unreadCount' => $user->unreadNotifications()->count(),
                'list' => $user->notifications()->latest()->take(15)->get()->map(function ($n) {
                    $data = is_array($n->data) ? $n->data : json_decode($n->data ?? '{}', true);

                    return [
                        'id' => $n->id,
                        'data' => [
                            'title' => $data['title'] ?? 'Application Update',
                            'message' => $data['message'] ?? '',
                            'icon' => $data['icon'] ?? 'bell',
                            'color' => $data['color'] ?? 'blue',
                            'action_url' => $data['action_url'] ?? route('application.show'),
                            'event' => $data['event'] ?? 'notification',
                            'application_id' => $data['application_id'] ?? null,
                            'reference_number' => $data['reference_number'] ?? null,
                            'pet_name' => $data['pet_name'] ?? null,
                        ],
                        'read_at' => $n->read_at ? $n->read_at->toIso8601String() : null,
                        'created_at' => $n->created_at ? $n->created_at->diffForHumans() : 'Just now',
                        'created_at_iso' => $n->created_at ? $n->created_at->toIso8601String() : now()->toIso8601String(),
                    ];
                })->values()->toArray(),
            ];

            // Pending review counts for sidebar badges
            if (in_array('shelter_staff', $roles) || in_array('admin', $roles)) {
                $notificationData['pendingShelterCount'] = Application::whereIn('status', ['pending', 'under_review'])->count();
            }

            if (in_array('mao_officer', $roles) || in_array('admin', $roles)) {
                $notificationData['pendingMaoCount'] = Application::where('status', 'mao_audit')->count();
            }
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? array_merge($user->toArray(), [
                    'roles' => $user->getRoleNames(),
                ]) : null,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'systemSettings' => [
                'pricing_enabled' => SystemSetting::get('pricing_enabled', false),
            ],
            'notifications' => $notificationData,
        ];
    }
}
