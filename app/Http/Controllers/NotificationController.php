<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * List the authenticated user's recent notifications.
     */
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->take(20)
            ->get()
            ->map(function ($notification) {
                $data = is_array($notification->data) ? $notification->data : json_decode($notification->data ?? '{}', true);

                return [
                    'id' => $notification->id,
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
                    'read_at' => $notification->read_at ? $notification->read_at->toIso8601String() : null,
                    'created_at' => $notification->created_at ? $notification->created_at->diffForHumans() : 'Just now',
                    'created_at_iso' => $notification->created_at ? $notification->created_at->toIso8601String() : now()->toIso8601String(),
                ];
            });

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    /**
     * Mark a specific notification as read.
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()
            ->notifications()
            ->where('id', $id)
            ->first();

        if ($notification) {
            $notification->markAsRead();
        }

        return response()->json(['success' => true]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['success' => true]);
    }
}
