import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Award, X, PenTool, Eye, ShieldAlert } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AdoptionCertificate, type CertificateSignatory } from '@/components/adoption-certificate';
import { CertificateSignatoriesDialog } from '@/components/certificate-signatories-dialog';
import { type AdoptionPassApplication } from '@/components/adoption-pickup-pass';

interface AdoptionCertificateModalProps {
    application: AdoptionPassApplication;
    trigger?: React.ReactNode;
}

export function AdoptionCertificateModal({ application, trigger }: AdoptionCertificateModalProps) {
    const [open, setOpen] = useState(false);
    const [signatoriesDialogOpen, setSignatoriesDialogOpen] = useState(false);
    const [localSignatories, setLocalSignatories] = useState<CertificateSignatory[] | undefined>(undefined);
    const [currentCertCount, setCurrentCertCount] = useState<number>(
        Number(application.certificate_print_count ?? 0)
    );
    const [isRecordingPrint, setIsRecordingPrint] = useState(false);

    const { auth } = usePage().props as { auth?: { user?: { roles?: string[] } } };
    const userRoles = auth?.user?.roles || [];
    const isShelterStaffOnly =
        userRoles.includes('shelter_staff') &&
        !userRoles.includes('admin') &&
        !userRoles.includes('mao_staff');
    const canPrint = !isShelterStaffOnly;
    const canManageSignatories = userRoles.includes('admin') || userRoles.includes('mao_staff');

    const handlePrint = async () => {
        if (!canPrint) return;

        try {
            setIsRecordingPrint(true);
            const csrfMeta = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const csrfCookie = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/)?.[1];
            const csrfToken = csrfMeta || (csrfCookie ? decodeURIComponent(csrfCookie) : '');

            const res = await fetch(`/applications/${application.id}/record-certificate-print`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
            });
            if (res.ok) {
                const data = await res.json();
                if (typeof data.certificate_print_count === 'number') {
                    setCurrentCertCount(data.certificate_print_count);
                }
            }
        } catch (e) {
            console.error('Failed to record certificate print:', e);
        } finally {
            setIsRecordingPrint(false);
        }

        document.body.classList.add('is-printing');
        const cleanup = () => {
            document.body.classList.remove('is-printing');
            window.removeEventListener('afterprint', cleanup);
        };
        window.addEventListener('afterprint', cleanup);
        window.print();
    };

    const displayPrintCount = currentCertCount > 0 ? currentCertCount : (application.certificate_print_count || 1);
    const copyBadge = displayPrintCount <= 1
        ? 'Original Copy'
        : displayPrintCount === 2
        ? 'Duplicate Copy'
        : displayPrintCount === 3
        ? 'Triplicate Copy'
        : `Copy #${displayPrintCount}`;

    const effectiveApplication: AdoptionPassApplication = {
        ...application,
        certificate_print_count: currentCertCount > 0 ? currentCertCount : (application.certificate_print_count || 1),
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {trigger || (
                        canPrint ? (
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-xs border-[#D4A017]/50 text-[#8B6508] dark:text-amber-300 hover:bg-[#D4A017]/10 h-9 gap-1.5 font-bold shadow-2xs cursor-pointer"
                            >
                                <Award className="h-4 w-4 text-[#D4A017]" />
                                Adoption Certificate
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-xs border-[#D4A017]/50 text-[#8B6508] dark:text-amber-300 hover:bg-[#D4A017]/10 h-9 gap-1.5 font-bold shadow-2xs cursor-pointer"
                            >
                                <Eye className="h-4 w-4 text-[#D4A017]" />
                                View Certificate
                            </Button>
                        )
                    )}
                </DialogTrigger>

                <DialogContent showCloseButton={false} className="sm:max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-gray-100 dark:bg-neutral-900 border-none print:hidden">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-[#D4A017]/30 flex items-center justify-center text-[#D4A017]">
                                <Award className="w-5 h-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    Official Certificate of Pet Adoption
                                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold italic bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                                        *{copyBadge}*
                                    </span>
                                </DialogTitle>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Formal municipal certification confirming legal guardianship under RA 8485 &amp; RA 9482.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {canManageSignatories && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSignatoriesDialogOpen(true)}
                                    className="border-amber-300 text-amber-900 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-semibold gap-1.5 h-8.5 px-3 cursor-pointer"
                                >
                                    <PenTool className="h-3.5 w-3.5 text-amber-600" />
                                    Edit Signatories
                                </Button>
                            )}

                            {canPrint ? (
                                <Button
                                    size="sm"
                                    onClick={handlePrint}
                                    className="bg-[#D4A017] hover:bg-[#B8860B] text-white text-xs font-bold gap-1.5 h-8.5 px-3.5 cursor-pointer shadow-xs"
                                >
                                    <Printer className="h-3.5 w-3.5" />
                                    Print Official Certificate
                                </Button>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                                    <Eye className="w-3.5 h-3.5 text-amber-600" />
                                    AHWS View Only
                                </span>
                            )}

                            <DialogClose asChild>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8.5 px-2.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white cursor-pointer"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </DialogClose>
                        </div>
                    </div>

                    {/* Document Preview Canvas (Paper Effect) */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-200/60 dark:bg-neutral-950 flex justify-center">
                        <div className="bg-white shadow-xl w-full max-w-3xl ring-1 ring-black/5">
                            <AdoptionCertificate application={effectiveApplication} signatories={localSignatories} />
                        </div>
                    </div>

                    {/* Modal Footer Note */}
                    <div className="px-6 py-3 bg-white dark:bg-neutral-800 border-t border-gray-200 dark:border-neutral-700 text-center text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
                        <span>
                            Certificate Number: <strong className="text-gray-700 dark:text-gray-300 font-mono">{application.certificate_number || `CERT-${application.reference_number}`}</strong>
                        </span>
                        <span>
                            {canPrint ? (
                                <>
                                    Click <strong>Print Official Certificate</strong> for a clean single-page official copy suitable for framing.
                                </>
                            ) : (
                                <span className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-medium">
                                    <ShieldAlert className="w-3.5 h-3.5" />
                                    AHWS Staff View Only: Printing is restricted to Municipal Agriculture Officers (MAO).
                                </span>
                            )}
                        </span>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dedicated Print Portal: mounted directly to body to bypass all modal styles/transforms */}
            {open && canPrint && typeof document !== 'undefined' && createPortal(
                <div id="furfect-print-root" className="hidden print:flex">
                    <AdoptionCertificate application={effectiveApplication} signatories={localSignatories} />
                </div>,
                document.body
            )}

            {/* Certificate Signatories Manager Subdialog */}
            {canManageSignatories && (
                <CertificateSignatoriesDialog
                    open={signatoriesDialogOpen}
                    onOpenChange={setSignatoriesDialogOpen}
                    signatories={localSignatories || []}
                    onSignatoriesUpdated={(newSignatories) => setLocalSignatories(newSignatories)}
                />
            )}
        </>
    );
}
