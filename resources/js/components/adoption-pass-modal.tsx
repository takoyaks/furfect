import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Eye, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AdoptionPickupPass, type AdoptionPassApplication } from '@/components/adoption-pickup-pass';

interface AdoptionPassModalProps {
    application: AdoptionPassApplication;
    trigger?: React.ReactNode;
}

export function AdoptionPassModal({ application, trigger }: AdoptionPassModalProps) {
    const [open, setOpen] = useState(false);

    const handlePrint = () => {
        document.body.classList.add('is-printing');
        const cleanup = () => {
            document.body.classList.remove('is-printing');
            window.removeEventListener('afterprint', cleanup);
        };
        window.addEventListener('afterprint', cleanup);
        window.print();
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {trigger || (
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-xs border-green-300 text-green-800 hover:bg-green-50 h-9 gap-1.5 font-bold shadow-2xs cursor-pointer"
                        >
                            <Printer className="h-4 w-4" />
                            Print Pass
                        </Button>
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
                            <Button
                                size="sm"
                                onClick={handlePrint}
                                className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold gap-1.5 h-8.5 px-3 cursor-pointer shadow-xs"
                            >
                                <Printer className="h-3.5 w-3.5" />
                                Print Official Pass
                            </Button>
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
                            <AdoptionPickupPass application={application} />
                        </div>
                    </div>

                    {/* Modal Footer Note */}
                    <div className="px-6 py-3 bg-white dark:bg-neutral-800 border-t border-gray-200 dark:border-neutral-700 text-center text-xs text-gray-500 dark:text-gray-400">
                        Click <strong>Print Official Pass</strong> to generate a clean, official single-page copy for physical turnover.
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dedicated Print Portal: mounted directly to body to bypass all modal styles/transforms */}
            {open && typeof document !== 'undefined' && createPortal(
                <div id="furfect-print-root" className="hidden print:flex">
                    <AdoptionPickupPass application={application} />
                </div>,
                document.body
            )}
        </>
    );
}
