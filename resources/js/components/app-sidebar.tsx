import { Link, usePage } from '@inertiajs/react';
import { 
    LayoutGrid, 
    Sparkles, 
    Heart, 
    FileCheck, 
    FolderGit2, 
    ClipboardList, 
    BookOpen, 
    Users, 
    Home, 
    Cat,
    Settings, 
    HelpCircle,
    ShieldCheck,
    Wand2,
    Megaphone
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import admin from '@/routes/admin';
import shelter from '@/routes/shelter';
import type { NavGroup, NavItem } from '@/types';

export function AppSidebar() {
    const { auth } = usePage().props;
    const user = auth.user;
    const roles = (user?.roles as string[]) || [];

    // Helper to generate navigation groups based on roles
    const getNavGroups = (): NavGroup[] => {
        if (!user) return [];

        if (roles.includes('admin')) {
            return [
                {
                    title: 'Main',
                    items: [
                        {
                            title: 'Dashboard',
                            href: route('admin.dashboard'),
                            icon: LayoutGrid,
                        },
                        {
                            title: 'Application',
                            href: route('admin.applications.index'),
                            icon: ClipboardList,
                        },
                        {
                            title: 'Pets',
                            href: route('admin.pets.index'),
                            icon: Cat,
                        },
                        {
                            title: 'Users',
                            href: route('admin.users.index'),
                            icon: Users,
                        },
                    ],
                },
                {
                    title: 'Management',
                    items: [
                        {
                            title: 'Shelters',
                            href: route('admin.shelters.index'),
                            icon: Home,
                        },
                        {
                            title: 'MAO Audit',
                            href: route('mao.applications.index'),
                            icon: ShieldCheck,
                        },
                        {
                            title: 'Reports',
                            href: route('admin.reports.index'),
                            icon: BookOpen,
                        },
                    ],
                },
                {
                    title: 'Content & Pages',
                    items: [
                        {
                            title: 'Landing Builder',
                            href: admin.cms.builder.index().url,
                            icon: Wand2,
                        },
                        {
                            title: 'Announcements',
                            href: admin.cms.announcements.index().url,
                            icon: Megaphone,
                        },
                    ],
                },
                {
                    title: 'System',
                    items: [
                        {
                            title: 'Settings',
                            href: route('admin.settings.index'),
                            icon: Settings,
                        },
                    ],
                },
            ];
        }

        if (roles.includes('shelter_staff')) {
            return [
                {
                    title: 'Main',
                    items: [
                        {
                            title: 'Dashboard',
                            href: shelter.dashboard().url,
                            icon: LayoutGrid,
                        },
                        {
                            title: 'Pets',
                            href: shelter.pets.index().url,
                            icon: FolderGit2,
                        },
                        {
                            title: 'Application',
                            href: shelter.applications.index().url,
                            icon: ClipboardList,
                        },
                        {
                            title: 'Reports',
                            href: shelter.reports.index().url,
                            icon: BookOpen,
                        },
                    ],
                },
                {
                    title: 'Content & Pages',
                    items: [
                        {
                            title: 'Announcements',
                            href: shelter.cms.announcements.index().url,
                            icon: Megaphone,
                        },
                    ],
                },
            ];
        }

        if (roles.includes('mao_officer')) {
            return [
                {
                    title: 'Main',
                    items: [
                        {
                            title: 'Dashboard',
                            href: route('mao.dashboard'),
                            icon: LayoutGrid,
                        },
                        {
                            title: 'MAO Audit',
                            href: route('mao.applications.index'),
                            icon: ShieldCheck,
                        },
                        {
                            title: 'Reports',
                            href: route('mao.reports.index'),
                            icon: BookOpen,
                        },
                    ],
                },
            ];
        }

        // Default to Adopter Role
        return [
            {
                title: 'Main',
                items: [
                    {
                        title: 'Dashboard',
                        href: dashboard(),
                        icon: LayoutGrid,
                    },
                    {
                        title: 'Browse Pets',
                        href: route('pets.index'),
                        icon: Heart,
                    },
                    {
                        title: 'My Matches',
                        href: route('matches.index'),
                        icon: Sparkles,
                    },
                    {
                        title: 'My Application',
                        href: route('application.show'),
                        icon: FileCheck,
                    },
                ],
            },
        ];
    };

    const navGroups = getNavGroups();

    const footerNavItems: NavItem[] = [
        {
            title: 'Help Center',
            href: '#',
            icon: HelpCircle,
        },
    ];

    // Determine dashboard logo link
    const getLogoLink = () => {
        if (roles.includes('admin')) {
            return route('admin.dashboard');
        }
        if (roles.includes('mao_officer')) {
            return route('mao.dashboard');
        }
        if (roles.includes('shelter_staff')) {
            return route('shelter.dashboard');
        }
        return dashboard();
    };

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            render={
                                <Link href={getLogoLink()} prefetch>
                                    <AppLogo />
                                </Link>
                            }
                        />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain groups={navGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

