import { ReactNode } from 'react';
import { Link, usePage } from '@inertiajs/react';
import AppLogo from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { LogOut, Cat } from 'lucide-react';
import { logout } from '@/routes';

interface Props {
    children: ReactNode;
    currentStep: 1 | 2;
}

export default function OnboardingLayout({ children, currentStep }: Props) {
    const { auth } = usePage().props;
    const user = auth.user;

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between selection:bg-[#D4A017] selection:text-white">
            {/* Minimal Fullscreen Header */}
            <header className="border-b border-[#D4A017]/15 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                    {/* <div className="flex items-center space-x-3">
                        <AppLogo />
                        <span className="hidden sm:inline-block h-4 w-[1px] bg-gray-300" />
                        <span className="hidden sm:inline-block text-xs font-semibold tracking-wide text-gray-500 uppercase">
                            Adopter Onboarding
                        </span>
                    </div> */}

                    {/* Step indicator */}
                    <div className="flex items-center justify-center space-x-2 text-xs font-medium">
                        <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-colors ${
                            currentStep === 1 
                                ? 'bg-[#D4A017] text-white shadow-sm font-semibold' 
                                : 'bg-gray-100 text-gray-500'
                        }`}>
                            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
                            <span>Personal Info</span>
                        </div>

                        <span className="text-gray-300">→</span>

                        <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-colors ${
                            currentStep === 2 
                                ? 'bg-[#D4A017] text-white shadow-sm font-semibold' 
                                : 'bg-gray-100 text-gray-500'
                        }`}>
                            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
                            <span>Lifestyle Quiz</span>
                        </div>
                    </div>

                    {/* Right side user info & logout */}
                    {/* <div className="flex items-center space-x-3 text-xs">
                        <span className="hidden md:inline-block text-gray-600 font-medium">
                            {user?.name}
                        </span>
                        <Link href={logout()} method="post" as="button">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-gray-500 hover:text-red-600 hover:bg-red-50 text-xs h-8 gap-1.5"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Logout</span>
                            </Button>
                        </Link>
                    </div> */}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {children}
            </main>

            {/* Minimal Fullscreen Footer */}
            <footer className="border-t border-[#D4A017]/10 bg-white/50 py-4 text-center text-xs text-gray-400">
                <div className="flex items-center justify-center gap-1">
                    <span>FurFect Match &copy; {new Date().getFullYear()} — Virac Animal Shelter Adoption System</span>
                    <Cat className="h-3 w-3 text-black-400 fill-yellow-400 inline" />
                </div>
            </footer>
        </div>
    );
}
