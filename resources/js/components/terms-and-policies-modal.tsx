import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DEFAULT_AGREEMENT_CONTENT } from '@/config/agreement-content';

type Tab = 'terms' | 'policies';

interface Props {
    trigger?: React.ReactNode;
    defaultTab?: Tab;
}

export function TermsAndPoliciesModal({ trigger, defaultTab = 'terms' }: Props) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

    const { systemSettings } = usePage().props as any;

    const customTerms = systemSettings?.terms_and_conditions_content?.trim();
    const customPolicies = systemSettings?.shelter_policies_content?.trim();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && (
                <span onClick={() => setOpen(true)} className="inline-block cursor-pointer">
                    {trigger}
                </span>
            )}
            <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
                    <DialogTitle className="text-lg font-bold text-gray-900">Terms &amp; Policies</DialogTitle>
                </DialogHeader>

                {/* Tab bar */}
                <div className="flex border-b border-gray-200 px-6 mt-4 shrink-0">
                    {([
                        { key: 'terms', label: 'FurFect Match Terms' },
                        { key: 'policies', label: 'Virac Shelter Policies' },
                    ] as { key: Tab; label: string }[]).map(({ key, label }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setActiveTab(key)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === key
                                    ? 'border-[#D4A017] text-[#D4A017]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 text-sm text-gray-700 space-y-4">
                    {activeTab === 'terms' && (
                        <>
                            <h3 className="font-bold text-base text-gray-900">
                                {DEFAULT_AGREEMENT_CONTENT.termsTitle}
                            </h3>
                            <p className="text-xs text-gray-400">
                                {DEFAULT_AGREEMENT_CONTENT.termsEffectiveDate}
                            </p>

                            {customTerms ? (
                                <div className="whitespace-pre-wrap leading-relaxed text-gray-700">
                                    {customTerms}
                                </div>
                            ) : (
                                DEFAULT_AGREEMENT_CONTENT.termsSections.map(({ title, body }) => (
                                    <div key={title} className="space-y-1">
                                        <h4 className="font-semibold text-gray-800">{title}</h4>
                                        <p className="text-gray-600 leading-relaxed">{body}</p>
                                    </div>
                                ))
                            )}
                        </>
                    )}

                    {activeTab === 'policies' && (
                        <>
                            <h3 className="font-bold text-base text-gray-900">
                                {DEFAULT_AGREEMENT_CONTENT.policiesTitle}
                            </h3>
                            <p className="text-xs text-gray-400">
                                {DEFAULT_AGREEMENT_CONTENT.policiesSubtitle}
                            </p>

                            {customPolicies ? (
                                <div className="whitespace-pre-wrap leading-relaxed text-gray-700">
                                    {customPolicies}
                                </div>
                            ) : (
                                DEFAULT_AGREEMENT_CONTENT.policiesSections.map(({ title, body }) => (
                                    <div key={title} className="space-y-1">
                                        <h4 className="font-semibold text-gray-800">{title}</h4>
                                        <p className="text-gray-600 leading-relaxed">{body}</p>
                                    </div>
                                ))
                            )}
                        </>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex justify-end">
                    <Button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="bg-[#D4A017] hover:bg-[#B8860B] text-white"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
