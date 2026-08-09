import { Link } from '@inertiajs/react';
import AppLogo from '@/components/app-logo';
import { Heart, MapPin, Phone, Mail, Clock, ShieldCheck } from 'lucide-react';
import { login, register } from '@/routes';

interface AppFooterProps {
    user?: any;
    config?: {
        about_title?: string;
        about_phone?: string;
        about_email?: string;
        about_location?: string;
        about_hours?: string;
    };
}

export function AppFooter({ user, config }: AppFooterProps) {
    return (
        <footer className="mt-16 bg-gradient-to-b from-[#FAF8F5] to-[#F3EEE3] border-t border-[#D4A017]/20 text-gray-700">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand Column */}
                    <div className="space-y-4 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2">
                            <AppLogo />
                        </Link>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            FurFect Match is the official animal adoption platform of Virac, Catanduanes, connecting rescued shelter animals with verified adopters using data-driven compatibility scoring.
                        </p>
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#B8860B]">
                            <ShieldCheck className="h-4 w-4 text-[#D4A017]" />
                            <span>Municipal Animal Office Verified</span>
                        </div>
                    </div>

                    {/* Quick Navigation */}
                    <div className="space-y-3">
                        <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wider">Quick Links</h4>
                        <ul className="space-y-2 text-xs">
                            <li>
                                <Link href={user ? route('dashboard') : route('home')} className="hover:text-[#D4A017] transition-colors">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link href={route('pets.index')} className="hover:text-[#D4A017] transition-colors">
                                    Browse Pets Available for Adoption
                                </Link>
                            </li>
                            <li>
                                <Link href={route('how-it-works')} className="hover:text-[#D4A017] transition-colors">
                                    How It Works
                                </Link>
                            </li>
                            <li>
                                <Link href={route('about')} className="hover:text-[#D4A017] transition-colors">
                                    About Us &amp; Shelter Policies
                                </Link>
                            </li>
                            {!user && (
                                <>
                                    <li>
                                        <Link href={login()} className="hover:text-[#D4A017] transition-colors">
                                            Log in
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href={register()} className="hover:text-[#D4A017] transition-colors">
                                            Register Account
                                        </Link>
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* Municipal Shelter Contact */}
                    <div className="space-y-3 md:col-span-2">
                        <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wider">Virac Animal Shelter Directory</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-600">
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-[#D4A017] shrink-0 mt-0.5" />
                                <span>{config?.about_location || 'Virac Municipal Compound, Barangay Concepcion, Virac, Catanduanes 4800'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <Clock className="h-4 w-4 text-[#D4A017] shrink-0 mt-0.5" />
                                <span>{config?.about_hours || 'Mon–Fri: 8:00 AM – 5:00 PM | Sat: 9:00 AM – 12:00 PM'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <Phone className="h-4 w-4 text-[#D4A017] shrink-0 mt-0.5" />
                                <span>{config?.about_phone || '(052) 811-2345 / +63 950-321-7654'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <Mail className="h-4 w-4 text-[#D4A017] shrink-0 mt-0.5" />
                                <span>{config?.about_email || 'virac.shelter@gmail.com / mao@virac.gov.ph'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-8 pt-6 border-t border-gray-200/80 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-4">
                    <div className="flex items-center gap-1.5">
                        <span>&copy; {new Date().getFullYear()} FurFect Match. Made with</span>
                        <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
                        <span>for Virac Animal Welfare.</span>
                    </div>
                    <div className="flex gap-4">
                        <span>Anti-Rabies Act (RA 9482)</span>
                        <span>&bull;</span>
                        <span>Animal Welfare Act (RA 8485)</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
