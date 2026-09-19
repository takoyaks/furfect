import React, { useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ShieldCheck, ShieldAlert, CheckCircle2, ArrowRight, FileCheck, Camera, ScanFace, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import OnboardingLayout from '@/layouts/onboarding-layout';
import { IdentityVerificationCard } from '@/components/identity-verification-card';

interface Profile {
    id?: number;
    full_name?: string;
    valid_id_type?: string;
    valid_id_number?: string;
    date_of_birth?: string | null;
    is_identity_verified?: boolean;
    identity_verified_at?: string | null;
    face_match_score?: number | null;
    liveness_verified?: boolean;
}

interface Verification {
    id?: number;
    status?: string;
    face_match_score?: number | null;
    face_match_status?: string | null;
    liveness_status?: string | null;
    id_verification_status?: string | null;
    extracted_data?: {
        document_type?: string;
        document_number?: string;
        full_name?: string;
        date_of_birth?: string;
        address?: string;
        country?: string;
    } | null;
    failure_reasons?: string[] | null;
}

export default function OnboardingEkyc({
    profile,
    verification,
    userName,
}: {
    profile: Profile | null;
    verification: Verification | null;
    userName?: string;
}) {
    const isVerified = Boolean(profile?.is_identity_verified || verification?.status === 'approved');
    const faceMatch = verification?.face_match_score ?? profile?.face_match_score;
    const extracted = verification?.extracted_data;
    const [autoRedirecting, setAutoRedirecting] = useState(false);

    // Auto-advance to Step 2 when identity is verified
    useEffect(() => {
        if (isVerified) {
            setAutoRedirecting(true);
            window.location.href = route('onboarding.personal.edit');
        }
    }, [isVerified]);

    // Live status polling if verification is in progress
    useEffect(() => {
        if (isVerified) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(route('identity.verification.status'), {
                    headers: { 'Accept': 'application/json' },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.is_verified || data.verification_status === 'approved') {
                        setAutoRedirecting(true);
                        window.location.href = route('onboarding.personal.edit');
                    }
                }
            } catch {
                // Ignore background polling errors
            }
        }, 2500);

        return () => clearInterval(interval);
    }, [isVerified]);

    return (
        <OnboardingLayout currentStep={1}>
            <Head title="Step 1: eKYC Identity Verification - FurFect" />

            <div className="space-y-6 w-full max-w-5xl mx-auto">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-[#FFFDF0] via-[#FFF78D]/30 to-[#467235]/10 border border-[#467235]/20 rounded-2xl p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#283F24] bg-[#FFF78D] px-2.5 py-1 rounded-full border border-[#FFBF00]/50 mb-1.5">
                                <ShieldCheck className="size-3.5 text-[#467235]" /> Step 1 of 3 — eKYC & Identity Verification (Required)
                            </div>
                            <h1 className="text-2xl font-bold text-[#283F24]">Adopter Identity Verification</h1>
                            <p className="text-sm text-gray-600 mt-0.5">
                                Government ID and facial biometric verification are required by municipal ordinances before proceeding to personal information.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Verification Section */}
                {isVerified ? (
                    /* Verified State Banner & Summary with Auto-Proceed */
                    <Card className="border-emerald-300 bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white shadow-sm">
                        <CardHeader className="border-b border-emerald-200/70 pb-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                                        <ShieldCheck className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-lg font-bold text-emerald-950">
                                                Identity & Biometrics Verified Successfully
                                            </CardTitle>
                                            <Badge className="bg-emerald-600 text-white text-xs">Verified</Badge>
                                        </div>
                                        <CardDescription className="text-xs text-emerald-800/90 mt-0.5">
                                            Your official ID document, live passive liveness, and 1:1 facial match have been authenticated.
                                        </CardDescription>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 space-y-6">
                            {/* 3 Verified Biometric Badges */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-white/80 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                                            <FileCheck className="h-4 w-4 text-emerald-600" />
                                            Government ID
                                        </span>
                                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px]">
                                            Authentic
                                        </Badge>
                                    </div>
                                    <p className="text-xs font-bold text-gray-900 truncate">
                                        {extracted?.document_type || profile?.valid_id_type || 'Philippine Valid ID'}
                                    </p>
                                    <p className="text-[11px] font-mono text-gray-500 truncate">
                                        {extracted?.document_number || profile?.valid_id_number || 'VERIFIED'}
                                    </p>
                                </div>

                                <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-white/80 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                                            <Camera className="h-4 w-4 text-emerald-600" />
                                            Passive Liveness
                                        </span>
                                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px]">
                                            Passed
                                        </Badge>
                                    </div>
                                    <p className="text-xs font-bold text-gray-900">
                                        Live Person Confirmed
                                    </p>
                                    <p className="text-[11px] text-gray-500">
                                        Anti-spoofing validated
                                    </p>
                                </div>

                                <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-white/80 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                                            <ScanFace className="h-4 w-4 text-emerald-600" />
                                            1:1 Face Match
                                        </span>
                                        {faceMatch !== null && faceMatch !== undefined ? (
                                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px]">
                                                {Math.round(faceMatch)}% Match
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px]">
                                                Matched
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs font-bold text-gray-900">
                                        Selfie matches ID photo
                                    </p>
                                    <p className="text-[11px] text-gray-500">
                                        Biometric similarity confirmed
                                    </p>
                                </div>
                            </div>

                            {/* Verified Profile Particulars Preview */}
                            <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-4 text-xs space-y-2">
                                <span className="font-bold text-emerald-900 uppercase tracking-wider text-[10px] block">
                                    Verified Particulars Transferred to Step 2
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                    <div>
                                        <span className="text-gray-500 block text-[11px]">Full Name:</span>
                                        <span className="font-semibold text-gray-900">{extracted?.full_name || profile?.full_name || userName}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block text-[11px]">Date of Birth:</span>
                                        <span className="font-semibold text-gray-900">{extracted?.date_of_birth || profile?.date_of_birth || 'Verified'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block text-[11px]">ID Number:</span>
                                        <span className="font-semibold text-gray-900 font-mono">{extracted?.document_number || profile?.valid_id_number || 'Verified'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Continue to Step 2 Button / Auto-advancing indicator */}
                            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                    {autoRedirecting ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#467235]" />
                                            <span>Advancing to Step 2: Personal Information...</span>
                                        </>
                                    ) : (
                                        <span>Your verified credentials have automatically transferred to Step 2.</span>
                                    )}
                                </p>
                                <Link href={route('onboarding.personal.edit')} className="w-full sm:w-auto">
                                    <Button className="w-full sm:w-auto bg-[#467235] hover:bg-[#385c2a] text-white font-semibold gap-2 shadow-sm px-6 py-2.5">
                                        <span>Proceed to Step 2: Personal Info</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    /* Not Verified State: Verification Options */
                    <div className="space-y-6">
                        <IdentityVerificationCard
                            isVerified={profile?.is_identity_verified}
                            faceMatchScore={profile?.face_match_score}
                            livenessVerified={profile?.liveness_verified}
                            verifiedAt={profile?.identity_verified_at}
                            returnTo="onboarding"
                        />

                        {/* Why Verification Matters Card */}
                        <Card className="border-gray-200 shadow-2xs">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-[#467235]" />
                                    Why is eKYC Required for Adoption?
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-xs text-gray-600">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                                        <p className="font-bold text-gray-800">1. Animal Welfare Act Compliance</p>
                                        <p className="text-gray-500 text-[11px]">
                                            Complies with Republic Act 8485 &amp; Municipal Shelter Ordinances to ensure animals are placed into legitimate, safe homes.
                                        </p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                                        <p className="font-bold text-gray-800">2. Fast-Track Shelter Review</p>
                                        <p className="text-gray-500 text-[11px]">
                                            Biometrically verified adopters receive priority screening from municipal and shelter officers.
                                        </p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                                        <p className="font-bold text-gray-800">3. 1-Time Verification</p>
                                        <p className="text-gray-500 text-[11px]">
                                            Complete verification once. Your authenticated status applies to all future pet adoptions.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </OnboardingLayout>
    );
}
