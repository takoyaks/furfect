import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ShieldCheck, Heart, FileCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AppFooter } from '@/components/app-footer';

interface Props {
    config?: {
        how_it_works_steps?: { step: string; title: string; description: string }[];
        about_location?: string;
        about_hours?: string;
        about_phone?: string;
        about_email?: string;
    };
}

export default function HowItWorks({ config }: Props) {
    const defaultSteps = [
        {
            step: '01',
            title: 'Register & Complete Profile',
            description: 'Create your account and complete our 2-step adopter & lifestyle profile detailing your home environment, activity level, and pet preferences.',
        },
        {
            step: '02',
            title: 'DSS Compatibility Matching',
            description: 'Our Decision Support System automatically evaluates your lifestyle profile against available shelter animals to generate a personalized compatibility match score.',
        },
        {
            step: '03',
            title: 'Submit Adoption Application',
            description: 'Select your matched pet and submit your formal adoption application. Your profile details are automatically attached so you fill it out once.',
        },
        {
            step: '04',
            title: 'Shelter Review & MAO Audit',
            description: 'Virac Animal Shelter staff review your home suitability, followed by final compliance audit and approval by the Municipal Animal Office (MAO).',
        },
    ];

    const steps = config?.how_it_works_steps?.length ? config.how_it_works_steps : defaultSteps;
    const icons = [FileCheck, Sparkles, Heart, ShieldCheck];

    return (
        <AppLayout breadcrumbs={[{ title: 'How It Works', href: route('how-it-works') }]}>
            <Head title="How It Works — FurFect Match" />

            <div className="max-w-5xl mx-auto py-8 px-4 space-y-12">
                {/* Hero Header */}
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                    <span className="bg-[#F5EDD7] text-[#B8860B] px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                        Adoption Lifecycle
                    </span>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                        How FurFect Match Pairs You With Your Perfect Pet
                    </h1>
                    <p className="text-gray-600 text-base leading-relaxed">
                        Our Decision Support System (DSS) combines scientific compatibility scoring with a transparent, two-tier municipal review process to ensure long-term adoption success.
                    </p>
                </div>

                {/* 4 Steps Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {steps.map((item, idx) => {
                        const Icon = icons[idx % icons.length];
                        return (
                            <Card key={item.step || idx} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                <div className="absolute -top-3 -right-3 text-6xl font-black text-gray-100 select-none pointer-events-none">
                                    {item.step || `0${idx + 1}`}
                                </div>
                                <CardContent className="p-6 space-y-3 relative">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-100 text-[#D4A017]">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Key Benefits */}
                <div className="bg-[#FDFBF7] border border-[#D4A017]/20 rounded-2xl p-8 space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 text-center">Why Our Matching Process Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                title: 'Objective DSS Scoring',
                                text: 'Eliminates guesswork by evaluating living space, air conditioning, and daily routines.',
                            },
                            {
                                title: 'Virac Shelter Verified',
                                text: 'Every animal is health-checked, vaccinated, and logged with complete medical records.',
                            },
                            {
                                title: 'MAO Compliance Audit',
                                text: 'Ensures municipal animal welfare regulations and spay/neuter standards are met.',
                            },
                        ].map((b, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex items-center gap-2 font-semibold text-[#D4A017]">
                                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                                    <span>{b.title}</span>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed">{b.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Callout */}
                <div className="text-center bg-[#D4A017] text-white rounded-2xl p-8 space-y-4 shadow-lg">
                    <h2 className="text-2xl font-bold">Ready to Find Your Companion?</h2>
                    <p className="text-amber-100 text-sm max-w-xl mx-auto">
                        Explore available pets at the Virac Animal Shelter or check your personal DSS compatibility matches today.
                    </p>
                    <div className="flex justify-center gap-4 pt-2">
                        <Link href={route('pets.index')}>
                            <Button className="bg-white text-[#B8860B] hover:bg-amber-50 font-semibold gap-2">
                                Browse Pets <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href={route('matches.index')}>
                            <Button variant="outline" className="border-white text-white hover:bg-white/10 font-semibold">
                                View My Matches
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <AppFooter config={config} />
        </AppLayout>
    );
}
