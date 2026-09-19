import React, { useState } from 'react';
import { ShieldCheck, Camera, ScanFace, FileCheck, CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface IdentityVerificationCardProps {
    isVerified?: boolean;
    faceMatchScore?: number | null;
    livenessVerified?: boolean;
    verifiedAt?: string | null;
    returnTo?: 'onboarding' | 'settings';
    onVerificationSuccess?: () => void;
    className?: string;
}

export function IdentityVerificationCard({
    isVerified = false,
    faceMatchScore,
    livenessVerified = false,
    verifiedAt,
    returnTo = 'onboarding',
    onVerificationSuccess,
    className = '',
}: IdentityVerificationCardProps) {
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleStartVerification = async () => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            
            const response = await fetch('/identity/verification/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ return_to: returnTo }),
            });

            const result = await response.json();

            if (result.success && result.url) {
                // Redirect user to the secure verification flow
                window.location.href = result.url;
            } else {
                setErrorMessage(result.message || 'Unable to start verification. Please try again.');
                setLoading(false);
            }
        } catch (err: any) {
            setErrorMessage('Network error initiating verification. Please check your connection.');
            setLoading(false);
        }
    };

    if (isVerified) {
        return (
            <Card className={`border-emerald-200 bg-gradient-to-r from-emerald-50/80 to-teal-50/60 dark:border-emerald-900/60 dark:from-emerald-950/30 dark:to-teal-950/20 ${className}`}>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-emerald-950 dark:text-emerald-100 text-base">
                                        Identity & Biometrics Verified
                                    </h4>
                                    <Badge className="bg-emerald-600 text-white text-xs">Active</Badge>
                                </div>
                                <p className="text-sm text-emerald-800/90 dark:text-emerald-300/90 mt-0.5">
                                    Your government ID, facial liveness, and 1:1 face match have been verified.
                                </p>
                                <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                                    <span className="inline-flex items-center gap-1">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                        Government ID OCR Validated
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                        Live Passive Liveness Confirmed
                                    </span>
                                    {faceMatchScore !== null && faceMatchScore !== undefined && (
                                        <span className="inline-flex items-center gap-1">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                            Face Match {Math.round(faceMatchScore)}% Confidence
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleStartVerification}
                            disabled={loading}
                            className="border-emerald-300 hover:bg-emerald-100/60 text-emerald-800 dark:border-emerald-800 dark:text-emerald-200 shrink-0 text-xs"
                        >
                            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                            Re-verify
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={`border-primary/20 bg-gradient-to-br from-primary/5 via-amber-500/5 to-transparent shadow-xs ${className}`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-semibold">Start Verification</CardTitle>
                            <CardDescription className="text-xs">
                                Fast-track your adoption eligibility with automated ID & face biometric verification.
                            </CardDescription>
                        </div>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary font-medium text-xs">
                        Recommended
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-background/80 border border-border/60">
                        <FileCheck className="h-4 w-4 text-primary shrink-0" />
                        <span>Government ID Scan & OCR</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-background/80 border border-border/60">
                        <Camera className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Passive Liveness (Anti-Spoof)</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-background/80 border border-border/60">
                        <ScanFace className="h-4 w-4 text-blue-600 shrink-0" />
                        <span>1:1 Biometric Face Match</span>
                    </div>
                </div>

                {errorMessage && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-xs">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                    <p className="text-xs text-muted-foreground">
                        Your biometric data is encrypted and verified securely in compliance with Philippine data privacy standards.
                    </p>
                    <Button
                        type="button"
                        onClick={handleStartVerification}
                        disabled={loading}
                        className="w-full sm:w-auto font-medium gap-2 shadow-xs"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Initializing...
                            </>
                        ) : (
                            <>
                                Start Verification
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
