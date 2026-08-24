import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Bell,
    FileCheck,
    ShieldCheck,
    AlertCircle,
    Award,
    ClipboardList,
    CheckCircle,
    Check,
    Clock,
    HeartHandshake,
    Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NotificationItem {
    id: string;
    data: {
        title: string;
        message: string;
        icon: string;
        color: string;
        action_url: string;
        event: string;
        application_id?: number;
        reference_number?: string;
        pet_name?: string;
    };
    read_at: string | null;
    created_at: string;
    created_at_iso: string;
}

const iconMap: Record<string, typeof Bell> = {
    'file-check': FileCheck,
    'shield-check': ShieldCheck,
    'alert-circle': AlertCircle,
    'award': Award,
    'clipboard-list': ClipboardList,
    'check-circle': CheckCircle,
    'clock': Clock,
    'heart-handshake': HeartHandshake,
    'zap': Zap,
    'bell': Bell,
};

const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    amber: 'bg-amber-100 text-amber-600',
    gray: 'bg-gray-100 text-gray-600',
};

export function NotificationCenter() {
    const page = usePage();
    const notificationsData = (page.props as any).notifications ?? {};
    const unreadCount: number = notificationsData?.unreadCount ?? 0;
    const initialList: NotificationItem[] = notificationsData?.list ?? [];

    const [notifications, setNotifications] = useState<NotificationItem[]>(initialList);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    // Keep notifications synced whenever page props update
    useEffect(() => {
        if (notificationsData?.list) {
            setNotifications(notificationsData.list);
        }
    }, [notificationsData?.list]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await fetch(route('notifications.index'), {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            const data = await response.json();
            if (data.notifications && data.notifications.length > 0) {
                setNotifications(data.notifications);
            }
        } catch {
            // fallback gracefully to shared props list
        }
        setLoading(false);
    };

    useEffect(() => {
        if (open) {
            fetchNotifications();
        }
    }, [open]);

    const markAsRead = async (id: string, actionUrl: string) => {
        try {
            await fetch(route('notifications.read', { id }), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
        } catch {
            // silently fail
        }
        setOpen(false);
        router.visit(actionUrl);
    };

    const markAllAsRead = async () => {
        try {
            await fetch(route('notifications.read-all'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
            router.reload({ only: ['notifications'] });
        } catch {
            // silently fail
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Bell className="h-5 w-5 text-gray-600" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 p-0">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <p className="text-xs text-gray-500">{unreadCount} unread</p>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-[#D4A017] hover:text-[#B8860B] h-7 px-2 gap-1"
                            onClick={markAllAsRead}
                        >
                            <Check className="h-3 w-3" />
                            Mark all read
                        </Button>
                    )}
                </div>

                {/* Notification List */}
                <div className="max-h-80 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-[#D4A017]" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                            <Bell className="h-8 w-8 mb-2 opacity-40" />
                            <p className="text-xs font-medium">No notifications yet</p>
                            <p className="text-[10px] text-gray-300 mt-0.5">You'll see updates about your applications here.</p>
                        </div>
                    ) : (
                        notifications.map((notification) => {
                            const { data } = notification;
                            const IconComponent = iconMap[data.icon] ?? Bell;
                            const colorClass = colorMap[data.color] ?? colorMap.gray;
                            const isUnread = !notification.read_at;

                            return (
                                <button
                                    key={notification.id}
                                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 border-b border-gray-50 last:border-0 ${isUnread ? 'bg-blue-50/30' : ''}`}
                                    onClick={() => markAsRead(notification.id, data.action_url)}
                                >
                                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                                        <IconComponent className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={`text-xs leading-tight ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                {data.title}
                                            </p>
                                            {isUnread && (
                                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                                            )}
                                        </div>
                                        <p className="text-[11px] text-gray-500 leading-snug mt-0.5 line-clamp-2">{data.message}</p>
                                        <p className="text-[10px] text-gray-400 mt-1">{notification.created_at}</p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
