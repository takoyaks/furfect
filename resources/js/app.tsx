import { type ReactNode } from 'react';
import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem } from '@/types';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

const routesMap: Record<string, string> = {
    'home': '/',
    'dashboard': '/dashboard',
    'how-it-works': '/how-it-works',
    'about': '/about',
    
    'onboarding.personal.edit': '/onboarding/personal',
    'onboarding.personal.store': '/onboarding/personal',
    'onboarding.lifestyle.edit': '/onboarding/lifestyle',
    'onboarding.lifestyle.store': '/onboarding/lifestyle',
    
    'matches.index': '/matches',
    'history.index': '/history',
    'saved-pets.toggle': '/saved-pets/toggle',
    'application.show': '/application',
    'application.store': '/application',
    'application.transfer': '/application/transfer',
    'application.withdraw': '/application/withdraw',
    
    'notifications.index': '/notifications',
    'notifications.read': '/notifications/{id}/read',
    'notifications.read-all': '/notifications/read-all',
    
    'profile.edit': '/settings/profile',
    'profile.update': '/settings/profile',
    'profile.destroy': '/settings/profile',
    'security.edit': '/settings/security',
    'user-password.update': '/settings/password',
    'appearance.edit': '/settings/appearance',
    
    'pets.index': '/pets',
    'pets.show': '/pets/{id}',
    'announcements.index': '/announcements',
    'announcements.show': '/announcements/{id}',
    
    'shelter.applications.index': '/shelter/applications',
    'shelter.applications.show': '/shelter/applications/{id}',
    'shelter.applications.update': '/shelter/applications/{id}',
    'shelter.pets.index': '/shelter/pets',
    'shelter.pets.create': '/shelter/pets/create',
    'shelter.pets.store': '/shelter/pets',
    'shelter.pets.edit': '/shelter/pets/{id}/edit',
    'shelter.pets.update': '/shelter/pets/{id}',
    'shelter.pets.destroy': '/shelter/pets/{id}',
    'shelter.reports.index': '/shelter/reports',
    
    'mao.dashboard': '/mao/dashboard',
    'mao.applications.index': '/mao/applications',
    'mao.applications.show': '/mao/applications/{id}',
    'mao.applications.update': '/mao/applications/{id}',
    'mao.reports.index': '/mao/reports',
    'mao.reports.pdf': '/mao/reports/pdf',
    'mao.reports.excel': '/mao/reports/excel',
    
    'admin.dashboard': '/admin/dashboard',
    'admin.applications.index': '/admin/applications',
    'admin.applications.show': '/admin/applications/{id}',
    'admin.applications.destroy': '/admin/applications/{id}',
    'admin.pets.index': '/admin/pets',
    'admin.pets.destroy': '/admin/pets/{id}',
    'admin.users.index': '/admin/users',
    'admin.users.store': '/admin/users',
    'admin.users.update': '/admin/users/{id}',
    'admin.users.reset-password': '/admin/users/{id}/reset-password',
    'admin.users.destroy': '/admin/users/{id}',
    'admin.shelters.index': '/admin/shelters',
    'admin.shelters.store': '/admin/shelters',
    'admin.shelters.update': '/admin/shelters/{id}',
    'admin.shelters.destroy': '/admin/shelters/{id}',
    'admin.reports.index': '/admin/reports',
    'admin.reports.pdf': '/admin/reports/pdf',
    'admin.reports.excel': '/admin/reports/excel',
    'admin.settings.index': '/admin/settings',
    'admin.settings.update': '/admin/settings',
    'admin.cms.builder.index': '/admin/cms/builder',
    'admin.cms.builder.update': '/admin/cms/builder',
    'admin.cms.announcements.index': '/admin/cms/announcements',
    'admin.cms.announcements.store': '/admin/cms/announcements',
    'admin.cms.announcements.update': '/admin/cms/announcements/{id}',
    'admin.cms.announcements.destroy': '/admin/cms/announcements/{id}',
};

// Define global route helper mapping route name to URL string
const globalRouteHelper = (name: string, params?: any): string => {
    let url = routesMap[name];
    if (!url) {
        return '';
    }

    if (params !== undefined && params !== null) {
        if (typeof params === 'object') {
            const queryParams: string[] = [];
            Object.entries(params).forEach(([key, val]) => {
                if (url.includes(`{${key}}`)) {
                    url = url.replace(`{${key}}`, String(val));
                } else if (val !== undefined && val !== null) {
                    queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`);
                }
            });
            if (queryParams.length > 0) {
                url += (url.includes('?') ? '&' : '?') + queryParams.join('&');
            }
        } else {
            if (url.includes('{')) {
                url = url.replace(/{[a-zA-Z0-9_]+}/, String(params));
            } else {
                url += `?id=${encodeURIComponent(String(params))}`;
            }
        }
    }
    return url;
};

if (typeof globalThis !== 'undefined') {
    (globalThis as any).route = globalRouteHelper;
}
if (typeof window !== 'undefined') {
    (window as any).route = globalRouteHelper;
}

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name, page) => {
        // Read breadcrumbs defined as a static property on the page component:
        //   MyPage.layout = { breadcrumbs: [...] }
        const layoutMeta = (page.type as any)?.layout;
        const pageBreadcrumbs: BreadcrumbItem[] =
            Array.isArray(layoutMeta?.breadcrumbs) ? layoutMeta.breadcrumbs : [];

        switch (true) {
            case name === 'welcome':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                // Wrap in a functional layout that passes breadcrumbs
                if (pageBreadcrumbs.length > 0) {
                    return (children: ReactNode) => (
                        <AppLayout breadcrumbs={pageBreadcrumbs}>
                            {children}
                        </AppLayout>
                    );
                }
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
