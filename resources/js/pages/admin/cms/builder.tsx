import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Wand2, Save, LayoutTemplate, Palette, Image as ImageIcon, Eye, Check, HelpCircle, Info } from 'lucide-react';
import InputError from '@/components/input-error';
import { getTheme } from '@/lib/theme-templates';

interface TemplateOption {
    id: string;
    name: string;
    description: string;
    primary_color: string;
    preview_badge: string;
}

interface StepItem {
    step: string;
    title: string;
    description: string;
}

interface Config {
    template_name: string;
    hero_title: string;
    hero_subtitle?: string;
    hero_cta_text: string;
    hero_cta_link: string;
    hero_image_path?: string;
    section_settings?: Record<string, boolean>;
    theme_color: string;
    about_title?: string;
    about_mission?: string;
    about_phone?: string;
    about_email?: string;
    about_location?: string;
    about_hours?: string;
    how_it_works_steps?: StepItem[];
}

interface Props {
    config: Config;
    templates: TemplateOption[];
}

export default function Builder({ config, templates }: Props) {
    const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

    const defaultSteps: StepItem[] = [
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

    const { data, setData, post, processing, errors } = useForm<{
        template_name: string;
        hero_title: string;
        hero_subtitle: string;
        hero_cta_text: string;
        hero_cta_link: string;
        theme_color: string;
        section_settings: Record<string, boolean>;
        hero_image: File | null;
        about_title: string;
        about_mission: string;
        about_phone: string;
        about_email: string;
        about_location: string;
        about_hours: string;
        how_it_works_steps: StepItem[];
        _method?: string;
    }>({
        template_name: config.template_name || 'honey_warm',
        hero_title: config.hero_title || '',
        hero_subtitle: config.hero_subtitle || '',
        hero_cta_text: config.hero_cta_text || 'Browse Pets',
        hero_cta_link: config.hero_cta_link || '/pets',
        theme_color: config.theme_color || '#D4A017',
        section_settings: (() => {
            const defaults = {
                show_hero: true,
                show_featured_pets: true,
                show_announcements: true,
                show_stats: true,
                show_how_it_works: true,
                show_shelter_info: true,
            };
            if (!config.section_settings) return defaults;
            const res: Record<string, boolean> = { ...defaults };
            for (const [k, v] of Object.entries(config.section_settings)) {
                res[k] = v === true || (v as any) === '1' || (v as any) === 'true' || (v as any) === 1;
            }
            return res;
        })(),
        hero_image: null,
        about_title: config.about_title || 'Virac Municipal Animal Adoption System',
        about_mission: config.about_mission || 'To eliminate animal homelessness in Virac, Catanduanes through responsible pet adoption, community education, spay/neuter programs, and transparent municipal oversight.',
        about_phone: config.about_phone || '(052) 811-2345 / +63 950-321-7654',
        about_email: config.about_email || 'virac.shelter@gmail.com / mao@virac.gov.ph',
        about_location: config.about_location || 'Virac Municipal Compound, Barangay Concepcion, Virac, Catanduanes 4800',
        about_hours: config.about_hours || 'Monday – Friday: 8:00 AM – 5:00 PM | Saturday: 9:00 AM – 12:00 PM',
        how_it_works_steps: config.how_it_works_steps?.length ? config.how_it_works_steps : defaultSteps,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (data.hero_image) {
            post(route('admin.cms.builder.update'), {
                forceFormData: true,
            });
        } else {
            post(route('admin.cms.builder.update'));
        }
    };

    const toggleSection = (key: string) => {
        setData((prev) => ({
            ...prev,
            section_settings: {
                ...prev.section_settings,
                [key]: !prev.section_settings[key],
            },
        }));
    };

    const updateStep = (index: number, field: 'title' | 'description', value: string) => {
        const newSteps = [...data.how_it_works_steps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setData('how_it_works_steps', newSteps);
    };

    const previewTheme = getTheme(data.template_name);

    return (
        <AppLayout breadcrumbs={[{ title: 'Content & Pages', href: '#' }, { title: 'Landing Builder', href: route('admin.cms.builder.index') }]}>
            <Head title="Landing Page Builder — Admin Panel" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Builder Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Wand2 className="h-6 w-6 text-[#D4A017]" />
                            <h1 className="text-2xl font-bold text-gray-900">Landing Page Web App Builder</h1>
                        </div>
                        <p className="text-gray-500 text-xs">Customize layout themes, hero text, How It Works steps, About Us info, and section toggles.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex border border-gray-200 rounded-lg p-1 bg-gray-50">
                            <button
                                type="button"
                                onClick={() => setActiveTab('editor')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                    activeTab === 'editor' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Editor Controls
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('preview')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                                    activeTab === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Eye className="h-3.5 w-3.5" />
                                Live Preview
                            </button>
                        </div>

                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={processing}
                            className="bg-[#D4A017] hover:bg-[#B8860B] text-white font-semibold gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? 'Saving...' : 'Save & Publish'}
                        </Button>
                    </div>
                </div>

                {activeTab === 'editor' ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 1. Template Selector */}
                        <Card className="border-gray-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Palette className="h-5 w-5 text-[#D4A017]" />
                                    1. Choose Theme Template
                                </CardTitle>
                                <CardDescription className="text-xs">Select a visual theme palette for the landing header and cards.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {templates.map((tmpl) => {
                                        const isSelected = data.template_name === tmpl.id;
                                        const tmplTheme = getTheme(tmpl.id);

                                        return (
                                            <div
                                                key={tmpl.id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => {
                                                    setData((prev) => ({
                                                        ...prev,
                                                        template_name: tmpl.id,
                                                        theme_color: tmpl.primary_color,
                                                    }));
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        setData((prev) => ({
                                                            ...prev,
                                                            template_name: tmpl.id,
                                                            theme_color: tmpl.primary_color,
                                                        }));
                                                    }
                                                }}
                                                className={`border rounded-xl p-4 cursor-pointer transition-all relative select-none ${
                                                    isSelected
                                                        ? `${tmplTheme.ringColor} ring-2 bg-amber-50/20 shadow-xs`
                                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{tmpl.preview_badge}</span>
                                                    {isSelected && (
                                                        <div
                                                            className="h-5 w-5 rounded-full text-white flex items-center justify-center shadow-xs"
                                                            style={{ backgroundColor: tmpl.primary_color }}
                                                        >
                                                            <Check className="h-3 w-3 stroke-[3]" />
                                                        </div>
                                                    )}
                                                </div>
                                                <h4 className="font-bold text-gray-900 text-sm">{tmpl.name}</h4>
                                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{tmpl.description}</p>
                                                <div className="mt-3 flex items-center gap-2">
                                                    <div className="h-4 w-4 rounded-full border border-gray-300 shadow-2xs" style={{ backgroundColor: tmpl.primary_color }} />
                                                    <span className="text-[11px] font-mono text-gray-500">{tmpl.primary_color}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Hero Content Customizer */}
                        <Card className="border-gray-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <LayoutTemplate className="h-5 w-5 text-[#D4A017]" />
                                    2. Hero Banner Content &amp; Media
                                </CardTitle>
                                <CardDescription className="text-xs">Customize the headline text, subtitle, and hero graphics.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="hero_title">Hero Headline Title *</Label>
                                    <Input
                                        id="hero_title"
                                        value={data.hero_title}
                                        onChange={(e) => setData('hero_title', e.target.value)}
                                        placeholder="e.g. Find Your Perfect Companion in Virac"
                                        required
                                    />
                                    <InputError message={errors.hero_title} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="hero_subtitle">Hero Subtitle Paragraph *</Label>
                                    <Textarea
                                        id="hero_subtitle"
                                        value={data.hero_subtitle}
                                        onChange={(e) => setData('hero_subtitle', e.target.value)}
                                        placeholder="Describe the adoption mission or system compatibility benefits..."
                                        rows={3}
                                        required
                                    />
                                    <InputError message={errors.hero_subtitle} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="hero_cta_text">Primary Button Text *</Label>
                                        <Input
                                            id="hero_cta_text"
                                            value={data.hero_cta_text}
                                            onChange={(e) => setData('hero_cta_text', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="hero_cta_link">Primary Button Link *</Label>
                                        <Input
                                            id="hero_cta_link"
                                            value={data.hero_cta_link}
                                            onChange={(e) => setData('hero_cta_link', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Hero Graphic Upload */}
                                <div className="pt-2 space-y-2 border-t border-gray-100">
                                    <Label htmlFor="hero_image" className="flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4 text-[#D4A017]" />
                                        Hero Banner Graphic (Optional Photo Upload)
                                    </Label>
                                    <Input
                                        id="hero_image"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setData('hero_image', e.target.files?.[0] || null)}
                                        className="cursor-pointer"
                                    />
                                    {config.hero_image_path && (
                                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                            <span>Current image:</span>
                                            <a href={`/storage/${config.hero_image_path}`} target="_blank" rel="noreferrer" className="text-[#D4A017] underline font-medium">
                                                View Banner Image
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* 3. How It Works Steps Customizer */}
                        <Card className="border-gray-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <HelpCircle className="h-5 w-5 text-[#D4A017]" />
                                    3. How It Works Steps Customizer
                                </CardTitle>
                                <CardDescription className="text-xs">Customize titles and descriptions for the 4-step adoption process.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {data.how_it_works_steps.map((step, idx) => (
                                    <div key={idx} className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-[#D4A017] bg-white border border-gray-200 px-2 py-0.5 rounded">
                                                Step {step.step || `0${idx + 1}`}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold">Step Title</Label>
                                            <Input
                                                value={step.title}
                                                onChange={(e) => updateStep(idx, 'title', e.target.value)}
                                                className="text-xs bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold">Step Description</Label>
                                            <Textarea
                                                value={step.description}
                                                onChange={(e) => updateStep(idx, 'description', e.target.value)}
                                                rows={2}
                                                className="text-xs bg-white"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* 4. About Us & Shelter Directory Customizer */}
                        <Card className="border-gray-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Info className="h-5 w-5 text-[#D4A017]" />
                                    4. About Us Page &amp; Directory Customizer
                                </CardTitle>
                                <CardDescription className="text-xs">Customize shelter history, mission statement, and directory contact information.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="about_title">About Page Main Title</Label>
                                    <Input
                                        id="about_title"
                                        value={data.about_title}
                                        onChange={(e) => setData('about_title', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="about_mission">Mission Statement</Label>
                                    <Textarea
                                        id="about_mission"
                                        value={data.about_mission}
                                        onChange={(e) => setData('about_mission', e.target.value)}
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="about_phone">Hotline &amp; Phone Number</Label>
                                        <Input
                                            id="about_phone"
                                            value={data.about_phone}
                                            onChange={(e) => setData('about_phone', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="about_email">Official Email Address</Label>
                                        <Input
                                            id="about_email"
                                            value={data.about_email}
                                            onChange={(e) => setData('about_email', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="about_location">Facility Address / Location</Label>
                                        <Input
                                            id="about_location"
                                            value={data.about_location}
                                            onChange={(e) => setData('about_location', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="about_hours">Operating Hours</Label>
                                        <Input
                                            id="about_hours"
                                            value={data.about_hours}
                                            onChange={(e) => setData('about_hours', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 5. Section Toggles */}
                        <Card className="border-gray-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-gray-900">5. Section Visibility Controls</CardTitle>
                                <CardDescription className="text-xs">Enable or disable specific content blocks on the home page.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {[
                                        { key: 'show_hero', label: 'Hero Banner Section' },
                                        { key: 'show_featured_pets', label: 'Featured Pets Grid' },
                                        { key: 'show_how_it_works', label: 'How It Works Process Block' },
                                        { key: 'show_announcements', label: 'Announcements & News Feed' },
                                        { key: 'show_stats', label: 'Statistics Counter Cards' },
                                    ].map((sec) => (
                                        <div key={sec.key} className="flex items-center space-x-3 bg-gray-50 border border-gray-200 p-3 rounded-lg">
                                            <Checkbox
                                                id={sec.key}
                                                checked={!!data.section_settings[sec.key]}
                                                onCheckedChange={() => toggleSection(sec.key)}
                                                className="border-gray-400 data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017]"
                                            />
                                            <Label htmlFor={sec.key} className="text-xs font-semibold text-gray-800 cursor-pointer">
                                                {sec.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                ) : (
                    /* Live Preview Tab */
                    <Card className="border-gray-200 shadow-md">
                        <CardHeader className="bg-gray-50 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-base font-bold text-gray-900">Live Home Page Preview</CardTitle>
                                <span className="text-xs text-gray-700 font-medium bg-white px-2.5 py-1 rounded-md border border-gray-200 flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: previewTheme.primaryColor }} />
                                    Theme: <strong className="capitalize">{previewTheme.name}</strong>
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            {data.section_settings.show_hero && (
                                <div className={`p-8 rounded-2xl ${previewTheme.heroGradient} space-y-4`}>
                                    <span className={`text-[10px] font-bold ${previewTheme.heroBadge} px-2.5 py-0.5 rounded-full uppercase`}>Preview Hero</span>
                                    <h2 className="text-2xl font-extrabold text-gray-900">{data.hero_title}</h2>
                                    <p className="text-sm text-gray-600">{data.hero_subtitle}</p>
                                    <Button className={`${previewTheme.primaryButton} font-bold text-xs px-4 py-2 rounded-lg shadow-sm`}>
                                        {data.hero_cta_text}
                                    </Button>
                                </div>
                            )}

                            {data.section_settings.show_how_it_works && (
                                <div className={`space-y-4 ${previewTheme.cardHighlightBg} p-6 rounded-2xl border ${previewTheme.cardHighlightBorder}`}>
                                    <h3 className="font-bold text-gray-900 text-lg">Preview: How It Works</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {data.how_it_works_steps.map((st, i) => (
                                            <div key={i} className="bg-white p-3 rounded-xl border border-gray-200 space-y-1">
                                                <span className={`text-[10px] font-bold ${previewTheme.accentText}`}>Step {st.step || `0${i + 1}`}</span>
                                                <h4 className="font-bold text-xs text-gray-900">{st.title}</h4>
                                                <p className="text-[11px] text-gray-500 line-clamp-2">{st.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {data.section_settings.show_stats && (
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                                        <div className="text-xl font-black text-gray-900">6</div>
                                        <div className="text-[10px] text-gray-500 uppercase font-medium">Available Pets</div>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                        <div className="text-xl font-black text-gray-900">12</div>
                                        <div className="text-[10px] text-gray-500 uppercase font-medium">Adopted Pets</div>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                        <div className="text-xl font-black text-gray-900">45</div>
                                        <div className="text-[10px] text-gray-500 uppercase font-medium">Adopters</div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
