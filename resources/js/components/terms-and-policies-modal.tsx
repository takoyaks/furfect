import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type Tab = 'terms' | 'policies';

interface Props {
    trigger?: React.ReactNode;
    defaultTab?: Tab;
}

export function TermsAndPoliciesModal({ trigger, defaultTab = 'terms' }: Props) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
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
                            <h3 className="font-bold text-base text-gray-900">FurFect Match Platform — Terms and Conditions</h3>
                            <p className="text-xs text-gray-400">Effective Date: January 1, 2025</p>

                            {[
                                {
                                    title: '1. Acceptance of Terms',
                                    body: 'By registering and using the FurFect Match platform, you agree to be bound by these Terms and Conditions. If you do not agree, you may not use this platform.',
                                },
                                {
                                    title: '2. Platform Purpose',
                                    body: 'FurFect Match is an adoption matching platform designed to connect prospective pet owners with animals available for adoption from the Virac Animal Shelter. The platform uses a Decision Support System (DSS) to recommend compatible pets based on user lifestyle profiles.',
                                },
                                {
                                    title: '3. User Eligibility',
                                    body: 'Users must be at least 18 years of age, a legal resident of Virac, Catanduanes, and capable of entering into a binding agreement in order to use this platform.',
                                },
                                {
                                    title: '4. Accuracy of Information',
                                    body: 'You agree to provide accurate, current, and complete information during registration and throughout your use of the platform. Providing false information may result in the rejection of your application and permanent account suspension.',
                                },
                                {
                                    title: '5. Data Privacy',
                                    body: 'Your personal information is collected, processed, and stored in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173). Data is used solely for the purpose of facilitating pet adoption matching and will not be shared with third parties without your consent.',
                                },
                                {
                                    title: '6. DSS Matching Algorithm Disclaimer',
                                    body: 'The DSS compatibility score is generated algorithmically based on your lifestyle profile and pet characteristics. It is an advisory tool and does not guarantee adoption approval. Final adoption decisions are made by shelter staff and MAO officers.',
                                },
                                {
                                    title: '7. Account Responsibility',
                                    body: 'You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.',
                                },
                                {
                                    title: '8. Prohibited Activities',
                                    body: 'Users may not use the platform to submit false adoption applications, harass shelter staff, or engage in any activity that undermines the welfare of animals.',
                                },
                                {
                                    title: '9. Modifications',
                                    body: 'FurFect Match reserves the right to modify these Terms at any time. Continued use of the platform after changes constitutes your acceptance of the updated Terms.',
                                },
                            ].map(({ title, body }) => (
                                <div key={title}>
                                    <h4 className="font-semibold text-gray-800 mb-1">{title}</h4>
                                    <p className="text-gray-600 leading-relaxed">{body}</p>
                                </div>
                            ))}
                        </>
                    )}

                    {activeTab === 'policies' && (
                        <>
                            <h3 className="font-bold text-base text-gray-900">Virac Animal Shelter — Adoption Policies</h3>
                            <p className="text-xs text-gray-400">Municipality of Virac, Catanduanes</p>

                            {[
                                {
                                    title: '1. Eligibility to Adopt',
                                    body: 'Prospective adopters must be 18 years of age or older, a resident of Virac, Catanduanes, and must complete the FurFect Match adoption profile in its entirety before applying for adoption.',
                                },
                                {
                                    title: '2. Application Review Process',
                                    body: 'All adoption applications are subject to a two-tier review process: (a) Shelter staff review and lifestyle compatibility assessment, and (b) Municipal Animal Office (MAO) compliance audit. Both approvals are required before adoption is finalized.',
                                },
                                {
                                    title: '3. Spay/Neuter Requirements',
                                    body: 'All adopted animals must be spayed or neutered if not already done at the time of adoption. Adopters agree to schedule this procedure within 30 days of adoption for animals not yet sterilized.',
                                },
                                {
                                    title: '4. Vaccination Compliance',
                                    body: 'Adopters agree to maintain up-to-date vaccinations for all adopted animals. Anti-rabies vaccination is mandatory under Republic Act No. 9482. Proof of vaccination must be provided upon request.',
                                },
                                {
                                    title: '5. Home Environment Compliance',
                                    body: 'Adopters agree to provide a safe, clean, and appropriate living environment for the adopted animal. The shelter reserves the right to conduct home visits, with prior notice, to verify compliance with stated living conditions.',
                                },
                                {
                                    title: '6. Non-Transferability',
                                    body: 'Adopted animals may not be sold, given away, or transferred to another person without prior written consent from the Virac Animal Shelter. Unauthorized transfer constitutes a violation of this policy and may result in legal action.',
                                },
                                {
                                    title: '7. Surrender Protocol',
                                    body: 'If an adopter can no longer care for an adopted animal, they must contact the Virac Animal Shelter first. Surrendering an adopted animal to another shelter or abandoning it is strictly prohibited.',
                                },
                                {
                                    title: '8. Animal Welfare Compliance',
                                    body: 'Adopters must comply with the Animal Welfare Act (Republic Act No. 8485, as amended by RA 10631). Any act of cruelty or neglect will result in immediate revocation of adoption and legal prosecution.',
                                },
                                {
                                    title: '9. Post-Adoption Follow-up',
                                    body: 'Adopters agree to participate in post-adoption follow-up activities including photo updates and wellness check-ins as requested by the shelter within the first year of adoption.',
                                },
                            ].map(({ title, body }) => (
                                <div key={title}>
                                    <h4 className="font-semibold text-gray-800 mb-1">{title}</h4>
                                    <p className="text-gray-600 leading-relaxed">{body}</p>
                                </div>
                            ))}
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
