import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Home } from 'lucide-react';

import AppLogoIcon from '@/components/app-logo-icon';
import { Button, buttonVariants } from '@/components/ui/button';
import { LottiePlayer } from '@/components/ui/lottie-player';
import { cn } from '@/lib/utils';
import catAnimation from '@/animations/404cat.json';

interface Error404Props {
    status?: number;
}

export default function Error404({ status = 404 }: Error404Props) {
    const handleGoBack = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '/';
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-between bg-background px-4 py-8 text-foreground selection:bg-amber-100 selection:text-amber-900">
            <Head title={`${status} — Page Not Found`} />

            {/* Subtle Brand Header */}
            <header >
                {/* <Link
                    href="/"
                    className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-85"
                >
                    <div className="flex size-8 items-center justify-center rounded-lg border border-border/60 bg-muted/30">
                        <AppLogoIcon className="size-5 object-contain" />
                    </div>
                    <span className="font-semibold tracking-tight text-foreground text-sm">
                        FurFect Match
                    </span>
                </Link> */}
            </header>

            {/* Main Minimalist 404 Content */}
            <main className="my-auto flex w-full max-w-md flex-col items-center text-center">
                {/* Lottie Animation */}
                <div className="relative mb-2 flex items-center justify-center">
                    <LottiePlayer
                        animationData={catAnimation as Record<string, unknown>}
                        src="/animations/404cat.json"
                        className="h-64 w-64 sm:h-72 sm:w-72"
                        fallback={
                            <div className="flex h-64 w-64 items-center justify-center text-7xl select-none">
                                🐱
                            </div>
                        }
                    />
                </div>

                {/* Typography */}
                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        {status} Error
                    </p>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                        Page Not Found
                    </h1>
                    <p className="text-sm text-muted-foreground sm:text-base max-w-sm mx-auto leading-relaxed">
                        Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or removed.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3 w-full">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleGoBack}
                        className="gap-2 cursor-pointer h-10 px-4"
                    >
                        <ArrowLeft className="size-4" />
                        <span>Go Back</span>
                    </Button>

                    <Link
                        href="/"
                        className={cn(
                            buttonVariants({ variant: 'default' }),
                            'gap-2 cursor-pointer h-10 px-4 bg-[#283F24] hover:bg-[#395933] text-white',
                        )}
                    >
                        <Home className="size-4" />
                        <span>Back to Home</span>
                    </Link>
                </div>
            </main>

            {/* Minimalist Footer Note */}
            <footer className="w-full text-center text-xs text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} FurFect Match &bull; Virac Animal Welfare</p>
            </footer>
        </div>
    );
}

Error404.layout = (page: React.ReactNode) => page;
