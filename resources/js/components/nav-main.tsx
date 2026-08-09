import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    sidebarMenuButtonVariants,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import type { NavGroup, NavItem } from '@/types';

interface NavMainProps {
    groups?: NavGroup[];
    items?: NavItem[];
}

export function NavMain({ groups, items }: NavMainProps) {
    const { isCurrentUrl } = useCurrentUrl();

    const effectiveGroups: NavGroup[] = groups ?? (items ? [{ title: 'Main', items }] : []);

    return (
        <>
            {effectiveGroups.map((group, groupIdx) => (
                <SidebarGroup key={group.title || groupIdx} className="px-2 py-1">
                    {group.title && <SidebarGroupLabel>{group.title}</SidebarGroupLabel>}
                    <SidebarMenu>
                        {group.items.map((item) => {
                            const active = isCurrentUrl(item.href);
                            return (
                                <SidebarMenuItem key={item.title}>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            sidebarMenuButtonVariants({ variant: 'default', size: 'default' }),
                                            active && 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                                        )}
                                    >
                                        {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                                        <span>{item.title}</span>
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
