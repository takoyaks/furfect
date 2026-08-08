import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, X } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

const CHECKLIST_LABELS: Record<string, { label: string; description: string }> = {
    identity_verified:   { label: 'Applicant identity verified',       description: 'Name, address, and contact details match submitted ID document.' },
    dss_score_acceptable:{ label: 'DSS score acceptable (≥ 60%)',       description: 'Compatibility score meets minimum standard for selected pet.' },
    staff_recommendation:{ label: 'Staff recommendation reviewed',      description: 'Shelter staff has marked the application as suitable.' },
    housing_appropriate: { label: 'Housing appropriate for pet',        description: 'Assessed space matches pet size and energy level requirements.' },
    no_red_flags:        { label: 'No red flags in application',        description: 'No past history of animal abuse, neglect, or quick surrenders.' },
};

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
    resolved_at: string | null;
    submitted_at: string;
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
        };
        lifestyle_profile?: {
            housing_type: string;
            has_aircon: string;
            outdoor_access: string;
            activity_level: string;
            monthly_income: string;
            has_children: string;
            other_pets: string;
            household_size: number;
        };
    };
    pet: {
        name: string;
        species: string;
        breed: string;
        shelter: { name: string };
    };
    staff?: { name: string };
    mao_officer?: { name: string };
}

export default function AdminApplicationShow({ application }: { application: Application }) {
    const profile = application.adopter.adopter_profile;
    const lifestyle = application.adopter.lifestyle_profile;

    return (
        <AppLayout breadcrumbs={[
            { title: 'Manage Applications', href: route('admin.applications.index') },
            { title: application.reference_number, href: '#' }
        ]}>
            <Head title={`Audit Application: ${application.reference_number}`} />
            <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
                
                <div className="flex justify-between items-center flex-wrap gap-2 pb-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Application Audit details</h2>
                        <p className="text-xs text-gray-500">{application.reference_number} • Adopter: {application.adopter.name}</p>
                    </div>
                    <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full uppercase font-bold">
                        {application.status.replace(/_/g, ' ')}
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* DSS Compatibility */}
                        <Card className="border-gray-200 shadow-md">
                            <CardHeader className="bg-gray-50/50">
                                <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-1">
                                    <Sparkles className="h-4.5 w-4.5 text-[#D4A017]" />
                                    DSS Score Snapshot
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-center mb-1 text-sm font-semibold">
                                    <span>Lifestyle Compatibility Match:</span>
                                    <span className="text-[#D4A017]">{Math.round(parseFloat(application.dss_score))}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="h-2 rounded-full bg-[#D4A017]" style={{ width: `${application.dss_score}%` }} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Adopter details */}
                        {profile && (
                            <Card className="border-gray-200 shadow-md">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold text-gray-800">Adopter Profile</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-xs">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-gray-400 block">Full Name</span>
                                            <span className="font-semibold text-gray-700">{profile.full_name}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block">Contact Number</span>
                                            <span className="font-semibold text-gray-700">{profile.contact_number}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block">Email</span>
                                            <span className="font-semibold text-gray-700">{application.adopter.email}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block">Date of Birth</span>
                                            <span className="font-semibold text-gray-700">{new Date(profile.date_of_birth).toLocaleDateString()}</span>
                                        </div>
                                        <div className="md:col-span-2">
                                            <span className="text-gray-400 block">Address</span>
                                            <span className="font-semibold text-gray-700">{profile.home_address}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block">Valid ID Verification</span>
                                            <span className="font-semibold text-gray-700">{profile.valid_id_type} — {profile.valid_id_number}</span>
                                        </div>
                                    </div>

                                    {/* Lifestyle profile */}
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
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Timeline / logs */}
                        <Card className="border-gray-200 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold text-gray-800">Review Timeline Logs</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-xs">
                                {/* Submitted */}
                                <div className="border-l-2 border-[#D4A017] pl-3 py-1">
                                    <div className="font-bold text-gray-700">Application Submitted</div>
                                    <div className="text-gray-400 mt-0.5">{new Date(application.submitted_at).toLocaleString()}</div>
                                </div>

                                {/* Shelter Staff reviewed */}
                                {application.staff_decision && (
                                    <div className="border-l-2 border-green-500 pl-3 py-1">
                                        <div className="font-bold text-gray-700">Shelter Staff Verdict: <span className="uppercase text-green-600">{application.staff_decision}</span></div>
                                        <div className="text-gray-400 mt-0.5">By {application.staff?.name || 'Staff'} • {application.reviewed_at ? new Date(application.reviewed_at).toLocaleString() : ''}</div>
                                        {application.staff_notes && <p className="italic text-gray-500 mt-1">"{application.staff_notes}"</p>}
                                    </div>
                                )}

                                {/* MAO Officer reviewed */}
                                {application.mao_decision && (
                                    <div className="border-l-2 border-blue-500 pl-3 py-1">
                                        <div className="font-bold text-gray-700">MAO Final decision: <span className="uppercase text-blue-600">{application.mao_decision}</span></div>
                                        <div className="text-gray-400 mt-0.5">By {application.mao_officer?.name || 'Officer'} • {application.resolved_at ? new Date(application.resolved_at).toLocaleString() : ''}</div>
                                        {application.mao_remarks && <p className="italic text-gray-500 mt-1">"{application.mao_remarks}"</p>}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                    </div>

                    {/* Right column: Target info */}
                    <div className="space-y-6">
                        
                        {/* Pet details */}
                        <Card className="border-gray-200 shadow-md">
                            <CardHeader className="bg-gray-50/50">
                                <CardTitle className="text-sm font-bold text-gray-800">Target Pet details</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 text-xs space-y-2">
                                <div><span className="text-gray-500">Pet Name:</span> <span className="font-bold text-gray-800">{application.pet.name}</span></div>
                                <div><span className="text-gray-500">Species:</span> <span className="font-semibold capitalize text-gray-700">{application.pet.species}</span></div>
                                <div><span className="text-gray-500">Breed:</span> <span className="font-semibold capitalize text-gray-700">{application.pet.breed}</span></div>
                                <div><span className="text-gray-500">Shelter location:</span> <span className="font-semibold text-gray-700">{application.pet.shelter.name}</span></div>
                            </CardContent>
                        </Card>

                        {/* Compliance Checklist — dynamic from mao_checklist JSON */}
                        <Card className="border-gray-200 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold text-gray-800">Compliance Checklist</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-xs">
                                {application.mao_checklist ? (
                                    Object.entries(CHECKLIST_LABELS).map(([key, meta]) => {
                                        const passed = Boolean(application.mao_checklist![key]);
                                        return (
                                            <div key={key} className="flex items-start gap-2 border-b border-gray-50 pb-1 last:border-0">
                                                {passed
                                                    ? <Check className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                                                    : <X className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                                                }
                                                <div>
                                                    <div className={`font-semibold ${passed ? 'text-green-700' : 'text-red-500'}`}>{meta.label}</div>
                                                    <div className="text-gray-400 text-[10px]">{meta.description}</div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-gray-400 italic text-[11px]">MAO audit has not been completed yet.</p>
                                )}
                            </CardContent>
                        </Card>

                        <Link href={route('admin.applications.index')} className="block">
                            <Button variant="outline" className="w-full text-xs border-gray-200">
                                ← Back to Applications
                            </Button>
                        </Link>

                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
