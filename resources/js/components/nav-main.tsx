import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
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
                        {group.items.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    isActive={isCurrentUrl(item.href)}
                                    tooltip={{ children: item.title }}
                                    render={
                                        <Link href={item.href} prefetch>
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </Link>
                                    }
                                />
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </>
    );
}

