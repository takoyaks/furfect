import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { User, Phone, Calendar, CreditCard, Hash, MapPin, ArrowRight, Upload, FileText, Lock, ShieldCheck, CheckCircle2, Camera, Eye, Heart } from 'lucide-react';
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
import { IdentityVerificationCard } from '@/components/identity-verification-card';
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
        date_of_birth: profile?.date_of_birth ? profile.date_of_birth.split('T')[0] : '',
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
        <OnboardingLayout currentStep={2}>
            <Head title="Step 2: Personal Information - FurFect" />
            
            {/* Page Header Banner */}
            <div className="bg-gradient-to-r from-[#FFFDF0] via-[#FFF78D]/30 to-[#467235]/10 border border-[#467235]/20 rounded-2xl p-5 shadow-xs mb-1">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#283F24] bg-[#FFF78D] px-2.5 py-1 rounded-full border border-[#FFBF00]/50 mb-1.5">
                            <ShieldCheck className="size-3.5 text-[#467235]" /> Step 2 of 3 — Personal Information
                        </div>
                        <h1 className="text-2xl font-bold text-[#283F24]">Adopter Profile & Particulars</h1>
                        <p className="text-sm text-gray-600 mt-0.5">
                            {profile?.is_identity_verified 
                                ? 'Your identity has been verified in Step 1. Please review and complete your contact and adoption details.'
                                : 'Complete your primary contact and adoption information. All details stay securely saved for all shelter adoptions.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Verified Identity Status Notice */}
            {profile?.is_identity_verified ? (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-4 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="font-bold text-emerald-950 block">Identity Authenticated via eKYC</span>
                            <span className="text-emerald-800">
                                Your name, date of birth, and valid ID have been verified and locked for adoption security.
                            </span>
                        </div>
                    </div>
                    {/* <Link href={route('onboarding.ekyc.show')}>
                        <Button variant="outline" size="sm" className="text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-100/60">
                            View eKYC Details
                        </Button>
                    </Link> */}
                </div>
            ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                        <ShieldCheck className="h-4 w-4 text-amber-700 shrink-0" />
                        <span className="text-amber-900">
                            Want to fast-track your adoption? You can complete 60-second automated ID & biometric verification in Step 1.
                        </span>
                    </div>
                    <Link href={route('onboarding.ekyc.show')}>
                        <Button variant="outline" size="sm" className="text-xs border-amber-300 text-amber-900 hover:bg-amber-100 shrink-0">
                            Go to Step 1 eKYC
                        </Button>
                    </Link>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 2-Column Responsive Layout for Desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    
                    {/* LEFT COLUMN: Basic Info & Pet Ownership History */}
                    <div className="space-y-6">
                        {/* Basic Personal Particulars Card */}
                        <Card className="border-[#467235]/20 shadow-xs">
                            <CardHeader className="bg-[#FFFDF0] border-b border-[#467235]/15 py-3.5 px-5">
                                <CardTitle className="text-base font-bold text-[#283F24] flex items-center gap-2">
                                    <User className="size-4 text-[#467235]" /> Basic Particulars
                                </CardTitle>
                                <CardDescription className="text-xs">Your primary contact details for verification.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="full_name" className="text-xs font-semibold text-gray-700">Full Name *</Label>
                                    <Input 
                                        id="full_name" 
                                        value={data.full_name} 
                                        onChange={e => setData('full_name', e.target.value)} 
                                        required 
                                        leftIcon={<User className="size-4 text-gray-400" />}
                                        className="focus-visible:ring-[#467235]"
                                        placeholder="First, Middle, Last Name"
                                    />
                                    {errors.full_name && <p className="text-red-500 text-xs">{errors.full_name}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="contact_number" className="text-xs font-semibold text-gray-700">Contact Number *</Label>
                                        <Input 
                                            id="contact_number" 
                                            value={data.contact_number} 
                                            onChange={e => setData('contact_number', e.target.value)} 
                                            required
                                            leftIcon={<Phone className="size-4 text-gray-400" />}
                                            className="focus-visible:ring-[#467235]"
                                            placeholder="09123456789"
                                        />
                                        {errors.contact_number && <p className="text-red-500 text-xs">{errors.contact_number}</p>}
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
                                            onChange={e => setData('date_of_birth', e.target.value)} 
                                            required
                                            leftIcon={<Calendar className="size-4 text-gray-400" />}
                                            className="focus-visible:ring-[#467235]"
                                        />
                                        {errors.date_of_birth && <p className="text-red-500 text-xs">{errors.date_of_birth}</p>}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="home_address" className="text-xs font-semibold text-gray-700">Complete Home Address *</Label>
                                    <Input 
                                        id="home_address" 
                                        value={data.home_address} 
                                        onChange={e => setData('home_address', e.target.value)} 
                                        required
                                        leftIcon={<MapPin className="size-4 text-gray-400" />}
                                        className="focus-visible:ring-[#467235]"
                                        placeholder="Barangay, Street, Municipality, Catanduanes"
                                    />
                                    {errors.home_address && <p className="text-red-500 text-xs">{errors.home_address}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="pet_stay" className="text-xs font-semibold text-gray-700">Where will the pet primarily stay? *</Label>
                                    <Select 
                                        value={data.pet_stay} 
                                        onValueChange={val => setData('pet_stay', val)}
                                    >
                                        <SelectTrigger className="focus:ring-[#467235]">
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
                            </CardContent>
                        </Card>

                        {/* Pet Ownership History Card */}
                        <Card className="border-[#467235]/20 shadow-xs">
                            <CardHeader className="bg-[#FFFDF0] border-b border-[#467235]/15 py-3.5 px-5">
                                <CardTitle className="text-base font-bold text-[#283F24] flex items-center gap-2">
                                    <User className="size-4 text-[#467235]" /> Pet Ownership History
                                </CardTitle>
                                <CardDescription className="text-xs">Past pet parenting experience.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-700">Have you owned a pet before? *</Label>
                                    <div className="flex flex-wrap gap-4 pt-1">
                                        {[
                                            { id: 'currently_have', label: 'Currently Have' },
                                            { id: 'had_before', label: 'Had Before' },
                                            { id: 'never', label: 'Never (First Time)' },
                                        ].map(opt => (
                                            <label key={opt.id} className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-medium text-gray-700">
                                                <input 
                                                    type="radio" 
                                                    name="had_pets_before" 
                                                    value={opt.id} 
                                                    checked={data.had_pets_before === opt.id}
                                                    onChange={e => setData('had_pets_before', e.target.value)}
                                                    className="accent-[#467235] focus:ring-[#467235]"
                                                />
                                                <span>{opt.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {data.had_pets_before !== 'never' && (
                                    <div className="space-y-1.5 pt-1">
                                        <Label htmlFor="previous_pet_notes" className="text-xs font-semibold text-gray-700">If yes, what happened to your previous pet(s)?</Label>
                                        <Input 
                                            id="previous_pet_notes" 
                                            value={data.previous_pet_notes} 
                                            onChange={e => setData('previous_pet_notes', e.target.value)} 
                                            placeholder="e.g., Still with me, passed away naturally, etc."
                                            className="focus-visible:ring-[#467235] text-xs"
                                        />
                                    </div>
                                )}

                                <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                                    <Checkbox 
                                        id="surrendered_pet" 
                                        checked={data.surrendered_pet} 
                                        onCheckedChange={checked => setData('surrendered_pet', !!checked)}
                                        className="data-[state=checked]:bg-[#467235] data-[state=checked]:border-[#467235]"
                                    />
                                    <Label htmlFor="surrendered_pet" className="cursor-pointer text-xs sm:text-sm text-gray-700">
                                        Have you ever surrendered a pet to a shelter before? *
                                    </Label>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: Valid ID & Document Verification + Adoption Reason */}
                    <div className="space-y-6">
                        {/* ID Verification Card */}
                        <Card className="border-[#467235]/20 shadow-xs">
                            <CardHeader className="bg-[#FFFDF0] border-b border-[#467235]/15 py-3.5 px-5">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-bold text-[#283F24] flex items-center gap-2">
                                        <CreditCard className="size-4 text-[#467235]" /> Valid ID Verification
                                    </CardTitle>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-[#FFF78D] px-2 py-0.5 rounded-full border border-[#FFBF00]/40">
                                        <ShieldCheck className="size-3 text-[#467235]" /> Verified Identity
                                    </span>
                                </div>
                                <CardDescription className="text-xs">Government or institutional ID for adopter legitimacy.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="valid_id_type" className="text-xs font-semibold text-gray-700">Valid ID Type *</Label>
                                        <Select 
                                            value={data.valid_id_type} 
                                            onValueChange={val => setData('valid_id_type', val)}
                                        >
                                            <SelectTrigger className="focus:ring-[#467235]">
                                                <SelectValue placeholder="Select ID Type" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-72">
                                                <SelectItem value="Philippine Identification (PhilID / ePhilID)">Philippine Identification (PhilID / ePhilID)</SelectItem>
                                                <SelectItem value="Philippine Passport">Philippine Passport</SelectItem>
                                                <SelectItem value="Driver's License">Driver's License</SelectItem>
                                                <SelectItem value="Unified Multi-Purpose ID (UMID)">Unified Multi-Purpose ID (UMID)</SelectItem>
                                                <SelectItem value="Professional Regulation Commission (PRC) ID">Professional Regulation Commission (PRC) ID</SelectItem>
                                                <SelectItem value="GSIS e-Card">GSIS e-Card</SelectItem>
                                                <SelectItem value="School ID">School ID</SelectItem>
                                                <SelectItem value="Postal ID">Postal ID</SelectItem>
                                                <SelectItem value="PhilHealth ID">PhilHealth ID</SelectItem>
                                                <SelectItem value="TIN ID">TIN ID</SelectItem>
                                                <SelectItem value="NBI Clearance / Police Clearance">NBI Clearance / Police Clearance</SelectItem>
                                                <SelectItem value="Voter's ID / Voter's Certification">Voter's ID / Voter's Certification</SelectItem>
                                                <SelectItem value="Senior Citizen ID">Senior Citizen ID</SelectItem>
                                                <SelectItem value="PWD ID">PWD ID</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.valid_id_type && <p className="text-red-500 text-xs">{errors.valid_id_type}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="valid_id_number" className="text-xs font-semibold text-gray-700">ID Number *</Label>
                                        <Input 
                                            id="valid_id_number" 
                                            value={data.valid_id_number} 
                                            onChange={e => setData('valid_id_number', e.target.value)} 
                                            required
                                            leftIcon={<Hash className="size-4 text-gray-400" />}
                                            className="focus-visible:ring-[#467235]"
                                            placeholder="e.g. 1234-5678-9012"
                                        />
                                        {errors.valid_id_number && <p className="text-red-500 text-xs">{errors.valid_id_number}</p>}
                                    </div>
                                </div>

                                {/* ID Upload Container */}
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
                                                {profile?.has_id_document && (
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
                                                    onChange={e => {
                                                        const file = e.target.files?.[0] || null;
                                                        setData('id_document', file);
                                                    }}
                                                    className="bg-white file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-[#467235]/15 file:text-[#283F24] hover:file:bg-[#467235]/25 cursor-pointer text-xs h-8"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleOpenCamera('front')}
                                                    className="shrink-0 text-xs h-8 border-[#467235]/30 text-[#283F24] hover:bg-[#FFF78D]/30 flex items-center gap-1 px-2 cursor-pointer"
                                                    title={isFrontOnly ? "Capture Document" : "Capture Front"}
                                                >
                                                    <Camera className="size-3.5 text-[#467235]" />
                                                    <span className="hidden sm:inline">Cam</span>
                                                </Button>
                                            </div>

                                            {/* Front Side Preview */}
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
                                            ) : profile?.has_id_document ? (
                                                <div className="space-y-1 pt-1">
                                                    <div className="flex items-center justify-between gap-1 text-[11px] text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200">
                                                        <div className="flex items-center gap-1 truncate">
                                                            <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
                                                            <span className="truncate">{profile.id_document_name || 'Front ID'}</span>
                                                        </div>
                                                        {profile.front_preview_url && (
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
                                            {errors.id_document && <p className="text-red-500 text-xs">{errors.id_document}</p>}
                                        </div>

                                        {/* Back Side */}
                                        {!isFrontOnly ? (
                                            <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="id_document_back" className="text-[11px] font-bold text-[#283F24] uppercase tracking-wider">
                                                        Back Side
                                                    </Label>
                                                    {profile?.has_id_document_back && (
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
                                                        onChange={e => {
                                                            const file = e.target.files?.[0] || null;
                                                            setData('id_document_back', file);
                                                        }}
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

                                                {/* Back Side Preview */}
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
                                                ) : profile?.has_id_document_back ? (
                                                    <div className="space-y-1 pt-1">
                                                        <div className="flex items-center justify-between gap-1 text-[11px] text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200">
                                                            <div className="flex items-center gap-1 truncate">
                                                                <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
                                                                <span className="truncate">{profile.id_document_back_name || 'Back ID'}</span>
                                                            </div>
                                                            {profile.back_preview_url && (
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
                                                {errors.id_document_back && <p className="text-red-500 text-xs">{errors.id_document_back}</p>}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Reason for Adoption Card */}
                        <Card className="border-[#467235]/20 shadow-xs">
                            <CardHeader className="bg-[#FFFDF0] border-b border-[#467235]/15 py-3.5 px-5">
                                <CardTitle className="text-base font-bold text-[#283F24] flex items-center gap-2">
                                    <Heart className="size-4 text-[#467235]" /> Adoption Intentions
                                </CardTitle>
                                <CardDescription className="text-xs">Why you wish to welcome a pet into your life.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="adoption_reason" className="text-xs font-semibold text-gray-700">Primary Reason for Adoption *</Label>
                                    <Select 
                                        value={data.adoption_reason} 
                                        onValueChange={val => setData('adoption_reason', val)}
                                    >
                                        <SelectTrigger className="focus:ring-[#467235]">
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

                                <div className="space-y-1.5">
                                    <Label htmlFor="adoption_reason_text" className="text-xs font-semibold text-gray-700">Tell us why you want to adopt *</Label>
                                    <Textarea 
                                        id="adoption_reason_text" 
                                        value={data.adoption_reason_text} 
                                        onChange={e => setData('adoption_reason_text', e.target.value)} 
                                        required
                                        rows={3}
                                        placeholder="In your own words, why do you think you'd provide a loving, responsible home?"
                                        className="focus-visible:ring-[#467235] text-xs"
                                    />
                                    {errors.adoption_reason_text && <p className="text-red-500 text-xs">{errors.adoption_reason_text}</p>}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* BOTTOM FULL-WIDTH: Declaration & Agreement Card */}
                <Card className="border-[#467235]/20 shadow-xs bg-[#FFFDF0]/60">
                    <CardContent className="p-5 space-y-4">
                        <div className="space-y-3 bg-white p-4 rounded-xl border border-[#467235]/20">
                            <div className="space-y-1">
                                <div className="flex items-start space-x-3">
                                    <Checkbox 
                                        id="terms_read" 
                                        checked={data.terms_read} 
                                        onCheckedChange={checked => setData('terms_read', !!checked)}
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
                                {errors.terms_read && <p className="text-red-500 text-xs pl-7">{errors.terms_read}</p>}
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-start space-x-3">
                                    <Checkbox 
                                        id="info_confirmed" 
                                        checked={data.info_confirmed} 
                                        onCheckedChange={checked => setData('info_confirmed', !!checked)}
                                        className="mt-0.5 data-[state=checked]:bg-[#467235] data-[state=checked]:border-[#467235]"
                                    />
                                    <Label htmlFor="info_confirmed" className="cursor-pointer font-medium text-xs sm:text-sm text-gray-700">
                                        {confirmLabel} *
                                    </Label>
                                </div>
                                {errors.info_confirmed && <p className="text-red-500 text-xs pl-7">{errors.info_confirmed}</p>}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                            <p className="text-xs text-gray-500">All information is encrypted and protected under Virac Animal Shelter Adoption policy.</p>
                            <Button 
                                type="submit" 
                                disabled={processing}
                                className="w-full sm:w-auto bg-[#467235] hover:bg-[#283F24] text-white font-semibold transition-all px-6 py-2.5 shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {processing ? 'Saving...' : 'Next: Lifestyle Quiz'}
                                {!processing && <ArrowRight className="size-4" />}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>

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

