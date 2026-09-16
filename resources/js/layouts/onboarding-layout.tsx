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
        <div className="min-h-screen bg-[#FDFCF7] flex flex-col justify-between selection:bg-[#467235] selection:text-white">
            {/* Minimal Fullscreen Header */}
            <header className="border-b border-[#467235]/15 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-xs">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Link href={route('dashboard')} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                            <AppLogo />
                        </Link>
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center justify-center space-x-2 text-xs font-medium">
                        <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
                            currentStep === 1 
                                ? 'bg-[#467235] text-white shadow-sm font-semibold ring-2 ring-[#FFBF00]/60' 
                                : 'bg-[#FFF78D]/60 text-[#283F24] border border-[#467235]/20 font-medium'
                        }`}>
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                currentStep === 1 ? 'bg-white/20 text-white' : 'bg-[#467235]/15 text-[#283F24]'
                            }`}>1</span>
                            <span>Personal Info</span>
                        </div>

                        <span className="text-[#467235]/40 font-bold">→</span>

                        <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
                            currentStep === 2 
                                ? 'bg-[#467235] text-white shadow-sm font-semibold ring-2 ring-[#FFBF00]/60' 
                                : 'bg-gray-100 text-gray-500'
                        }`}>
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                currentStep === 2 ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
                            }`}>2</span>
                            <span>Lifestyle Quiz</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Link href={logout()} method="post" as="button">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-gray-500 hover:text-red-600 hover:bg-red-50 text-xs h-8 gap-1.5 cursor-pointer"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Logout</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex h-full flex-1 flex-col gap-4 max-w-6xl w-full mx-auto p-4 sm:p-6">
                {children}
            </main>

            {/* Minimal Fullscreen Footer */}
            <footer className="border-t border-[#467235]/10 bg-white/60 py-4 text-center text-xs text-gray-500">
                <div className="flex items-center justify-center gap-1.5">
                    <span>FurFect Match &copy; {new Date().getFullYear()} — Virac Animal Shelter Adoption System</span>
                    <Cat className="h-3.5 w-3.5 text-[#467235] fill-[#FFBF00] inline" />
                </div>
            </footer>
        </div>
    );
}
