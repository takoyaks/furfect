import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface AdopterProfile {
    full_name?: string;
    contact_number?: string;
    home_address?: string;
    valid_id_type?: string;
    valid_id_number?: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    adopter_profile?: AdopterProfile;
}

interface Shelter {
    id: number;
    name: string;
    location: string;
    contact_number?: string;
}

interface Pet {
    id: number;
    name: string;
    species: string;
    breed: string;
    gender?: string;
    age_years?: number;
    size?: string;
    tag_number?: string | null;
    microchip_number?: string | null;
    housing_area?: string | null;
    adoption_fee: string | number;
    shelter: Shelter;
}

export interface AdoptionPassApplication {
    id: number;
    reference_number: string;
    certificate_number?: string | null;
    status: string;
    submitted_at?: string;
    reviewed_at?: string | null;
    resolved_at?: string | null;
    pickup_deadline_at?: string | null;
    pet: Pet;
    user?: User;
    staff?: { id: number; name: string } | null;
    mao_officer?: { id: number; name: string } | null;
    mao_remarks?: string | null;
    staff_notes?: string | null;
}

interface AdoptionPickupPassProps {
    application: AdoptionPassApplication;
    className?: string;
}

export function AdoptionPickupPass({ application, className = '' }: AdoptionPickupPassProps) {
    const adopterName =
        application.user?.adopter_profile?.full_name ||
        application.user?.name ||
        'Authorized Adopter';

    const adopterContact =
        application.user?.adopter_profile?.contact_number ||
        application.user?.phone ||
        'Recorded in Registry';

    const adopterAddress =
        application.user?.adopter_profile?.home_address ||
        application.user?.address ||
        'Virac, Catanduanes';

    const idType = application.user?.adopter_profile?.valid_id_type;
    const idNumber = application.user?.adopter_profile?.valid_id_number;
    const validIdInfo = idType
        ? `${idType}${idNumber ? ` (ID No. ${idNumber})` : ''}`
        : 'Verified Government ID on File';

    const issueDate = application.resolved_at
        ? new Date(application.resolved_at).toLocaleDateString('en-PH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : new Date().toLocaleDateString('en-PH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          });

    const pickupDeadline = application.pickup_deadline_at
        ? new Date(application.pickup_deadline_at).toLocaleDateString('en-PH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : 'Within 7 Calendar Days of Approval';

    const certNumber = application.certificate_number || `CERT-${application.reference_number}`;
    const feeNumber = parseFloat(String(application.pet.adoption_fee || 0));

    return (
        <div
            className={`print-pass-document bg-white text-gray-950 font-sans p-6 print:p-0 max-w-3xl mx-auto border-2 border-gray-900 rounded-none shadow-none text-xs leading-normal ${className}`}
            style={{
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
            }}
        >
            {/* Official LGU Header */}
            <div className="text-center border-b-2 border-gray-900 pb-2 mb-2.5 print:pb-1 print:mb-1 space-y-0.5 print:space-y-0">
                <div className="text-[10px] print:text-[8px] tracking-widest uppercase font-semibold text-gray-700">
                    Republic of the Philippines &bull; Province of Catanduanes
                </div>
                <div className="text-sm print:text-xs font-black uppercase tracking-wider text-gray-900">
                    MUNICIPALITY OF VIRAC
                </div>
                <div className="text-xs print:text-[10px] font-bold uppercase tracking-wide text-gray-800">
                    Office of the Municipal Mayor &bull; Municipal Agriculture Office (MAO)
                </div>
                <div className="text-[10px] print:text-[8px] font-medium text-gray-600">
                    Animal Welfare, Health &amp; Regulatory Services Section
                </div>
                <div className="pt-1 print:pt-0.5">
                    <span className="inline-block bg-gray-900 text-white font-black text-xs print:text-[10.5px] tracking-wide px-3 py-0.5 uppercase rounded-xs">
                        Official Pet Adoption Pickup Pass &amp; Gate Clearance
                    </span>
                </div>
                <div className="text-[9px] print:text-[7.5px] text-gray-500 italic pt-0.5">
                    Issued pursuant to Republic Act No. 8485 (Animal Welfare Act of 1998, as amended by RA 10631) &amp; RA 9482
                </div>
            </div>

            {/* Document Control & Verification Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-50 border border-gray-900 p-2 print:p-1.5 mb-2.5 print:mb-1 text-[11px] print:text-[9px]">
                <div>
                    <span className="text-[9px] print:text-[8px] font-bold uppercase text-gray-600 block">Certificate No.</span>
                    <span className="font-mono font-black text-gray-900">{certNumber}</span>
                </div>
                <div>
                    <span className="text-[9px] print:text-[8px] font-bold uppercase text-gray-600 block">Application Ref</span>
                    <span className="font-mono font-bold text-gray-900">{application.reference_number}</span>
                </div>
                <div>
                    <span className="text-[9px] print:text-[8px] font-bold uppercase text-gray-600 block">Approval Date</span>
                    <span className="font-semibold text-gray-900">{issueDate}</span>
                </div>
                <div>
                    <span className="text-[9px] print:text-[8px] font-bold uppercase text-red-700 block">Claim Deadline</span>
                    <span className="font-bold text-red-700">{pickupDeadline}</span>
                </div>
            </div>

            {/* Particulars: Adopter & Pet (2-Column Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2.5 print:gap-2 print:mb-1">
                {/* Adopter Information */}
                <div className="border border-gray-900 p-2.5 print:p-1.5 space-y-1.5 print:space-y-0.5">
                    <div className="font-bold text-[11px] print:text-[9px] uppercase tracking-wide border-b border-gray-300 pb-0.5 flex items-center justify-between">
                        <span>I. Adopter Details</span>
                        <span className="text-[9px] print:text-[7.5px] text-gray-500 font-normal">Legal Custodian</span>
                    </div>
                    <div className="space-y-1 print:space-y-0.5 text-[11px] print:text-[8.5px]">
                        <div>
                            <span className="text-gray-500 block text-[9.5px] print:text-[7.5px]">Full Name:</span>
                            <span className="font-bold text-gray-900 text-xs print:text-[10px]">{adopterName}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block text-[9.5px] print:text-[7.5px]">Contact Number:</span>
                            <span className="font-medium text-gray-900">{adopterContact}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block text-[9.5px] print:text-[7.5px]">Residential Address:</span>
                            <span className="font-medium text-gray-900">{adopterAddress}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block text-[9.5px] print:text-[7.5px]">Identity Verification:</span>
                            <span className="font-medium text-gray-900">{validIdInfo}</span>
                        </div>
                    </div>
                </div>

                {/* Adopted Animal Information */}
                <div className="border border-gray-900 p-2.5 print:p-1.5 space-y-1.5 print:space-y-0.5">
                    <div className="font-bold text-[11px] print:text-[9px] uppercase tracking-wide border-b border-gray-300 pb-0.5 flex items-center justify-between">
                        <span>II. Animal Particulars</span>
                        <span className="text-[9px] print:text-[7.5px] text-gray-500 font-normal">Municipal Ward</span>
                    </div>
                    <div className="space-y-1 print:space-y-0.5 text-[11px] print:text-[8.5px]">
                        <div className="flex justify-between">
                            <div>
                                <span className="text-gray-500 block text-[9.5px] print:text-[7.5px]">Pet Name:</span>
                                <span className="font-black text-gray-900 text-xs print:text-[10px]">{application.pet.name}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-gray-500 block text-[9.5px] print:text-[7.5px]">Species / Breed:</span>
                                <span className="font-bold text-gray-900 capitalize">
                                    {application.pet.species} &bull; {application.pet.breed}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-0.5">
                            <div>
                                <span className="text-gray-500 block text-[9.5px] print:text-[7.5px]">Sex &amp; Age:</span>
                                <span className="font-medium text-gray-900 capitalize">
                                    {application.pet.gender || 'Unknown'} &bull; ~{application.pet.age_years || 1} yr(s)
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-[9.5px] print:text-[7.5px]">Collar Tag No.:</span>
                                <span className="font-mono font-bold text-gray-900">
                                    {application.pet.tag_number || 'N/A'}
                                </span>
                            </div>
                        </div>

                        <div className="pt-0.5 border-t border-gray-100 flex justify-between items-center text-[10px] print:text-[8px]">
                            <span>Shelter Housing Bay:</span>
                            <span className="font-semibold text-gray-900">
                                {application.pet.housing_area || 'Main Shelter Bay'}
                            </span>
                        </div>

                        <div className="flex justify-between items-center text-[10px] print:text-[8px]">
                            <span>Adoption Fee:</span>
                            <span className="font-bold text-gray-900">
                                {feeNumber > 0 ? `₱${feeNumber.toLocaleString()}` : 'Municipal Fee Waived'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pickup Facility & Instructions */}
            <div className="border border-gray-900 p-2.5 print:p-1.5 mb-2.5 print:mb-1 bg-gray-50/70 space-y-1 print:space-y-0.5">
                <div className="font-bold text-[11px] print:text-[9px] uppercase tracking-wide border-b border-gray-200 pb-0.5 flex items-center justify-between">
                    <span>III. Releasing Facility &amp; Pickup Instructions</span>
                    <span className="text-[10px] print:text-[8px] font-semibold text-gray-700">
                        Facility: {application.pet.shelter.name} ({application.pet.shelter.location})
                    </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 print:gap-1 text-[10px] print:text-[8px] text-gray-800 pt-0.5">
                    <div className="p-1.5 print:p-1 bg-white border border-gray-200 leading-tight">
                        <span className="font-bold block text-gray-900">1. Original ID</span>
                        Present the original government ID matching this pass.
                    </div>
                    <div className="p-1.5 print:p-1 bg-white border border-gray-200 leading-tight">
                        <span className="font-bold block text-gray-900">2. Transport Gear</span>
                        Bring a secure crate (for cats) or collar &amp; leash (for dogs).
                    </div>
                    <div className="p-1.5 print:p-1 bg-white border border-gray-200 leading-tight">
                        <span className="font-bold block text-gray-900">3. Release Log</span>
                        Sign the municipal physical turnover registry upon release.
                    </div>
                </div>
            </div>

            {/* Legal Sworn Care Undertaking */}
            <div className="border border-gray-900 p-2.5 print:p-1.5 mb-2.5 print:mb-1 text-[9.5px] print:text-[7.5px] leading-relaxed print:leading-tight text-gray-800 bg-white">
                <div className="font-bold uppercase tracking-wider text-gray-900 mb-0.5 text-[10px] print:text-[8px]">
                    IV. Adopter's Sworn Covenant &amp; Humane Care Undertaking
                </div>
                <p>
                    I hereby certify that I am adopting the animal described herein solely as a family companion. Under penalty of applicable municipal ordinances and national animal welfare laws, I solemnly swear to provide humane treatment, adequate sustenance, clean water, suitable shelter, and required veterinary attention. I strictly pledge never to abandon, maltreat, or neglect this animal, nor subject it to fighting or unauthorized breeding. I recognize the authority of municipal officers to conduct post-adoption welfare checks.
                </p>
            </div>

            {/* Signatures & Verification Strip (3-Column) */}
            <div className="border border-gray-900 p-3 print:p-1.5 mb-2 print:mb-1">
                <div className="text-[10px] print:text-[8.5px] font-bold uppercase tracking-wider text-gray-700 border-b border-gray-200 pb-0.5 mb-3 print:mb-1">
                    V. Official Endorsements &amp; Turnover Signatures
                </div>

                <div className="grid grid-cols-3 gap-4 print:gap-2 text-center text-[10px] print:text-[8px]">
                    {/* Approving Officer */}
                    <div className="space-y-1 flex flex-col justify-end">
                        <div className="h-9 print:h-5 border-b border-gray-900 flex items-end justify-center pb-0.5">
                            {/* Line for physical or stamp endorsement */}
                        </div>
                        <span className="font-bold uppercase text-gray-900 block text-[10px] print:text-[8px] pt-1 print:pt-0.5">
                            {application.mao_officer?.name || 'Authorized MAO Officer'}
                        </span>
                        <span className="text-gray-500 text-[9px] print:text-[7px] block">
                            Municipal Agriculture Office (MAO)
                        </span>
                        <span className="text-gray-400 text-[8px] print:text-[6.5px] block">
                            Approved: {issueDate}
                        </span>
                    </div>

                    {/* Releasing Officer */}
                    <div className="space-y-1 flex flex-col justify-end">
                        <div className="h-9 print:h-5 border-b border-gray-900 flex items-end justify-center pb-0.5">
                            {/* Line for physical signature */}
                        </div>
                        <span className="font-bold uppercase text-gray-900 block text-[10px] print:text-[8px] pt-1 print:pt-0.5">
                            {application.staff?.name || 'Releasing Officer'}
                        </span>
                        <span className="text-gray-500 text-[9px] print:text-[7px] block">
                            Shelter Officer-in-Charge
                        </span>
                        <span className="text-gray-400 text-[8px] print:text-[6.5px] block">
                            Date of Release: _____________
                        </span>
                    </div>

                    {/* Adopter */}
                    <div className="space-y-1 flex flex-col justify-end">
                        <div className="h-9 print:h-5 border-b border-gray-900 flex items-end justify-center pb-0.5">
                            {/* Line for physical signature */}
                        </div>
                        <span className="font-bold uppercase text-gray-900 block text-[10px] print:text-[8px] pt-1 print:pt-0.5">
                            {adopterName}
                        </span>
                        <span className="text-gray-500 text-[9px] print:text-[7px] block">
                            Adopter / Custodian Signature
                        </span>
                        <span className="text-gray-400 text-[8px] print:text-[6.5px] block">
                            Date Received: _____________
                        </span>
                    </div>
                </div>
            </div>

            {/* Security Footer */}
            <div className="flex items-center justify-between text-[9px] print:text-[7px] text-gray-500 border-t border-gray-200 pt-2 print:pt-0.5">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-700" />
                    <span>
                        Verified Municipal Document &bull; Application #{application.reference_number} &bull; Page 1 of 1
                    </span>
                </div>
                <div className="font-mono text-[8px] print:text-[6.5px] text-gray-400">
                    AUTH-HASH: {application.id}-{certNumber.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}
                </div>
            </div>
        </div>
    );
}
