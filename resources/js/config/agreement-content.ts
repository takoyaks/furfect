/**
 * ==============================================================================
 * AGREEMENT & CONSENT CONTENT CONFIGURATION (EDITABLE PLACEHOLDER)
 * ==============================================================================
 * 
 * You can edit or update the Terms & Conditions, Virac Shelter Adoption Policies,
 * and Consent Checkbox copy directly in this file.
 * 
 * NOTE: If configured in Admin Settings (System Configuration), the database
 * settings will take precedence. If left empty in Admin Settings, this file
 * provides the default content and fallback placeholders.
 */

export interface AgreementSection {
    title: string;
    body: string;
}

export interface AgreementConfig {
    termsTitle: string;
    termsEffectiveDate: string;
    termsSections: AgreementSection[];
    policiesTitle: string;
    policiesSubtitle: string;
    policiesSections: AgreementSection[];
    registrationConsentLabel: string;
    personalInfoConsentLabel: string;
    personalInfoConfirmLabel: string;
}

export const DEFAULT_AGREEMENT_CONTENT: AgreementConfig = {
    // --------------------------------------------------------------------------
    // 1. FURFECT MATCH TERMS AND CONDITIONS
    // --------------------------------------------------------------------------
    termsTitle: 'FurFect Match Platform — Terms and Conditions',
    termsEffectiveDate: 'Effective Date: September 1, 2026',
    termsSections: [
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
    ],

    // --------------------------------------------------------------------------
    // 2. VIRAC ANIMAL SHELTER ADOPTION POLICIES
    // --------------------------------------------------------------------------
    policiesTitle: 'Virac Animal Shelter — Adoption Policies',
    policiesSubtitle: 'Municipality of Virac, Catanduanes',
    policiesSections: [
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
    ],

    // --------------------------------------------------------------------------
    // 3. CONSENT & DECLARATION LABELS
    // --------------------------------------------------------------------------
    registrationConsentLabel:
        'I agree to the terms and conditions of FurFect Match and the Virac Animal Shelter Adoption policies.',
    personalInfoConsentLabel:
        'I have read and agree to the adoption terms and conditions.',
    personalInfoConfirmLabel:
        'I confirm that all information provided is accurate and true.',
};
