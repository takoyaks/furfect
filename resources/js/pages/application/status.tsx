import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, ClipboardList, ShieldAlert, Award, FileCheck } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

interface Application {
    id: number;
    reference_number: string;
    dss_score: string;
    status: 'pending' | 'under_review' | 'mao_audit' | 'approved' | 'rejected';
    staff_decision: string;
    staff_notes: string;
    reviewed_at: string;
    mao_decision: string;
    mao_remarks: string;
    resolved_at: string;
    submitted_at: string;
    pet: {
        name: string;
        species: string;
        adoption_fee: string;
        photos?: { photo_path: string }[];
        shelter: { name: string; location: string };
    };
}

export default function ApplicationStatus({ application }: { application: Application | null }) {
    if (!application) {
        return (
            <AppLayout breadcrumbs={[{ title: 'My Application', href: '#' }]}>
                <Head title="My Application" />
                <div className="max-w-2xl mx-auto py-16 px-4 text-center">
                    <ClipboardList className="mx-auto h-12 w-12 text-[#D4A017] mb-4" />
                    <h2 className="text-2xl font-bold text-[#444] mb-2">No Active Application</h2>
                    <p className="text-gray-600 mb-6">You don't have any active or past adoption applications. Browse our pets to find a match!</p>
                    <Link href={route('pets.index')}>
                        <Button className="bg-[#D4A017] hover:bg-[#B8860B] text-white">Browse Pets</Button>
                    </Link>
                </div>
            </AppLayout>
        );
    }

    // Step status helper
    const getStepStatus = (step: number) => {
        const statuses = ['pending', 'under_review', 'mao_audit', 'resolved'];
        const currentIdx = statuses.indexOf(
            application.status === 'approved' || application.status === 'rejected' ? 'resolved' : application.status
        );
        if (currentIdx >= step) return 'completed';
        if (currentIdx === step - 1) return 'active';
        return 'upcoming';
    };

    const petPhoto = application.pet.photos?.[0]?.photo_path || '/placeholder-pet.png';

    return (
        <AppLayout breadcrumbs={[{ title: 'My Application', href: '#' }]}>
            <Head title="Application Status" />
            <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
                
                {/* Pet summary card */}
                <Card className="border-[#D4A017]/20 shadow-md">
                    <CardContent className="p-6 flex items-center gap-6 flex-wrap md:flex-nowrap">
                        <div className="h-24 w-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                            <img src={petPhoto} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <h3 className="text-xl font-bold text-gray-800">{application.pet.name}</h3>
                            <p className="text-xs text-gray-500 capitalize">{application.pet.species} • {application.pet.shelter.name}</p>
                            <p className="text-xs text-gray-400">Ref: <span className="font-semibold">{application.reference_number}</span> • Submitted: {new Date(application.submitted_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                application.status === 'approved' ? 'bg-green-100 text-green-700' :
                                application.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                                {application.status.replace(/_/g, ' ')}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Progress bar timeline */}
                <Card className="border-gray-200 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-md font-bold text-gray-700">Application Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center relative">
                            {/* Horizontal Line background */}
                            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-gray-100 -z-10" />

                            {[
                                { step: 1, label: 'Submitted', date: application.submitted_at },
                                { step: 2, label: 'Under Review', date: application.reviewed_at },
                                { step: 3, label: 'MAO Audit', date: application.reviewed_at },
                                { step: 4, label: 'Result', date: application.resolved_at },
                            ].map(node => {
                                const status = getStepStatus(node.step);
                                return (
                                    <div key={node.step} className="flex flex-col items-center z-10">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                                            status === 'completed' ? 'bg-[#D4A017] border-[#D4A017] text-white' :
                                            status === 'active' ? 'bg-white border-[#D4A017] text-[#D4A017] animate-pulse' :
                                            'bg-white border-gray-200 text-gray-400'
                                        }`}>
                                            {status === 'completed' && node.step < 4 ? <Check className="h-5 w-5" /> : node.step}
                                        </div>
                                        <span className="text-xs font-bold text-gray-600 mt-2">{node.label}</span>
                                        {node.date && (
                                            <span className="text-[10px] text-gray-400 mt-0.5">{new Date(node.date).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Status-specific action panels */}
                {application.status === 'approved' && (
                    <Card className="border-green-300 bg-green-50/50 shadow-md">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-2 text-green-800">
                                <FileCheck className="h-6 w-6 text-green-600" />
                                <h4 className="text-lg font-bold">Your application is approved!</h4>
                            </div>
                            <p className="text-sm text-green-700">
                                The Municipal Agriculture Office (MAO) has approved your adoption of <strong>{application.pet.name}</strong>. 
                                Please visit the shelter within <strong>7 days</strong> to finalize and take your pet home!
                            </p>
                            
                            <div className="bg-white border border-green-200 p-4 rounded-md space-y-3 text-xs text-gray-600">
                                <div className="font-semibold text-gray-800 text-sm flex items-center gap-1">
                                    <Award className="h-4 w-4 text-[#D4A017]" />
                                    Adoption Fee Collection
                                </div>
                                <p className="font-bold text-[#D4A017] text-base">₱{parseFloat(application.pet.adoption_fee).toLocaleString()}</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>Bring the exact amount in <strong>cash</strong> when you visit the shelter.</li>
                                    <li>Bring a <strong>valid government-issued ID</strong> for identity verification.</li>
                                    <li><strong>Note:</strong> Payments are collected <strong>in person only</strong> at the shelter; we never request online payments.</li>
                                    <li>Adoption pickup location: <strong>{application.pet.shelter.location}</strong></li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {application.status === 'rejected' && (
                    <Card className="border-red-300 bg-red-50/50 shadow-md">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-2 text-red-800">
                                <ShieldAlert className="h-6 w-6 text-red-600" />
                                <h4 className="text-lg font-bold">Your application was not approved this time.</h4>
                            </div>
                            <p className="text-sm text-red-700">
                                The compliance review team assessed the application profile and did not approve this request.
                            </p>
                            {application.mao_remarks && (
                                <div className="bg-white border border-red-200 p-4 rounded-md text-xs text-gray-600">
                                    <div className="font-semibold text-gray-800 text-sm mb-1">Reason for Rejection</div>
                                    <p className="italic">"{application.mao_remarks}"</p>
                                </div>
                            )}
                            <div className="flex gap-3 mt-4">
                                <Link href={route('pets.index')}>
                                    <Button className="bg-[#D4A017] hover:bg-[#B8860B] text-white">Browse Other Pets</Button>
                                </Link>
                                <Link href={route('onboarding.lifestyle.edit')}>
                                    <Button variant="outline">Update My Profile</Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {(application.status === 'pending' || application.status === 'under_review') && (
                    <Card className="border-gray-200 shadow-md">
                        <CardContent className="p-6 space-y-3">
                            <h4 className="font-semibold text-sm text-gray-700 uppercase">Notes from Shelter</h4>
                            <div className="border-l-4 border-[#D4A017] pl-3 italic text-xs text-gray-500">
                                {application.staff_notes || 'Thank you for your application. We are currently reviewing your information. Our team will contact you within 3-5 business days.'}
                            </div>
                        </CardContent>
                    </Card>
                )}

            </div>
        </AppLayout>
    );
}
