import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap, Sparkles, HeartHandshake, ShieldCheck, HelpCircle } from 'lucide-react';

interface EnergyMaintenanceGuideDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EnergyMaintenanceGuideDialog({
    open,
    onOpenChange,
}: EnergyMaintenanceGuideDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto p-6 bg-white dark:bg-neutral-900 border-gray-200">
                <DialogHeader className="space-y-1.5 border-b border-gray-100 dark:border-neutral-800 pb-3">
                    <div className="flex items-center gap-2 text-[#D4A017]">
                        <HelpCircle className="h-5 w-5" />
                        <span className="text-xs font-bold uppercase tracking-wider">Adoption Guide</span>
                    </div>
                    <DialogTitle className="text-xl font-bold text-gray-900 dark:text-neutral-100">
                        Understanding Energy &amp; Maintenance Levels
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-500 dark:text-neutral-400">
                        These ratings help you choose a rescued pet whose daily activity and grooming demands match your lifestyle and schedule.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-3">
                    {/* Energy Level Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                                <Zap className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-neutral-100">Energy Level Scale</h3>
                                <p className="text-[11px] text-gray-500">How much daily physical exercise and stimulation this pet needs.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/70 dark:bg-neutral-800/50 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-green-700 dark:text-green-400 flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-green-500" />
                                        Low (Couch Potato / Calm)
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-neutral-300 leading-relaxed">
                                    Happy with brief walks (15–20 mins) and indoor relaxation. Ideal for apartments, seniors, or adopters with busy schedules.
                                </p>
                            </div>

                            <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/70 dark:bg-neutral-800/50 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                                        Medium / Moderate (Balanced)
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-neutral-300 leading-relaxed">
                                    Enjoys 30–45 mins daily walking and playtime, but easily settles down indoors. Adaptable to most everyday household routines.
                                </p>
                            </div>

                            <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/70 dark:bg-neutral-800/50 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                                        High (Active &amp; Playful)
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-neutral-300 leading-relaxed">
                                    Requires 60+ minutes of vigorous activity (fetch, jogging, hiking). Needs outdoor space or an active family to avoid restlessness.
                                </p>
                            </div>

                            <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/70 dark:bg-neutral-800/50 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-red-500" />
                                        Very High (Energetic Athlete)
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-neutral-300 leading-relaxed">
                                    Intense drive requiring agility games, continuous mental challenges, and extensive space. Recommended for dedicated experienced owners.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Maintenance Level Section */}
                    <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-neutral-800">
                        <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-neutral-100">Maintenance &amp; Grooming Scale</h3>
                                <p className="text-[11px] text-gray-500">Coat care, shedding control, hygiene routines, and health upkeep.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                            <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/40 dark:bg-neutral-800/50 space-y-1">
                                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                                    🟢 Low Maintenance
                                </span>
                                <p className="text-xs text-gray-600 dark:text-neutral-300 leading-relaxed">
                                    Short or wash-and-wear coat. Needs minimal brushing (once weekly or bi-weekly), standard baths only when dirty, and routine wellness checkups.
                                </p>
                            </div>

                            <div className="p-3 rounded-xl border border-amber-100 bg-amber-50/40 dark:bg-neutral-800/50 space-y-1">
                                <span className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                                    🟡 Medium Maintenance
                                </span>
                                <p className="text-xs text-gray-600 dark:text-neutral-300 leading-relaxed">
                                    Medium coat with seasonal shedding. Requires brushing 2–3 times weekly, ear cleaning, and regular nail trims to stay comfortable.
                                </p>
                            </div>

                            <div className="p-3 rounded-xl border border-orange-100 bg-orange-50/40 dark:bg-neutral-800/50 space-y-1">
                                <span className="text-xs font-bold text-orange-800 dark:text-orange-400 flex items-center gap-1.5">
                                    🟠 High Maintenance
                                </span>
                                <p className="text-xs text-gray-600 dark:text-neutral-300 leading-relaxed">
                                    Long, double, or curly coat prone to matting. Needs daily brushing, professional grooming every 4–6 weeks, or specialized diet/medication.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Municipal Assurance */}
                    <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/60 flex items-start gap-2.5 text-xs text-amber-900">
                        <ShieldCheck className="h-4 w-4 text-[#D4A017] shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold">Shelter &amp; MAO Verified:</span> All animals at Virac Animal Shelter undergo comprehensive veterinary health screening, anti-rabies vaccination, and behavioral evaluation before listing.
                        </div>
                    </div>
                </div>

                <DialogFooter className="border-t border-gray-100 dark:border-neutral-800 pt-3">
                    <Button 
                        type="button" 
                        onClick={() => onOpenChange(false)} 
                        className="w-full sm:w-auto bg-[#D4A017] hover:bg-[#B8860B] text-white font-semibold"
                    >
                        Got It
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
