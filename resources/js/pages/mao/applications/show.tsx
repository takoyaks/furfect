import { Head, useForm, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Sparkles, ShieldCheck, Check, X, FileText, User } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

interface ChecklistItem {
    label: string;
    description: string;
}

interface Application {
    id: number;
    reference_number: string;
    dss_score: string;
    status: string;
    staff_decision: string | null;
    staff_notes: string | null;
    reviewed_at: string | null;
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
        };
        lifestyle_profile?: {
            housing_type: string;
            has_aircon: string;
            outdoor_access: string;
            activity_level: string;
            work_schedule: string;
            household_size: number;
            has_children: string;
            other_pets: string;
            monthly_income: string;
            pet_experience: string;
        };
    };
    pet: {
        name: string;
        species: string;
        breed: string;
        age_years: number;
        gender: string;
        size: string;
        energy_level: string;
        shelter: { name: string };
    };
    staff?: { name: string };
}

interface Props {
    application: Application;
    defaultChecklist: Record<string, ChecklistItem>;
}

const STATUS_COLOR: Record<string, string> = {
    mao_audit: 'bg-purple-100 text-purple-700',
    approved:  'bg-green-100 text-green-700',
    rejected:  'bg-red-100 text-red-700',
};

export default function MaoApplicationShow({ application, defaultChecklist }: Props) {
    const isResolved = application.status === 'approved' || application.status === 'rejected';
    const profile    = application.adopter.adopter_profile;
    const lifestyle  = application.adopter.lifestyle_profile;

    // Build initial checklist state — use saved values if already resolved
    const initialChecklist = Object.fromEntries(
        Object.keys(defaultChecklist).map(key => [
            key,
            application.mao_checklist ? Boolean(application.mao_checklist[key]) : false,
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
            <Head title={`Audit: ${application.reference_number}`} />
            <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">

                {/* Header */}
                <div className="flex justify-between items-center flex-wrap gap-2 pb-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6 text-[#D4A017]" />
                            Compliance Audit
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {application.reference_number} • {application.adopter.name} → {application.pet.name}
                        </p>
                    </div>
                    <span className={`text-[10px] px-3 py-1 rounded-full uppercase font-bold ${STATUS_COLOR[application.status] ?? 'bg-amber-100 text-amber-700'}`}>
                        {application.status.replace(/_/g, ' ')}
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left column — applicant details & timeline */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* DSS Score */}
                        <Card className="border-[#D4A017]/20 shadow-md">
                            <CardHeader className="bg-[#F5EDD7]/30 border-b border-[#D4A017]/10">
                                <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                                    <Sparkles className="h-4.5 w-4.5 text-[#D4A017]" />
                                    DSS Score Snapshot
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-center mb-1 text-sm font-semibold">
                                    <span className="text-gray-700">Lifestyle Compatibility Match:</span>
                                    <span className="text-[#D4A017] text-lg">{Math.round(parseFloat(application.dss_score))}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5">
                                    <div
                                        className={`h-2.5 rounded-full transition-all ${parseFloat(application.dss_score) >= 60 ? 'bg-[#D4A017]' : 'bg-red-400'}`}
                                        style={{ width: `${application.dss_score}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">
                                    {parseFloat(application.dss_score) >= 60
                                        ? 'Score meets the minimum 60% threshold.'
                                        : 'Score is below the minimum 60% threshold.'}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Adopter Profile */}
                        {profile && (
                            <Card className="border-gray-200 shadow-md">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                                        <User className="h-4 w-4 text-gray-500" />
                                        Adopter Profile
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-xs">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-gray-400 block">Full Name</span>
                                            <span className="font-semibold text-gray-700">{profile.full_name}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block">Contact</span>
                                            <span className="font-semibold text-gray-700">{profile.contact_number}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block">Email</span>
                                            <span className="font-semibold text-gray-700">{application.adopter.email}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block">Date of Birth</span>
                                            <span className="font-semibold text-gray-700">
                                                {new Date(profile.date_of_birth).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="md:col-span-2">
                                            <span className="text-gray-400 block">Address</span>
                                            <span className="font-semibold text-gray-700">{profile.home_address}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block">Valid ID</span>
                                            <span className="font-semibold text-gray-700">
                                                {profile.valid_id_type} — {profile.valid_id_number}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block">Adoption Reason</span>
                                            <span className="font-semibold capitalize text-gray-700">
                                                {profile.adoption_reason?.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    {lifestyle && (
                                        <div className="border-t border-gray-100 pt-4 space-y-3">
                                            <h4 className="font-bold text-gray-700">Lifestyle Details</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                <div>
                                                    <span className="text-gray-400 block text-[11px]">Housing Type</span>
                                                    <span className="font-semibold capitalize">{lifestyle.housing_type?.replace(/_/g, ' ')}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 block text-[11px]">Air Conditioning</span>
                                                    <span className="font-semibold capitalize">{lifestyle.has_aircon?.replace(/_/g, ' ')}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 block text-[11px]">Outdoor Access</span>
                                                    <span className="font-semibold capitalize">{lifestyle.outdoor_access?.replace(/_/g, ' ')}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 block text-[11px]">Activity Level</span>
                                                    <span className="font-semibold capitalize">{lifestyle.activity_level?.replace(/_/g, ' ')}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 block text-[11px]">Monthly Income</span>
                                                    <span className="font-semibold capitalize">{lifestyle.monthly_income?.replace(/_/g, ' ')}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 block text-[11px]">Has Children</span>
                                                    <span className="font-semibold capitalize">{lifestyle.has_children?.replace(/_/g, ' ')}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 block text-[11px]">Other Pets</span>
                                                    <span className="font-semibold capitalize">{lifestyle.other_pets?.replace(/_/g, ' ')}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 block text-[11px]">Household Size</span>
                                                    <span className="font-semibold">{lifestyle.household_size}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 block text-[11px]">Pet Experience</span>
                                                    <span className="font-semibold capitalize">{lifestyle.pet_experience?.replace(/_/g, ' ')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Timeline */}
                        <Card className="border-gray-200 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold text-gray-800">Review Timeline</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-xs">
                                <div className="border-l-2 border-[#D4A017] pl-3 py-1">
                                    <div className="font-bold text-gray-700">Application Submitted</div>
                                    <div className="text-gray-400 mt-0.5">{new Date(application.submitted_at).toLocaleString()}</div>
                                </div>
                                {application.staff_decision && (
                                    <div className="border-l-2 border-green-500 pl-3 py-1">
                                        <div className="font-bold text-gray-700">
                                            Shelter Staff Verdict: <span className={`uppercase ${application.staff_decision === 'suitable' ? 'text-green-600' : 'text-red-500'}`}>{application.staff_decision}</span>
                                        </div>
                                        <div className="text-gray-400 mt-0.5">
                                            By {application.staff?.name || 'Staff'} • {application.reviewed_at ? new Date(application.reviewed_at).toLocaleString() : ''}
                                        </div>
                                        {application.staff_notes && <p className="italic text-gray-500 mt-1">"{application.staff_notes}"</p>}
                                    </div>
                                )}
                                {application.mao_decision && (
                                    <div className={`border-l-2 pl-3 py-1 ${application.mao_decision === 'approved' ? 'border-blue-500' : 'border-red-400'}`}>
                                        <div className="font-bold text-gray-700">
                                            MAO Final Decision: <span className={`uppercase ${application.mao_decision === 'approved' ? 'text-blue-600' : 'text-red-500'}`}>{application.mao_decision}</span>
                                        </div>
                                        <div className="text-gray-400 mt-0.5">
                                            {application.resolved_at ? new Date(application.resolved_at).toLocaleString() : ''}
                                        </div>
                                        {application.mao_remarks && <p className="italic text-gray-500 mt-1">"{application.mao_remarks}"</p>}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                    </div>

                    {/* Right column — pet details + checklist + decision form */}
                    <div className="space-y-6">

                        {/* Pet details */}
                        <Card className="border-gray-200 shadow-md">
                            <CardHeader className="bg-gray-50/50">
                                <CardTitle className="text-sm font-bold text-gray-800">Target Pet</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 text-xs space-y-2">
                                <div><span className="text-gray-400">Name:</span> <span className="font-bold text-gray-800">{application.pet.name}</span></div>
                                <div><span className="text-gray-400">Species:</span> <span className="font-semibold capitalize">{application.pet.species}</span></div>
                                <div><span className="text-gray-400">Breed:</span> <span className="font-semibold capitalize">{application.pet.breed}</span></div>
                                <div><span className="text-gray-400">Age:</span> <span className="font-semibold">{application.pet.age_years} yr(s)</span></div>
                                <div><span className="text-gray-400">Size:</span> <span className="font-semibold capitalize">{application.pet.size}</span></div>
                                <div><span className="text-gray-400">Energy:</span> <span className="font-semibold capitalize">{application.pet.energy_level?.replace(/_/g, ' ')}</span></div>
                                <div><span className="text-gray-400">Shelter:</span> <span className="font-semibold">{application.pet.shelter.name}</span></div>
                            </CardContent>
                        </Card>

                        {/* Compliance Checklist + Decision Form */}
                        <Card className="border-gray-200 shadow-md">
                            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                                <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    {isResolved ? 'Compliance Checklist' : 'MAO Audit Decision'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-5">
                                {isResolved ? (
                                    /* Read-only view once resolved */
                                    <div className="space-y-2 text-xs">
                                        {Object.entries(defaultChecklist).map(([key, item]) => {
                                            const passed = application.mao_checklist ? Boolean(application.mao_checklist[key]) : false;
                                            return (
                                                <div key={key} className="flex items-start gap-2">
                                                    {passed
                                                        ? <Check className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                                                        : <X className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                                                    }
                                                    <div>
                                                        <div className={`font-semibold ${passed ? 'text-green-700' : 'text-red-500'}`}>{item.label}</div>
                                                        <div className="text-gray-400 text-[10px]">{item.description}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div className="mt-4 pt-3 border-t border-gray-100">
                                            <div className="font-bold text-gray-700">Final Decision:</div>
                                            <div className={`mt-1 font-bold uppercase text-sm ${application.mao_decision === 'approved' ? 'text-green-600' : 'text-red-500'}`}>
                                                {application.mao_decision}
                                            </div>
                                            {application.mao_remarks && (
                                                <p className="italic text-gray-500 text-xs mt-1">"{application.mao_remarks}"</p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    /* Active decision form */
                                    <form onSubmit={handleSubmit} className="space-y-5">

                                        {/* Checklist */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Compliance Checklist *</Label>
                                            {Object.entries(defaultChecklist).map(([key, item]) => (
                                                <label key={key} className="flex items-start gap-2.5 cursor-pointer group">
                                                    <div className={`w-4 h-4 mt-0.5 shrink-0 rounded border-2 flex items-center justify-center transition-all ${data.checklist[key] ? 'bg-[#D4A017] border-[#D4A017]' : 'border-gray-300 group-hover:border-[#D4A017]/50'}`}
                                                        onClick={() => toggleChecklist(key)}
                                                    >
                                                        {data.checklist[key] && <Check className="h-2.5 w-2.5 text-white" />}
                                                    </div>
                                                    <div className="text-xs" onClick={() => toggleChecklist(key)}>
                                                        <div className="font-semibold text-gray-700">{item.label}</div>
                                                        <div className="text-gray-400 text-[10px]">{item.description}</div>
                                                    </div>
                                                </label>
                                            ))}
                                            {!allChecked && (
                                                <p className="text-[10px] text-amber-600">Complete all checklist items before approving.</p>
                                            )}
                                        </div>

                                        {/* Decision */}
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Final Decision *</Label>
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-green-100 bg-green-50/20 hover:bg-green-50/40 cursor-pointer transition">
                                                    <input
                                                        type="radio"
                                                        name="decision"
                                                        value="approved"
                                                        checked={data.decision === 'approved'}
                                                        onChange={e => setData('decision', e.target.value)}
                                                        className="text-green-600"
                                                    />
                                                    <div className="text-xs">
                                                        <span className="font-bold text-green-800 block">Approve</span>
                                                        <span className="text-green-600">Pet is officially adopted. Adopter will be notified.</span>
                                                    </div>
                                                </label>
                                                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-red-100 bg-red-50/20 hover:bg-red-50/40 cursor-pointer transition">
                                                    <input
                                                        type="radio"
                                                        name="decision"
                                                        value="rejected"
                                                        checked={data.decision === 'rejected'}
                                                        onChange={e => setData('decision', e.target.value)}
                                                        className="text-red-600"
                                                    />
                                                    <div className="text-xs">
                                                        <span className="font-bold text-red-800 block">Reject</span>
                                                        <span className="text-red-600">Application does not meet compliance standards.</span>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Remarks */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="remarks" className="text-xs font-bold text-gray-700 uppercase tracking-wide">Remarks</Label>
                                            <textarea
                                                id="remarks"
                                                value={data.remarks}
                                                onChange={e => setData('remarks', e.target.value)}
                                                className="w-full min-h-[90px] p-2 border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A017] text-xs"
                                                placeholder="Optional remarks for the record..."
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className={`w-full font-semibold text-white transition ${data.decision === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}
                                        >
                                            {processing ? 'Submitting...' : data.decision === 'approved' ? 'Approve Application' : 'Reject Application'}
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>

                        <Link href={route('mao.applications.index')} className="block">
                            <Button variant="outline" className="w-full text-xs border-gray-200">
                                ← Back to Audits
                            </Button>
                        </Link>

                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
