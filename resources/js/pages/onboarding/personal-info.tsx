import { Head, useForm, usePage } from '@inertiajs/react';
import { User, Phone, Calendar, CreditCard, Hash, MapPin, ArrowRight, Upload, FileText, Lock, ShieldCheck, CheckCircle2, Camera, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import React, { useState } from 'react';

import OnboardingLayout from '@/layouts/onboarding-layout';
import { TermsAndPoliciesModal } from '@/components/terms-and-policies-modal';
import { CameraCaptureModal } from '@/components/camera-capture-modal';
import { IdDocumentInspectorModal } from '@/components/id-document-inspector-modal';
import { DEFAULT_AGREEMENT_CONTENT } from '@/config/agreement-content';

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
    front_preview_url?: string | null;
    back_preview_url?: string | null;
    had_pets_before?: string;
    previous_pet_notes?: string;
    surrendered_pet?: boolean;
    adoption_reason?: string;
    adoption_reason_text?: string;
    pet_stay?: string;
}

export default function PersonalInfo({ profile, userName }: { profile: Profile | null; userName?: string }) {
    const { auth, systemSettings } = usePage().props as any;

    const consentLabel =
        systemSettings?.consent_agreement_label?.trim() ||
        DEFAULT_AGREEMENT_CONTENT.personalInfoConsentLabel;
    const confirmLabel = DEFAULT_AGREEMENT_CONTENT.personalInfoConfirmLabel;

    // Minimum age 18 constraint
    const maxBirthDate = new Date();
    maxBirthDate.setFullYear(maxBirthDate.getFullYear() - 18);
    const maxBirthDateStr = maxBirthDate.toISOString().split('T')[0];

    const { data, setData, post, processing, errors } = useForm<{
        full_name: string;
        contact_number: string;
        date_of_birth: string;
        home_address: string;
        valid_id_type: string;
        valid_id_number: string;
        id_document: File | null;
        id_document_back: File | null;
        had_pets_before: string;
        previous_pet_notes: string;
        surrendered_pet: boolean;
        adoption_reason: string;
        adoption_reason_text: string;
        pet_stay: string;
        terms_read: boolean;
        info_confirmed: boolean;
    }>({
        full_name: profile?.full_name || userName || auth?.user?.name || '',
        contact_number: profile?.contact_number || '',
        date_of_birth: profile?.date_of_birth || '',
        home_address: profile?.home_address || '',
        valid_id_type: profile?.valid_id_type || '',
        valid_id_number: profile?.valid_id_number || '',
        id_document: null,
        id_document_back: null,
        had_pets_before: profile?.had_pets_before || 'never',
        previous_pet_notes: profile?.previous_pet_notes || '',
        surrendered_pet: profile?.surrendered_pet || false,
        adoption_reason: profile?.adoption_reason || 'Companionship',
        adoption_reason_text: profile?.adoption_reason_text || '',
        pet_stay: profile?.pet_stay || 'inside',
        terms_read: false,
        info_confirmed: false,
    });

    // ID Configuration: Determines whether each valid ID requires Front & Back or Front Only
    const ID_CONFIG: Record<string, { sides: 'front_and_back' | 'front_only'; note: string }> = {
        'Philippine Identification (PhilID / ePhilID)': {
            sides: 'front_and_back',
            note: 'Philippine National ID cards feature biometric and security QR codes on the back.',
        },
        'Philippine Passport': {
            sides: 'front_only',
            note: 'Passports only require the biographical / photo data page.',
        },
        "Driver's License": {
            sides: 'front_and_back',
            note: "Driver's Licenses require both front particulars and back conditions/restrictions.",
        },
        'Unified Multi-Purpose ID (UMID)': {
            sides: 'front_and_back',
            note: 'UMID cards contain cardholder data on front and magnetic stripe/signature on back.',
        },
        'Professional Regulation Commission (PRC) ID': {
            sides: 'front_and_back',
            note: 'PRC ID cards have professional license data on front and validity/signature on back.',
        },
        'GSIS e-Card': {
            sides: 'front_and_back',
            note: 'GSIS UMID/e-Cards require both sides for membership verification.',
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

    const currentIdConfig = data.valid_id_type ? (ID_CONFIG[data.valid_id_type] || { sides: 'front_and_back', note: 'Standard identification document.' }) : null;
    const isFrontOnly = currentIdConfig?.sides === 'front_only';

    // Camera capture modal state
    const [cameraOpen, setCameraOpen] = useState(false);
    const [cameraTargetSide, setCameraTargetSide] = useState<'front' | 'back'>('front');

    // ID Preview inspector modal state
    const [activeIdModal, setActiveIdModal] = useState<{ open: boolean; side: 'front' | 'back' }>({
        open: false,
        side: 'front',
    });

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
        post(route('onboarding.personal.store'));
    };

    return (
        <OnboardingLayout currentStep={1}>
            <Head title="Personal Information" />
            <Card className="border-[#D4A017]/20 shadow-lg">
                    <CardHeader className="bg-[#F5EDD7]/50 border-b border-[#D4A017]/10">
                        <div className="text-sm font-semibold text-[#D4A017] mb-1">Step 1 of 2 - Personal Information</div>
                        <CardTitle className="text-2xl font-bold text-[#444]">Welcome to FurFect Match!</CardTitle>
                        <CardDescription>Let's start with your basic information. Fill it once and it stays on your account for all future applications.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name">Full Name *</Label>
                                    <Input 
                                        id="full_name" 
                                        value={data.full_name} 
                                        onChange={e => setData('full_name', e.target.value)} 
                                        required 
                                        leftIcon={<User className="size-4" />}
                                        className="focus-visible:ring-[#D4A017]"
                                    />
                                    {errors.full_name && <p className="text-red-500 text-xs">{errors.full_name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contact_number">Contact Number *</Label>
                                    <Input 
                                        id="contact_number" 
                                        value={data.contact_number} 
                                        onChange={e => setData('contact_number', e.target.value)} 
                                        required
                                        leftIcon={<Phone className="size-4" />}
                                        className="focus-visible:ring-[#D4A017]"
                                    />
                                    {errors.contact_number && <p className="text-red-500 text-xs">{errors.contact_number}</p>}
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="date_of_birth">Date of Birth *</Label>
                                        <span className="text-[11px] text-muted-foreground">Must be 18+ years</span>
                                    </div>
                                    <Input 
                                        id="date_of_birth" 
                                        type="date"
                                        max={maxBirthDateStr}
                                        value={data.date_of_birth} 
                                        onChange={e => setData('date_of_birth', e.target.value)} 
                                        required
                                        leftIcon={<Calendar className="size-4" />}
                                        className="focus-visible:ring-[#D4A017]"
                                    />
                                    {errors.date_of_birth && <p className="text-red-500 text-xs">{errors.date_of_birth}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="valid_id_type">Valid ID Type *</Label>
                                    <Select 
                                        value={data.valid_id_type} 
                                        onValueChange={val => setData('valid_id_type', val)}
                                    >
                                        <SelectTrigger className="focus:ring-[#D4A017]">
                                            <SelectValue placeholder="Select your valid ID" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-72">
                                            {/* Primary Government IDs */}
                                            <SelectItem value="Philippine Identification (PhilID / ePhilID)">Philippine Identification (PhilID / ePhilID)</SelectItem>
                                            <SelectItem value="Philippine Passport">Philippine Passport</SelectItem>
                                            <SelectItem value="Driver's License">Driver's License</SelectItem>
                                            <SelectItem value="Unified Multi-Purpose ID (UMID)">Unified Multi-Purpose ID (UMID)</SelectItem>
                                            <SelectItem value="Professional Regulation Commission (PRC) ID">Professional Regulation Commission (PRC) ID</SelectItem>
                                            <SelectItem value="GSIS e-Card">GSIS e-Card</SelectItem>

                                            {/* Secondary & Student IDs */}
                                            <SelectItem value="School ID">School ID</SelectItem>
                                            <SelectItem value="Postal ID">Postal ID</SelectItem>
                                            <SelectItem value="PhilHealth ID">PhilHealth ID</SelectItem>
                                            <SelectItem value="TIN ID">TIN ID</SelectItem>
                                            <SelectItem value="NBI Clearance / Police Clearance">NBI Clearance / Police Clearance</SelectItem>
                                            <SelectItem value="Voter's ID / Voter's Certification">Voter's ID / Voter's Certification</SelectItem>
                                            <SelectItem value="Senior Citizen ID">Senior Citizen ID</SelectItem>
                                            <SelectItem value="PWD ID">PWD ID</SelectItem>

                                            {/* Fallbacks for existing selections */}
                                            {data.valid_id_type && ![
                                                'Philippine Identification (PhilID / ePhilID)',
                                                'Philippine Passport',
                                                "Driver's License",
                                                'Unified Multi-Purpose ID (UMID)',
                                                'Professional Regulation Commission (PRC) ID',
                                                'GSIS e-Card',
                                                'School ID',
                                                'Postal ID',
                                                'PhilHealth ID',
                                                'TIN ID',
                                                'NBI Clearance / Police Clearance',
                                                "Voter's ID / Voter's Certification",
                                                'Senior Citizen ID',
                                                'PWD ID'
                                            ].includes(data.valid_id_type) && (
                                                <SelectItem value={data.valid_id_type}>{data.valid_id_type}</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {errors.valid_id_type && <p className="text-red-500 text-xs">{errors.valid_id_type}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="valid_id_number">ID Number *</Label>
                                    <Input 
                                        id="valid_id_number" 
                                        value={data.valid_id_number} 
                                        onChange={e => setData('valid_id_number', e.target.value)} 
                                        required
                                        leftIcon={<Hash className="size-4" />}
                                        className="focus-visible:ring-[#D4A017]"
                                    />
                                    {errors.valid_id_number && <p className="text-red-500 text-xs">{errors.valid_id_number}</p>}
                                </div>

                                {/* Optional Encrypted Valid ID Document Upload (Front & Back or Front Only) */}
                                <div className="space-y-4 col-span-1 md:col-span-2 bg-[#F5EDD7]/30 border border-[#D4A017]/20 rounded-xl p-4 sm:p-5">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Label className="font-semibold text-gray-800 flex items-center gap-1.5 text-sm">
                                                <FileText className="size-4 text-[#D4A017]" />
                                                Upload Valid ID
                                                {currentIdConfig && (
                                                    <span className="text-xs font-normal text-gray-600">
                                                        ({isFrontOnly ? 'Front Side Only' : 'Front & Back Sides'})
                                                    </span>
                                                )}
                                            </Label>
                                        </div>
                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                            <Lock className="size-3" /> AES-256 Encrypted in Private Storage
                                        </span>
                                    </div>

                                    {/* Auto-Identification Info Banner */}
                                    <div className="text-xs text-muted-foreground bg-white/70 p-2.5 rounded-lg border border-gray-100 flex items-start gap-2">
                                        <ShieldCheck className="size-4 shrink-0 text-[#D4A017] mt-0.5" />
                                        <div>
                                            <p className="font-medium text-gray-800">
                                                {currentIdConfig 
                                                    ? `Auto-Identified Requirement for ${data.valid_id_type}:`
                                                    : 'Upload requirement adapts automatically based on your selected ID:'}
                                            </p>
                                            <p className="text-gray-600 mt-0.5">
                                                {currentIdConfig 
                                                    ? currentIdConfig.note 
                                                    : 'Select your Valid ID Type above to see if it requires both sides (e.g. National ID, Driver\'s License) or front only (e.g. Passport, PhilHealth, Clearances).'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className={`grid gap-4 pt-1 ${isFrontOnly ? 'grid-cols-1 max-w-xl' : 'grid-cols-1 sm:grid-cols-2'}`}>
                                        {/* Front Side */}
                                        <div className="bg-white/90 p-3.5 rounded-xl border border-gray-200 space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="id_document" className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                                                    {isFrontOnly ? 'Front / Main Document Scan' : 'Front Side'}
                                                </Label>
                                                {profile?.has_id_document && (
                                                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                        Attached
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Input
                                                    id="id_document"
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/jpg,application/pdf"
                                                    onChange={e => {
                                                        const file = e.target.files?.[0] || null;
                                                        setData('id_document', file);
                                                    }}
                                                    className="bg-white file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#D4A017]/15 file:text-[#8B6508] hover:file:bg-[#D4A017]/25 cursor-pointer text-xs"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleOpenCamera('front')}
                                                    className="shrink-0 text-xs border-[#D4A017]/40 text-[#8B6508] hover:bg-[#D4A017]/15 flex items-center gap-1.5"
                                                    title={isFrontOnly ? "Open camera to capture Document" : "Open camera to capture Front ID"}
                                                >
                                                    <Camera className="size-3.5 text-[#D4A017]" />
                                                    <span className="hidden sm:inline">Camera</span>
                                                </Button>
                                            </div>

                                            {/* Front Side Selected File Preview */}
                                            {data.id_document ? (
                                                <div className="space-y-1.5 pt-1">
                                                    {data.id_document.type.startsWith('image/') && (
                                                        <div className="relative rounded-lg overflow-hidden border border-[#D4A017]/40 max-h-36 bg-gray-50 flex items-center justify-center">
                                                            <img
                                                                src={URL.createObjectURL(data.id_document)}
                                                                alt="Front ID Preview"
                                                                className="max-h-36 w-full object-contain rounded-lg"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1.5 text-xs text-[#8B6508] bg-[#F5EDD7] p-2 rounded-lg border border-[#D4A017]/30">
                                                        <Upload className="size-3.5 shrink-0 text-[#D4A017]" />
                                                        <span className="truncate">
                                                            New: <strong>{data.id_document.name}</strong> ({(data.id_document.size / 1024 / 1024).toFixed(2)} MB)
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : profile?.has_id_document ? (
                                                <div className="space-y-2 pt-1">
                                                    {profile.front_preview_url && (
                                                        <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 max-h-36 flex items-center justify-center">
                                                            <img
                                                                src={profile.front_preview_url}
                                                                alt="Current Front ID"
                                                                className="max-h-36 w-full object-contain rounded-lg"
                                                                onError={(e) => {
                                                                    // If PDF or error loading img
                                                                    (e.target as HTMLElement).style.display = 'none';
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-between gap-1 text-xs text-emerald-700 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200">
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                                                            <span className="truncate">{profile.id_document_name || 'Front ID Document'}</span>
                                                        </div>
                                                        {profile.front_preview_url && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setActiveIdModal({ open: true, side: 'front' })}
                                                                className="shrink-0 text-[11px] font-bold text-[#8B6508] hover:underline inline-flex items-center gap-1 cursor-pointer"
                                                            >
                                                                <Eye className="size-3 text-[#D4A017]" />
                                                                View Full
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : null}
                                            {errors.id_document && <p className="text-red-500 text-xs">{errors.id_document}</p>}
                                        </div>

                                        {/* Back Side (Rendered for dual-sided IDs, or shows not-required badge) */}
                                        {!isFrontOnly ? (
                                            <div className="bg-white/90 p-3.5 rounded-xl border border-gray-200 space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="id_document_back" className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                                                        Back Side
                                                    </Label>
                                                    {profile?.has_id_document_back && (
                                                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                            Attached
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        id="id_document_back"
                                                        type="file"
                                                        accept="image/png,image/jpeg,image/jpg,application/pdf"
                                                        onChange={e => {
                                                            const file = e.target.files?.[0] || null;
                                                            setData('id_document_back', file);
                                                        }}
                                                        className="bg-white file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#D4A017]/15 file:text-[#8B6508] hover:file:bg-[#D4A017]/25 cursor-pointer text-xs"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleOpenCamera('back')}
                                                        className="shrink-0 text-xs border-[#D4A017]/40 text-[#8B6508] hover:bg-[#D4A017]/15 flex items-center gap-1.5"
                                                        title="Open camera to capture Back ID"
                                                    >
                                                        <Camera className="size-3.5 text-[#D4A017]" />
                                                        <span className="hidden sm:inline">Camera</span>
                                                    </Button>
                                                </div>

                                                {/* Back Side Selected File Preview */}
                                                {data.id_document_back ? (
                                                    <div className="space-y-1.5 pt-1">
                                                        {data.id_document_back.type.startsWith('image/') && (
                                                            <div className="relative rounded-lg overflow-hidden border border-[#D4A017]/40 max-h-36 bg-gray-50 flex items-center justify-center">
                                                                <img
                                                                    src={URL.createObjectURL(data.id_document_back)}
                                                                    alt="Back ID Preview"
                                                                    className="max-h-36 w-full object-contain rounded-lg"
                                                                />
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1.5 text-xs text-[#8B6508] bg-[#F5EDD7] p-2 rounded-lg border border-[#D4A017]/30">
                                                            <Upload className="size-3.5 shrink-0 text-[#D4A017]" />
                                                            <span className="truncate">
                                                                New: <strong>{data.id_document_back.name}</strong> ({(data.id_document_back.size / 1024 / 1024).toFixed(2)} MB)
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : profile?.has_id_document_back ? (
                                                    <div className="space-y-2 pt-1">
                                                        {profile.back_preview_url && (
                                                            <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 max-h-36 flex items-center justify-center">
                                                                <img
                                                                    src={profile.back_preview_url}
                                                                    alt="Current Back ID"
                                                                    className="max-h-36 w-full object-contain rounded-lg"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLElement).style.display = 'none';
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                        <div className="flex items-center justify-between gap-1 text-xs text-emerald-700 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200">
                                                            <div className="flex items-center gap-1.5 truncate">
                                                                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                                                                <span className="truncate">{profile.id_document_back_name || 'Back ID Document'}</span>
                                                            </div>
                                                            {profile.back_preview_url && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setActiveIdModal({ open: true, side: 'back' })}
                                                                    className="shrink-0 text-[11px] font-bold text-[#8B6508] hover:underline inline-flex items-center gap-1 cursor-pointer"
                                                                >
                                                                    <Eye className="size-3 text-[#D4A017]" />
                                                                    View Full
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : null}
                                                {errors.id_document_back && <p className="text-red-500 text-xs">{errors.id_document_back}</p>}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pet_stay">Where will the pet primarily stay? *</Label>
                                    <Select 
                                        value={data.pet_stay} 
                                        onValueChange={val => setData('pet_stay', val)}
                                    >
                                        <SelectTrigger className="focus:ring-[#D4A017]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="inside">Inside the house</SelectItem>
                                            <SelectItem value="outdoors">Outdoors / Yard</SelectItem>
                                            <SelectItem value="both">Both indoors and outdoors</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.pet_stay && <p className="text-red-500 text-xs">{errors.pet_stay}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="home_address">Complete Home Address *</Label>
                                <Input 
                                    id="home_address" 
                                    value={data.home_address} 
                                    onChange={e => setData('home_address', e.target.value)} 
                                    required
                                    leftIcon={<MapPin className="size-4" />}
                                    className="focus-visible:ring-[#D4A017]"
                                />
                                {errors.home_address && <p className="text-red-500 text-xs">{errors.home_address}</p>}
                            </div>

                            <div className="border-t border-[#D4A017]/10 pt-4 space-y-4">
                                <h3 className="font-semibold text-lg text-[#444]">Pet Ownership History</h3>
                                <div className="space-y-2">
                                    <Label>Have you owned a pet before? *</Label>
                                    <div className="flex gap-4">
                                        {['currently_have', 'had_before', 'never'].map(opt => (
                                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="had_pets_before" 
                                                    value={opt} 
                                                    checked={data.had_pets_before === opt}
                                                    onChange={e => setData('had_pets_before', e.target.value)}
                                                    className="text-[#D4A017] focus:ring-[#D4A017]"
                                                />
                                                <span className="capitalize">{opt.replace('_', ' ')}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {data.had_pets_before !== 'never' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="previous_pet_notes">If yes, what happened to your previous pet(s)?</Label>
                                        <Input 
                                            id="previous_pet_notes" 
                                            value={data.previous_pet_notes} 
                                            onChange={e => setData('previous_pet_notes', e.target.value)} 
                                            placeholder="e.g., Still with me, passed away naturally, etc."
                                            className="focus-visible:ring-[#D4A017]"
                                        />
                                    </div>
                                )}

                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="surrendered_pet" 
                                        checked={data.surrendered_pet} 
                                        onCheckedChange={checked => setData('surrendered_pet', !!checked)}
                                    />
                                    <Label htmlFor="surrendered_pet" className="cursor-pointer">Have you ever surrendered a pet to a shelter? *</Label>
                                </div>
                            </div>

                            <div className="border-t border-[#D4A017]/10 pt-4 space-y-4">
                                <h3 className="font-semibold text-lg text-[#444]">Reason for Adoption</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="adoption_reason">Primary reason for adopting a pet *</Label>
                                    <Select 
                                        value={data.adoption_reason} 
                                        onValueChange={val => setData('adoption_reason', val)}
                                    >
                                        <SelectTrigger className="focus:ring-[#D4A017]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Companionship">Companionship</SelectItem>
                                            <SelectItem value="For family/children">For family / children</SelectItem>
                                            <SelectItem value="For security/guard">For security / guard</SelectItem>
                                            <SelectItem value="Emotional Support">Emotional Support</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="adoption_reason_text">Tell us about yourself and why you want to adopt *</Label>
                                    <Textarea 
                                        id="adoption_reason_text" 
                                        value={data.adoption_reason_text} 
                                        onChange={e => setData('adoption_reason_text', e.target.value)} 
                                        required
                                        placeholder="In your own words, why do you think you'd be a good pet owner?"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-[#D4A017]/10 pt-4 space-y-4">
                                <h3 className="font-semibold text-lg text-[#444]">Declaration &amp; Agreement</h3>
                                <div className="space-y-3 bg-[#F5EDD7]/30 border border-[#D4A017]/20 p-4 rounded-lg">
                                    <div className="space-y-1">
                                        <div className="flex items-start space-x-3">
                                            <Checkbox 
                                                id="terms_read" 
                                                checked={data.terms_read} 
                                                onCheckedChange={checked => setData('terms_read', !!checked)}
                                                className="mt-0.5 border-[#D4A017] data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017]"
                                            />
                                            <div className="text-sm text-gray-700">
                                                <Label htmlFor="terms_read" className="cursor-pointer font-medium">
                                                    {consentLabel} *
                                                </Label>{' '}
                                                <TermsAndPoliciesModal
                                                    trigger={
                                                        <button
                                                            type="button"
                                                            className="font-semibold text-[#D4A017] underline hover:text-[#B8860B] text-xs inline-block ml-1"
                                                        >
                                                            (View Terms &amp; Policies)
                                                        </button>
                                                    }
                                                />
                                            </div>
                                        </div>
                                        {errors.terms_read && <p className="text-red-500 text-xs pl-7">{errors.terms_read}</p>}
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-start space-x-3">
                                            <Checkbox 
                                                id="info_confirmed" 
                                                checked={data.info_confirmed} 
                                                onCheckedChange={checked => setData('info_confirmed', !!checked)}
                                                className="mt-0.5 border-[#D4A017] data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017]"
                                            />
                                            <Label htmlFor="info_confirmed" className="cursor-pointer font-medium text-sm text-gray-700">
                                                {confirmLabel} *
                                            </Label>
                                        </div>
                                        {errors.info_confirmed && <p className="text-red-500 text-xs pl-7">{errors.info_confirmed}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-[#D4A017]/10">
                                <Button 
                                    type="submit" 
                                    disabled={processing}
                                    className="bg-[#D4A017] hover:bg-[#B8860B] text-white font-semibold transition flex items-center gap-2"
                                >
                                    {processing ? 'Saving...' : 'Next: Lifestyle Quiz'}
                                    {!processing && <ArrowRight className="size-4" />}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

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
                    onOpenChange={(open) => setActiveIdModal(prev => ({ ...prev, open }))}
                    title="My Uploaded Government ID"
                    applicantName={data.full_name || profile.full_name}
                    idType={data.valid_id_type || profile.valid_id_type || 'ID Document'}
                    idNumber={data.valid_id_number || profile.valid_id_number || ''}
                    side={activeIdModal.side}
                    documentUrl={
                        activeIdModal.side === 'front'
                            ? (profile.front_preview_url ?? null)
                            : (profile.back_preview_url ?? null)
                    }
                />
            )}
        </OnboardingLayout>
    );
}

