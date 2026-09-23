import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { CheckCircle2, ShieldCheck, AlertTriangle, Dog, User, Calendar, MapPin, ClipboardCheck, Sparkles, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ConfirmPetReleaseModalProps {
    application: {
        id: number;
        reference_number: string;
        certificate_number?: string | null;
        pickup_deadline_at?: string | null;
        adopter: {
            id: number;
            name: string;
            phone?: string | null;
            adopter_profile?: {
                full_name?: string | null;
                contact_number?: string | null;
                home_address?: string | null;
                valid_id_type?: string | null;
                valid_id_number?: string | null;
            } | null;
        };
        pet: {
            id: number;
            name: string;
            species: string;
            breed?: string | null;
            tag_number?: string | null;
            housing_area?: string | null;
            shelter?: {
                name: string;
                location: string;
            } | null;
        };
    };
    routePrefix?: 'shelter' | 'admin';
    trigger?: React.ReactNode;
}

export function ConfirmPetReleaseModal({
    application,
    routePrefix = 'shelter',
    trigger,
}: ConfirmPetReleaseModalProps) {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<'release' | 'unclaimed'>('release');

    const adopterProfile = application.adopter?.adopter_profile;
    const adopterName = adopterProfile?.full_name || application.adopter?.name || 'Authorized Adopter';
    const adopterContact = adopterProfile?.contact_number || application.adopter?.phone || 'On file';
    const idInfo = adopterProfile?.valid_id_type
        ? `${adopterProfile.valid_id_type}${adopterProfile.valid_id_number ? ` (ID No. ${adopterProfile.valid_id_number})` : ''}`
        : 'Verified Government ID on File';

    const { data, setData, post, processing, reset, errors } = useForm({
        notes: '',
        checklist: {
            id_verified: false,
            transport_ready: false,
            registry_signed: false,
        },
    });

    const isChecklistComplete =
        data.checklist.id_verified &&
        data.checklist.transport_ready &&
        data.checklist.registry_signed;

    const handleRelease = (e: React.FormEvent) => {
        e.preventDefault();
        const routeName = `${routePrefix}.applications.release`;
        post(route(routeName, application.id), {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    };

    const handleUnclaimed = () => {
        if (!confirm(`Are you sure you want to mark application ${application.reference_number} as UNCLAIMED? The pet will be returned to the available catalog.`)) {
            return;
        }
        const routeName = `${routePrefix}.applications.unclaimed`;
        post(route(routeName, application.id), {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 h-9 px-4 shadow-xs cursor-pointer"
                    >
                        <ShieldCheck className="h-4 w-4" />
                        Confirm Pet Release &amp; Turnover
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-2xl">
                {/* Header Banner */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-700 to-teal-800 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                            <Dog className="w-5 h-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                                Official Pet Turnover &amp; Gate Clearance
                            </DialogTitle>
                            <p className="text-xs text-emerald-100 mt-0.5">
                                Physical release of <strong>{application.pet.name}</strong> to legal adopter <strong>{adopterName}</strong>
                            </p>
                        </div>
                    </div>

                    <DialogClose asChild>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8.5 px-2 text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogClose>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-gray-700 dark:text-gray-300">
                    {/* Identification & Ward Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-neutral-800/60 rounded-xl border border-gray-200 dark:border-neutral-700">
                        <div className="space-y-1">
                            <span className="font-bold text-[10px] uppercase text-gray-500 tracking-wider block">Adopter Particulars</span>
                            <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-emerald-600" />
                                {adopterName}
                            </div>
                            <p className="text-[11px] text-gray-600 dark:text-gray-400">Contact: {adopterContact}</p>
                            <p className="text-[11px] text-gray-600 dark:text-gray-400 font-mono">ID: {idInfo}</p>
                        </div>

                        <div className="space-y-1 sm:border-l sm:border-gray-200 sm:dark:border-neutral-700 sm:pl-3">
                            <span className="font-bold text-[10px] uppercase text-gray-500 tracking-wider block">Animal Ward Specifications</span>
                            <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                                <Dog className="w-3.5 h-3.5 text-[#D4A017]" />
                                {application.pet.name} ({application.pet.species} &bull; {application.pet.breed || 'Mixed'})
                            </div>
                            <p className="text-[11px] text-gray-600 dark:text-gray-400">
                                Housing: {application.pet.housing_area || 'Shelter Ward'}
                            </p>
                            <p className="text-[11px] text-gray-600 dark:text-gray-400 font-mono">
                                Pass Ref: #{application.reference_number}
                            </p>
                        </div>
                    </div>

                    {mode === 'release' ? (
                        <form onSubmit={handleRelease} className="space-y-4">
                            {/* Statutory Verification Checklist */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                                        <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                                        Physical Turnover Verification Checklist *
                                    </Label>
                                    <span className="text-[10px] text-gray-500">All 3 checks required</span>
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800/40 cursor-pointer transition">
                                        <input
                                            type="checkbox"
                                            checked={data.checklist.id_verified}
                                            onChange={(e) =>
                                                setData('checklist', {
                                                    ...data.checklist,
                                                    id_verified: e.target.checked,
                                                })
                                            }
                                            className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                        />
                                        <div className="space-y-0.5">
                                            <span className="font-bold text-gray-900 dark:text-white block">
                                                1. Original Government ID Inspected
                                            </span>
                                            <span className="text-[11px] text-gray-500 block">
                                                Adopter presented physical photo ID matching the verified name and details on the Adoption Pass.
                                            </span>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800/40 cursor-pointer transition">
                                        <input
                                            type="checkbox"
                                            checked={data.checklist.transport_ready}
                                            onChange={(e) =>
                                                setData('checklist', {
                                                    ...data.checklist,
                                                    transport_ready: e.target.checked,
                                                })
                                            }
                                            className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                        />
                                        <div className="space-y-0.5">
                                            <span className="font-bold text-gray-900 dark:text-white block">
                                                2. Safe Transport Gear Inspected
                                            </span>
                                            <span className="text-[11px] text-gray-500 block">
                                                Adopter provided an adequate, secure pet carrier/crate (cats) or collar &amp; leash (dogs) for safe transport.
                                            </span>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800/40 cursor-pointer transition">
                                        <input
                                            type="checkbox"
                                            checked={data.checklist.registry_signed}
                                            onChange={(e) =>
                                                setData('checklist', {
                                                    ...data.checklist,
                                                    registry_signed: e.target.checked,
                                                })
                                            }
                                            className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                        />
                                        <div className="space-y-0.5">
                                            <span className="font-bold text-gray-900 dark:text-white block">
                                                3. Physical Turnover Registry Signed
                                            </span>
                                            <span className="text-[11px] text-gray-500 block">
                                                Adopter formally signed the municipal physical turnover logbook and confirmed pet custody transfer.
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Release Notes */}
                            <div className="space-y-1.5">
                                <Label htmlFor="release_notes" className="font-bold text-xs text-gray-800 dark:text-gray-200">
                                    Releasing Officer Remarks / Handover Notes (Optional)
                                </Label>
                                <Textarea
                                    id="release_notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="e.g. Pet released in good health, rabies vaccination booklet handed to adopter, collar tag attached."
                                    rows={3}
                                    className="text-xs"
                                />
                            </div>

                            {/* Actions Footer */}
                            <div className="pt-2 flex items-center justify-between border-t border-gray-200 dark:border-neutral-700">
                                <button
                                    type="button"
                                    onClick={() => setMode('unclaimed')}
                                    className="text-[11px] text-red-600 hover:text-red-700 hover:underline cursor-pointer font-medium"
                                >
                                    Adopter didn't show up? Mark as Unclaimed
                                </button>

                                <div className="flex items-center gap-2">
                                    <DialogClose asChild>
                                        <Button size="sm" variant="outline" className="text-xs">
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={!isChecklistComplete || processing}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        {processing ? 'Processing Turnover...' : 'Confirm Pet Handover & Release'}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        /* Unclaimed Mode */
                        <div className="space-y-4">
                            <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-300 space-y-1">
                                <div className="font-bold flex items-center gap-1.5 text-red-900 dark:text-red-200">
                                    <AlertTriangle className="w-4 h-4 text-red-600" />
                                    Adopter Forfeiture &amp; Pet Relisting
                                </div>
                                <p className="text-[11px] leading-relaxed">
                                    Marking this adoption as <strong>UNCLAIMED</strong> will formally close application #{application.reference_number} and return <strong>{application.pet.name}</strong> to the available pet catalog.
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="unclaimed_notes" className="font-bold text-xs text-gray-800 dark:text-gray-200">
                                    Forfeiture Reason / Notes
                                </Label>
                                <Textarea
                                    id="unclaimed_notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="e.g. Adopter failed to claim pet after 7-day pickup deadline expired; did not respond to follow-up calls."
                                    rows={3}
                                    className="text-xs"
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-between border-t border-gray-200 dark:border-neutral-700">
                                <button
                                    type="button"
                                    onClick={() => setMode('release')}
                                    className="text-[11px] text-gray-500 hover:text-gray-900 hover:underline cursor-pointer"
                                >
                                    &larr; Back to Pet Handover
                                </button>

                                <div className="flex items-center gap-2">
                                    <DialogClose asChild>
                                        <Button size="sm" variant="outline" className="text-xs">
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button
                                        type="button"
                                        onClick={handleUnclaimed}
                                        disabled={processing}
                                        className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-1.5 shadow-xs cursor-pointer"
                                    >
                                        <AlertTriangle className="w-4 h-4" />
                                        {processing ? 'Processing...' : 'Mark as Unclaimed & Return Pet'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
