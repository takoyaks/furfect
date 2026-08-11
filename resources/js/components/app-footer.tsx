import { Link } from '@inertiajs/react';
import AppLogo from '@/components/app-logo';
import { Heart, Cat, MapPin, Phone, Mail, Clock, ShieldCheck } from 'lucide-react';
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
                            A Capstone Project of the College of information and Communications Technology (CICT) students of Catanduanes State University, Virac Campus. This project is a web-based adoption management system for the Virac Municipal Animal Shelter.
                        </p>
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#B8860B]">
                            <ShieldCheck className="h-4 w-4 text-[#D4A017]" />
                            <span>Municipal Animal Office Verified</span>
                        </div>
                    </div>

                    {/* Quick Navigation */}
                    <div className="space-y-3">
                        <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wider">Capstone Project </h4>
                        <ul className="space-y-2 text-xs">
                            <li>
                                <span className="text-gray-400">Baltzar, Danna Lorraine I.</span>
                            </li>
                            <li>
                                <span className="text-gray-400">Padua, Sophia Yzabel V.</span>
                            </li>
                            <li>
                                <span className="text-gray-400">Romero, Xandra T.</span>
                            </li>
                            <li>
                                <span className="text-gray-400">Tendencia, Moira Cielo</span>
                            </li>
                            {/* {!user && (
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
                            )} */}
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
                                <span>{config?.about_hours || 'Mon–Fri: 8:00 AM – 5:00 PM'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <Phone className="h-4 w-4 text-[#D4A017] shrink-0 mt-0.5" />
                                <span>{config?.about_phone || '(000) 000-0000 / +63 900-000-0000'}</span>
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
                        <Cat className="h-3.5 w-3.5 fill-yellow-500 text-black-500" />
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
