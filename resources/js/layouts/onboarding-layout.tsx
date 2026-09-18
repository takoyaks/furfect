import { ReactNode } from 'react';
import { Cat } from 'lucide-react';

interface Props {
    children: ReactNode;
    currentStep: 1 | 2 | 3;
}

export default function OnboardingLayout({ children, currentStep }: Props) {
    return (
        <div className="min-h-screen bg-[#FDFCF7] flex flex-col justify-between selection:bg-[#467235] selection:text-white">
            {/* Dynamic Fullscreen Header with Centered Step Progress */}
            <header className="border-b border-[#467235]/15 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-xs w-full">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-center">
                    {/* 3-Step Progress Indicator */}
                    <div className="hidden md:flex items-center justify-center space-x-2 text-xs font-medium">
                        {/* Step 1: eKYC Verification */}
                        <div className={`px-3.5 py-1.5 rounded-full flex items-center gap-2 transition-all ${
                            currentStep === 1 
                                ? 'bg-[#467235] text-white shadow-sm font-semibold ring-2 ring-[#FFBF00]/60' 
                                : currentStep > 1 
                                    ? 'bg-[#FFF78D]/80 text-[#283F24] border border-[#467235]/20 font-medium'
                                    : 'bg-gray-100 text-gray-500'
                        }`}>
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                currentStep === 1 ? 'bg-white/20 text-white' : 'bg-[#467235]/15 text-[#283F24]'
                            }`}>1</span>
                            <span>eKYC Verification</span>
                        </div>

                        <span className="text-[#467235]/40 font-bold">→</span>

                        {/* Step 2: Personal Info */}
                        <div className={`px-3.5 py-1.5 rounded-full flex items-center gap-2 transition-all ${
                            currentStep === 2 
                                ? 'bg-[#467235] text-white shadow-sm font-semibold ring-2 ring-[#FFBF00]/60' 
                                : currentStep > 2 
                                    ? 'bg-[#FFF78D]/80 text-[#283F24] border border-[#467235]/20 font-medium'
                                    : 'bg-gray-100 text-gray-500'
                        }`}>
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                currentStep === 2 ? 'bg-white/20 text-white' : currentStep > 2 ? 'bg-[#467235]/15 text-[#283F24]' : 'bg-gray-200 text-gray-500'
                            }`}>2</span>
                            <span>Personal Info</span>
                        </div>

                        <span className="text-[#467235]/40 font-bold">→</span>

                        {/* Step 3: Lifestyle Quiz */}
                        <div className={`px-3.5 py-1.5 rounded-full flex items-center gap-2 transition-all ${
                            currentStep === 3 
                                ? 'bg-[#467235] text-white shadow-sm font-semibold ring-2 ring-[#FFBF00]/60' 
                                : 'bg-gray-100 text-gray-500'
                        }`}>
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                currentStep === 3 ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
                            }`}>3</span>
                            <span>Lifestyle Quiz</span>
                        </div>
                    </div>

                    {/* Mobile Step Badge */}
                    <div className="md:hidden flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#467235] text-white text-xs font-semibold shadow-xs">
                        <span>Step {currentStep} of 3</span>
                    </div>
                </div>
            </header>

            {/* Main Content Area - Full-screen dynamic adjustable */}
            <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl 2xl:max-w-[1600px] mx-auto flex flex-col justify-start">
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
