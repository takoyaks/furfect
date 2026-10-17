import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Eye, X, ShieldAlert, PenTool } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AdoptionPickupPass, type AdoptionPassApplication } from '@/components/adoption-pickup-pass';
import { CertificateSignatoriesDialog } from '@/components/certificate-signatories-dialog';
import { type CertificateSignatory } from '@/components/adoption-certificate';

interface AdoptionPassModalProps {
    application: AdoptionPassApplication;
    trigger?: React.ReactNode;
}

export function AdoptionPassModal({ application, trigger }: AdoptionPassModalProps) {
    const [open, setOpen] = useState(false);
    const [signatoriesDialogOpen, setSignatoriesDialogOpen] = useState(false);
    const [localSignatories, setLocalSignatories] = useState<CertificateSignatory[] | undefined>(undefined);
    const [currentPassCount, setCurrentPassCount] = useState<number>(Number(application.pass_print_count ?? 0));
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
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch(`/applications/${application.id}/record-pass-print`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
            });
            if (res.ok) {
                const data = await res.json();
                if (typeof data.pass_print_count === 'number') {
                    setCurrentPassCount(data.pass_print_count);
                }
            }
        } catch (e) {
            console.error('Failed to record pass print:', e);
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

    const effectiveApplication: AdoptionPassApplication = {
        ...application,
        pass_print_count: currentPassCount > 0 ? currentPassCount : (application.pass_print_count ?? 1),
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
                                className="text-xs border-green-300 text-green-800 hover:bg-green-50 h-9 gap-1.5 font-bold shadow-2xs cursor-pointer"
                            >
                                <Printer className="h-4 w-4" />
                                Print Pass
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-xs border-blue-300 text-blue-800 hover:bg-blue-50 h-9 gap-1.5 font-bold shadow-2xs cursor-pointer"
                            >
                                <Eye className="h-4 w-4" />
                                View Pass
                            </Button>
                        )
                    )}
                </DialogTrigger>

                <DialogContent showCloseButton={false} className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-gray-100 dark:bg-neutral-900 border-none print:hidden">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
                        <div>
                            <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                                Official Municipal Adoption Pass
                            </DialogTitle>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Formal document prepared for official shelter gate release and physical turnover.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {canManageSignatories && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSignatoriesDialogOpen(true)}
                                    className="border-green-300 text-green-900 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/40 text-xs font-semibold gap-1.5 h-8.5 px-3 cursor-pointer"
                                >
                                    <PenTool className="h-3.5 w-3.5 text-green-700" />
                                    Edit Signatories
                                </Button>
                            )}

                            {canPrint ? (
                                <Button
                                    size="sm"
                                    onClick={handlePrint}
                                    disabled={isRecordingPrint}
                                    className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold gap-1.5 h-8.5 px-3 cursor-pointer shadow-xs"
                                >
                                    <Printer className="h-3.5 w-3.5" />
                                    {isRecordingPrint ? 'Preparing...' : 'Print Official Pass'}
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

                    {/* Document Preview Container (Paper Effect) */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-200/60 dark:bg-neutral-950 flex justify-center">
                        <div className="bg-white shadow-lg w-full max-w-3xl ring-1 ring-black/5">
                            <AdoptionPickupPass application={effectiveApplication} signatories={localSignatories} />
                        </div>
                    </div>

                    {/* Modal Footer Note */}
                    <div className="px-6 py-3 bg-white dark:bg-neutral-800 border-t border-gray-200 dark:border-neutral-700 text-center text-xs text-gray-500 dark:text-gray-400">
                        {canPrint ? (
                            <>
                                Click <strong>Print Official Pass</strong> to generate a clean, official single-page copy for physical turnover.
                            </>
                        ) : (
                            <span className="flex items-center justify-center gap-1.5 text-amber-800 dark:text-amber-300">
                                <ShieldAlert className="w-3.5 h-3.5" />
                                AHWS Staff View Only: Official printing is restricted to Municipal Agriculture Officers (MAO).
                            </span>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dedicated Print Portal: mounted directly to body to bypass all modal styles/transforms */}
            {open && canPrint && typeof document !== 'undefined' && createPortal(
                <div id="furfect-print-root" className="hidden print:flex">
                    <AdoptionPickupPass application={effectiveApplication} signatories={localSignatories} />
                </div>,
                document.body
            )}

            {/* Pass Signatories Manager Subdialog */}
            {canManageSignatories && (
                <CertificateSignatoriesDialog
                    open={signatoriesDialogOpen}
                    onOpenChange={setSignatoriesDialogOpen}
                    signatories={localSignatories || []}
                    onSignatoriesUpdated={(newSignatories) => setLocalSignatories(newSignatories)}
                    title="Configure Official Pass Signatories"
                    description="Customize up to 4 signatories for the adoption pickup pass. You can edit names, titles, upload official signature images, and toggle them on/off."
                />
            )}
        </>
    );
}
