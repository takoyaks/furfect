import type { ComponentPropsWithoutRef } from 'react';
import { usePage } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { toUrl } from '@/lib/utils';
import type { NavItem } from '@/types';

export function NavFooter({
    items,
    className,
    ...props
}: ComponentPropsWithoutRef<typeof SidebarGroup> & {
    items: NavItem[];
}) {
    const { version } = usePage().props as { version?: string };
    return (
        <SidebarGroup
            {...props}
            className={`group-data-[collapsible=icon]:p-0 ${className || ''}`}
        >
            <SidebarGroupContent>
                {/* <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                className="text-neutral-600 hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-neutral-100"
                                render={
                                    <a
                                        href={toUrl(item.href)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {item.icon && (
                                            <item.icon className="h-5 w-5" />
                                        )}
                                        <span>{item.title}</span>
                                    </a>
                                }
                            />
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu> */}
                {version && (
                    <div className="px-2 pt-2 pb-1 text-[11px] font-mono text-muted-foreground/70 group-data-[collapsible=icon]:hidden flex items-center justify-between">
                        {/* <span className="truncate">Release</span> */}
                        <span className="truncate">
                            {version}
                        </span>
                    </div>
                )}
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
