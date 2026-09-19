import React from 'react';
import { ShieldCheck, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface IdentityVerificationBadgeProps {
    isVerified?: boolean;
    faceMatchScore?: number | null;
    livenessVerified?: boolean;
    verifiedAt?: string | null;
    showDetails?: boolean;
    className?: string;
}

export function IdentityVerificationBadge({
    isVerified = false,
    faceMatchScore,
    livenessVerified = false,
    verifiedAt,
    showDetails = false,
    className = '',
}: IdentityVerificationBadgeProps) {
    if (!isVerified) {
        return (
            <Badge variant="outline" className={`gap-1.5 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300 ${className}`}>
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Verification Pending</span>
            </Badge>
        );
    }

    return (
        <div className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
            <Badge className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Verified Identity</span>
            </Badge>

            {showDetails && livenessVerified && (
                <Badge variant="secondary" className="gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300">
                    <UserCheck className="h-3 w-3" />
                    <span>Liveness Confirmed</span>
                </Badge>
            )}

            {showDetails && faceMatchScore !== null && faceMatchScore !== undefined && (
                <Badge variant="secondary" className="gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800/60 dark:text-blue-300">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Face Match {Math.round(faceMatchScore)}%</span>
                </Badge>
            )}
        </div>
    );
}
