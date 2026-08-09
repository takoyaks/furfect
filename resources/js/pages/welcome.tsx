import { Head, Link, usePage } from '@inertiajs/react';
import AppHeaderLayout from '@/layouts/app/app-header-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Heart, ArrowRight, ShieldCheck, Calendar, Users, CheckCircle2, Megaphone, FileCheck } from 'lucide-react';
import { AppFooter } from '@/components/app-footer';
import { login, register } from '@/routes';

interface Pet {
    id: number;
    name: string;
    species: string;
    breed: string;
    age_years: number;
    gender: string;
    size: string;
    health_status: string;
    photos?: { photo_path: string }[];
    shelter?: { name: string };
}

interface Announcement {
    id: number;
    title: string;
    category: string;
    content: string;
    image_path?: string;
    published_at?: string;
}

interface Props {
    config: {
        template_name: string;
        hero_title: string;
        hero_subtitle: string;
        hero_cta_text: string;
        hero_cta_link: string;
        hero_image_path?: string;
        section_settings?: Record<string, boolean>;
        theme_color: string;
        about_title?: string;
        about_phone?: string;
        about_email?: string;
        about_location?: string;
        about_hours?: string;
        how_it_works_steps?: { step: string; title: string; description: string }[];
    };
    featuredPets: Pet[];
    announcements: Announcement[];
    stats: {
        available_pets: number;
        adopted_pets: number;
        total_adopters: number;
    };
}

export default function Welcome({ config, featuredPets = [], announcements = [], stats }: Props) {
    const { auth } = usePage().props;

    const sections = (() => {
        const defaults = {
            show_hero: true,
            show_featured_pets: true,
            show_announcements: true,
            show_stats: true,
            show_how_it_works: true,
            show_shelter_info: true,
        };
        if (!config?.section_settings) return defaults;
        const res: Record<string, boolean> = { ...defaults };
        for (const [k, v] of Object.entries(config.section_settings)) {
            res[k] = v === true || (v as any) === '1' || (v as any) === 'true' || (v as any) === 1;
        }
        return res;
    })();

    const defaultSteps = [
        {
            step: '01',
            title: 'Register & Complete Profile',
            description: 'Create your account and complete our 2-step adopter & lifestyle profile detailing your home environment and pet preferences.',
        },
        {
            step: '02',
            title: 'DSS Compatibility Matching',
            description: 'Our Decision Support System automatically evaluates your lifestyle profile against available shelter animals to generate a personalized match score.',
        },
        {
            step: '03',
            title: 'Submit Adoption Application',
            description: 'Select your matched pet and submit your formal adoption application with pre-filled profile details.',
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
        <AppHeaderLayout>
            <Head title="FurFect Match — Virac Animal Shelter Adoption Portal" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 py-6">
                {/* ── 1. Hero Section ────────────────────────────────────────────── */}
                {sections.show_hero && (
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FDFBF7] via-[#F5EDD7]/40 to-[#EADAA2]/20 border border-[#D4A017]/20 p-8 md:p-12 shadow-sm">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                            <div className="lg:col-span-7 space-y-6">
                                <div className="inline-flex items-center gap-2 bg-[#F5EDD7] text-[#B8860B] px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Virac Animal Shelter Adoption Portal
                                </div>
                                <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                                    {config?.hero_title || 'Find Your Perfect Companion in Virac'}
                                </h1>
                                <p className="text-gray-600 text-base md:text-lg leading-relaxed max-w-2xl">
                                    {config?.hero_subtitle || 'FurFect Match pairs you with rescued pets using our Decision Support System (DSS) compatibility matching engine.'}
                                </p>
                                <div className="flex flex-wrap gap-4 pt-2">
                                    <Link href={config?.hero_cta_link || route('pets.index')}>
                                        <Button className="bg-[#D4A017] hover:bg-[#B8860B] text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all gap-2">
                                            {config?.hero_cta_text || 'Browse Available Pets'}
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Link href={route('how-it-works')}>
                                        <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-white text-sm px-6 py-2.5 rounded-xl font-semibold">
                                            How It Works
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            {/* Hero Graphics */}
                            <div className="lg:col-span-5 flex justify-center">
                                {config?.hero_image_path ? (
                                    <img
                                        src={`/storage/${config.hero_image_path}`}
                                        alt="Hero Banner"
                                        className="w-full max-h-80 object-cover rounded-2xl shadow-lg border border-white"
                                    />
                                ) : (
                                    <div className="w-full aspect-video bg-gradient-to-tr from-[#D4A017]/20 to-amber-100 rounded-2xl flex items-center justify-center border border-[#D4A017]/20 shadow-inner p-6 text-center">
                                        <div className="space-y-3">
                                            <div className="w-16 h-16 rounded-full bg-white shadow-md mx-auto flex items-center justify-center text-[#D4A017]">
                                                <Heart className="h-8 w-8 fill-[#D4A017]" />
                                            </div>
                                            <h3 className="font-bold text-gray-800 text-lg">Virac Adoption Support</h3>
                                            <p className="text-xs text-gray-500 max-w-xs">Data-driven animal matching for responsible pet ownership.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── 2. Statistics Counter Bar ──────────────────────────────────── */}
                {sections.show_stats && stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-amber-200/60 bg-amber-50/40 shadow-sm">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#D4A017] text-white flex items-center justify-center shrink-0 shadow-md">
                                    <Heart className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-gray-900">{stats.available_pets}</div>
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pets Ready for Adoption</div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-green-200/60 bg-green-50/40 shadow-sm">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-green-600 text-white flex items-center justify-center shrink-0 shadow-md">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-gray-900">{stats.adopted_pets}</div>
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pets Successfully Rehomed</div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-blue-200/60 bg-blue-50/40 shadow-sm">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                                    <Users className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-gray-900">{stats.total_adopters}</div>
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Registered Adopters</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ── 3. Featured Pets Available for Adoption ───────────────────── */}
                {sections.show_featured_pets && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Featured Pets Available for Adoption</h2>
                                <p className="text-xs text-gray-500">Rescued animals currently seeking loving homes at Virac Shelter.</p>
                            </div>
                            <Link href={route('pets.index')}>
                                <Button variant="ghost" className="text-xs font-bold text-[#D4A017] hover:text-[#B8860B] gap-1">
                                    View All Pets <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                            </Link>
                        </div>

                        {featuredPets.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {featuredPets.map((pet) => {
                                    const rawPhoto = pet.photos?.find((p: any) => p.is_primary)?.photo_path || pet.photos?.[0]?.photo_path;
                                    const photoUrl = rawPhoto
                                        ? (rawPhoto.startsWith('http') || rawPhoto.startsWith('/') ? rawPhoto : `/storage/${rawPhoto}`)
                                        : null;

                                    return (
                                        <Card key={pet.id} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                                            <div className="aspect-video bg-gray-100 relative overflow-hidden">
                                                {photoUrl ? (
                                                    <img
                                                        src={photoUrl}
                                                        alt={pet.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-semibold bg-amber-50/50">
                                                        No Photo Available
                                                    </div>
                                                )}
                                                <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded font-bold capitalize">
                                                    {pet.species}
                                                </span>
                                            </div>
                                        <CardContent className="p-4 space-y-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-base text-gray-900">{pet.name}</h3>
                                                    <p className="text-xs text-gray-500">{pet.breed} &bull; {pet.age_years} yrs</p>
                                                </div>
                                                <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded capitalize">
                                                    {pet.size}
                                                </span>
                                            </div>
                                            <div className="pt-2 flex justify-between items-center border-t border-gray-100">
                                                <span className="text-[11px] text-gray-400">{pet.shelter?.name || 'Virac Shelter'}</span>
                                                <Link href={route('pets.show', pet.id)}>
                                                    <Button size="sm" className="text-xs bg-[#D4A017] hover:bg-[#B8860B] text-white h-7 px-3">
                                                        Meet {pet.name}
                                                    </Button>
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                        ) : (
                            <p className="text-xs text-gray-400 italic">No available pets featured right now.</p>
                        )}
                    </div>
                )}

                {/* ── 4. How It Works Section ────────────────────────────────────── */}
                {sections.show_how_it_works && (
                    <div className="space-y-6 bg-[#FDFBF7] border border-[#D4A017]/20 p-8 rounded-3xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-bold text-[#B8860B] bg-[#F5EDD7] px-2.5 py-0.5 rounded-full uppercase">
                                    Adoption Process
                                </span>
                                <h2 className="text-2xl font-bold text-gray-900 mt-1">How It Works</h2>
                                <p className="text-xs text-gray-500">4 simple steps to adopt your companion pet from Virac Shelter.</p>
                            </div>
                            <Link href={route('how-it-works')}>
                                <Button variant="outline" className="text-xs font-semibold border-gray-300 text-gray-700 hover:bg-white gap-1">
                                    Full Guide <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {steps.map((item, idx) => {
                                const Icon = icons[idx % icons.length];
                                return (
                                    <div key={item.step || idx} className="bg-white border border-gray-200 p-5 rounded-2xl space-y-2 relative overflow-hidden shadow-xs">
                                        <div className="text-3xl font-black text-amber-100 absolute top-2 right-3 select-none">
                                            {item.step || `0${idx + 1}`}
                                        </div>
                                        <div className="w-9 h-9 rounded-lg bg-amber-100 text-[#D4A017] flex items-center justify-center font-bold text-xs">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <h4 className="font-bold text-sm text-gray-900">{item.title}</h4>
                                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{item.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── 5. Announcements & Shelter News ────────────────────────────── */}
                {sections.show_announcements && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Megaphone className="h-5 w-5 text-[#D4A017]" />
                                <h2 className="text-2xl font-bold text-gray-900">Shelter Announcements &amp; Updates</h2>
                            </div>
                        </div>

                        {announcements.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {announcements.map((item) => (
                                    <Card key={item.id} className="border-gray-200 shadow-sm space-y-3 p-5">
                                        {item.image_path && (
                                            <img
                                                src={`/storage/${item.image_path}`}
                                                alt={item.title}
                                                className="w-full h-36 object-cover rounded-lg"
                                            />
                                        )}
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-[#D4A017] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase">
                                                {item.category}
                                            </span>
                                            <h3 className="font-bold text-sm text-gray-900">{item.title}</h3>
                                            <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">{item.content}</p>
                                        </div>
                                        {item.published_at && (
                                            <div className="text-[10px] text-gray-400 flex items-center gap-1 pt-2 border-t border-gray-100">
                                                <Calendar className="h-3 w-3" />
                                                <span>{new Date(item.published_at).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-6 text-center text-xs text-gray-500">
                                No active announcements at this time. Check back soon for shelter drives &amp; events!
                            </div>
                        )}
                    </div>
                )}
            </div>

            <AppFooter user={auth?.user} config={config} />
        </AppHeaderLayout>
    );
}
