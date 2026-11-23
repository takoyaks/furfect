import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import OnboardingLayout from '@/layouts/onboarding-layout';
import {
    Home,
    Activity,
    Users,
    Briefcase,
    Heart,
    PawPrint,
    ArrowRight,
    ArrowLeft,
    Lock,
    Cloud,
    Loader2,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { WORK_SCHEDULE_OPTIONS, normalizeWorkSchedule } from '@/lib/lifestyle-labels';

interface Lifestyle {
    housing_type?: string;
    has_aircon?: string;
    outdoor_access?: string;
    activity_level?: string;
    work_schedule?: string;
    work_schedule_other?: string | null;
    household_size?: number;
    household_agrees?: boolean;
    has_children?: string;
    other_pets?: string;
    occupation?: string;
    monthly_income?: string;
    pet_experience?: string;
    health_conditions?: string[];
    preferred_type?: string;
    preferred_size?: string[];
    preferred_gender?: string;
    preferred_coat?: string[];
    draft_step?: number;
}

const LIFESTYLE_STEPS = [
    { step: 1, title: 'Living Situation', shortTitle: 'Living', icon: Home },
    { step: 2, title: 'Daily Lifestyle', shortTitle: 'Lifestyle', icon: Activity },
    { step: 3, title: 'Household', shortTitle: 'Household', icon: Users },
    { step: 4, title: 'Financial & Experience', shortTitle: 'Financial', icon: Briefcase },
    { step: 5, title: 'Health Considerations', shortTitle: 'Health', icon: Heart },
    { step: 6, title: 'Pet Preferences', shortTitle: 'Preferences', icon: PawPrint },
] as const;

const FIELD_STEP_MAP: Record<string, number> = {
    housing_type: 1,
    has_aircon: 1,
    outdoor_access: 1,
    occupation: 2,
    activity_level: 2,
    work_schedule: 2,
    work_schedule_other: 2,
    household_size: 3,
    household_agrees: 3,
    has_children: 3,
    other_pets: 3,
    monthly_income: 4,
    pet_experience: 4,
    health_conditions: 5,
    preferred_type: 6,
    preferred_gender: 6,
    preferred_size: 6,
    preferred_coat: 6,
};

const clampStep = (step?: number | null): number => {
    if (!step || Number.isNaN(step)) {
        return 1;
    }
    return Math.min(6, Math.max(1, step));
};

export default function LifestyleQuiz({
    lifestyle,
    isLocked,
    lockedUntil,
    ekycEnabled = true,
}: {
    lifestyle: Lifestyle | null;
    isLocked: boolean;
    lockedUntil: string | null;
    ekycEnabled?: boolean;
}) {
    const { auth } = usePage().props as any;
    const userId = auth?.user?.id ?? 'guest';
    const storageKey = `furfect_onboarding_lifestyle_${userId}`;

    const readSavedDraft = () => {
        if (typeof window === 'undefined' || isLocked) {
            return null;
        }
        try {
            const raw = window.localStorage.getItem(storageKey);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    };

    const initialLocalDraft = useMemo(() => readSavedDraft(), [storageKey, isLocked]);

    const { data, setData, post, processing, errors } = useForm({
        housing_type: initialLocalDraft?.data?.housing_type ?? lifestyle?.housing_type ?? 'apartment',
        has_aircon: initialLocalDraft?.data?.has_aircon ?? lifestyle?.has_aircon ?? 'stable',
        outdoor_access: initialLocalDraft?.data?.outdoor_access ?? lifestyle?.outdoor_access ?? 'none',
        occupation: initialLocalDraft?.data?.occupation ?? lifestyle?.occupation ?? '',
        activity_level: initialLocalDraft?.data?.activity_level ?? lifestyle?.activity_level ?? 'moderate',
        work_schedule: normalizeWorkSchedule(initialLocalDraft?.data?.work_schedule ?? lifestyle?.work_schedule),
        work_schedule_other: initialLocalDraft?.data?.work_schedule_other ?? lifestyle?.work_schedule_other ?? '',
        household_size: Number(initialLocalDraft?.data?.household_size ?? lifestyle?.household_size ?? 2),
        household_agrees: initialLocalDraft?.data?.household_agrees ?? lifestyle?.household_agrees ?? true,
        has_children: initialLocalDraft?.data?.has_children ?? lifestyle?.has_children ?? 'none',
        other_pets: initialLocalDraft?.data?.other_pets ?? lifestyle?.other_pets ?? 'none',
        monthly_income: initialLocalDraft?.data?.monthly_income ?? lifestyle?.monthly_income ?? '20001_40000',
        pet_experience: initialLocalDraft?.data?.pet_experience ?? lifestyle?.pet_experience ?? 'first_time',
        health_conditions: (initialLocalDraft?.data?.health_conditions ?? lifestyle?.health_conditions ?? []) as string[],
        preferred_type: initialLocalDraft?.data?.preferred_type ?? lifestyle?.preferred_type ?? 'dog',
        preferred_size: (initialLocalDraft?.data?.preferred_size ?? lifestyle?.preferred_size ?? []) as string[],
        preferred_gender: initialLocalDraft?.data?.preferred_gender ?? lifestyle?.preferred_gender ?? 'none',
        preferred_coat: (initialLocalDraft?.data?.preferred_coat ?? lifestyle?.preferred_coat ?? []) as string[],
    });

    const [currentFormStep, setCurrentFormStep] = useState<number>(() =>
        clampStep(initialLocalDraft?.step ?? lifestyle?.draft_step ?? 1)
    );
    const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const isInitialMount = useRef(true);

    const persistToLocalStorage = (stepToSave: number) => {
        if (typeof window === 'undefined' || isLocked) {
            return;
        }
        try {
            window.localStorage.setItem(
                storageKey,
                JSON.stringify({
                    step: stepToSave,
                    data,
                    updatedAt: Date.now(),
                })
            );
        } catch {
            // Ignore localStorage quota/private-mode errors
        }
    };

    const saveDraftToServer = async (stepToSave: number) => {
        if (isLocked) {
            return;
        }
        setSaveStatus('saving');
        try {
            const csrfToken =
                (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';

            const response = await fetch(route('onboarding.lifestyle.draft'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    ...data,
                    draft_step: stepToSave,
                }),
            });

            if (response.ok) {
                setSaveStatus('saved');
            } else {
                setSaveStatus('error');
            }
        } catch {
            setSaveStatus('error');
        }
    };

    useEffect(() => {
        if (isLocked) {
            return;
        }

        persistToLocalStorage(currentFormStep);

        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timer = setTimeout(() => {
            saveDraftToServer(currentFormStep);
        }, 800);

        return () => clearTimeout(timer);
    }, [
        isLocked,
        data.housing_type,
        data.has_aircon,
        data.outdoor_access,
        data.occupation,
        data.activity_level,
        data.work_schedule,
        data.work_schedule_other,
        data.household_size,
        data.household_agrees,
        data.has_children,
        data.other_pets,
        data.monthly_income,
        data.pet_experience,
        data.health_conditions,
        data.preferred_type,
        data.preferred_size,
        data.preferred_gender,
        data.preferred_coat,
    ]);

    const handleHealthCheckbox = (val: string, checked: boolean) => {
        const list = checked
            ? [...data.health_conditions, val]
            : data.health_conditions.filter((item) => item !== val);
        setData('health_conditions', list);
    };

    const handlePreferredSize = (val: string, checked: boolean) => {
        const list = checked
            ? [...data.preferred_size, val]
            : data.preferred_size.filter((item) => item !== val);
        setData('preferred_size', list);
    };

    const handlePreferredCoat = (val: string, checked: boolean) => {
        const list = checked
            ? [...data.preferred_coat, val]
            : data.preferred_coat.filter((item) => item !== val);
        setData('preferred_coat', list);
    };

    const validateStep = (step: number): boolean => {
        if (isLocked) {
            return true;
        }

        const newErrors: Record<string, string> = {};

        if (step === 1) {
            if (!data.housing_type) newErrors.housing_type = 'Please select your housing type.';
            if (!data.has_aircon) newErrors.has_aircon = 'Please select your ventilation/air conditioning setup.';
            if (!data.outdoor_access) newErrors.outdoor_access = 'Please select your outdoor access.';
        } else if (step === 2) {
            if (!data.occupation.trim()) newErrors.occupation = 'Please state your occupation.';
            if (!data.activity_level) newErrors.activity_level = 'Please select your activity level.';
            if (!data.work_schedule) newErrors.work_schedule = 'Please select your daily schedule.';
            if (data.work_schedule === 'others' && !data.work_schedule_other.trim()) {
                newErrors.work_schedule_other = 'Please specify your daily schedule.';
            }
        } else if (step === 3) {
            if (!data.household_size || data.household_size < 1) {
                newErrors.household_size = 'Household members must be at least 1.';
            }
        } else if (step === 4) {
            if (!data.monthly_income) newErrors.monthly_income = 'Please select a monthly income range.';
            if (!data.pet_experience) newErrors.pet_experience = 'Please select your pet experience level.';
        }

        setStepErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const goToStep = async (targetStep: number) => {
        const clamped = clampStep(targetStep);
        if (clamped > currentFormStep && !isLocked) {
            for (let s = currentFormStep; s < clamped; s++) {
                if (!validateStep(s)) {
                    setCurrentFormStep(s);
                    return;
                }
            }
        }
        setStepErrors({});
        setCurrentFormStep(clamped);
        if (!isLocked) {
            persistToLocalStorage(clamped);
            await saveDraftToServer(clamped);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLocked) {
            return;
        }
        for (let s = 1; s <= LIFESTYLE_STEPS.length; s++) {
            if (!validateStep(s)) {
                setCurrentFormStep(s);
                return;
            }
        }
        post(route('onboarding.lifestyle.store'), {
            onSuccess: () => {
                if (typeof window !== 'undefined') {
                    window.localStorage.removeItem(storageKey);
                }
            },
            onError: (errs) => {
                const firstKey = Object.keys(errs)[0];
                if (firstKey && FIELD_STEP_MAP[firstKey]) {
                    setCurrentFormStep(FIELD_STEP_MAP[firstKey]);
                }
            },
        });
    };

    const mergedError = (key: string) => stepErrors[key] || (errors as Record<string, string>)[key];
    const progressPercent = (currentFormStep / LIFESTYLE_STEPS.length) * 100;

    return (
        <OnboardingLayout currentStep={3} ekycEnabled={ekycEnabled}>
            <Head title={ekycEnabled ? 'Step 3: Lifestyle Compatibility Quiz - FurFect' : 'Step 2: Lifestyle Compatibility Quiz - FurFect'} />

            <div className="max-w-4xl mx-auto w-full space-y-5">
                {/* Locked Profile Alert */}
                {isLocked && (
                    <Alert className="bg-[#FFF78D]/60 border-[#FFBF00] text-[#283F24]">
                        <Lock className="h-4 w-4 text-[#467235]" />
                        <AlertTitle className="text-[#283F24] font-bold">Lifestyle Profile Locked</AlertTitle>
                        <AlertDescription className="text-gray-700 text-xs">
                            Your lifestyle profile is locked until{' '}
                            <strong>{lockedUntil ? new Date(lockedUntil).toLocaleDateString() : ''}</strong>.
                            Changes can only be made once every 3 months to ensure matching integrity.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Header Banner + Multi-Step Progress */}
                <div className="bg-gradient-to-r from-[#FFFDF0] via-[#FFF78D]/30 to-[#467235]/10 border border-[#467235]/20 rounded-2xl p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#283F24] bg-[#FFF78D] px-2.5 py-1 rounded-full border border-[#FFBF00]/50 mb-1.5">
                                <Activity className="size-3.5 text-[#467235]" />
                                {ekycEnabled ? 'Step 3 of 3 — Lifestyle Compatibility Assessment' : 'Step 2 of 2 — Lifestyle Compatibility Assessment'}
                            </div>
                            <h1 className="text-2xl font-bold text-[#283F24]">Tell Us About Your Lifestyle</h1>
                            <p className="text-sm text-gray-600 mt-0.5">
                                Complete each section step-by-step so we can find compatible pets for your home.
                            </p>
                        </div>

                        {!isLocked && (
                            <div className="shrink-0">
                                {saveStatus === 'saving' && (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                                        <Loader2 className="size-3.5 animate-spin" /> Saving progress...
                                    </span>
                                )}
                                {saveStatus === 'saved' && (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                                        <Cloud className="size-3.5" /> Progress saved
                                    </span>
                                )}
                                {saveStatus === 'idle' && (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-white/80 border border-gray-200 px-3 py-1.5 rounded-full">
                                        <Cloud className="size-3.5 text-[#467235]" /> Auto-save enabled
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Google Forms-style Stepper & Progress Bar */}
                    <div className="mt-5 space-y-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-[#283F24]">
                            <span>Section {currentFormStep} of {LIFESTYLE_STEPS.length}: {LIFESTYLE_STEPS[currentFormStep - 1].title}</span>
                            <span>{Math.round(progressPercent)}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/80 rounded-full overflow-hidden border border-[#467235]/20">
                            <div
                                className="h-full bg-[#467235] transition-all duration-300 rounded-full"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <div className="grid grid-cols-6 gap-1.5 pt-1">
                            {LIFESTYLE_STEPS.map((s) => {
                                const Icon = s.icon;
                                const isActive = currentFormStep === s.step;
                                const isDone = currentFormStep > s.step;
                                return (
                                    <button
                                        key={s.step}
                                        type="button"
                                        onClick={() => goToStep(s.step)}
                                        className={`flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-[11px] font-semibold border transition cursor-pointer ${
                                            isActive
                                                ? 'bg-[#467235] text-white border-[#467235] shadow-xs'
                                                : isDone
                                                    ? 'bg-[#FFF78D]/60 text-[#283F24] border-[#FFBF00]/50 hover:bg-[#FFF78D]'
                                                    : 'bg-white/70 text-gray-500 border-gray-200 hover:bg-white'
                                        }`}
                                    >
                                        <Icon className="size-3.5 shrink-0" />
                                        <span className="hidden md:inline truncate">{s.shortTitle}</span>
                                        <span className="md:hidden">{s.step}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* STEP 1: Living Situation (Weight badge hidden) */}
                    {currentFormStep === 1 && (
                        <Card className="border-[#467235]/20 shadow-xs">
                            <CardHeader className="bg-[#FFFDF0] border-b border-[#467235]/15 py-4 px-5">
                                <CardTitle className="text-base font-bold text-[#283F24] flex items-center gap-2">
                                    <Home className="size-4 text-[#467235]" /> Section 1: Living Situation
                                </CardTitle>
                                <CardDescription className="text-xs">Tell us about your current home environment and outdoor space.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 sm:p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="housing_type" className="text-xs font-semibold text-gray-700">What type of house do you live in? *</Label>
                                    <Select disabled={isLocked} value={data.housing_type} onValueChange={(val) => setData('housing_type', val)}>
                                        <SelectTrigger id="housing_type" className="focus:ring-[#467235] text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="house_with_yard">House with yard</SelectItem>
                                            <SelectItem value="apartment">Apartment</SelectItem>
                                            <SelectItem value="condo">Condo</SelectItem>
                                            <SelectItem value="house_no_yard">House without yard</SelectItem>
                                            <SelectItem value="rented_room">Rented room / boarding</SelectItem>
                                            <SelectItem value="rural">Rural / Farm</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {mergedError('housing_type') && <p className="text-red-500 text-xs">{mergedError('housing_type')}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="has_aircon" className="text-xs font-semibold text-gray-700">Air conditioning / ventilation *</Label>
                                        <Select disabled={isLocked} value={data.has_aircon} onValueChange={(val) => setData('has_aircon', val)}>
                                            <SelectTrigger id="has_aircon" className="focus:ring-[#467235] text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="stable">Stable aircon</SelectItem>
                                                <SelectItem value="sometimes">Sometimes</SelectItem>
                                                <SelectItem value="none_electric">Electric fan only</SelectItem>
                                                <SelectItem value="none_natural">Natural ventilation</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {mergedError('has_aircon') && <p className="text-red-500 text-xs">{mergedError('has_aircon')}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="outdoor_access" className="text-xs font-semibold text-gray-700">Outdoor access *</Label>
                                        <Select disabled={isLocked} value={data.outdoor_access} onValueChange={(val) => setData('outdoor_access', val)}>
                                            <SelectTrigger id="outdoor_access" className="focus:ring-[#467235] text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="fully_fenced">Fully fenced yard</SelectItem>
                                                <SelectItem value="not_fenced">Yard (not fenced)</SelectItem>
                                                <SelectItem value="none">No yard / None</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {mergedError('outdoor_access') && <p className="text-red-500 text-xs">{mergedError('outdoor_access')}</p>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* STEP 2: Daily Lifestyle (Occupation moved here + New Daily Schedule choices) */}
                    {currentFormStep === 2 && (
                        <Card className="border-[#467235]/20 shadow-xs">
                            <CardHeader className="bg-[#FFFDF0] border-b border-[#467235]/15 py-4 px-5">
                                <CardTitle className="text-base font-bold text-[#283F24] flex items-center gap-2">
                                    <Activity className="size-4 text-[#467235]" /> Section 2: Daily Lifestyle
                                </CardTitle>
                                <CardDescription className="text-xs">Share your occupation, activity pace, and typical daily schedule.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 sm:p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="occupation" className="text-xs font-semibold text-gray-700">Occupation *</Label>
                                    <Input
                                        id="occupation"
                                        disabled={isLocked}
                                        value={data.occupation}
                                        onChange={(e) => setData('occupation', e.target.value)}
                                        placeholder="e.g. Teacher, Nurse, Freelancer, Student, Business Owner"
                                        className="focus-visible:ring-[#467235] text-xs"
                                    />
                                    {mergedError('occupation') && <p className="text-red-500 text-xs">{mergedError('occupation')}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="activity_level" className="text-xs font-semibold text-gray-700">Activity Level *</Label>
                                        <Select disabled={isLocked} value={data.activity_level} onValueChange={(val) => setData('activity_level', val)}>
                                            <SelectTrigger id="activity_level" className="focus:ring-[#467235] text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="very_light">Very light (mostly home)</SelectItem>
                                                <SelectItem value="light">Light (occasional walks)</SelectItem>
                                                <SelectItem value="moderate">Moderate (regular exercise)</SelectItem>
                                                <SelectItem value="very_active">Very active (sporty/outdoor)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {mergedError('activity_level') && <p className="text-red-500 text-xs">{mergedError('activity_level')}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="work_schedule" className="text-xs font-semibold text-gray-700">Daily Schedule *</Label>
                                        <Select
                                            disabled={isLocked}
                                            value={data.work_schedule}
                                            onValueChange={(val) => {
                                                setData('work_schedule', val);
                                                if (val !== 'others') {
                                                    setData('work_schedule_other', '');
                                                }
                                            }}
                                        >
                                            <SelectTrigger id="work_schedule" className="focus:ring-[#467235] text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {WORK_SCHEDULE_OPTIONS.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {mergedError('work_schedule') && <p className="text-red-500 text-xs">{mergedError('work_schedule')}</p>}
                                    </div>
                                </div>

                                {data.work_schedule === 'others' && (
                                    <div className="space-y-1.5">
                                        <Label htmlFor="work_schedule_other" className="text-xs font-semibold text-gray-700">
                                            Please specify your daily schedule *
                                        </Label>
                                        <Input
                                            id="work_schedule_other"
                                            disabled={isLocked}
                                            value={data.work_schedule_other}
                                            onChange={(e) => setData('work_schedule_other', e.target.value)}
                                            placeholder="Describe your typical daily schedule"
                                            className="focus-visible:ring-[#467235] text-xs"
                                        />
                                        {mergedError('work_schedule_other') && <p className="text-red-500 text-xs">{mergedError('work_schedule_other')}</p>}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* STEP 3: Household */}
                    {currentFormStep === 3 && (
                        <Card className="border-[#467235]/20 shadow-xs">
                            <CardHeader className="bg-[#FFFDF0] border-b border-[#467235]/15 py-4 px-5">
                                <CardTitle className="text-base font-bold text-[#283F24] flex items-center gap-2">
                                    <Users className="size-4 text-[#467235]" /> Section 3: Household
                                </CardTitle>
                                <CardDescription className="text-xs">Information about everyone living in your home.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 sm:p-6 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="household_size" className="text-xs font-semibold text-gray-700">Household Members *</Label>
                                        <Input
                                            id="household_size"
                                            type="number"
                                            min="1"
                                            disabled={isLocked}
                                            value={data.household_size}
                                            onChange={(e) => setData('household_size', parseInt(e.target.value, 10) || 1)}
                                            className="focus-visible:ring-[#467235] text-xs"
                                        />
                                        {mergedError('household_size') && <p className="text-red-500 text-xs">{mergedError('household_size')}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="household_agrees" className="text-xs font-semibold text-gray-700">Household Agreement *</Label>
                                        <Select
                                            disabled={isLocked}
                                            value={data.household_agrees ? 'yes' : 'no'}
                                            onValueChange={(val) => setData('household_agrees', val === 'yes')}
                                        >
                                            <SelectTrigger id="household_agrees" className="focus:ring-[#467235] text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="yes">Yes, everyone agrees to adopt</SelectItem>
                                                <SelectItem value="no">Not yet discussed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="has_children" className="text-xs font-semibold text-gray-700">Children at home *</Label>
                                        <Select disabled={isLocked} value={data.has_children} onValueChange={(val) => setData('has_children', val)}>
                                            <SelectTrigger id="has_children" className="focus:ring-[#467235] text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No children</SelectItem>
                                                <SelectItem value="young">Young children (&lt; 7)</SelectItem>
                                                <SelectItem value="older">Older children (7-12)</SelectItem>
                                                <SelectItem value="teenagers">Teenagers (13+)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="other_pets" className="text-xs font-semibold text-gray-700">Other pets at home *</Label>
                                        <Select disabled={isLocked} value={data.other_pets} onValueChange={(val) => setData('other_pets', val)}>
                                            <SelectTrigger id="other_pets" className="focus:ring-[#467235] text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No other pets</SelectItem>
                                                <SelectItem value="dogs">Yes, other dogs</SelectItem>
                                                <SelectItem value="cats">Yes, other cats</SelectItem>
                                                <SelectItem value="both">Both dogs &amp; cats</SelectItem>
                                                <SelectItem value="mixed">Mixed pets</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* STEP 4: Financial Capacity & Experience */}
                    {currentFormStep === 4 && (
                        <Card className="border-[#467235]/20 shadow-xs">
                            <CardHeader className="bg-[#FFFDF0] border-b border-[#467235]/15 py-4 px-5">
                                <CardTitle className="text-base font-bold text-[#283F24] flex items-center gap-2">
                                    <Briefcase className="size-4 text-[#467235]" /> Section 4: Financial Capacity &amp; Experience
                                </CardTitle>
                                <CardDescription className="text-xs">Monthly budget capacity and prior experience caring for pets.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 sm:p-6 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="monthly_income" className="text-xs font-semibold text-gray-700">Monthly Income Range *</Label>
                                        <Select disabled={isLocked} value={data.monthly_income} onValueChange={(val) => setData('monthly_income', val)}>
                                            <SelectTrigger id="monthly_income" className="focus:ring-[#467235] text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="below_10000">Below ₱10,000</SelectItem>
                                                <SelectItem value="10000_20000">₱10,000 - ₱20,000</SelectItem>
                                                <SelectItem value="20001_40000">₱20,001 - ₱40,000</SelectItem>
                                                <SelectItem value="40001_60000">₱40,001 - ₱60,000</SelectItem>
                                                <SelectItem value="60001_100000">₱60,001 - ₱100,000</SelectItem>
                                                <SelectItem value="above_100000">Above ₱100,000</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {mergedError('monthly_income') && <p className="text-red-500 text-xs">{mergedError('monthly_income')}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="pet_experience" className="text-xs font-semibold text-gray-700">Pet Experience *</Label>
                                        <Select disabled={isLocked} value={data.pet_experience} onValueChange={(val) => setData('pet_experience', val)}>
                                            <SelectTrigger id="pet_experience" className="focus:ring-[#467235] text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="first_time">First-time owner</SelectItem>
                                                <SelectItem value="had_before">Had pets before</SelectItem>
                                                <SelectItem value="currently_have">Currently have pets</SelectItem>
                                                <SelectItem value="experienced_multiple">Experienced / Multi-pet</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {mergedError('pet_experience') && <p className="text-red-500 text-xs">{mergedError('pet_experience')}</p>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* STEP 5: Health Considerations (Statement Checkboxes) */}
                    {currentFormStep === 5 && (
                        <Card className="border-[#467235]/20 shadow-xs">
                            <CardHeader className="bg-[#FFFDF0] border-b border-[#467235]/15 py-4 px-5">
                                <CardTitle className="text-base font-bold text-[#283F24] flex items-center gap-2">
                                    <Heart className="size-4 text-[#467235]" /> Section 5: Health Considerations
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Select any statement below that applies to you or your household members (leave unchecked if none apply).
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 sm:p-6 space-y-3">
                                <div className="grid grid-cols-1 gap-2.5">
                                    {[
                                        { val: 'asthma', label: 'Someone in my household has asthma or a respiratory condition.' },
                                        { val: 'fur_allergy', label: 'Someone in my household has a pet fur or dander allergy.' },
                                        { val: 'skin_allergy', label: 'Someone in my household has skin allergies or dermatitis.' },
                                        { val: 'immunocompromised', label: 'Someone in my household is immunocompromised.' },
                                        { val: 'anxiety', label: 'Someone in my household has animal phobia or anxiety around pets.' },
                                        { val: 'noise_sensitive', label: 'Someone in my household is sensitive to loud barking or pet noise.' },
                                    ].map((item) => (
                                        <div key={item.val} className="flex items-start space-x-2.5 bg-[#FFFDF0] p-3 rounded-lg border border-[#467235]/15">
                                            <Checkbox
                                                id={item.val}
                                                disabled={isLocked}
                                                checked={data.health_conditions.includes(item.val)}
                                                onCheckedChange={(checked) => handleHealthCheckbox(item.val, !!checked)}
                                                className="mt-0.5 data-[state=checked]:bg-[#467235] data-[state=checked]:border-[#467235]"
                                            />
                                            <Label htmlFor={item.val} className="cursor-pointer font-normal text-xs sm:text-sm text-gray-700">
                                                {item.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* STEP 6: Pet Preferences & Final Submit */}
                    {currentFormStep === 6 && (
                        <Card className="border-[#467235]/20 shadow-xs">
                            <CardHeader className="bg-[#FFFDF0] border-b border-[#467235]/15 py-4 px-5">
                                <CardTitle className="text-base font-bold text-[#283F24] flex items-center gap-2">
                                    <PawPrint className="size-4 text-[#467235]" /> Section 6: Pet Preferences
                                </CardTitle>
                                <CardDescription className="text-xs">Select any preferred traits for your companion pet.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 sm:p-6 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="preferred_type" className="text-xs font-semibold text-gray-700">Preferred Type</Label>
                                        <Select disabled={isLocked} value={data.preferred_type} onValueChange={(val) => setData('preferred_type', val)}>
                                            <SelectTrigger id="preferred_type" className="focus:ring-[#467235] text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="dog">Dog</SelectItem>
                                                <SelectItem value="cat">Cat</SelectItem>
                                                <SelectItem value="none">No preference</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="preferred_gender" className="text-xs font-semibold text-gray-700">Preferred Gender</Label>
                                        <Select disabled={isLocked} value={data.preferred_gender} onValueChange={(val) => setData('preferred_gender', val)}>
                                            <SelectTrigger id="preferred_gender" className="focus:ring-[#467235] text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Any / No preference</SelectItem>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-1">
                                    <Label className="text-xs font-semibold text-gray-700">
                                        Select all preferred pet sizes (leave unchecked if you have no preference):
                                    </Label>
                                    <div className="flex flex-wrap gap-4 pt-1">
                                        {['small', 'medium', 'large'].map((sz) => (
                                            <div key={sz} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`sz-${sz}`}
                                                    disabled={isLocked}
                                                    checked={data.preferred_size.includes(sz)}
                                                    onCheckedChange={(checked) => handlePreferredSize(sz, !!checked)}
                                                    className="data-[state=checked]:bg-[#467235] data-[state=checked]:border-[#467235]"
                                                />
                                                <Label htmlFor={`sz-${sz}`} className="cursor-pointer font-normal capitalize text-xs text-gray-700">
                                                    I prefer a {sz} pet
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-gray-100">
                                    <Label className="text-xs font-semibold text-gray-700">
                                        Select all preferred coat colors (leave unchecked if you have no preference):
                                    </Label>
                                    <div className="flex flex-wrap gap-3 pt-1">
                                        {[
                                            { val: 'black', label: 'I prefer a black coat' },
                                            { val: 'white', label: 'I prefer a white coat' },
                                            { val: 'brown', label: 'I prefer a brown coat' },
                                            { val: 'mixed', label: 'I prefer a multi / mixed coat' },
                                            { val: 'golden', label: 'I prefer a golden / cream coat' },
                                        ].map((color) => (
                                            <div key={color.val} className="flex items-center space-x-1.5">
                                                <Checkbox
                                                    id={`color-${color.val}`}
                                                    disabled={isLocked}
                                                    checked={data.preferred_coat.includes(color.val)}
                                                    onCheckedChange={(checked) => handlePreferredCoat(color.val, !!checked)}
                                                    className="data-[state=checked]:bg-[#467235] data-[state=checked]:border-[#467235]"
                                                />
                                                <Label htmlFor={`color-${color.val}`} className="cursor-pointer font-normal text-xs text-gray-700">
                                                    {color.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* BOTTOM FULL-WIDTH: Action Footer */}
                    <Card className="border-[#467235]/20 shadow-xs bg-[#FFFDF0]/60">
                        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                            {currentFormStep > 1 ? (
                                <Button
                                    type="button"
                                    onClick={() => goToStep(currentFormStep - 1)}
                                    variant="outline"
                                    className="w-full sm:w-auto border-[#467235]/30 text-[#283F24] hover:bg-[#FFF78D]/30 text-xs px-5 cursor-pointer flex items-center gap-1.5"
                                >
                                    <ArrowLeft className="size-4" /> Back
                                </Button>
                            ) : (
                                <Link href={route('onboarding.personal.edit')} className="w-full sm:w-auto">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full sm:w-auto border-[#467235]/30 text-[#283F24] hover:bg-[#FFF78D]/30 text-xs px-5 cursor-pointer"
                                    >
                                        ← Back to Personal Info
                                    </Button>
                                </Link>
                            )}

                            {currentFormStep < LIFESTYLE_STEPS.length ? (
                                <Button
                                    type="button"
                                    onClick={() => goToStep(currentFormStep + 1)}
                                    className="w-full sm:w-auto bg-[#467235] hover:bg-[#283F24] text-white font-semibold transition-all px-6 py-2.5 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    Next Section <ArrowRight className="size-4" />
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={processing || isLocked}
                                    className="w-full sm:w-auto bg-[#467235] hover:bg-[#283F24] text-white font-semibold transition-all px-6 py-2.5 shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {processing ? 'Finding Matches...' : <>Submit &amp; View My Matches <ArrowRight className="size-4" /></>}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </form>
            </div>
        </OnboardingLayout>
    );
}
