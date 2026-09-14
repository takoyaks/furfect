import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Camera, Check, CheckCircle2, Eye, FileText, Lock, MapPin, Phone, ShieldCheck, Trash2, Upload } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { CameraCaptureModal } from '@/components/camera-capture-modal';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import { IdDocumentInspectorModal } from '@/components/id-document-inspector-modal';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useInitials } from '@/hooks/use-initials';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

interface AdopterProfileData {
    id?: number;
    full_name?: string;
    contact_number?: string;
    date_of_birth?: string | null;
    home_address?: string;
    valid_id_type?: string | null;
    valid_id_number?: string | null;
    has_id_document?: boolean;
    id_document_name?: string | null;
    has_id_document_back?: boolean;
    id_document_back_name?: string | null;
    front_preview_url?: string | null;
    back_preview_url?: string | null;
}

type PageProps = {
    auth: Auth;
    adopterProfile?: AdopterProfileData | null;
};

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

export default function Profile({
    mustVerifyEmail,
    status,
    adopterProfile,
}: {
    mustVerifyEmail: boolean;
    status?: string;
    adopterProfile?: AdopterProfileData | null;
}) {
    const { auth } = usePage<PageProps>().props;
    const getInitials = useInitials();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const frontIdInputRef = useRef<HTMLInputElement>(null);
    const backIdInputRef = useRef<HTMLInputElement>(null);

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Camera capture modal state
    const [cameraOpen, setCameraOpen] = useState(false);
    const [cameraTargetSide, setCameraTargetSide] = useState<'front' | 'back'>('front');

    // ID Preview inspector modal state
    const [activeIdModal, setActiveIdModal] = useState<{ open: boolean; side: 'front' | 'back' }>({
        open: false,
        side: 'front',
    });

    const isAdopter = auth.user.roles?.includes('adopter') || Boolean(adopterProfile);

    // Minimum age 18 constraint
    const maxBirthDate = new Date();
    maxBirthDate.setFullYear(maxBirthDate.getFullYear() - 18);
    const maxBirthDateStr = maxBirthDate.toISOString().split('T')[0];

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        name: auth.user.name || '',
        email: auth.user.email || '',
        phone: (auth.user.phone as string) || adopterProfile?.contact_number || '',
        address: (auth.user.address as string) || adopterProfile?.home_address || '',
        bio: (auth.user.bio as string) || '',
        avatar: null as File | null,
        remove_avatar: false,
        // Adopter profile fields
        date_of_birth: adopterProfile?.date_of_birth || '',
        valid_id_type: adopterProfile?.valid_id_type || '',
        valid_id_number: adopterProfile?.valid_id_number || '',
        id_document: null as File | null,
        id_document_back: null as File | null,
        _method: 'patch',
    });

    const currentIdConfig = data.valid_id_type
        ? ID_CONFIG[data.valid_id_type] || { sides: 'front_and_back', note: 'Standard identification document.' }
        : null;
    const isFrontOnly = currentIdConfig?.sides === 'front_only';

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData((prev) => ({
                ...prev,
                avatar: file,
                remove_avatar: false,
            }));
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handleRemoveAvatar = () => {
        setData((prev) => ({
            ...prev,
            avatar: null,
            remove_avatar: true,
        }));
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('profile.update'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            },
        });
    };

    // Format display role
    const userRole = (auth.user.roles && auth.user.roles[0])
        ? auth.user.roles[0]
            .replace('_', ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : 'Member';

    const currentAvatarSrc = !data.remove_avatar ? (previewUrl || auth.user.avatar || undefined) : undefined;

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile"
                    description="Manage your account profile picture, contact details, and personal information."
                />

                {/* Profile Overview Card */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-xs">
                    <div className="flex items-center gap-4">
                        <Avatar className="size-16 rounded-full border-2 border-primary/20 shadow-xs">
                            <AvatarImage
                                src={currentAvatarSrc}
                                alt={data.name || auth.user.name}
                                className="object-cover"
                            />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                                {getInitials(data.name || auth.user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground text-base">
                                    {auth.user.name}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                    {userRole}
                                </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground block mt-0.5">
                                {auth.user.email}
                            </span>
                            {auth.user.created_at && (
                                <span className="text-[11px] text-muted-foreground block mt-0.5">
                                    Joined {new Date(auth.user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Avatar Upload Section */}
                    <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
                        <div>
                            <Label className="text-sm font-semibold text-foreground">Profile Picture</Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Upload a photo to personalize your account across Furfect.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <Avatar className="size-20 rounded-full border border-border shadow-xs shrink-0">
                                <AvatarImage
                                    src={currentAvatarSrc}
                                    alt={data.name || auth.user.name}
                                    className="object-cover"
                                />
                                <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-xl">
                                    {getInitials(data.name || auth.user.name)}
                                </AvatarFallback>
                            </Avatar>

                            <div className="space-y-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    id="avatar-upload"
                                />

                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="cursor-pointer gap-1.5"
                                    >
                                        <Camera className="size-4" />
                                        <span>{currentAvatarSrc ? 'Change photo' : 'Upload photo'}</span>
                                    </Button>

                                    {currentAvatarSrc && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleRemoveAvatar}
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer gap-1.5"
                                        >
                                            <Trash2 className="size-4" />
                                            <span>Remove</span>
                                        </Button>
                                    )}
                                </div>

                                <p className="text-[11px] text-muted-foreground">
                                    Recommended: Square JPG, PNG, or WEBP. Max size 2MB.
                                </p>

                                <InputError message={errors.avatar} />
                            </div>
                        </div>
                    </div>

                    {/* Basic Information */}
                    <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
                        <div className="border-b border-border pb-3">
                            <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                General details identifying your account.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    autoComplete="name"
                                    placeholder="Enter your full name"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-1.5 sm:col-span-2">
                                <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                    autoComplete="username"
                                    placeholder="Enter your email address"
                                />
                                <InputError message={errors.email} />
                            </div>

                            {mustVerifyEmail && auth.user.email_verified_at === null && (
                                <div className="sm:col-span-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                                    <p>
                                        Your email address is unverified.{' '}
                                        <Link
                                            href={send()}
                                            as="button"
                                            className="underline font-medium hover:text-amber-900 cursor-pointer"
                                        >
                                            Click here to re-send the verification email.
                                        </Link>
                                    </p>

                                    {status === 'verification-link-sent' && (
                                        <div className="mt-2 text-sm font-medium text-green-700">
                                            A new verification link has been sent to your email address.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contact & Additional Details */}
                    <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
                        <div className="border-b border-border pb-3">
                            <h3 className="text-sm font-semibold text-foreground">Contact & Additional Details</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Optional contact details used for shelter communications and adoptions.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="phone">Phone / Contact Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            placeholder="+63 912 345 6789"
                                            className="pl-9"
                                        />
                                    </div>
                                    <InputError message={errors.phone} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="address">Address / Location</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                                        <Input
                                            id="address"
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            placeholder="Barangay, City, Province"
                                            className="pl-9"
                                        />
                                    </div>
                                    <InputError message={errors.address} />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="bio">Bio / About Me</Label>
                                    <span className="text-[11px] text-muted-foreground">
                                        {data.bio.length}/500
                                    </span>
                                </div>
                                <Textarea
                                    id="bio"
                                    value={data.bio}
                                    maxLength={500}
                                    onChange={(e) => setData('bio', e.target.value)}
                                    placeholder="Write a brief introduction about yourself, your pet experience, or your household..."
                                    rows={3}
                                />
                                <InputError message={errors.bio} />
                            </div>
                        </div>
                    </div>

                    {/* Adopter Verification & Identification Details (Shown for adopters or users with an adopter profile) */}
                    {isAdopter && (
                        <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-5">
                            <div className="border-b border-border pb-3 flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="size-5 text-[#D4A017]" />
                                        <h3 className="text-sm font-semibold text-foreground">
                                            Adopter Verification & Identification
                                        </h3>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Verified identification documents are required by municipal ordinances and shelters for adoption processing.
                                    </p>
                                </div>
                                <Badge variant="outline" className="bg-[#D4A017]/10 text-[#8B6508] border-[#D4A017]/30 text-xs shrink-0">
                                    Adopter Profile
                                </Badge>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* Date of Birth */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                                    <Input
                                        id="date_of_birth"
                                        type="date"
                                        max={maxBirthDateStr}
                                        value={data.date_of_birth}
                                        onChange={(e) => setData('date_of_birth', e.target.value)}
                                        className="w-full"
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        Adopters must be at least 18 years of age.
                                    </p>
                                    <InputError message={errors.date_of_birth} />
                                </div>

                                {/* Valid ID Type */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="valid_id_type">Government Issued ID Type</Label>
                                    <Select
                                        value={data.valid_id_type}
                                        onValueChange={(val) => {
                                            setData('valid_id_type', val);
                                            // Reset back ID if changing to a front-only ID
                                            if (ID_CONFIG[val]?.sides === 'front_only') {
                                                setData('id_document_back', null);
                                                if (backIdInputRef.current) {
                                                    backIdInputRef.current.value = '';
                                                }
                                            }
                                        }}
                                    >
                                        <SelectTrigger id="valid_id_type">
                                            <SelectValue placeholder="Select your Government ID type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.keys(ID_CONFIG).map((idName) => (
                                                <SelectItem key={idName} value={idName}>
                                                    {idName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.valid_id_type} />
                                </div>

                                {/* ID Number */}
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="valid_id_number">ID / License / Certificate Number</Label>
                                    <Input
                                        id="valid_id_number"
                                        value={data.valid_id_number}
                                        onChange={(e) => setData('valid_id_number', e.target.value)}
                                        placeholder="e.g., 1234-5678-9012-3456 or D01-23-456789"
                                    />
                                    <InputError message={errors.valid_id_number} />
                                </div>
                            </div>

                            {/* ID Document Requirements & Uploads */}
                            <div className="space-y-4 pt-2">
                                <div className="rounded-lg bg-[#F5EDD7]/40 border border-[#D4A017]/25 p-3 text-xs flex items-start gap-2.5">
                                    <Lock className="size-4 text-[#D4A017] shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-foreground">
                                            {currentIdConfig
                                                ? `Requirement for ${data.valid_id_type}:`
                                                : 'Upload requirement adapts automatically based on your selected ID:'}
                                        </p>
                                        <p className="text-muted-foreground mt-0.5">
                                            {currentIdConfig
                                                ? currentIdConfig.note
                                                : 'Select your Valid ID Type above to see if it requires both sides (e.g. National ID, Driver\'s License) or front only (e.g. Passport, PhilHealth, Clearances).'}
                                        </p>
                                        <p className="text-[11px] text-[#8B6508] mt-1 font-medium">
                                            All uploaded ID documents are securely stored with AES-256 encryption at rest.
                                        </p>
                                    </div>
                                </div>

                                <div className={`grid gap-4 ${isFrontOnly ? 'grid-cols-1 max-w-xl' : 'grid-cols-1 sm:grid-cols-2'}`}>
                                    {/* Front Side */}
                                    <div className="bg-muted/30 p-3.5 rounded-xl border border-border space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="id_document" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                                                {isFrontOnly ? 'Front / Main Document Scan' : 'Front Side'}
                                            </Label>
                                            {adopterProfile?.has_id_document && (
                                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                    Attached
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Input
                                                ref={frontIdInputRef}
                                                id="id_document"
                                                type="file"
                                                accept="image/png,image/jpeg,image/jpg,application/pdf"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0] || null;
                                                    setData('id_document', file);
                                                }}
                                                className="bg-background file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#D4A017]/15 file:text-[#8B6508] hover:file:bg-[#D4A017]/25 cursor-pointer text-xs"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleOpenCamera('front')}
                                                className="shrink-0 text-xs border-[#D4A017]/40 text-[#8B6508] hover:bg-[#D4A017]/15 flex items-center gap-1.5 cursor-pointer"
                                                title={isFrontOnly ? 'Open camera to capture Document' : 'Open camera to capture Front ID'}
                                            >
                                                <Camera className="size-3.5 text-[#D4A017]" />
                                                <span className="hidden sm:inline">Camera</span>
                                            </Button>
                                        </div>

                                        {/* Front Side Selected File Preview */}
                                        {data.id_document ? (
                                            <div className="space-y-1.5 pt-1">
                                                {data.id_document.type.startsWith('image/') && (
                                                    <div className="relative rounded-lg overflow-hidden border border-[#D4A017]/40 max-h-36 bg-background flex items-center justify-center">
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
                                        ) : adopterProfile?.has_id_document ? (
                                            <div className="space-y-2 pt-1">
                                                {adopterProfile.front_preview_url && (
                                                    <div className="relative rounded-lg overflow-hidden border border-border bg-background max-h-36 flex items-center justify-center">
                                                        <img
                                                            src={adopterProfile.front_preview_url}
                                                            alt="Current Front ID"
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
                                                        <span className="truncate">{adopterProfile.id_document_name || 'Front ID Document'}</span>
                                                    </div>
                                                    {adopterProfile.front_preview_url && (
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
                                        <InputError message={errors.id_document} />
                                    </div>

                                    {/* Back Side (Rendered for dual-sided IDs) */}
                                    {!isFrontOnly && (
                                        <div className="bg-muted/30 p-3.5 rounded-xl border border-border space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="id_document_back" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                                                    Back Side
                                                </Label>
                                                {adopterProfile?.has_id_document_back && (
                                                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                        Attached
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Input
                                                    ref={backIdInputRef}
                                                    id="id_document_back"
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/jpg,application/pdf"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0] || null;
                                                        setData('id_document_back', file);
                                                    }}
                                                    className="bg-background file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#D4A017]/15 file:text-[#8B6508] hover:file:bg-[#D4A017]/25 cursor-pointer text-xs"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleOpenCamera('back')}
                                                    className="shrink-0 text-xs border-[#D4A017]/40 text-[#8B6508] hover:bg-[#D4A017]/15 flex items-center gap-1.5 cursor-pointer"
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
                                                        <div className="relative rounded-lg overflow-hidden border border-[#D4A017]/40 max-h-36 bg-background flex items-center justify-center">
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
                                            ) : adopterProfile?.has_id_document_back ? (
                                                <div className="space-y-2 pt-1">
                                                    {adopterProfile.back_preview_url && (
                                                        <div className="relative rounded-lg overflow-hidden border border-border bg-background max-h-36 flex items-center justify-center">
                                                            <img
                                                                src={adopterProfile.back_preview_url}
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
                                                            <span className="truncate">{adopterProfile.id_document_back_name || 'Back ID Document'}</span>
                                                        </div>
                                                        {adopterProfile.back_preview_url && (
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
                                            <InputError message={errors.id_document_back} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit Section */}
                    <div className="flex items-center gap-3">
                        <Button
                            type="submit"
                            disabled={processing}
                            data-test="update-profile-button"
                            className="cursor-pointer"
                        >
                            {processing ? 'Saving...' : 'Save changes'}
                        </Button>

                        {recentlySuccessful && (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                                <Check className="size-4" />
                                Saved successfully
                            </span>
                        )}
                    </div>
                </form>
            </div>

            {/* Camera Capture Modal */}
            <CameraCaptureModal
                open={cameraOpen}
                onOpenChange={setCameraOpen}
                onCapture={handleCameraCapture}
                title={cameraTargetSide === 'front' ? 'Capture Front ID Document' : 'Capture Back ID Document'}
                aspectRatio={1.586}
            />

            {/* Full Encrypted ID Document Inspector Modal */}
            {adopterProfile && (
                <IdDocumentInspectorModal
                    open={activeIdModal.open}
                    onOpenChange={(open) => setActiveIdModal((prev) => ({ ...prev, open }))}
                    title={activeIdModal.side === 'front' ? 'Front Side ID Document' : 'Back Side ID Document'}
                    idType={data.valid_id_type || adopterProfile.valid_id_type || 'ID Document'}
                    idNumber={data.valid_id_number || adopterProfile.valid_id_number || ''}
                    applicantName={data.name || auth.user.name}
                    side={activeIdModal.side}
                    documentUrl={
                        activeIdModal.side === 'front'
                            ? (adopterProfile.front_preview_url || (adopterProfile.has_id_document && adopterProfile.id ? route('adopter.id-document.show', { profile: adopterProfile.id, side: 'front' }) : null))
                            : (adopterProfile.back_preview_url || (adopterProfile.has_id_document_back && adopterProfile.id ? route('adopter.id-document.show', { profile: adopterProfile.id, side: 'back' }) : null))
                    }
                />
            )}

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
