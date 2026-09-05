import { Head, useForm, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, ShieldCheck, Check, X, FileText, User, Zap, Building, Clock, FileCheck, Tag, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { DssScoreCard } from '@/components/dss-score-card';
import { ApplicationTimelineCard, TimelineEvent } from '@/components/application-timeline-card';

interface ChecklistItem {
    label: string;
    description: string;
}

interface Application {
    id: number;
    reference_number: string;
    dss_score: string;
    fast_track_eligible?: boolean;
    dss_breakdown?: any;
    status: string;
    staff_decision: string | null;
    staff_notes: string | null;
    reviewed_at: string | null;
    target_sla_at: string | null;
    pickup_deadline_at: string | null;
    certificate_number: string | null;
    mao_decision: string | null;
    mao_remarks: string | null;
    mao_checklist: Record<string, boolean> | null;
    submitted_at: string;
    resolved_at: string | null;
    adopter: {
        name: string;
        email: string;
        adopter_profile?: {
            full_name: string;
            contact_number: string;
            date_of_birth: string;
            home_address: string;
            valid_id_type: string;
            valid_id_number: string;
            had_pets_before: string;
            previous_pet_notes: string;
            adoption_reason: string;
            adoption_reason_text?: string;
        };
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
            monthly_income: string;
            pet_experience: string;
        };
    };
    pet: {
        id: number;
        name: string;
        species: string;
        breed: string;
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
        shelter: { name: string; location: string };
    };
    staff?: { name: string };
    mao_officer?: { name: string };
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

interface Props {
    application: Application;
    dssMatch?: any;
    defaultChecklist: Record<string, ChecklistItem>;
    adopterTrackRecord?: AdopterTrackRecord;
}

const STATUS_COLOR: Record<string, string> = {
    mao_audit: 'bg-purple-100 text-purple-700',
    approved:  'bg-green-100 text-green-700',
    rejected:  'bg-red-100 text-red-700',
};

export default function MaoApplicationShow({ application, dssMatch, defaultChecklist, adopterTrackRecord }: Props) {
    const isResolved = application.status === 'approved' || application.status === 'rejected';
    const profile    = application.adopter.adopter_profile;
    const lifestyle  = application.adopter.lifestyle_profile;

    // Build initial checklist state — if fast-track eligible and not yet resolved, pre-check items
    const initialChecklist = Object.fromEntries(
        Object.keys(defaultChecklist).map(key => [
            key,
            application.mao_checklist
                ? Boolean(application.mao_checklist[key])
                : (application.fast_track_eligible ? true : false),
        ])
    );

    const { data, setData, patch, processing } = useForm<{
        decision: string;
        remarks: string;
        checklist: Record<string, boolean>;
    }>({
        decision: application.mao_decision ?? 'approved',
        remarks: application.mao_remarks ?? '',
        checklist: initialChecklist,
    });

    const toggleChecklist = (key: string) => {
        setData('checklist', { ...data.checklist, [key]: !data.checklist[key] });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('mao.applications.update', application.id));
    };

    const allChecked = Object.values(data.checklist).every(Boolean);

    return (
        <AppLayout breadcrumbs={[
            { title: 'Compliance Audits', href: route('mao.applications.index') },
            { title: application.reference_number, href: '#' },
        ]}>
            <Head title={`MAO Audit: ${application.reference_number}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 max-w-7xl mx-auto w-full">

                {/* Header Banner */}
                <div className="flex justify-between items-center flex-wrap gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <ShieldCheck className="h-7 w-7 text-purple-600" />
                                MAO Statutory Compliance Audit
                            </h2>
                            {application.fast_track_eligible && (
                                <Badge className="bg-emerald-600 text-white font-bold text-xs gap-1">
                                    <Zap className="h-3.5 w-3.5" /> Fast-Track Qualified
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">
                            Municipal Agriculture Office (Virac, Catanduanes) &bull; Mandated under RA 8485 &amp; RA 9482 &bull; Ref: <strong className="text-gray-700">{application.reference_number}</strong>
                        </p>
                    </div>
                    <span className={`text-xs px-3.5 py-1 rounded-full uppercase font-bold tracking-wider ${STATUS_COLOR[application.status] ?? 'bg-amber-100 text-amber-700'}`}>
                        {application.status.replace(/_/g, ' ')}
                    </span>
                </div>

                {/* ── 8-Factor DSS Score Card ────────────────────────────────────── */}
                <DssScoreCard dss={dssMatch || { total_score: Number(application.dss_score) }} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Applicant & Lifestyle Details & Timeline */}
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
                                    <div className="p-3 bg-purple-50/40 border border-purple-100 rounded-xl space-y-2">
                                        <span className="font-bold text-purple-900 block uppercase">Adopter Profile</span>
                                        <div className="space-y-1 text-gray-600">
                                            <p><strong>Housing:</strong> {lifestyle?.housing_type?.replace(/_/g, ' ') || 'N/A'}</p>
                                            <p><strong>Outdoor Access:</strong> {lifestyle?.outdoor_access?.replace(/_/g, ' ') || 'N/A'}</p>
                                            <p><strong>Activity Level:</strong> {lifestyle?.activity_level?.replace(/_/g, ' ') || 'N/A'}</p>
                                            <p><strong>Income:</strong> {lifestyle?.monthly_income?.replace(/_/g, ' ') || 'N/A'}</p>
                                            <p><strong>Experience:</strong> {lifestyle?.pet_experience?.replace(/_/g, ' ') || 'N/A'}</p>
                                            <p><strong>Other Animals:</strong> {lifestyle?.other_pets || 'None'}</p>
                                            <p><strong>Children:</strong> {lifestyle?.has_children || 'None'}</p>
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
                                                <span><strong>Shelter Location:</strong> {application.pet.housing_area || 'Unassigned'}</span>
                                            </p>
                                            {application.pet.microchip_number && (
                                                <p><strong>Microchip ID:</strong> <span className="font-mono">{application.pet.microchip_number}</span></p>
                                            )}
                                            {application.pet.housing_notes && (
                                                <p className="text-[11px] italic text-gray-500">"{application.pet.housing_notes}"</p>
                                            )}
                                            <p><strong>Species / Breed:</strong> {application.pet.species} ({application.pet.breed})</p>
                                            <p><strong>Size / Energy:</strong> {application.pet.size} &bull; {application.pet.energy_level}</p>
                                            <p><strong>Yard Required:</strong> {application.pet.requires_yard ? 'Strictly Required' : 'No'}</p>
                                            <p><strong>Experienced Handler:</strong> {application.pet.requires_experience ? 'Required' : 'Beginner OK'}</p>
                                            <p><strong>Children Safe:</strong> {application.pet.requires_no_children ? 'Adults Only' : 'Yes'}</p>
                                            <p><strong>Single Pet Home:</strong> {application.pet.requires_no_other_pets ? 'Must be single pet' : 'Compatible'}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Adopter Profile Details */}
                        {profile && (
                            <Card className="border-gray-200 shadow-xs">
                                <CardHeader className="p-4 border-b border-gray-100">
                                    <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                                        <User className="h-4 w-4 text-gray-500" />
                                        Verified Adopter Identity (RA 9482 Anti-Rabies Act Record)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-5 space-y-4 text-xs text-gray-600">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-gray-400 block">Full Name:</span>
                                            <span className="font-bold text-gray-900 text-sm">{profile.full_name}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block">Contact Number:</span>
                                            <span className="font-bold text-gray-900 text-sm">{profile.contact_number}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block">Email Address:</span>
                                            <span className="font-bold text-gray-900 text-sm">{application.adopter.email}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block">Date of Birth:</span>
                                            <span className="font-bold text-gray-900 text-sm">{new Date(profile.date_of_birth).toLocaleDateString()}</span>
                                        </div>
                                        <div className="md:col-span-2">
                                            <span className="text-gray-400 block">Municipal Residence Address:</span>
                                            <span className="font-bold text-gray-900 text-sm">{profile.home_address}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block">Government Identification:</span>
                                            <span className="font-mono font-bold text-gray-900">{profile.valid_id_type} — {profile.valid_id_number}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block">Adoption Purpose:</span>
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
                                        <ShieldCheck className="h-4 w-4 text-purple-600" />
                                        Municipal Compliance History &amp; Welfare Record
                                    </CardTitle>
                                    <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-800 border-purple-200 font-bold">
                                        RA 8485 Audit
                                    </Badge>
                                </CardHeader>
                                <CardContent className="p-5 space-y-4 text-xs text-gray-600">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                        <div className="p-2.5 bg-green-50 rounded-xl border border-green-200/60">
                                            <span className="text-[10px] text-green-700 font-bold block uppercase">Prior Adoptions</span>
                                            <span className="text-lg font-black text-green-800">{adopterTrackRecord.prior_adopted_count}</span>
                                        </div>
                                        <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-200/60">
                                            <span className="text-[10px] text-purple-700 font-bold block uppercase">Total Applications</span>
                                            <span className="text-lg font-black text-purple-800">{adopterTrackRecord.total_applications}</span>
                                        </div>
                                        <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                                            <span className="text-[10px] text-gray-600 font-bold block uppercase">Prior Pets Kept</span>
                                            <span className="text-xs font-bold text-gray-800 block capitalize mt-1">
                                                {adopterTrackRecord.had_pets_before?.replace(/_/g, ' ') || 'None'}
                                            </span>
                                        </div>
                                        <div className={`p-2.5 rounded-xl border ${adopterTrackRecord.surrendered_pet ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                                            <span className="text-[10px] font-bold block uppercase">Surrender Flag</span>
                                            <span className="text-xs font-bold block mt-1">
                                                {adopterTrackRecord.surrendered_pet ? 'Disclosed Surrender' : 'Clean (0 Surrenders)'}
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
                                            <span className="text-[11px] font-bold text-gray-700 block uppercase">Previously Adopted Municipal Animals:</span>
                                            <div className="space-y-1.5">
                                                {adopterTrackRecord.prior_adopted_pets.map((p) => (
                                                    <div key={p.id} className="flex justify-between items-center bg-purple-50/40 border border-purple-100 px-3 py-1.5 rounded-lg text-xs">
                                                        <span className="font-bold text-gray-800">{p.pet.name} ({p.pet.species})</span>
                                                        <span className="font-mono text-purple-700 text-[10px]">{p.certificate_number || `#${p.reference_number}`}</span>
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

                    {/* Right Column: Statutory Checklist & Decision Form */}
                    <div className="space-y-6">

                        {/* Target Pet Summary */}
                        <Card className="border-gray-200 shadow-xs">
                            <CardHeader className="bg-gray-50/50 p-4 border-b border-gray-100">
                                <CardTitle className="text-xs font-bold text-gray-700 uppercase tracking-wider">Candidate Pet Record</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 text-xs space-y-2">
                                <div><span className="text-gray-400">Name:</span> <span className="font-bold text-gray-900">{application.pet.name}</span></div>
                                <div><span className="text-gray-400">Species:</span> <span className="font-semibold capitalize">{application.pet.species}</span></div>
                                <div><span className="text-gray-400">Breed:</span> <span className="font-semibold capitalize">{application.pet.breed}</span></div>
                                <div><span className="text-gray-400">Age / Gender:</span> <span className="font-semibold">{application.pet.age_years} yr(s) &bull; {application.pet.gender}</span></div>
                                <div><span className="text-gray-400">Shelter Facility:</span> <span className="font-semibold">{application.pet.shelter.name} ({application.pet.shelter.location})</span></div>
                            </CardContent>
                        </Card>

                        {/* Compliance Checklist + Decision Form */}
                        <Card className="border-purple-200/80 shadow-md sticky top-6">
                            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50/40 border-b border-purple-100 p-5">
                                <CardTitle className="text-sm font-bold text-purple-900 flex items-center gap-1.5">
                                    <FileText className="h-4 w-4 text-purple-600" />
                                    {isResolved ? 'Executed Compliance Audit' : 'MAO Statutory Verification'}
                                </CardTitle>
                                <CardDescription className="text-[11px] text-purple-700">
                                    Formal audit verification under Municipal Animal Welfare Regulations
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="p-5">
                                {isResolved ? (
                                    /* Read-only view once resolved */
                                    <div className="space-y-4 text-xs">
                                        <div className="space-y-2">
                                            {Object.entries(defaultChecklist).map(([key, item]) => {
                                                const passed = application.mao_checklist ? Boolean(application.mao_checklist[key]) : false;
                                                return (
                                                    <div key={key} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
                                                        {passed
                                                            ? <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                                            : <X className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                                        }
                                                        <div>
                                                            <div className={`font-bold ${passed ? 'text-green-800' : 'text-red-600'}`}>{item.label}</div>
                                                            <div className="text-gray-400 text-[10px]">{item.description}</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="pt-3 border-t border-gray-200 space-y-2">
                                            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                                                <span className="font-bold text-gray-500 block uppercase text-[10px]">Audit Resolution:</span>
                                                <span className={`font-black uppercase text-base ${application.mao_decision === 'approved' ? 'text-green-700' : 'text-red-600'}`}>
                                                    {application.mao_decision}
                                                </span>
                                            </div>
                                            {application.certificate_number && (
                                                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-mono font-bold text-xs flex items-center gap-1.5">
                                                    <FileCheck className="h-4 w-4 text-emerald-600" />
                                                    Certificate: {application.certificate_number}
                                                </div>
                                            )}
                                            {application.mao_remarks && (
                                                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                    <span className="font-bold text-gray-500 block uppercase text-[10px]">Officer Remarks:</span>
                                                    <p className="italic text-gray-700 text-xs mt-0.5">"{application.mao_remarks}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    /* Active decision form */
                                    <form onSubmit={handleSubmit} className="space-y-5">

                                        {/* Checklist */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                                Statutory Compliance Checklist *
                                            </Label>
                                            <div className="space-y-2.5">
                                                {Object.entries(defaultChecklist).map(([key, item]) => (
                                                    <label key={key} className="flex items-start gap-2.5 p-2 rounded-lg border border-gray-200 bg-white hover:bg-purple-50/30 cursor-pointer transition">
                                                        <div
                                                            className={`w-4 h-4 mt-0.5 shrink-0 rounded border-2 flex items-center justify-center transition-all ${
                                                                data.checklist[key] ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
                                                            }`}
                                                            onClick={() => toggleChecklist(key)}
                                                        >
                                                            {data.checklist[key] && <Check className="h-3 w-3 text-white" />}
                                                        </div>
                                                        <div className="text-xs" onClick={() => toggleChecklist(key)}>
                                                            <div className="font-bold text-gray-800">{item.label}</div>
                                                            <div className="text-gray-400 text-[10px]">{item.description}</div>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                            {!allChecked && (
                                                <p className="text-[10px] text-amber-700 font-semibold bg-amber-50 p-2 rounded-lg border border-amber-200">
                                                    Notice: All compliance items must be verified before executing approval.
                                                </p>
                                            )}
                                        </div>

                                        {/* Decision */}
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-800 uppercase tracking-wider">Final Municipal Determination *</Label>
                                            <div className="space-y-2">
                                                <label className="flex items-start gap-3 p-3 rounded-xl border border-green-200 bg-green-50/30 hover:bg-green-50/70 cursor-pointer transition">
                                                    <input
                                                        type="radio"
                                                        name="decision"
                                                        value="approved"
                                                        checked={data.decision === 'approved'}
                                                        onChange={e => setData('decision', e.target.value)}
                                                        className="text-green-600 mt-0.5"
                                                    />
                                                    <div className="text-xs">
                                                        <span className="font-bold text-green-900 block">Approve &amp; Issue Adoption Certificate</span>
                                                        <span className="text-green-700 text-[11px]">Officially approves adoption, marks pet as adopted, and generates 7-day pickup pass.</span>
                                                    </div>
                                                </label>
                                                <label className="flex items-start gap-3 p-3 rounded-xl border border-red-200 bg-red-50/30 hover:bg-red-50/70 cursor-pointer transition">
                                                    <input
                                                        type="radio"
                                                        name="decision"
                                                        value="rejected"
                                                        checked={data.decision === 'rejected'}
                                                        onChange={e => setData('decision', e.target.value)}
                                                        className="text-red-600 mt-0.5"
                                                    />
                                                    <div className="text-xs">
                                                        <span className="font-bold text-red-900 block">Disapprove Application</span>
                                                        <span className="text-red-700 text-[11px]">Fails statutory criteria. Re-releases pet to public catalog.</span>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Remarks */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="remarks" className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                                Official Audit Remarks / Certificate Notes
                                            </Label>
                                            <Textarea
                                                id="remarks"
                                                value={data.remarks}
                                                onChange={e => setData('remarks', e.target.value)}
                                                className="min-h-[90px]"
                                                placeholder="Enter audit findings, statutory notes, or reason for disapproval..."
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className={`w-full font-bold text-white py-2.5 rounded-xl transition shadow-xs flex items-center gap-2 ${
                                                data.decision === 'approved' ? 'bg-purple-700 hover:bg-purple-800' : 'bg-red-600 hover:bg-red-700'
                                            }`}
                                        >
                                            {data.decision === 'approved' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                            {processing ? 'Processing Final Audit...' : data.decision === 'approved' ? 'Execute Approval & Issue Certificate' : 'Execute Disapproval'}
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>

                        <Link href={route('mao.applications.index')} className="block">
                            <Button variant="outline" className="w-full text-xs border-gray-200">
                                &larr; Back to Compliance Audit Queue
                            </Button>
                        </Link>

                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
