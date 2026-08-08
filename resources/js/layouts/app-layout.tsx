import React, {
    createContext,
    useCallback,
    useContext,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { usePage } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import AppHeaderLayout from '@/layouts/app/app-header-layout';
import type { BreadcrumbItem } from '@/types';

// ─── Breadcrumbs context ────────────────────────────────────────────────────
type BreadcrumbsSetter = (items: BreadcrumbItem[]) => void;

const BreadcrumbsContext = createContext<BreadcrumbsSetter | null>(null);

/** Exported for use by the static-layout path in app.tsx if needed. */
export function useBreadcrumbsSetter(): BreadcrumbsSetter | null {
    return useContext(BreadcrumbsContext);
}

// ─── Nesting guard ──────────────────────────────────────────────────────────
const AppLayoutContext = createContext<boolean>(false);

// ─── Outer persistent layout ─────────────────────────────────────────────────
export default function AppLayout({
    breadcrumbs: initialBreadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    const isNested = useContext(AppLayoutContext);

    if (isNested) {
        // Inner usage: page wraps itself in <AppLayout breadcrumbs={...}>
        // Delegate to a component so we can safely call hooks.
        return (
            <AppLayoutInner breadcrumbs={initialBreadcrumbs}>
                {children}
            </AppLayoutInner>
        );
    }

    // Outer usage: mounted once by app.tsx as the persistent layout.
    return (
        <AppLayoutOuter initialBreadcrumbs={initialBreadcrumbs}>
            {children}
        </AppLayoutOuter>
    );
}

/** Rendered when AppLayout is used *inside* a page body (nested). */
function AppLayoutInner({
    breadcrumbs,
    children,
}: {
    breadcrumbs: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    const setter = useContext(BreadcrumbsContext);

    // Push breadcrumbs into the outer layout before paint, without mutating
    // state during render (which would trigger React warnings).
    useLayoutEffect(() => {
        if (setter && breadcrumbs.length > 0) {
            setter(breadcrumbs);
        }
    }, [setter, breadcrumbs]);

    return <>{children}</>;
}

/** Rendered once as the persistent shell by app.tsx. */
function AppLayoutOuter({
    initialBreadcrumbs,
    children,
}: {
    initialBreadcrumbs: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    const { auth } = usePage().props;
    const user = auth.user;
    const roles = (user?.roles as string[]) || [];

    const isStaff = roles.some((r) => ['admin', 'shelter_staff', 'mao_officer'].includes(r));
    const AppLayoutTemplate = isStaff ? AppSidebarLayout : AppHeaderLayout;

    const [breadcrumbs, setBreadcrumbs] =
        useState<BreadcrumbItem[]>(initialBreadcrumbs);

    // Keep a ref so the stable callback can compare without causing re-renders.
    const breadcrumbsRef = useRef(breadcrumbs);

    const handleSet = useCallback((items: BreadcrumbItem[]) => {
        if (JSON.stringify(items) !== JSON.stringify(breadcrumbsRef.current)) {
            breadcrumbsRef.current = items;
            setBreadcrumbs(items);
        }
    }, []);

    // When the persistent layout receives new initialBreadcrumbs (e.g. from
    // app.tsx reading Page.layout.breadcrumbs), sync them in.
    useLayoutEffect(() => {
        handleSet(initialBreadcrumbs);
    }, [initialBreadcrumbs, handleSet]);

    return (
        <AppLayoutContext.Provider value={true}>
            <BreadcrumbsContext.Provider value={handleSet}>
                <AppLayoutTemplate breadcrumbs={breadcrumbs}>
                    {children}
                </AppLayoutTemplate>
            </BreadcrumbsContext.Provider>
        </AppLayoutContext.Provider>
    );
}
