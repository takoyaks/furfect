import { Link, usePage } from '@inertiajs/react';
import { ShieldCheck, Sparkles, Heart } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
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
        <div className="relative flex min-h-svh flex-col justify-between overflow-hidden bg-gradient-to-br from-[#FFFDF5] via-white to-[#F6F8F5] p-4 sm:p-6 md:p-10 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
            {/* Soft Ambient Background Glows */}
            <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#FFBF00]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#467235]/10 blur-3xl" />

            {/* Center Split Screen Layout Container */}
            <div className="relative z-10 my-auto mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-8 lg:flex-row lg:gap-14">
                
                {/* Left Side: Elevated Brand Showcase */}
                <div className="flex w-full flex-col items-center justify-center text-center lg:w-1/2 lg:py-6">
                    {/* Municipal Pill Badge */}
                    <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-[#FFBF00]/40 bg-[#FFF78D]/50 px-3.5 py-1 text-xs font-semibold text-[#283F24] shadow-2xs dark:bg-amber-950/40 dark:text-amber-300">
                        <span>🐾</span>
                        <span>Virac Animal Shelter &amp; MAO</span>
                    </div>

                    <Link
                        href={home()}
                        className="group flex flex-col items-center transition-transform duration-300 hover:scale-[1.02]"
                    >
                        {/* Logo with ambient soft backlight */}
                        <div className="relative mb-3 flex h-36 w-36 items-center justify-center sm:h-44 sm:w-44">
                            <div className="absolute inset-0 scale-75 rounded-full bg-[#FFBF00]/20 blur-2xl transition-all duration-300 group-hover:scale-95 group-hover:bg-[#FFBF00]/30" />
                            <AppLogoIcon className="relative h-full w-full object-contain drop-shadow-md" />
                        </div>

                        {/* Brand Name */}
                        <h1 className="flex items-center justify-center font-serif text-3xl font-black tracking-tight text-[#283F24] sm:text-4xl md:text-5xl dark:text-[#FFF78D]">
                            <span>FurFect</span>
                            <span className="ml-2.5">Match</span>
                        </h1>
                    </Link>

                    {/* Slogan */}
                    <p className="mt-3 max-w-sm font-serif text-lg italic leading-relaxed text-neutral-700 sm:text-xl dark:text-neutral-300">
                        Connecting Hearts, Saving Lives in Virac.
                    </p>

                    {/* Trust Highlights */}
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-md">
                        <div className="inline-flex items-center gap-1 rounded-lg border border-neutral-200/80 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-neutral-600 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-400">
                            <ShieldCheck className="size-3 text-[#467235]" /> Verified Adoptions
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-lg border border-neutral-200/80 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-neutral-600 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-400">
                            <Sparkles className="size-3 text-[#FFBF00]" /> DSS Smart Matching
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-lg border border-neutral-200/80 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-neutral-600 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-400">
                            <Heart className="size-3 text-red-500" /> Free &amp; Non-Profit
                        </div>
                    </div>
                </div>

                {/* Vertical Divider with Decorative Dot */}
                <div className="hidden h-auto flex-col items-center justify-center self-stretch lg:flex">
                    <div className="w-[1px] flex-1 bg-gradient-to-b from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
                    <div className="my-3 flex size-6 items-center justify-center rounded-full border border-amber-300/80 bg-white text-[10px] text-amber-600 shadow-2xs dark:border-neutral-700 dark:bg-neutral-900">
                        🐾
                    </div>
                    <div className="w-[1px] flex-1 bg-gradient-to-b from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
                </div>

                {/* Right Side: Enhanced Auth Card */}
                <div className="flex w-full flex-col items-center justify-center lg:w-1/2">
                    <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-amber-200/80 bg-white/95 p-6 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.06),0_2px_8px_-2px_rgba(0,0,0,0.04)] backdrop-blur-md sm:p-8 dark:border-neutral-800 dark:bg-neutral-900/95">
                        {/* Top Gradient Accent Bar */}
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FFBF00] via-[#FFF78D] to-[#467235]" />

                        {/* Top Card Icon Badge */}
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/60 bg-gradient-to-b from-[#FFFDF0] to-[#FFF78D]/50 p-2.5 shadow-2xs">
                            <AppLogoIcon className="h-full w-full object-contain" />
                        </div>

                        {/* Card Heading */}
                        <div className="mb-6 space-y-1 text-center">
                            <h2 className="text-xl font-bold tracking-tight text-[#283F24] sm:text-2xl dark:text-neutral-50">
                                {resolvedGreeting}
                            </h2>
                            {description && (
                                <p className="mx-auto max-w-xs text-xs text-neutral-500 sm:text-sm dark:text-neutral-400">
                                    {description}
                                </p>
                            )}
                        </div>

                        {/* Form Body */}
                        {children}
                    </div>

                    {/* Bottom Municipal Subtext */}
                    <div className="mt-5 max-w-md space-y-1 px-2 text-center">
                        <p className="text-[11px] text-neutral-500 sm:text-xs dark:text-neutral-400">
                            Virac Animal Shelter &amp; Municipal Agriculture Office &bull; Adoption Platform
                        </p>
                        {version && (
                            <p className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
                                {version}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
