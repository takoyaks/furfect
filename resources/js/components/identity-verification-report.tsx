import React from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, AlertCircle, ScanFace, Camera, FileText, UserCheck, Calendar, Hash, MapPin, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface IdentityVerificationReportProps {
    verification?: {
        id?: number;
        status?: string;
        id_verification_status?: string | null;
        liveness_status?: string | null;
        liveness_score?: number | null;
        face_match_status?: string | null;
        face_match_score?: number | null;
        extracted_data?: {
            document_type?: string;
            document_number?: string;
            full_name?: string;
            first_name?: string;
            last_name?: string;
            date_of_birth?: string;
            expiration_date?: string;
            address?: string;
            country?: string;
        } | null;
        failure_reasons?: string[] | null;
        verified_at?: string | null;
        created_at?: string;
    } | null;
    adopterProfile?: {
        full_name?: string;
        date_of_birth?: string;
        valid_id_type?: string;
        valid_id_number?: string;
        is_identity_verified?: boolean;
        face_match_score?: number | null;
        liveness_verified?: boolean;
    } | null;
    className?: string;
}

export function IdentityVerificationReport({
    verification,
    adopterProfile,
    className = '',
}: IdentityVerificationReportProps) {
    const isVerified = Boolean(adopterProfile?.is_identity_verified || verification?.status === 'approved');
    const faceMatch = verification?.face_match_score ?? adopterProfile?.face_match_score;
    const livenessPassed = Boolean(verification?.liveness_status === 'passed' || adopterProfile?.liveness_verified);
    const extracted = verification?.extracted_data;

    return (
        <Card className={`border shadow-xs ${className}`}>
            <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isVerified ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>
                            {isVerified ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                        </div>
                        <div>
                            <CardTitle className="text-base font-semibold">
                                Automated Identity & Biometric Verification
                            </CardTitle>
                            <CardDescription className="text-xs">
                                3-Point Validation: Government ID Authenticity + Passive Liveness + 1:1 Face Match
                            </CardDescription>
                        </div>
                    </div>

                    <div>
                        {isVerified ? (
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 py-1 px-2.5">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Verified & Confirmed
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 gap-1 py-1">
                                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                                Manual Review Required
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
                {/* 3 Biometric & Document Pillars */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Pillar 1: ID Document Verification */}
                    <div className="p-3 rounded-lg border bg-card/60 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 text-primary" />
                                Government ID OCR
                            </span>
                            {isVerified ? (
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0 font-medium">
                                    Authentic
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0 font-medium">
                                    Unverified
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs font-semibold truncate">
                            {extracted?.document_type || adopterProfile?.valid_id_type || 'Government ID'}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono truncate">
                            {extracted?.document_number || adopterProfile?.valid_id_number || '—'}
                        </p>
                    </div>

                    {/* Pillar 2: Passive Liveness Detection */}
                    <div className="p-3 rounded-lg border bg-card/60 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <Camera className="h-3.5 w-3.5 text-emerald-600" />
                                Passive Liveness
                            </span>
                            {livenessPassed ? (
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0 font-medium">
                                    Passed
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0 font-medium">
                                    Pending
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs font-semibold">
                            {livenessPassed ? 'Live Human Confirmed' : 'No Live Capture'}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                            {livenessPassed ? 'Anti-spoofing & anti-deepfake verified' : 'Requires live selfie capture'}
                        </p>
                    </div>

                    {/* Pillar 3: 1:1 Face Match */}
                    <div className="p-3 rounded-lg border bg-card/60 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <ScanFace className="h-3.5 w-3.5 text-blue-600" />
                                1:1 Face Match
                            </span>
                            {faceMatch !== null && faceMatch !== undefined ? (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0 font-medium">
                                    {Math.round(faceMatch)}% Match
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0 font-medium">
                                    Pending
                                </Badge>
                            )}
                        </div>
                        {faceMatch !== null && faceMatch !== undefined ? (
                            <>
                                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${faceMatch >= 80 ? 'bg-emerald-500' : faceMatch >= 60 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                        style={{ width: `${Math.min(100, faceMatch)}%` }}
                                    />
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    Selfie matches ID document photo
                                </p>
                            </>
                        ) : (
                            <p className="text-[11px] text-muted-foreground">
                                Face comparison not yet executed
                            </p>
                        )}
                    </div>
                </div>

                {/* Extracted Details & Cross-Check */}
                {extracted && (
                    <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-xs">
                        <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                            Verified Biographical Data (OCR)
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                            <div>
                                <span className="text-muted-foreground block text-[11px]">Full Name:</span>
                                <span className="font-medium text-foreground">{extracted.full_name || '—'}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-[11px]">Date of Birth:</span>
                                <span className="font-medium text-foreground">{extracted.date_of_birth || '—'}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-[11px]">Document Expiry:</span>
                                <span className="font-medium text-foreground">{extracted.expiration_date || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-[11px]">Country:</span>
                                <span className="font-medium text-foreground">{extracted.country || 'PH'}</span>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
