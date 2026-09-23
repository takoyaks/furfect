import React from 'react';
import { Award, ShieldCheck, HeartHandshake, Sparkles, CheckCircle2 } from 'lucide-react';
import { type AdoptionPassApplication } from '@/components/adoption-pickup-pass';

interface AdoptionCertificateProps {
    application: AdoptionPassApplication;
    className?: string;
}

export function AdoptionCertificate({ application, className = '' }: AdoptionCertificateProps) {
    const adopterUser = application.user || application.adopter;

    const adopterName =
        adopterUser?.adopter_profile?.full_name ||
        adopterUser?.name ||
        'Authorized Adopter';

    const adopterContact =
        adopterUser?.adopter_profile?.contact_number ||
        adopterUser?.phone ||
        'Recorded in Registry';

    const adopterAddress =
        adopterUser?.adopter_profile?.home_address ||
        adopterUser?.address ||
        'Virac, Catanduanes';

    const idType = adopterUser?.adopter_profile?.valid_id_type;
    const idNumber = adopterUser?.adopter_profile?.valid_id_number;
    const validIdInfo = idType
        ? `${idType}${idNumber ? ` (ID No. ${idNumber})` : ''}`
        : 'Verified Government ID on File';

    const adoptionDate = application.resolved_at
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

    const certNumber = application.certificate_number || `CERT-${application.reference_number}`;
    const feeNumber = parseFloat(String(application.pet.adoption_fee || 0));

    return (
        <div
            className={`print-certificate-document bg-white text-gray-950 font-sans p-6 print:p-0 max-w-3xl mx-auto border-4 border-double border-gray-900 shadow-none text-xs leading-normal relative ${className}`}
            style={{
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
            }}
        >
            {/* Inner Decorative Framing Ring */}
            <div className="border border-gray-400 p-3.5 print:p-2 relative bg-gradient-to-b from-amber-50/20 via-white to-amber-50/10">
                {/* Corner Accents */}
                <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#D4A017]" />
                <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#D4A017]" />
                <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#D4A017]" />
                <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#D4A017]" />

                {/* Official LGU & Republic Header */}
                <div className="text-center border-b-2 border-gray-900 pb-2.5 mb-2 print:pb-1 print:mb-1 space-y-0.5 print:space-y-0">
                    <div className="flex items-center justify-center gap-1.5 mb-0.5">
                        <Award className="w-4 h-4 text-[#D4A017]" />
                        <span className="text-[10px] print:text-[8px] tracking-widest uppercase font-semibold text-gray-700">
                            Republic of the Philippines &bull; Province of Catanduanes
                        </span>
                        <Award className="w-4 h-4 text-[#D4A017]" />
                    </div>

                    <div className="text-sm print:text-xs font-black uppercase tracking-wider text-gray-900">
                        MUNICIPALITY OF VIRAC
                    </div>
                    <div className="text-xs print:text-[10px] font-bold uppercase tracking-wide text-gray-800">
                        Office of the Municipal Mayor &bull; Municipal Agriculture Office (MAO)
                    </div>
                    <div className="text-[10px] print:text-[8px] font-medium text-gray-600">
                        Animal Welfare, Health &amp; Veterinary Regulatory Division
                    </div>

                    {/* Prominent Certificate Title Banner */}
                    <div className="pt-1.5 print:pt-0.5">
                        <span className="inline-block bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white font-black text-sm print:text-xs tracking-widest px-5 py-0.5 print:py-0.5 print:px-3 uppercase rounded-xs shadow-xs border-y border-[#D4A017]">
                            Official Certificate of Pet Adoption
                        </span>
                    </div>
                    <div className="text-[10px] print:text-[8px] font-bold text-[#8B6508] italic pt-0.5">
                        Katunayan ng Legal na Pag-aampon ng Hayop
                    </div>
                    <div className="text-[9px] print:text-[7.5px] text-gray-500 pt-0.5">
                        Issued pursuant to Republic Act No. 8485 (Animal Welfare Act of 1998, as amended by RA 10631) &amp; RA 9482 (Anti-Rabies Act of 2007)
                    </div>
                </div>

                {/* Certificate Identification & Document Control */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-amber-50/40 border border-gray-900 p-2 print:p-1.5 mb-2.5 print:mb-1.5 text-[11px] print:text-[9px]">
                    <div>
                        <span className="text-[9px] print:text-[8px] font-bold uppercase text-gray-600 block">Certificate No.</span>
                        <span className="font-mono font-black text-amber-900">{certNumber}</span>
                    </div>
                    <div>
                        <span className="text-[9px] print:text-[8px] font-bold uppercase text-gray-600 block">Registry Reference</span>
                        <span className="font-mono font-bold text-gray-900">{application.reference_number}</span>
                    </div>
                    <div>
                        <span className="text-[9px] print:text-[8px] font-bold uppercase text-gray-600 block">Date of Legal Adoption</span>
                        <span className="font-semibold text-gray-900">{adoptionDate}</span>
                    </div>
                    <div>
                        <span className="text-[9px] print:text-[8px] font-bold uppercase text-emerald-700 block">Legal Registry Status</span>
                        <span className="font-bold text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Officially Registered
                        </span>
                    </div>
                </div>

                {/* Solemn Conferment Statement */}
                <div className="text-center my-2.5 print:my-1 px-3 print:px-1 space-y-1 print:space-y-0.5">
                    <p className="text-[11px] print:text-[9px] uppercase tracking-wider text-gray-600 font-serif italic">
                        This is to solemnly and officially certify that
                    </p>
                    <div className="text-base sm:text-lg print:text-xs font-black text-gray-900 tracking-wide uppercase border-b-2 border-dashed border-gray-400 pb-1 print:pb-0 max-w-lg mx-auto font-serif">
                        {adopterName}
                    </div>
                    <p className="text-[10px] print:text-[8px] print:leading-tight text-gray-600 pt-0.5 max-w-xl mx-auto">
                        residing at <span className="font-semibold text-gray-800">{adopterAddress}</span>, having satisfactorily fulfilled all statutory compliance evaluations, background audits, and welfare verifications, is hereby conferred full legal custodianship, compassionate ownership, and guardianship of the companion animal described below:
                    </p>
                </div>

                {/* Adopted Animal Profile Showcase */}
                <div className="border-2 border-gray-900 p-2.5 print:p-1.5 mb-2.5 print:mb-1 bg-white shadow-2xs">
                    <div className="font-bold text-[11px] print:text-[9px] uppercase tracking-wider border-b border-gray-300 pb-1 print:pb-0.5 flex items-center justify-between text-gray-800">
                        <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-[#D4A017]" />
                            Official Ward Identity &amp; Physical Specifications
                        </span>
                        <span className="text-[9px] print:text-[7.5px] font-mono text-gray-500 uppercase">
                            Registry Ward #{application.pet.id}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1.5 print:gap-1 print:pt-1 text-[11px] print:text-[8.5px]">
                        <div className="col-span-2 sm:col-span-1">
                            <span className="text-gray-500 block text-[9.5px] print:text-[7.5px] uppercase font-semibold">Pet Name:</span>
                            <span className="text-sm print:text-xs font-black text-gray-900 tracking-wide">{application.pet.name}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block text-[9.5px] print:text-[7.5px] uppercase font-semibold">Species &amp; Breed:</span>
                            <span className="font-bold text-gray-900 capitalize">
                                {application.pet.species} &bull; {application.pet.breed}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500 block text-[9.5px] print:text-[7.5px] uppercase font-semibold">Sex &amp; Estimated Age:</span>
                            <span className="font-semibold text-gray-900 capitalize">
                                {application.pet.gender || 'Unknown'} &bull; ~{application.pet.age_years || 1} yr(s)
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500 block text-[9.5px] print:text-[7.5px] uppercase font-semibold">Size &amp; Coat:</span>
                            <span className="font-semibold text-gray-900 capitalize">
                                {application.pet.size || 'Medium'} &bull; {application.pet.coat_color || 'Mixed'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1.5 mt-1.5 print:gap-1 print:pt-1 print:mt-1 border-t border-gray-100 text-[10.5px] print:text-[8px]">
                        <div>
                            <span className="text-gray-500 block text-[9.5px] print:text-[7.5px] uppercase font-semibold">Collar Tag Number:</span>
                            <span className="font-mono font-bold text-gray-900">
                                {application.pet.tag_number || 'N/A (Recorded in Registry)'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500 block text-[9.5px] print:text-[7.5px] uppercase font-semibold">Electronic Microchip ID:</span>
                            <span className="font-mono font-bold text-gray-900">
                                {application.pet.microchip_number || 'ISO Transponder on File'}
                            </span>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <span className="text-gray-500 block text-[9.5px] print:text-[7.5px] uppercase font-semibold">Releasing Shelter Facility:</span>
                            <span className="font-semibold text-gray-900">
                                {application.pet.shelter.name} ({application.pet.shelter.location})
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sworn Humane Guardianship Covenant */}
                <div className="border border-gray-900 p-2 print:p-1.5 mb-2.5 print:mb-1 text-[9.5px] print:text-[7.5px] leading-relaxed print:leading-tight text-gray-800 bg-amber-50/20">
                    <div className="font-bold uppercase tracking-wider text-gray-900 mb-0.5 text-[10px] print:text-[8px] flex items-center gap-1.5">
                        <HeartHandshake className="w-3.5 h-3.5 print:w-3 print:h-3 text-[#D4A017]" />
                        Humane Guardianship Covenant &amp; Municipal Responsibility Pledge
                    </div>
                    <p>
                        By receiving this Official Certificate of Adoption, the custodian solemnly undertakes to provide lifelong humane care, wholesome nourishment, fresh water, adequate shelter, routine healthcare, and mandatory rabies vaccinations pursuant to the Animal Welfare Act (RA 8485) and the Anti-Rabies Act (RA 9482). The adopter pledges never to abandon, mistreat, or subject this animal to cruel practices, and acknowledges the visitorial authority of municipal veterinary officers for welfare follow-up.
                    </p>
                </div>

                {/* Official Signatures & Seal Strip (3-Column) */}
                <div className="border border-gray-900 p-2.5 print:p-1.5 mb-1.5 print:mb-0.5 bg-white">
                    <div className="text-[10px] print:text-[8px] font-bold uppercase tracking-wider text-gray-700 border-b border-gray-200 pb-0.5 mb-2.5 print:mb-1 text-center">
                        Official Endorsements, Seal &amp; Authority Attestation
                    </div>

                    <div className="grid grid-cols-3 gap-3 print:gap-2 text-center text-[10px] print:text-[8px]">
                        {/* Municipal Agriculture Officer (MAO) */}
                        <div className="space-y-0.5 flex flex-col justify-end">
                            <div className="h-8 print:h-5 border-b border-gray-900 flex items-end justify-center pb-0.5">
                                {/* Line for signature */}
                            </div>
                            <span className="font-bold uppercase text-gray-900 block text-[10px] print:text-[8px] pt-0.5">
                                {application.mao_officer?.name || 'Municipal Agriculture Officer'}
                            </span>
                            <span className="text-gray-500 text-[9px] print:text-[7px] block">
                                Municipal Agriculture Office (MAO)
                            </span>
                            <span className="text-gray-400 text-[8px] print:text-[6.5px] block">
                                Virac, Catanduanes &bull; {adoptionDate}
                            </span>
                        </div>

                        {/* Shelter Officer / Supervisor */}
                        <div className="space-y-0.5 flex flex-col justify-end">
                            <div className="h-8 print:h-5 border-b border-gray-900 flex items-end justify-center pb-0.5">
                                {/* Line for physical signature */}
                            </div>
                            <span className="font-bold uppercase text-gray-900 block text-[10px] print:text-[8px] pt-0.5">
                                {application.staff?.name || 'Shelter Officer-in-Charge'}
                            </span>
                            <span className="text-gray-500 text-[9px] print:text-[7px] block">
                                Releasing Facility Head / Veterinarian
                            </span>
                            <span className="text-gray-400 text-[8px] print:text-[6.5px] block">
                                {application.pet.shelter.name}
                            </span>
                        </div>

                        {/* Registered Adopter */}
                        <div className="space-y-0.5 flex flex-col justify-end">
                            <div className="h-8 print:h-5 border-b border-gray-900 flex items-end justify-center pb-0.5">
                                {/* Line for Adopter physical or digital signature */}
                            </div>
                            <span className="font-bold uppercase text-gray-900 block text-[10px] print:text-[8px] pt-0.5">
                                {adopterName}
                            </span>
                            <span className="text-gray-500 text-[9px] print:text-[7px] block">
                                Registered Legal Custodian
                            </span>
                            <span className="text-gray-400 text-[8px] print:text-[6.5px] block">
                                Conferred: {adoptionDate}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Security Verification & Audit Footer */}
                <div className="flex items-center justify-between text-[9px] print:text-[7px] text-gray-500 border-t border-gray-200 pt-1.5 print:pt-0.5">
                    <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 print:h-3 print:w-3 text-emerald-700" />
                        <span>
                            Official Municipal Document &bull; Certificate Registry #{certNumber} &bull; Page 1 of 1
                        </span>
                    </div>
                    <div className="font-mono text-[8px] print:text-[6.5px] text-gray-400">
                        AUTH-CERT: {application.id}-{certNumber.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}
                    </div>
                </div>
            </div>
        </div>
    );
}
