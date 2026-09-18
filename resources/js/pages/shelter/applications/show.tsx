import { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Check, ShieldAlert, Award, FileText, UserCheck, Home, Phone, Mail, MapPin, Zap, Building, Tag, Cpu, Calendar, Users, ArrowRight, CheckCircle2, XCircle, ExternalLink, Eye } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { DssScoreCard } from '@/components/dss-score-card';
import { ApplicationTimelineCard, TimelineEvent } from '@/components/application-timeline-card';
import { IdDocumentInspectorModal } from '@/components/id-document-inspector-modal';
import { IdentityVerificationReport } from '@/components/identity-verification-report';
import { IdentityVerificationBadge } from '@/components/identity-verification-badge';

interface CompetingApp {
    id: number;
    reference_number: string;
    dss_score: string;
    fast_track_eligible?: boolean;
    status: string;
    submitted_at: string;
    adopter: {
        name: string;
        email: string;
        adopterProfile?: {
            home_address: string;
        };
        lifestyleProfile?: {
            residence_type?: string;
            pet_experience?: string;
        };
    };
}

interface Application {
    id: number;
    reference_number: string;
    dss_score: string;
    fast_track_eligible?: boolean;
    dss_breakdown?: any;
    status: string;
    staff_decision?: string;
    staff_notes?: string;
    target_sla_at?: string;
    certificate_number?: string;
    submitted_at: string;
    user_id: number;
    pet_id: number;
    adopter: {
        id: number;
        name: string;
        email: string;
        adopter_profile?: {
            id?: number;
            user_id?: number;
            full_name: string;
            contact_number: string;
            date_of_birth: string;
            home_address: string;
            valid_id_type: string;
            valid_id_number: string;
            is_identity_verified?: boolean;
            face_match_score?: number | null;
            liveness_verified?: boolean;
            identity_verified_at?: string | null;
            id_document_path?: string | null;
            id_document_name?: string | null;
            id_document_back_path?: string | null;
            id_document_back_name?: string | null;
            had_pets_before: string;
            previous_pet_notes?: string;
            surrendered_pet: boolean;
            adoption_reason: string;
            adoption_reason_text?: string;
            pet_stay: string;
        };
        latest_didit_verification?: any;
        lifestyle_profile?: {
            housing_type: string;
            has_aircon: string;
            outdoor_access: string;
            activity_level: string;
            work_schedule: string;
            household_size: number;
            household_agrees: boolean;
            has_children: string;
            other_pets: string;
            occupation?: string;
            monthly_income?: string;
            pet_experience: string;
            health_conditions?: string[];
        };
    };
    pet: {
        id: number;
        name: string;
        species: string;
        breed?: string;
        tag_number?: string | null;
        microchip_number?: string | null;
        housing_area?: string | null;
        housing_notes?: string | null;
        intake_date?: string | null;
        age_years: number;
        gender: string;
        size: string;
        energy_level: string;
        requires_yard?: boolean;
        requires_experience?: boolean;
        requires_no_children?: boolean;
        requires_no_other_pets?: boolean;
        shelter: { name: string };
    };
    timelines?: TimelineEvent[];
}

interface AdopterTrackRecord {
    total_applications: number;
    prior_adopted_count: number;
    prior_adopted_pets?: Array<{ id: number; reference_number: string; certificate_number?: string; pet: { name: string; species: string } }>;
    prior_rejected_count: number;
    surrendered_pet: boolean;
    had_pets_before: string;
    previous_pet_notes?: string | null;
    pet_stay: string;
}

export default function ShelterApplicationShow({
    application,
    dssMatch,
    competingApplications = [],
    adopterTrackRecord,
}: {
    application: Application;
    dssMatch?: any;
    competingApplications?: CompetingApp[];
    adopterTrackRecord?: AdopterTrackRecord;
}) {
    const { data, setData, patch, processing, errors } = useForm({
        decision: 'suitable',
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('shelter.applications.update', application.id));
    };

    const isProcessed = application.status !== 'pending' && application.status !== 'under_review';
    const profile = application.adopter.adopter_profile;
    const lifestyle = application.adopter.lifestyle_profile;

    const [activeIdModal, setActiveIdModal] = useState<{ open: boolean; side: 'front' | 'back' }>({
        open: false,
        side: 'front',
    });

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Review Applications', href: route('shelter.applications.index') },
                { title: application.reference_number, href: '#' },
            ]}
        >
            <Head title={`Review: ${application.reference_number}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 max-w-7xl mx-auto w-full">
                
                {/* Header Banner */}
                <div className="flex justify-between items-center flex-wrap gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-gray-900">Shelter Application Review</h2>
                            {application.fast_track_eligible && (
                                <Badge className="bg-emerald-600 text-white font-bold text-xs gap-1">
                                    <Zap className="h-3.5 w-3.5" /> Fast-Track Candidate
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">
                            Ref: <strong className="text-gray-700">{application.reference_number}</strong> &bull; {application.adopter.name} applying for <strong>{application.pet.name}</strong>
                        </p>
                    </div>
                    <span className={`text-xs px-3.5 py-1 rounded-full uppercase font-bold tracking-wider ${
                        application.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : application.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                    }`}>
                        {application.status.replace(/_/g, ' ')}
                    </span>
                </div>

                {/* ── 8-Factor DSS Score Card ────────────────────────────────────── */}
                <DssScoreCard dss={dssMatch || { total_score: Number(application.dss_score) }} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Applicant & Lifestyle Details */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Side-by-Side Match Matrix */}
                        <Card className="border-gray-200 shadow-xs">
                            <CardHeader className="bg-gray-50/60 border-b border-gray-100 p-4">
                                <CardTitle className="text-sm font-bold text-gray-800">
                                    Adopter Profile vs. Pet Requirements Matrix
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5">
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div className="p-3 bg-amber-50/40 border border-amber-100 rounded-xl space-y-2">
                                        <span className="font-bold text-amber-900 block uppercase">Adopter Profile</span>
                                        <div className="space-y-1 text-gray-600">
                                            <p><strong>Housing:</strong> {lifestyle?.housing_type?.replace(/_/g, ' ') || 'N/A'}</p>
                                            <p><strong>Outdoor:</strong> {lifestyle?.outdoor_access?.replace(/_/g, ' ') || 'N/A'}</p>
                                            <p><strong>Activity Level:</strong> {lifestyle?.activity_level?.replace(/_/g, ' ') || 'N/A'}</p>
                                            <p><strong>Experience:</strong> {lifestyle?.pet_experience?.replace(/_/g, ' ') || 'N/A'}</p>
                                            <p><strong>Other Animals:</strong> {lifestyle?.other_pets || 'None'}</p>
                                            <p><strong>Children:</strong> {lifestyle?.has_children || 'None'}</p>
                                            <p><strong>Household Consent:</strong> {lifestyle?.household_agrees ? 'Yes' : 'No'}</p>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-gray-800 block uppercase">Pet Profile ({application.pet.name})</span>
                                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-[#B8860B] border border-amber-200">
                                                <Tag className="h-3 w-3" />
                                                {application.pet.tag_number || 'No Tag'}
                                            </span>
                                        </div>
                                        <div className="space-y-1 text-gray-600">
                                            <p className="font-semibold text-gray-900 flex items-center gap-1">
                                                <MapPin className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                                                <span><strong>Housing Area:</strong> {application.pet.housing_area || 'Unassigned'}</span>
                                            </p>
                                            {application.pet.microchip_number && (
                                                <p><strong>Microchip ID:</strong> <span className="font-mono">{application.pet.microchip_number}</span></p>
                                            )}
                                            {application.pet.housing_notes && (
                                                <p className="text-[11px] italic text-gray-500">"{application.pet.housing_notes}"</p>
                                            )}
                                            <p><strong>Size:</strong> {application.pet.size}</p>
                                            <p><strong>Energy Level:</strong> {application.pet.energy_level}</p>
                                            <p><strong>Yard Required:</strong> {application.pet.requires_yard ? 'Strictly Required' : 'No'}</p>
                                            <p><strong>Handler Experience:</strong> {application.pet.requires_experience ? 'Experience Needed' : 'Beginner OK'}</p>
                                            <p><strong>Other Pets OK:</strong> {application.pet.requires_no_other_pets ? 'No (Must be only pet)' : 'Yes'}</p>
                                            <p><strong>Children OK:</strong> {application.pet.requires_no_children ? 'No (Adults only)' : 'Yes'}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Automated Identity & Biometric Verification Report */}
                        <IdentityVerificationReport
                            verification={application.adopter?.latest_didit_verification}
                            adopterProfile={profile}
                        />

                        {/* Applicant Personal Info details */}
                        {profile && (
                            <Card className="border-gray-200 shadow-xs">
                                <CardHeader className="p-4 border-b border-gray-100 flex flex-row items-center justify-between">
                                    <CardTitle className="text-sm font-bold text-gray-800">
                                        Applicant Verified Information
                                    </CardTitle>
                                    <IdentityVerificationBadge
                                        isVerified={profile.is_identity_verified}
                                        faceMatchScore={profile.face_match_score}
                                        livenessVerified={profile.liveness_verified}
                                        showDetails
                                    />
                                </CardHeader>
                                <CardContent className="p-5 space-y-4 text-xs text-gray-600">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-0.5">
                                            <span className="text-gray-400 block">Full Name:</span>
                                            <span className="font-bold text-gray-900 text-sm">{profile.full_name}</span>
                                        </div>
                                        <div className="space-y-0.5">
                                            <span className="text-gray-400 block">Contact Number:</span>
                                            <span className="font-bold text-gray-900 text-sm">{profile.contact_number}</span>
                                        </div>
                                        <div className="space-y-0.5">
                                            <span className="text-gray-400 block">Email Address:</span>
                                            <span className="font-bold text-gray-900 text-sm">{application.adopter.email}</span>
                                        </div>
                                        <div className="space-y-0.5">
                                            <span className="text-gray-400 block">Complete Address:</span>
                                            <span className="font-bold text-gray-900 text-sm">{profile.home_address}</span>
                                        </div>
                                         <div className="space-y-0.5">
                                             <span className="text-gray-400 block">Government ID ({profile.valid_id_type}):</span>
                                             <div className="flex items-center gap-2 flex-wrap">
                                                 <span className="font-mono font-bold text-gray-900">{profile.valid_id_number}</span>
                                                 {profile.id_document_path && (
                                                     <button
                                                         type="button"
                                                         onClick={() => setActiveIdModal({ open: true, side: 'front' })}
                                                         className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8B6508] bg-[#F5EDD7] hover:bg-[#D4A017]/30 px-2.5 py-1 rounded-full border border-[#D4A017]/30 transition cursor-pointer shadow-2xs"
                                                     >
                                                         <Eye className="size-3 text-[#D4A017]" />
                                                         Inspect Front ID
                                                     </button>
                                                 )}
                                                 {profile.id_document_back_path && (
                                                     <button
                                                         type="button"
                                                         onClick={() => setActiveIdModal({ open: true, side: 'back' })}
                                                         className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8B6508] bg-[#F5EDD7] hover:bg-[#D4A017]/30 px-2.5 py-1 rounded-full border border-[#D4A017]/30 transition cursor-pointer shadow-2xs"
                                                     >
                                                         <Eye className="size-3 text-[#D4A017]" />
                                                         Inspect Back ID
                                                     </button>
                                                 )}
                                             </div>
                                         </div>
                                        <div className="space-y-0.5">
                                            <span className="text-gray-400 block">Adoption Reason:</span>
                                            <span className="font-bold text-gray-900">{profile.adoption_reason}</span>
                                        </div>
                                    </div>

                                    {profile.adoption_reason_text && (
                                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                                            <span className="font-bold text-gray-700 block">Applicant's Statement:</span>
                                            <p className="italic text-gray-600">"{profile.adoption_reason_text}"</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Adopter Municipal Track Record & Animal Background */}
                        {adopterTrackRecord && (
                            <Card className="border-gray-200 shadow-xs">
                                <CardHeader className="p-4 border-b border-gray-100 flex flex-row items-center justify-between">
                                    <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                        <Award className="h-4 w-4 text-[#D4A017]" />
                                        Municipal Adoption History &amp; Welfare Record
                                    </CardTitle>
                                    <Badge variant="outline" className="text-[10px] bg-gray-50 font-bold">
                                        RA 8485 Audit Track
                                    </Badge>
                                </CardHeader>
                                <CardContent className="p-5 space-y-4 text-xs text-gray-600">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                        <div className="p-2.5 bg-green-50 rounded-xl border border-green-200/60">
                                            <span className="text-[10px] text-green-700 font-bold block uppercase">Prior Adoptions</span>
                                            <span className="text-lg font-black text-green-800">{adopterTrackRecord.prior_adopted_count}</span>
                                        </div>
                                        <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200/60">
                                            <span className="text-[10px] text-blue-700 font-bold block uppercase">Total Requests</span>
                                            <span className="text-lg font-black text-blue-800">{adopterTrackRecord.total_applications}</span>
                                        </div>
                                        <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                                            <span className="text-[10px] text-gray-600 font-bold block uppercase">Prior Pets Kept</span>
                                            <span className="text-xs font-bold text-gray-800 block capitalize mt-1">
                                                {adopterTrackRecord.had_pets_before?.replace(/_/g, ' ') || 'None'}
                                            </span>
                                        </div>
                                        <div className={`p-2.5 rounded-xl border ${adopterTrackRecord.surrendered_pet ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                                            <span className="text-[10px] font-bold block uppercase">Surrender Record</span>
                                            <span className="text-xs font-bold block mt-1">
                                                {adopterTrackRecord.surrendered_pet ? 'Has Surrender Flag' : 'Clean (0 Surrenders)'}
                                            </span>
                                        </div>
                                    </div>

                                    {adopterTrackRecord.previous_pet_notes && (
                                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                                            <span className="font-bold text-gray-700 block mb-0.5">Declared Prior Animals Experience:</span>
                                            <p className="italic text-gray-600">"{adopterTrackRecord.previous_pet_notes}"</p>
                                        </div>
                                    )}

                                    {adopterTrackRecord.prior_adopted_pets && adopterTrackRecord.prior_adopted_pets.length > 0 && (
                                        <div className="pt-2 border-t border-gray-100 space-y-2">
                                            <span className="text-[11px] font-bold text-gray-700 block uppercase">Previously Adopted From System:</span>
                                            <div className="space-y-1.5">
                                                {adopterTrackRecord.prior_adopted_pets.map((p) => (
                                                    <div key={p.id} className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-lg text-xs">
                                                        <span className="font-bold text-gray-800">{p.pet.name} ({p.pet.species})</span>
                                                        <span className="font-mono text-gray-500 text-[10px]">{p.certificate_number || `#${p.reference_number}`}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Audit Trail Timeline */}
                        <ApplicationTimelineCard
                            timelines={application.timelines || []}
                            status={application.status}
                            slaTarget={application.target_sla_at}
                            certificateNumber={application.certificate_number}
                        />
                    </div>

                    {/* Right Column: Decision Action Form & Competing Applicants */}
                    <div className="space-y-6">

                        {/* Competing Applicants Alert Card */}
                        {competingApplications.length > 0 && (
                            <Card className="border-amber-300 bg-amber-50/40 shadow-xs">
                                <CardHeader className="p-4 pb-2 border-b border-amber-200/60">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
                                            <Users className="h-4 w-4 text-[#D4A017]" />
                                            Competing Applicants ({competingApplications.length})
                                        </CardTitle>
                                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">
                                            Multiple Requests
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-[11px] text-amber-700 pt-0.5">
                                        Other active adopters who applied for {application.pet.name}, ranked by DSS score.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-3 space-y-2">
                                    {competingApplications.map((comp) => (
                                        <div key={comp.id} className="p-2.5 bg-white rounded-lg border border-amber-200/70 text-xs space-y-1 hover:border-[#D4A017] transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="font-bold text-gray-900 block">{comp.adopter.name}</span>
                                                    <span className="text-[10px] text-gray-500 font-mono">#{comp.reference_number}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="inline-flex items-center font-bold text-xs text-[#B8860B] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                                        {Math.round(parseFloat(comp.dss_score))}% Match
                                                    </span>
                                                    {comp.fast_track_eligible && (
                                                        <span className="block text-[9px] font-bold text-emerald-600">Fast-Track</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center pt-1 border-t border-gray-50 text-[10px] text-gray-500">
                                                <span>Status: <strong className="capitalize text-gray-700">{comp.status.replace(/_/g, ' ')}</strong></span>
                                                <Link href={route('shelter.applications.show', comp.id)} className="text-[#B8860B] font-semibold flex items-center gap-0.5 hover:underline">
                                                    View Dossier <ArrowRight className="h-3 w-3" />
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        <Card className="border-[#D4A017]/30 shadow-md sticky top-6">
                            <CardHeader className="bg-[#F5EDD7]/50 border-b border-[#D4A017]/20 p-5">
                                <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    <Building className="h-4.5 w-4.5 text-[#D4A017]" />
                                    Shelter Screening Decision
                                </CardTitle>
                                <CardDescription className="text-xs text-gray-600">
                                    Initial screening prior to Municipal Agriculture Office (MAO) compliance audit
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-5">
                                {isProcessed ? (
                                    <div className="space-y-4 text-xs">
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
                                            <span className="text-gray-500 font-bold uppercase block">Recorded Decision:</span>
                                            <span className="text-sm font-black capitalize text-gray-900">
                                                {application.staff_decision?.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        {application.staff_notes && (
                                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
                                                <span className="text-gray-500 font-bold uppercase block">Staff Notes:</span>
                                                <p className="text-gray-700 italic">"{application.staff_notes}"</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold text-gray-700">Screening Outcome *</Label>
                                            
                                            <div className="space-y-2">
                                                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-green-200 bg-green-50/30 hover:bg-green-50/70 cursor-pointer transition">
                                                    <input 
                                                        type="radio" 
                                                        name="decision" 
                                                        value="suitable" 
                                                        checked={data.decision === 'suitable'}
                                                        onChange={e => setData('decision', e.target.value)}
                                                        className="text-[#D4A017] mt-0.5"
                                                    />
                                                    <div className="text-xs space-y-0.5">
                                                        <span className="font-bold text-green-900 flex items-center gap-1.5"><CheckCircle2 className="size-4" /> Endorse as Suitable</span>
                                                        <span className="text-green-700 block">Passes initial check. Automatically forwards to MAO compliance queue.</span>
                                                    </div>
                                                </label>
                                                
                                                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-red-200 bg-red-50/30 hover:bg-red-50/70 cursor-pointer transition">
                                                    <input 
                                                        type="radio" 
                                                        name="decision" 
                                                        value="not_suitable" 
                                                        checked={data.decision === 'not_suitable'}
                                                        onChange={e => setData('decision', e.target.value)}
                                                        className="text-[#D4A017] mt-0.5"
                                                    />
                                                    <div className="text-xs space-y-0.5">
                                                        <span className="font-bold text-red-900 flex items-center gap-1.5"><XCircle className="size-4" /> Mark as Not Suitable</span>
                                                        <span className="text-red-700 block">Disapproves application and releases pet back to catalog.</span>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="notes" className="text-xs font-bold text-gray-700">
                                                Staff Screening Remarks / Notes
                                            </Label>
                                            <Textarea 
                                                id="notes" 
                                                value={data.notes} 
                                                onChange={e => setData('notes', e.target.value)}
                                                className="w-full min-h-[110px] text-xs"
                                                placeholder="Add assessment notes for the Municipal Agriculture Office or constructive rejection feedback..."
                                            />
                                        </div>

                                        <Button 
                                            type="submit" 
                                            disabled={processing}
                                            className="w-full bg-[#D4A017] hover:bg-[#B8860B] text-white font-bold py-2.5 rounded-xl transition shadow-xs"
                                        >
                                            {processing ? 'Processing...' : 'Submit & Execute Workflow Handoff'}
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

            </div>

            {/* ID Document Inspector Modal */}
            {profile && (
                <IdDocumentInspectorModal
                    open={activeIdModal.open}
                    onOpenChange={(open) => setActiveIdModal(prev => ({ ...prev, open }))}
                    title="Applicant Government ID"
                    applicantName={profile.full_name || application.adopter.name}
                    idType={profile.valid_id_type || 'ID Document'}
                    idNumber={profile.valid_id_number || ''}
                    side={activeIdModal.side}
                    documentUrl={
                        activeIdModal.side === 'front'
                            ? (profile.id_document_path ? route('adopter.id-document.show', { profile: profile.id || profile.user_id || application.adopter.id, side: 'front' }) : null)
                            : (profile.id_document_back_path ? route('adopter.id-document.show', { profile: profile.id || profile.user_id || application.adopter.id, side: 'back' }) : null)
                    }
                />
            )}
        </AppLayout>
    );
}
