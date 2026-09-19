import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Mail, Clock, ShieldCheck, Heart, Building2 } from 'lucide-react';
import { AppFooter } from '@/components/app-footer';
import { getTheme } from '@/lib/theme-templates';

interface Props {
    config?: {
        template_name?: string;
        about_title?: string;
        about_mission?: string;
        about_phone?: string;
        about_email?: string;
        about_location?: string;
        about_hours?: string;
    };
}

export default function About({ config }: Props) {
    const theme = getTheme(config?.template_name);

    return (
        <AppLayout breadcrumbs={[{ title: 'About Us', href: route('about') }]}>
            <Head title="About Us — Virac Animal Shelter & FurFect Match" />

            <div className="max-w-5xl mx-auto py-8 px-4 space-y-12">
                {/* Hero Banner */}
                <div className={`${theme.cardHighlightBg} border ${theme.cardHighlightBorder} rounded-2xl p-8 text-center space-y-4`}>
                    <span className={`${theme.secondaryBadge} px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider`}>
                        About FurFect Match
                    </span>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                        {config?.about_title || 'Virac Municipal Animal Adoption System'}
                    </h1>
                    <p className="text-gray-600 text-base max-w-3xl mx-auto leading-relaxed">
                        FurFect Match is the official animal adoption platform of the Virac Municipal Animal Office (MAO) and Virac Animal Shelter in Catanduanes. We utilize data-driven compatibility matching to find loving, permanent homes for rescued animals.
                    </p>
                </div>

                {/* Mission & Vision */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-gray-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center gap-3 pb-2">
                            <div className={`w-10 h-10 rounded-lg ${theme.iconBg} flex items-center justify-center ${theme.iconText}`}>
                                <Heart className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg font-bold text-gray-900">Our Mission</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-gray-600 leading-relaxed">
                            {config?.about_mission || 'To eliminate animal homelessness in Virac, Catanduanes through responsible pet adoption, community education, spay/neuter programs, and transparent municipal oversight.'}
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center gap-3 pb-2">
                            <div className={`w-10 h-10 rounded-lg ${theme.iconBg} flex items-center justify-center ${theme.iconText}`}>
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg font-bold text-gray-900">Municipal Standards</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-gray-600 leading-relaxed">
                            Operating in strict compliance with the Philippine Animal Welfare Act (RA 8485 / RA 10631) and Anti-Rabies Act (RA 9482) to guarantee animal safety and adopter support.
                        </CardContent>
                    </Card>
                </div>

                {/* Shelter Information & Contact */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-gray-200 shadow-sm md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Building2 className={`h-5 w-5 ${theme.accentText}`} />
                                Virac Animal Shelter Directory
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-gray-600">
                            <div className="flex items-start gap-3">
                                <MapPin className={`h-5 w-5 ${theme.accentText} shrink-0 mt-0.5`} />
                                <div>
                                    <strong className="text-gray-800 block">Facility Location</strong>
                                    {config?.about_location || 'Virac Municipal Compound, Barangay Concepcion, Virac, Catanduanes 4800'}
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Clock className={`h-5 w-5 ${theme.accentText} shrink-0 mt-0.5`} />
                                <div>
                                    <strong className="text-gray-800 block">Operating Hours</strong>
                                    {config?.about_hours || 'Monday – Friday: 8:00 AM – 5:00 PM | Saturday: 9:00 AM – 12:00 PM'}
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className={`h-5 w-5 ${theme.accentText} shrink-0 mt-0.5`} />
                                <div>
                                    <strong className="text-gray-800 block">Hotline &amp; Support</strong>
                                    {config?.about_phone || '(052) 811-2345 / +63 950-321-7654'}
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Mail className={`h-5 w-5 ${theme.accentText} shrink-0 mt-0.5`} />
                                <div>
                                    <strong className="text-gray-800 block">Email Address</strong>
                                    {config?.about_email || 'virac.shelter@gmail.com / mao@virac.gov.ph'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Stats Card */}
                    <Card className={`${theme.cardHighlightBorder} ${theme.cardHighlightBg} shadow-sm flex flex-col justify-between p-6`}>
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-900 text-base">Adoption Pledge</h3>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                Every adopted animal is spayed/neutered, vaccinated against rabies, microchipped, and given a full veterinary health clearance before rehoming.
                            </p>
                        </div>
                        <div className="pt-4">
                            <Link href={route('pets.index')}>
                                <Button className={`w-full ${theme.primaryButton} font-semibold`}>
                                    Explore Available Pets
                                </Button>
                            </Link>
                        </div>
                    </Card>
                </div>
            </div>

            <AppFooter config={config} />
        </AppLayout>
    );
}
