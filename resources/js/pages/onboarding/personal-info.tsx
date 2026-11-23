import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    User,
    Phone,
    Calendar,
    CreditCard,
    Hash,
    MapPin,
    ArrowRight,
    ArrowLeft,
    Upload,
    FileText,
    Lock,
    ShieldCheck,
    CheckCircle2,
    Camera,
    Eye,
    Heart,
    PawPrint,
    ClipboardCheck,
    Cloud,
    Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import OnboardingLayout from '@/layouts/onboarding-layout';
import { TermsAndPoliciesModal } from '@/components/terms-and-policies-modal';
import { CameraCaptureModal } from '@/components/camera-capture-modal';
import { IdDocumentInspectorModal } from '@/components/id-document-inspector-modal';
import { DEFAULT_AGREEMENT_CONTENT } from '@/config/agreement-content';
import {
    ADOPTION_INTENTION_OPTIONS,
    ADOPTION_REASON_OPTIONS,
    OTHER_OPTION_SENTINEL,
    PET_OWNERSHIP_HISTORY_OPTIONS,
    PREVIOUS_PET_HISTORY_OPTIONS,
} from '@/lib/lifestyle-labels';

interface Profile {
    id?: number;
    full_name?: string;
    contact_number?: string;
    date_of_birth?: string;
    home_address?: string;
    valid_id_type?: string;
    valid_id_number?: string;
    has_id_document?: boolean;
    id_document_name?: string;
    has_id_document_back?: boolean;
    id_document_back_name?: string;
    is_identity_verified?: boolean;
    identity_verified_at?: string | null;
    face_match_score?: number | null;
    liveness_verified?: boolean;
    front_preview_url?: string | null;
    back_preview_url?: string | null;
    had_pets_before?: string;
    previous_pet_notes?: string;
    surrendered_pet?: boolean;
    adoption_reason?: string;
    adoption_reason_text?: string;
    pet_stay?: string;
    draft_step?: number;
    profile_completed_at?: string | null;
}

const PERSONAL_STEPS = [
    { step: 1, title: 'Basic Particulars', shortTitle: 'Particulars', icon: User },
    { step: 2, title: 'Valid ID Verification', shortTitle: 'Valid ID', icon: CreditCard },
    { step: 3, title: 'Pet Ownership History', shortTitle: 'Pet History', icon: PawPrint },
    { step: 4, title: 'Adoption Intentions', shortTitle: 'Intentions', icon: Heart },
    { step: 5, title: 'Declaration & Review', shortTitle: 'Review', icon: ClipboardCheck },
] as const;

const FIELD_STEP_MAP: Record<string, number> = {
    full_name: 1,
    contact_number: 1,
    date_of_birth: 1,
    home_address: 1,
    pet_stay: 1,
    valid_id_type: 2,
    valid_id_number: 2,
    id_document: 2,
    id_document_back: 2,
    had_pets_before: 3,
    previous_pet_notes: 3,
    surrendered_pet: 3,
    adoption_reason: 4,
    adoption_reason_text: 4,
    terms_read: 5,
    info_confirmed: 5,
};

const ID_CONFIG: Record<string, { sides: 'front_only' | 'front_and_back'; note: string }> = {
    'Philippine Identification (PhilID / ePhilID)': {
        sides: 'front_and_back',
        note: 'National ID requires front personal photo side and back QR code side.',
    },
    "Driver's License": {
        sides: 'front_and_back',
        note: "Driver's License requires front info and back conditions/restrictions.",
    },
    'Philippine Passport': {
        sides: 'front_only',
        note: 'Passport requires the clear data page with signature.',
    },
    'Unified Multi-Purpose ID (UMID)': {
        sides: 'front_and_back',
        note: 'UMID requires front cardholder details and back barcode strip.',
    },
    'Professional Regulation Commission (PRC) ID': {
        sides: 'front_and_back',
        note: 'PRC ID requires front license photo side and back registration renewal info.',
    },
    'GSIS e-Card': {
        sides: 'front_and_back',
        note: 'GSIS card requires front member ID and back magnetic strip / barcode.',
    },
    'School ID': {
        sides: 'front_and_back',
        note: 'School IDs require front student details and back emergency contact / validation sticker.',
    },
    'Postal ID': {
        sides: 'front_and_back',
        note: 'Digitized Postal IDs feature cardholder info on front and QR/verification data on back.',
    },
    'PhilHealth ID': {
        sides: 'front_only',
        note: 'Standard PhilHealth paper/PVC cards only require the front member identification page.',
    },
    'TIN ID': {
        sides: 'front_only',
        note: 'BIR TIN cards only contain taxpayer identification details on the front.',
    },
    'NBI Clearance / Police Clearance': {
        sides: 'front_only',
        note: 'Clearance certificates are single-page documents.',
    },
    "Voter's ID / Voter's Certification": {
        sides: 'front_only',
        note: 'Voter documents / COMELEC certifications are single-sided certificates.',
    },
    'Senior Citizen ID': {
        sides: 'front_and_back',
        note: 'Senior Citizen OSCA cards require front personal info and back signature/benefits record.',
    },
    'PWD ID': {
        sides: 'front_and_back',
        note: 'PWD IDs require front disability registration and back signature / issuing LGU details.',
    },
};

const clampStep = (step?: number | null): number => {
    if (!step || Number.isNaN(step)) {
        return 1;
    }
    return Math.min(5, Math.max(1, step));
};

export default function PersonalInfo({
    profile,
    userName,
    ekycEnabled = true,
}: {
    profile: Profile | null;
    userName?: string;
    ekycEnabled?: boolean;
}) {
    const { auth, systemSettings } = usePage().props as any;
    const userId = auth?.user?.id ?? 'guest';
    const storageKey = `furfect_onboarding_personal_${userId}`;

    const consentLabel =
        systemSettings?.consent_agreement_label?.trim() ||
        DEFAULT_AGREEMENT_CONTENT.personalInfoConsentLabel;
    const confirmLabel = DEFAULT_AGREEMENT_CONTENT.personalInfoConfirmLabel;

    // Minimum age 18 constraint
    const maxBirthDate = new Date();
    maxBirthDate.setFullYear(maxBirthDate.getFullYear() - 18);
    const maxBirthDateStr = maxBirthDate.toISOString().split('T')[0];

    const readSavedDraft = () => {
        if (typeof window === 'undefined') {
            return null;
        }
        try {
            const raw = window.localStorage.getItem(storageKey);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    };

    const initialLocalDraft = useMemo(() => readSavedDraft(), [storageKey]);

    const initialData = {
        full_name: initialLocalDraft?.data?.full_name ?? profile?.full_name ?? userName ?? auth?.user?.name ?? '',
        contact_number: initialLocalDraft?.data?.contact_number ?? profile?.contact_number ?? '',
        date_of_birth: initialLocalDraft?.data?.date_of_birth ?? (profile?.date_of_birth ? profile.date_of_birth.split('T')[0] : ''),
        home_address: initialLocalDraft?.data?.home_address ?? profile?.home_address ?? '',
        valid_id_type: profile?.is_identity_verified
            ? (profile?.valid_id_type || initialLocalDraft?.data?.valid_id_type || '')
            : (initialLocalDraft?.data?.valid_id_type ?? profile?.valid_id_type ?? ''),
        valid_id_number: profile?.is_identity_verified
            ? (profile?.valid_id_number || initialLocalDraft?.data?.valid_id_number || '')
            : (initialLocalDraft?.data?.valid_id_number ?? profile?.valid_id_number ?? ''),
        id_document: null as File | null,
        id_document_back: null as File | null,
        had_pets_before: initialLocalDraft?.data?.had_pets_before ?? profile?.had_pets_before ?? 'never',
        previous_pet_notes: initialLocalDraft?.data?.previous_pet_notes ?? profile?.previous_pet_notes ?? '',
        surrendered_pet: initialLocalDraft?.data?.surrendered_pet ?? profile?.surrendered_pet ?? false,
        adoption_reason: initialLocalDraft?.data?.adoption_reason ?? profile?.adoption_reason ?? 'Companionship',
        adoption_reason_text: initialLocalDraft?.data?.adoption_reason_text ?? profile?.adoption_reason_text ?? '',
        pet_stay: initialLocalDraft?.data?.pet_stay ?? profile?.pet_stay ?? 'inside',
        terms_read: Boolean(initialLocalDraft?.data?.terms_read ?? false),
        info_confirmed: Boolean(initialLocalDraft?.data?.info_confirmed ?? false),
    };

    const [currentFormStep, setCurrentFormStep] = useState<number>(() =>
        clampStep(initialLocalDraft?.step ?? profile?.draft_step ?? 1)
    );
    const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [serverIdState, setServerIdState] = useState({
        has_id_document: Boolean(profile?.has_id_document),
        id_document_name: profile?.id_document_name ?? null,
        has_id_document_back: Boolean(profile?.has_id_document_back),
        id_document_back_name: profile?.id_document_back_name ?? null,
        front_preview_url: profile?.front_preview_url ?? null,
        back_preview_url: profile?.back_preview_url ?? null,
    });

    const [isOtherPrevPet, setIsOtherPrevPet] = useState<boolean>(() => {
        const notes = initialData.previous_pet_notes;
        return Boolean(notes && !PREVIOUS_PET_HISTORY_OPTIONS.includes(notes as any));
    });

    const [isOtherAdoptionText, setIsOtherAdoptionText] = useState<boolean>(() => {
        const txt = initialData.adoption_reason_text;
        return Boolean(txt && !ADOPTION_INTENTION_OPTIONS.includes(txt as any));
    });

    const { data, setData, post, processing, errors } = useForm(initialData);

    const currentIdConfig = data.valid_id_type
        ? (ID_CONFIG[data.valid_id_type] || { sides: 'front_and_back', note: 'Standard identification document.' })
        : null;
    const isFrontOnly = currentIdConfig?.sides === 'front_only';

    const [cameraOpen, setCameraOpen] = useState(false);
    const [cameraTargetSide, setCameraTargetSide] = useState<'front' | 'back'>('front');
    const [activeIdModal, setActiveIdModal] = useState<{ open: boolean; side: 'front' | 'back' }>({
        open: false,
        side: 'front',
    });

    const isInitialMount = useRef(true);
    const uploadedFrontRef = useRef<File | null>(null);
    const uploadedBackRef = useRef<File | null>(null);

    const persistToLocalStorage = (stepToSave: number) => {
        if (typeof window === 'undefined') {
            return;
        }
        try {
            const { id_document: _front, id_document_back: _back, ...serializableData } = data;
            window.localStorage.setItem(
                storageKey,
                JSON.stringify({
                    step: stepToSave,
                    data: serializableData,
                    updatedAt: Date.now(),
                })
            );
        } catch {
            // Ignore localStorage quota or private-mode errors
        }
    };

    const saveDraftToServer = async (stepToSave: number, includeFiles = false) => {
        setSaveStatus('saving');
        try {
            const csrfToken =
                (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';

            const hasNewFront = includeFiles && data.id_document && uploadedFrontRef.current !== data.id_document;
            const hasNewBack = includeFiles && data.id_document_back && uploadedBackRef.current !== data.id_document_back;

            let response: Response;

            if (hasNewFront || hasNewBack) {
                const formData = new FormData();
                formData.append('draft_step', String(stepToSave));
                formData.append('full_name', data.full_name || '');
                formData.append('contact_number', data.contact_number || '');
                formData.append('date_of_birth', data.date_of_birth || '');
                formData.append('home_address', data.home_address || '');
                formData.append('valid_id_type', data.valid_id_type || '');
                formData.append('valid_id_number', data.valid_id_number || '');
                formData.append('had_pets_before', data.had_pets_before || 'never');
                formData.append('previous_pet_notes', data.previous_pet_notes || '');
                formData.append('surrendered_pet', data.surrendered_pet ? '1' : '0');
                formData.append('adoption_reason', data.adoption_reason || '');
                formData.append('adoption_reason_text', data.adoption_reason_text || '');
                formData.append('pet_stay', data.pet_stay || 'inside');
                if (hasNewFront && data.id_document) {
                    formData.append('id_document', data.id_document);
                }
                if (hasNewBack && data.id_document_back) {
                    formData.append('id_document_back', data.id_document_back);
                }

                response = await fetch(route('onboarding.personal.draft'), {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: formData,
                });
            } else {
                const { id_document: _front, id_document_back: _back, terms_read: _t, info_confirmed: _c, ...payload } = data;
                response = await fetch(route('onboarding.personal.draft'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        ...payload,
                        draft_step: stepToSave,
                    }),
                });
            }

            if (response.ok) {
                const json = await response.json();
                if (hasNewFront && data.id_document) {
                    uploadedFrontRef.current = data.id_document;
                }
                if (hasNewBack && data.id_document_back) {
                    uploadedBackRef.current = data.id_document_back;
                }
                setServerIdState((prev) => ({
                    ...prev,
                    has_id_document: json.has_id_document ?? prev.has_id_document,
                    id_document_name: json.id_document_name ?? prev.id_document_name,
                    has_id_document_back: json.has_id_document_back ?? prev.has_id_document_back,
                    id_document_back_name: json.id_document_back_name ?? prev.id_document_back_name,
                    front_preview_url: json.front_preview_url ?? prev.front_preview_url,
                    back_preview_url: json.back_preview_url ?? prev.back_preview_url,
                }));
                setSaveStatus('saved');
            } else {
                setSaveStatus('error');
            }
        } catch {
            setSaveStatus('error');
        }
    };

    // Persist immediately to localStorage & debounce save to server on data changes
    useEffect(() => {
        persistToLocalStorage(currentFormStep);

        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timer = setTimeout(() => {
            saveDraftToServer(currentFormStep, false);
        }, 800);

        return () => clearTimeout(timer);
    }, [
        data.full_name,
        data.contact_number,
        data.date_of_birth,
        data.home_address,
        data.pet_stay,
        data.valid_id_type,
        data.valid_id_number,
        data.had_pets_before,
        data.previous_pet_notes,
        data.surrendered_pet,
        data.adoption_reason,
        data.adoption_reason_text,
        data.terms_read,
        data.info_confirmed,
    ]);

    // Upload newly chosen ID files immediately so they persist across page reloads
    useEffect(() => {
        if (data.id_document || data.id_document_back) {
            saveDraftToServer(currentFormStep, true);
        }
    }, [data.id_document, data.id_document_back]);

    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};

        if (step === 1) {
            if (!data.full_name.trim()) newErrors.full_name = 'Full name is required.';
            if (!data.contact_number.trim()) newErrors.contact_number = 'Contact number is required.';
            if (!data.date_of_birth) {
                newErrors.date_of_birth = 'Date of birth is required.';
            } else if (data.date_of_birth > maxBirthDateStr) {
                newErrors.date_of_birth = 'Adopters must be at least 18 years old.';
            }
            if (!data.home_address.trim()) newErrors.home_address = 'Complete home address is required.';
            if (!data.pet_stay) newErrors.pet_stay = 'Please select where the pet will stay.';
        } else if (step === 2 && !profile?.is_identity_verified) {
            if (!data.valid_id_type) newErrors.valid_id_type = 'Please select a valid ID type.';
            if (!data.valid_id_number.trim()) newErrors.valid_id_number = 'ID number is required.';
        } else if (step === 3) {
            if (!data.had_pets_before) newErrors.had_pets_before = 'Please select your pet ownership history.';
            if (data.had_pets_before !== 'never' && isOtherPrevPet && !data.previous_pet_notes.trim()) {
                newErrors.previous_pet_notes = 'Please specify what happened to your previous pet(s).';
            }
        } else if (step === 4) {
            if (!data.adoption_reason) newErrors.adoption_reason = 'Please select a primary reason for adoption.';
            if (!data.adoption_reason_text.trim()) {
                newErrors.adoption_reason_text = 'Please select or enter why you want to adopt.';
            }
        } else if (step === 5) {
            if (!data.terms_read) newErrors.terms_read = 'You must agree to the adoption terms and conditions.';
            if (!data.info_confirmed) newErrors.info_confirmed = 'You must confirm that all information provided is accurate.';
        }

        setStepErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const goToStep = async (targetStep: number) => {
        const clamped = clampStep(targetStep);
        if (clamped > currentFormStep) {
            for (let s = currentFormStep; s < clamped; s++) {
                if (!validateStep(s)) {
                    setCurrentFormStep(s);
                    return;
                }
            }
        }
        setStepErrors({});
        setCurrentFormStep(clamped);
        persistToLocalStorage(clamped);
        await saveDraftToServer(clamped, currentFormStep === 2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleOpenCamera = (side: 'front' | 'back') => {
        setCameraTargetSide(side);
        setCameraOpen(true);
    };

    const handleCameraCapture = (file: File) => {
        if (cameraTargetSide === 'front') {
            setData('id_document', file);
        } else {
            setData('id_document_back', file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep(5)) {
            return;
        }
        post(route('onboarding.personal.store'), {
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

    const previousPetDropdownValue = isOtherPrevPet
        ? OTHER_OPTION_SENTINEL
        : PREVIOUS_PET_HISTORY_OPTIONS.includes(data.previous_pet_notes as any)
            ? data.previous_pet_notes
            : data.previous_pet_notes
                ? OTHER_OPTION_SENTINEL
                : '';

    const adoptionReasonTextDropdownValue = isOtherAdoptionText
        ? OTHER_OPTION_SENTINEL
        : ADOPTION_INTENTION_OPTIONS.includes(data.adoption_reason_text as any)
            ? data.adoption_reason_text
            : data.adoption_reason_text
                ? OTHER_OPTION_SENTINEL
                : '';

    const mergedError = (key: string) => stepErrors[key] || (errors as Record<string, string>)[key];
    const progressPercent = (currentFormStep / PERSONAL_STEPS.length) * 100;

    return (
        <OnboardingLayout currentStep={2} ekycEnabled={ekycEnabled}>
            <Head title={ekycEnabled ? 'Step 2: Personal Information - FurFect' : 'Step 1: Personal Information - FurFect'} />

            <div className="max-w-4xl mx-auto w-full space-y-5">
                {/* Page Header Banner */}
                <div className="bg-gradient-to-r from-[#FFFDF0] via-[#FFF78D]/30 to-[#467235]/10 border border-[#467235]/20 rounded-2xl p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#283F24] bg-[#FFF78D] px-2.5 py-1 rounded-full border border-[#FFBF00]/50 mb-1.5">
                                <ShieldCheck className="size-3.5 text-[#467235]" />
                                {ekycEnabled ? 'Step 2 of 3 — Personal Information' : 'Step 1 of 2 — Personal Information'}
                            </div>
                            <h1 className="text-2xl font-bold text-[#283F24]">Adopter Profile &amp; Particulars</h1>
                            <p className="text-sm text-gray-600 mt-0.5">
                                Complete each section below. Your responses are saved automatically as you progress.
                            </p>
                        </div>

                        {/* Progressive Save Indicator */}
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
                    </div>

                    {/* Google Forms-style Stepper & Progress Bar */}
                    <div className="mt-5 space-y-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-[#283F24]">
                            <span>Section {currentFormStep} of {PERSONAL_STEPS.length}: {PERSONAL_STEPS[currentFormStep - 1].title}</span>
                            <span>{Math.round(progressPercent)}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/80 rounded-full overflow-hidden border border-[#467235]/20">
                            <div
                                className="h-full bg-[#467235] transition-all duration-300 rounded-full"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <div className="grid grid-cols-5 gap-1.5 pt-1">
                            {PERSONAL_STEPS.map((s) => {
                                const Icon = s.icon;
                                const isActive = currentFormStep === s.step;
                                const isDone = currentFormStep > s.step;
                                return (
                                    <button
                                        key={s.step}
                                        type="button"
                                        onClick={() => goToStep(s.step)}
                                        className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] font-semibold border transition cursor-pointer ${
                                            isActive
                                                ? 'bg-[#467235] text-white border-[#467235] shadow-xs'
                                                : isDone
                                                    ? 'bg-[#FFF78D]/60 text-[#283F24] border-[#FFBF00]/50 hover:bg-[#FFF78D]'
                                                    : 'bg-white/70 text-gray-500 border-gray-200 hover:bg-white'
                                        }`}
                                    >
                                        <Icon className="size-3.5 shrink-0" />
                                        <span className="hidden sm:inline truncate">{s.shortTitle}</span>
                                        <span className="sm:hidden">{s.step}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Verified Identity Status Notice */}
                {profile?.is_identity_verified ? (
                    <div className="rounded-2xl border border-emerald-300/80 bg-gradient-to-r from-emerald-50 via-emerald-50/70 to-teal-50/50 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-3.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-bold text-emerald-950 text-sm">
                                        {profile?.liveness_verified ? 'Identity Authenticated via eKYC' : 'Identity Verified & Authenticated'}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                                        <Lock className="size-2.5 text-emerald-700" /> Locked &amp; Protected
                                    </span>
                                </div>
                                <p className="text-xs text-emerald-800/90 mt-0.5">
                                    Your identity credentials have been verified and locked for adoption security.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : ekycEnabled ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-800">
                                <ShieldCheck className="h-5 w-5 text-amber-700" />
                            </div>
                            <span className="text-amber-900 font-medium">
                                Want to fast-track your adoption? Complete 60-second automated ID &amp; biometric verification in Step 1.
                            </span>
                        </div>
                        <Link href={route('onboarding.ekyc.show')}>
                            <Button variant="outline" size="sm" className="text-xs border-amber-300 text-amber-900 hover:bg-amber-100 shrink-0">
                                Go to Step 1 eKYC
                            </Button>
                        </Link>
                    </div>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* STEP 1: Basic Particulars */}
                    {currentFormStep === 1 && (
                        <Card className="border-[#467235]/20 shadow-xs">
                            <CardHeader className="bg-[#FFFDF0] border-b border-[#467235]/15 py-4 px-5">
                                <div className="flex items-center justify-between gap-2">
                                    <CardTitle className="text-base font-bold text-[#283F24] flex items-center gap-2">
                                        <User className="size-4 text-[#467235]" /> Section 1: Basic Particulars
                                    </CardTitle>
                                    {profile?.is_identity_verified && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300 shrink-0">
                                            <ShieldCheck className="size-3 text-emerald-600" /> Verified
                                        </span>
                                    )}
                                </div>
                                <CardDescription className="text-xs">Your primary contact details for verification.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 sm:p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="full_name" className="text-xs font-semibold text-gray-700">Full Name *</Label>
                                    <Input
                                        id="full_name"
                                        value={data.full_name}
                                        onChange={(e) => setData('full_name', e.target.value)}
                                        leftIcon={<User className="size-4 text-gray-400" />}
                                        className="focus-visible:ring-[#467235]"
                                        placeholder="First, Middle, Last Name"
                                    />
                                    {mergedError('full_name') && <p className="text-red-500 text-xs">{mergedError('full_name')}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="contact_number" className="text-xs font-semibold text-gray-700">Contact Number *</Label>
                                        <Input
                                            id="contact_number"
                                            value={data.contact_number}
                                            onChange={(e) => setData('contact_number', e.target.value)}
                                            leftIcon={<Phone className="size-4 text-gray-400" />}
                                            className="focus-visible:ring-[#467235]"
                                            placeholder="09123456789"
                                        />
                                        {mergedError('contact_number') && <p className="text-red-500 text-xs">{mergedError('contact_number')}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="date_of_birth" className="text-xs font-semibold text-gray-700">Date of Birth *</Label>
                                            <span className="text-[10px] text-gray-500 font-medium">18+ years</span>
                                        </div>
                                        <Input
                                            id="date_of_birth"
                                            type="date"
                                            max={maxBirthDateStr}
                                            value={data.date_of_birth}
                                            onChange={(e) => setData('date_of_birth', e.target.value)}
                                            leftIcon={<Calendar className="size-4 text-gray-400" />}
                                            className="focus-visible:ring-[#467235]"
                                        />
                                        {mergedError('date_of_birth') && <p className="text-red-500 text-xs">{mergedError('date_of_birth')}</p>}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="home_address" className="text-xs font-semibold text-gray-700">Complete Home Address *</Label>
                                    <Input
                                        id="home_address"
                                        value={data.home_address}
                                        onChange={(e) => setData('home_address', e.target.value)}
                                        leftIcon={<MapPin className="size-4 text-gray-400" />}
                                        className="focus-visible:ring-[#467235]"
                                        placeholder="Barangay, Street, Municipality, Catanduanes"
                                    />
                                    {mergedError('home_address') && <p className="text-red-500 text-xs">{mergedError('home_address')}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="pet_stay" className="text-xs font-semibold text-gray-700">Where will the pet primarily stay? *</Label>
                                    <Select value={data.pet_stay} onValueChange={(val) => setData('pet_stay', val)}>
                                        <SelectTrigger id="pet_stay" className="focus:ring-[#467235]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="inside">Inside the house</SelectItem>
                                            <SelectItem value="outdoors">Outdoors / Yard</SelectItem>
                                            <SelectItem value="both">Both indoors and outdoors</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {mergedError('pet_stay') && <p className="text-red-500 text-xs">{mergedError('pet_stay')}</p>}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* STEP 2: Valid ID Verification */}
                    {currentFormStep === 2 && (
                        <Card className="border-[#467235]/20 shadow-xs">
                            <CardHeader className="bg-[#FFFDF0] border-b border-[#467235]/15 py-4 px-5">
                                <div className="flex items-center justify-between gap-2">
                                    <CardTitle className="text-base font-bold text-[#283F24] flex items-center gap-2">
                                        <CreditCard className="size-4 text-[#467235]" /> Section 2: Valid ID Verification
                                    </CardTitle>
                                    {profile?.is_identity_verified ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300 shrink-0">
                                            <ShieldCheck className="size-3 text-emerald-600" /> Verified
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-300 shrink-0">
                                            Required
                                        </span>
                                    )}
                                </div>
                                <CardDescription className="text-xs">
                                    {profile?.is_identity_verified
                                        ? 'Government or institutional ID verified for adoption security.'
                                        : 'Government or institutional ID for adopter legitimacy.'}
                                </CardDescription>
                            </CardHeader>

                            {profile?.is_identity_verified ? (
                                <CardContent className="p-5 sm:p-6 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="p-3 rounded-xl border border-emerald-200/80 bg-emerald-50/50 space-y-1">
                                            <span className="text-[11px] font-semibold text-emerald-900/80 flex items-center gap-1">
                                                <CreditCard className="size-3 text-emerald-700" /> Verified ID Type
                                            </span>
                                            <p className="text-xs font-bold text-[#283F24] truncate" title={data.valid_id_type || profile.valid_id_type || 'Government ID'}>
                                                {data.valid_id_type || profile.valid_id_type || 'Government ID'}
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-xl border border-emerald-200/80 bg-emerald-50/50 space-y-1">
                                            <span className="text-[11px] font-semibold text-emerald-900/80 flex items-center gap-1">
                                                <Hash className="size-3 text-emerald-700" /> Verified ID Number
                                            </span>
                                            <p className="text-xs font-bold text-[#283F24] font-mono truncate" title={data.valid_id_number || profile.valid_id_number || '••••••••'}>
                                                {data.valid_id_number || profile.valid_id_number || '••••••••'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-3.5 rounded-xl border border-[#467235]/20 bg-[#FFFDF0]/60 space-y-2.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-semibold text-[#283F24] flex items-center gap-1.5">
                                                <FileText className="size-3.5 text-[#467235]" /> Verified Identity Credentials
                                            </span>
                                            <span className="text-[10px] font-medium text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-300/50">
                                                {serverIdState.has_id_document || serverIdState.front_preview_url ? 'Document Stored' : 'Shelter Verified'}
                                            </span>
                                        </div>

                                        {(serverIdState.front_preview_url || serverIdState.has_id_document || serverIdState.back_preview_url || serverIdState.has_id_document_back) ? (
                                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                                {(serverIdState.front_preview_url || serverIdState.has_id_document) && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setActiveIdModal({ open: true, side: 'front' })}
                                                        className="text-xs h-8 border-[#467235]/30 text-[#283F24] hover:bg-[#FFF78D]/30 flex items-center gap-1.5 px-3 cursor-pointer"
                                                    >
                                                        <Eye className="size-3.5 text-[#467235]" />
                                                        <span>View Front ID</span>
                                                    </Button>
                                                )}
                                                {(serverIdState.back_preview_url || serverIdState.has_id_document_back) && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setActiveIdModal({ open: true, side: 'back' })}
                                                        className="text-xs h-8 border-[#467235]/30 text-[#283F24] hover:bg-[#FFF78D]/30 flex items-center gap-1.5 px-3 cursor-pointer"
                                                    >
                                                        <Eye className="size-3.5 text-[#467235]" />
                                                        <span>View Back ID</span>
                                                    </Button>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-600">
                                                Identity record verified and cleared under official shelter supervision.
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            ) : (
                                <CardContent className="p-5 sm:p-6 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="valid_id_type" className="text-xs font-semibold text-gray-700">Valid ID Type *</Label>
                                            <Select value={data.valid_id_type} onValueChange={(val) => setData('valid_id_type', val)}>
                                                <SelectTrigger id="valid_id_type" className="focus:ring-[#467235]">
                                                    <SelectValue placeholder="Select ID Type" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-72">
                                                    {Object.keys(ID_CONFIG).map((idType) => (
                                                        <SelectItem key={idType} value={idType}>{idType}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {mergedError('valid_id_type') && <p className="text-red-500 text-xs">{mergedError('valid_id_type')}</p>}
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="valid_id_number" className="text-xs font-semibold text-gray-700">ID Number *</Label>
                                            <Input
                                                id="valid_id_number"
                                                value={data.valid_id_number}
                                                onChange={(e) => setData('valid_id_number', e.target.value)}
                                                leftIcon={<Hash className="size-4 text-gray-400" />}
                                                className="focus-visible:ring-[#467235]"
                                                placeholder="e.g. 1234-5678-9012"
                                            />
                                            {mergedError('valid_id_number') && <p className="text-red-500 text-xs">{mergedError('valid_id_number')}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-3 bg-[#FFFDF0] border border-[#467235]/20 rounded-xl p-3.5 sm:p-4">
                                        <div className="text-xs text-gray-600 flex items-start gap-2">
                                            <ShieldCheck className="size-4 shrink-0 text-[#467235] mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-[#283F24]">
                                                    {currentIdConfig
                                                        ? `Requirement for ${data.valid_id_type}:`
                                                        : 'Upload requirement adapts automatically:'}
                                                </p>
                                                <p className="text-[11px] text-gray-600 mt-0.5">
                                                    {currentIdConfig
                                                        ? currentIdConfig.note
                                                        : 'Select your Valid ID Type above to see if it requires both sides or front only.'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className={`grid gap-3 pt-1 ${isFrontOnly ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                                            {/* Front Side */}
                                            <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="id_document" className="text-[11px] font-bold text-[#283F24] uppercase tracking-wider">
                                                        {isFrontOnly ? 'Front / Main Scan' : 'Front Side'}
                                                    </Label>
                                                    {serverIdState.has_id_document && (
                                                        <span className="text-[10px] font-semibold text-emerald-800 bg-[#FFF78D] px-2 py-0.5 rounded-full border border-[#FFBF00]/40">
                                                            Attached
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    <Input
                                                        id="id_document"
                                                        type="file"
                                                        accept="image/png,image/jpeg,image/jpg,application/pdf"
                                                        onChange={(e) => setData('id_document', e.target.files?.[0] || null)}
                                                        className="bg-white file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-[#467235]/15 file:text-[#283F24] hover:file:bg-[#467235]/25 cursor-pointer text-xs h-8"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleOpenCamera('front')}
                                                        className="shrink-0 text-xs h-8 border-[#467235]/30 text-[#283F24] hover:bg-[#FFF78D]/30 flex items-center gap-1 px-2 cursor-pointer"
                                                        title={isFrontOnly ? 'Capture Document' : 'Capture Front'}
                                                    >
                                                        <Camera className="size-3.5 text-[#467235]" />
                                                        <span className="hidden sm:inline">Cam</span>
                                                    </Button>
                                                </div>

                                                {data.id_document ? (
                                                    <div className="space-y-1 pt-1">
                                                        {typeof window !== 'undefined' && data.id_document.type.startsWith('image/') && (
                                                            <div className="relative rounded-md overflow-hidden border border-[#467235]/30 max-h-24 bg-gray-50 flex items-center justify-center">
                                                                <img
                                                                    src={URL.createObjectURL(data.id_document)}
                                                                    alt="Front Preview"
                                                                    className="max-h-24 w-full object-contain"
                                                                />
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1.5 text-[11px] text-[#283F24] bg-[#FFF78D]/50 p-1.5 rounded border border-[#FFBF00]/30">
                                                            <Upload className="size-3 text-[#467235] shrink-0" />
                                                            <span className="truncate">{data.id_document.name}</span>
                                                        </div>
                                                    </div>
                                                ) : serverIdState.has_id_document ? (
                                                    <div className="space-y-1 pt-1">
                                                        <div className="flex items-center justify-between gap-1 text-[11px] text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200">
                                                            <div className="flex items-center gap-1 truncate">
                                                                <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
                                                                <span className="truncate">{serverIdState.id_document_name || 'Front ID'}</span>
                                                            </div>
                                                            {serverIdState.front_preview_url && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setActiveIdModal({ open: true, side: 'front' })}
                                                                    className="shrink-0 text-[10px] font-bold text-[#467235] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                                                                >
                                                                    <Eye className="size-3" /> View
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : null}
                                                {mergedError('id_document') && <p className="text-red-500 text-xs">{mergedError('id_document')}</p>}
                                            </div>

                                            {/* Back Side */}
                                            {!isFrontOnly && (
                                                <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label htmlFor="id_document_back" className="text-[11px] font-bold text-[#283F24] uppercase tracking-wider">
                                                            Back Side
                                                        </Label>
                                                        {serverIdState.has_id_document_back && (
                                                            <span className="text-[10px] font-semibold text-emerald-800 bg-[#FFF78D] px-2 py-0.5 rounded-full border border-[#FFBF00]/40">
                                                                Attached
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                        <Input
                                                            id="id_document_back"
                                                            type="file"
                                                            accept="image/png,image/jpeg,image/jpg,application/pdf"
                                                            onChange={(e) => setData('id_document_back', e.target.files?.[0] || null)}
                                                            className="bg-white file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-[#467235]/15 file:text-[#283F24] hover:file:bg-[#467235]/25 cursor-pointer text-xs h-8"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleOpenCamera('back')}
                                                            className="shrink-0 text-xs h-8 border-[#467235]/30 text-[#283F24] hover:bg-[#FFF78D]/30 flex items-center gap-1 px-2 cursor-pointer"
                                                            title="Capture Back"
                                                        >
                                                            <Camera className="size-3.5 text-[#467235]" />
                                                            <span className="hidden sm:inline">Cam</span>
                                                        </Button>
                                                    </div>

                                                    {data.id_document_back ? (
                                                        <div className="space-y-1 pt-1">
                                                            {typeof window !== 'undefined' && data.id_document_back.type.startsWith('image/') && (
                                                                <div className="relative rounded-md overflow-hidden border border-[#467235]/30 max-h-24 bg-gray-50 flex items-center justify-center">
                                                                    <img
                                                                        src={URL.createObjectURL(data.id_document_back)}
                                                                        alt="Back Preview"
                                                                        className="max-h-24 w-full object-contain"
                                                                    />
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-1.5 text-[11px] text-[#283F24] bg-[#FFF78D]/50 p-1.5 rounded border border-[#FFBF00]/30">
                                                                <Upload className="size-3 text-[#467235] shrink-0" />
                                                                <span className="truncate">{data.id_document_back.name}</span>
                                                            </div>
                                                        </div>
                                                    ) : serverIdState.has_id_document_back ? (
                                                        <div className="space-y-1 pt-1">
                                                            <div className="flex items-center justify-between gap-1 text-[11px] text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200">
                                                                <div className="flex items-center gap-1 truncate">
                                                                    <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
                                                                    <span className="truncate">{serverIdState.id_document_back_name || 'Back ID'}</span>
                                                                </div>
                                                                {serverIdState.back_preview_url && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setActiveIdModal({ open: true, side: 'back' })}
                                                                        className="shrink-0 text-[10px] font-bold text-[#467235] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                                                                    >
                                                                        <Eye className="size-3" /> View
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                    {mergedError('id_document_back') && <p className="text-red-500 text-xs">{mergedError('id_document_back')}</p>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    )}

                    {/* STEP 3: Pet Ownership History (Dropdowns + Statement Checkbox) */}
                    {currentFormStep === 3 && (
                        <Card className="border-[#467235]/20 shadow-xs">
                            <CardHeader className="bg-[#FFFDF0] border-b border-[#467235]/15 py-4 px-5">
                                <CardTitle className="text-base font-bold text-[#283F24] flex items-center gap-2">
                                    <PawPrint className="size-4 text-[#467235]" /> Section 3: Pet Ownership History
                                </CardTitle>
                                <CardDescription className="text-xs">Select your past or current pet parenting experience.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 sm:p-6 space-y-5">
                                <div className="space-y-1.5">
                                    <Label htmlFor="had_pets_before" className="text-xs font-semibold text-gray-700">
                                        Pet Ownership Experience *
                                    </Label>
                                    <Select
                                        value={data.had_pets_before}
                                        onValueChange={(val) => {
                                            setData('had_pets_before', val);
                                            if (val === 'never') {
                                                setData('previous_pet_notes', '');
                                                setIsOtherPrevPet(false);
                                            }
                                        }}
                                    >
                                        <SelectTrigger id="had_pets_before" className="focus:ring-[#467235]">
                                            <SelectValue placeholder="Select pet ownership experience" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PET_OWNERSHIP_HISTORY_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {mergedError('had_pets_before') && <p className="text-red-500 text-xs">{mergedError('had_pets_before')}</p>}
                                </div>

                                {data.had_pets_before !== 'never' && (
                                    <div className="space-y-2.5 pt-1">
                                        <Label htmlFor="previous_pet_history_select" className="text-xs font-semibold text-gray-700">
                                            What happened to your current or previous pet(s)?
                                        </Label>
                                        <Select
                                            value={previousPetDropdownValue}
                                            onValueChange={(val) => {
                                                if (val === OTHER_OPTION_SENTINEL) {
                                                    setIsOtherPrevPet(true);
                                                    if (PREVIOUS_PET_HISTORY_OPTIONS.includes(data.previous_pet_notes as any)) {
                                                        setData('previous_pet_notes', '');
                                                    }
                                                } else {
                                                    setIsOtherPrevPet(false);
                                                    setData('previous_pet_notes', val);
                                                }
                                            }}
                                        >
                                            <SelectTrigger id="previous_pet_history_select" className="focus:ring-[#467235]">
                                                <SelectValue placeholder="Select an option describing your pet(s)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PREVIOUS_PET_HISTORY_OPTIONS.map((option) => (
                                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                                ))}
                                                <SelectItem value={OTHER_OPTION_SENTINEL}>Others (Please specify)</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {isOtherPrevPet && (
                                            <Input
                                                id="previous_pet_notes"
                                                value={data.previous_pet_notes}
                                                onChange={(e) => setData('previous_pet_notes', e.target.value)}
                                                placeholder="Please specify what happened to your previous pet(s)"
                                                className="focus-visible:ring-[#467235] text-xs"
                                            />
                                        )}
                                        {mergedError('previous_pet_notes') && <p className="text-red-500 text-xs">{mergedError('previous_pet_notes')}</p>}
                                    </div>
                                )}

                                <div className="pt-3 border-t border-gray-100 space-y-1.5">
                                    <div className="flex items-start space-x-3 bg-[#FFFDF0] p-3.5 rounded-xl border border-[#467235]/15">
                                        <Checkbox
                                            id="surrendered_pet"
                                            checked={data.surrendered_pet}
                                            onCheckedChange={(checked) => setData('surrendered_pet', !!checked)}
                                            className="mt-0.5 data-[state=checked]:bg-[#467235] data-[state=checked]:border-[#467235]"
                                        />
                                        <div className="space-y-0.5">
                                            <Label htmlFor="surrendered_pet" className="cursor-pointer text-xs sm:text-sm font-medium text-gray-800">
                                                I have previously surrendered a pet to an animal shelter or rescue organization.
                                            </Label>
                                            <p className="text-[11px] text-gray-500">
                                                Check only if applicable. Leave unchecked if you have never surrendered a pet.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* STEP 4: Adoption Intentions (Dropdowns) */}
                    {currentFormStep === 4 && (
                        <Card className="border-[#467235]/20 shadow-xs">
                            <CardHeader className="bg-[#FFFDF0] border-b border-[#467235]/15 py-4 px-5">
                                <CardTitle className="text-base font-bold text-[#283F24] flex items-center gap-2">
                                    <Heart className="size-4 text-[#467235]" /> Section 4: Adoption Intentions
                                </CardTitle>
                                <CardDescription className="text-xs">Tell us why you wish to welcome a pet into your life.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 sm:p-6 space-y-5">
                                <div className="space-y-1.5">
                                    <Label htmlFor="adoption_reason" className="text-xs font-semibold text-gray-700">Primary Reason for Adoption *</Label>
                                    <Select value={data.adoption_reason} onValueChange={(val) => setData('adoption_reason', val)}>
                                        <SelectTrigger id="adoption_reason" className="focus:ring-[#467235]">
                                            <SelectValue placeholder="Select primary reason" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ADOPTION_REASON_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {mergedError('adoption_reason') && <p className="text-red-500 text-xs">{mergedError('adoption_reason')}</p>}
                                </div>

                                <div className="space-y-2.5">
                                    <Label htmlFor="adoption_reason_text_select" className="text-xs font-semibold text-gray-700">
                                        Why do you want to adopt? *
                                    </Label>
                                    <Select
                                        value={adoptionReasonTextDropdownValue}
                                        onValueChange={(val) => {
                                            if (val === OTHER_OPTION_SENTINEL) {
                                                setIsOtherAdoptionText(true);
                                                if (ADOPTION_INTENTION_OPTIONS.includes(data.adoption_reason_text as any)) {
                                                    setData('adoption_reason_text', '');
                                                }
                                            } else {
                                                setIsOtherAdoptionText(false);
                                                setData('adoption_reason_text', val);
                                            }
                                        }}
                                    >
                                        <SelectTrigger id="adoption_reason_text_select" className="focus:ring-[#467235]">
                                            <SelectValue placeholder="Select an adoption intention statement" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ADOPTION_INTENTION_OPTIONS.map((option) => (
                                                <SelectItem key={option} value={option}>{option}</SelectItem>
                                            ))}
                                            <SelectItem value={OTHER_OPTION_SENTINEL}>Others (Please specify)</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {isOtherAdoptionText && (
                                        <Textarea
                                            id="adoption_reason_text"
                                            value={data.adoption_reason_text}
                                            onChange={(e) => setData('adoption_reason_text', e.target.value)}
                                            rows={3}
                                            placeholder="In your own words, why do you think you'd provide a loving, responsible home?"
                                            className="focus-visible:ring-[#467235] text-xs"
                                        />
                                    )}
                                    {mergedError('adoption_reason_text') && <p className="text-red-500 text-xs">{mergedError('adoption_reason_text')}</p>}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* STEP 5: Declaration & Review */}
                    {currentFormStep === 5 && (
                        <Card className="border-[#467235]/20 shadow-xs bg-[#FFFDF0]/60">
                            <CardHeader className="bg-[#FFFDF0] border-b border-[#467235]/15 py-4 px-5">
                                <CardTitle className="text-base font-bold text-[#283F24] flex items-center gap-2">
                                    <ClipboardCheck className="size-4 text-[#467235]" /> Section 5: Review &amp; Declaration
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Review your information and confirm your declaration to continue to the Lifestyle Quiz.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 sm:p-6 space-y-5">
                                {/* Quick Summary of Entered Sections */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-[#283F24]">Basic Particulars</span>
                                            <button type="button" onClick={() => goToStep(1)} className="text-[#467235] font-semibold hover:underline cursor-pointer">
                                                Edit
                                            </button>
                                        </div>
                                        <p className="text-gray-700 truncate">{data.full_name || '—'}</p>
                                        <p className="text-gray-500 truncate">{data.contact_number || '—'} &bull; {data.date_of_birth || '—'}</p>
                                        <p className="text-gray-500 truncate">{data.home_address || '—'}</p>
                                    </div>
                                    <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-[#283F24]">History &amp; Intentions</span>
                                            <button type="button" onClick={() => goToStep(3)} className="text-[#467235] font-semibold hover:underline cursor-pointer">
                                                Edit
                                            </button>
                                        </div>
                                        <p className="text-gray-700 capitalize">{data.had_pets_before.replace(/_/g, ' ')}</p>
                                        <p className="text-gray-500 truncate">Reason: {data.adoption_reason}</p>
                                        <p className="text-gray-500 truncate">{data.adoption_reason_text || '—'}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 bg-white p-4 rounded-xl border border-[#467235]/20">
                                    <div className="space-y-1">
                                        <div className="flex items-start space-x-3">
                                            <Checkbox
                                                id="terms_read"
                                                checked={data.terms_read}
                                                onCheckedChange={(checked) => setData('terms_read', !!checked)}
                                                className="mt-0.5 data-[state=checked]:bg-[#467235] data-[state=checked]:border-[#467235]"
                                            />
                                            <div className="text-xs sm:text-sm text-gray-700">
                                                <Label htmlFor="terms_read" className="cursor-pointer font-medium">
                                                    {consentLabel} *
                                                </Label>{' '}
                                                <TermsAndPoliciesModal
                                                    trigger={
                                                        <button
                                                            type="button"
                                                            className="font-bold text-[#467235] underline hover:text-[#283F24] text-xs inline-block ml-1 cursor-pointer"
                                                        >
                                                            (View Terms &amp; Policies)
                                                        </button>
                                                    }
                                                />
                                            </div>
                                        </div>
                                        {mergedError('terms_read') && <p className="text-red-500 text-xs pl-7">{mergedError('terms_read')}</p>}
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-start space-x-3">
                                            <Checkbox
                                                id="info_confirmed"
                                                checked={data.info_confirmed}
                                                onCheckedChange={(checked) => setData('info_confirmed', !!checked)}
                                                className="mt-0.5 data-[state=checked]:bg-[#467235] data-[state=checked]:border-[#467235]"
                                            />
                                            <Label htmlFor="info_confirmed" className="cursor-pointer font-medium text-xs sm:text-sm text-gray-700">
                                                {confirmLabel} *
                                            </Label>
                                        </div>
                                        {mergedError('info_confirmed') && <p className="text-red-500 text-xs pl-7">{mergedError('info_confirmed')}</p>}
                                    </div>
                                </div>

                                <p className="text-xs text-gray-500">
                                    All information is encrypted and protected under Virac Animal Shelter Adoption policy.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Wizard Footer Navigation */}
                    <Card className="border-[#467235]/20 shadow-xs bg-[#FFFDF0]/60">
                        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                            {currentFormStep > 1 ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => goToStep(currentFormStep - 1)}
                                    className="w-full sm:w-auto border-[#467235]/30 text-[#283F24] hover:bg-[#FFF78D]/30 text-xs px-5 cursor-pointer flex items-center gap-1.5"
                                >
                                    <ArrowLeft className="size-4" /> Back
                                </Button>
                            ) : (
                                <span className="text-xs text-gray-500">Section 1 of {PERSONAL_STEPS.length}</span>
                            )}

                            {currentFormStep < PERSONAL_STEPS.length ? (
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
                                    disabled={processing}
                                    className="w-full sm:w-auto bg-[#467235] hover:bg-[#283F24] text-white font-semibold transition-all px-6 py-2.5 shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {processing ? 'Saving...' : 'Save & Continue to Lifestyle Quiz'}
                                    {!processing && <ArrowRight className="size-4" />}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </form>
            </div>

            {/* In-Browser Camera Capture Modal */}
            <CameraCaptureModal
                open={cameraOpen}
                onOpenChange={setCameraOpen}
                title={`Capture Valid ID (${cameraTargetSide === 'front' ? 'Front Side' : 'Back Side'})`}
                onCapture={handleCameraCapture}
            />

            {/* ID Document Inspector Modal */}
            {profile && (
                <IdDocumentInspectorModal
                    open={activeIdModal.open}
                    onOpenChange={(open) => setActiveIdModal((prev) => ({ ...prev, open }))}
                    title="My Uploaded Government ID"
                    applicantName={data.full_name || profile.full_name}
                    idType={data.valid_id_type || profile.valid_id_type || 'ID Document'}
                    idNumber={data.valid_id_number || profile.valid_id_number || ''}
                    side={activeIdModal.side}
                    documentUrl={
                        activeIdModal.side === 'front'
                            ? (serverIdState.front_preview_url ?? null)
                            : (serverIdState.back_preview_url ?? null)
                    }
                />
            )}
        </OnboardingLayout>
    );
}
