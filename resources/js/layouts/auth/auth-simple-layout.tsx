import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
    greeting,
}: AuthLayoutProps) {
    const { version } = usePage().props as { version?: string };

    // Resolve dynamic greeting heading
    const resolvedGreeting = greeting || (() => {
        const lowerTitle = (title || '').toLowerCase();
        if (lowerTitle.includes('register') || lowerTitle.includes('create an account')) {
            return 'Welcome to FurFect Match';
        }
        if (lowerTitle.includes('log in') || lowerTitle.includes('login')) {
            return 'Welcome back!';
        }
        return title || 'FurFect Match';
    })();

    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-amber-50/40 via-background to-background p-4 sm:p-6 md:p-10 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-900">
            <div className="w-full max-w-md">
                <Card className="shadow-lg border border-amber-200/50 dark:border-neutral-800 bg-card/95 backdrop-blur-sm">
                    <CardHeader className="flex flex-col items-center space-y-3 pb-4 text-center">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-1.5 transition-transform hover:scale-105"
                        >
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-neutral-800 p-2 border border-amber-200/60 dark:border-neutral-700 shadow-xs">
                                <AppLogoIcon className="size-12 fill-current text-[#D4A017]" />
                            </div>
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                                {resolvedGreeting}
                            </CardTitle>
                            {description && (
                                <CardDescription className="text-sm text-muted-foreground max-w-xs mx-auto">
                                    {description}
                                </CardDescription>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="pt-2 pb-6 px-6 sm:px-8">
                        {children}
                    </CardContent>
                </Card>

                <div className="mt-6 text-center space-y-1">
                    <p className="text-xs text-muted-foreground">
                        Virac Animal Shelter &amp; Municipal Agriculture Office &bull; Adoption Platform
                    </p>
                    {version && (
                        <p className="text-[11px] font-mono text-muted-foreground/70">
                            {version}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
