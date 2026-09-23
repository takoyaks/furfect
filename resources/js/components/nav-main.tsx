import { Link, usePage } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    sidebarMenuButtonVariants,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useThemeTemplate } from '@/hooks/use-theme-template';
import { cn } from '@/lib/utils';
import type { NavGroup, NavItem } from '@/types';

interface NavMainProps {
    groups?: NavGroup[];
    items?: NavItem[];
}

export function NavMain({ groups, items }: NavMainProps) {
    const theme = useThemeTemplate();
    const { isCurrentUrl } = useCurrentUrl();
    const page = usePage();
    const notificationsData = (page.props as any).notifications ?? {};

    const effectiveGroups: NavGroup[] = groups ?? (items ? [{ title: 'Main', items }] : []);

    // Map nav item titles to badge counts
    const getBadgeCount = (title: string): number | null => {
        if (title === 'Application' && notificationsData.pendingShelterCount > 0) {
            return notificationsData.pendingShelterCount;
        }
        if (title === 'MAO Audit' && notificationsData.pendingMaoCount > 0) {
            return notificationsData.pendingMaoCount;
        }
        return null;
    };

    return (
        <>
            {effectiveGroups.map((group, groupIdx) => (
                <SidebarGroup key={group.title || groupIdx} className="px-2 py-1">
                    {group.title && <SidebarGroupLabel>{group.title}</SidebarGroupLabel>}
                    <SidebarMenu>
                        {group.items.map((item) => {
                            const active = isCurrentUrl(item.href);
                            const badgeCount = getBadgeCount(item.title);
                            return (
                                <SidebarMenuItem key={item.title}>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            sidebarMenuButtonVariants({ variant: 'default', size: 'default' }),
                                            active
                                                ? `${theme.sidebarActive} shadow-2xs`
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                                        )}
                                    >
                                        {item.icon && (
                                            <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", active ? theme.sidebarActiveIcon : theme.sidebarInactiveIcon)} />
                                        )}
                                        <span className="flex-1">{item.title}</span>
                                        {badgeCount !== null && (
                                            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                                                {badgeCount > 99 ? '99+' : badgeCount}
                                            </span>
                                        )}
                                    </Link>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </>
    );
}
