import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Award,
    History,
    FileText,
    ShieldCheck,
    Sparkles,
    Building,
    Tag,
    ArrowRight,
    UserCheck,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TimelineEvent {
    id: number;
    stage: string;
    action: string;
    title: string;
    description: string;
    created_at: string;
}

interface ApplicationItem {
    id: number;
    reference_number: string;
    dss_score: string;
    fast_track_eligible?: boolean;
    status: string;
    staff_decision?: string;
    staff_notes?: string;
    mao_decision?: string;
    mao_remarks?: string;
    certificate_number?: string;
    pickup_deadline_at?: string;
    submitted_at: string;
    resolved_at?: string;
    pet: {
        id: number;
        name: string;
        species: string;
        breed?: string;
        tag_number?: string | null;
        microchip_number?: string | null;
        housing_area?: string | null;
        photos?: { photo_path: string }[];
        shelter: {
            name: string;
            location: string;
            contact?: string;
        };
    };
    timelines?: TimelineEvent[];
}

interface AdopterProfileData {
    full_name: string;
    contact_number: string;
    home_address: string;
    had_pets_before: string;
    previous_pet_notes?: string | null;
    surrendered_pet: boolean;
    adoption_reason: string;
    adoption_reason_text?: string | null;
    pet_stay: string;
}

interface LifestyleProfileData {
    housing_type?: string;
    has_yard?: boolean;
    pet_experience?: string;
    other_pets?: string;
    has_children?: string;
}

const STATUS_BADGE: Record<string, string> = {
    approved: 'bg-green-100 text-green-800 border-green-200',
    mao_audit: 'bg-purple-100 text-purple-800 border-purple-200',
    under_review: 'bg-blue-100 text-blue-800 border-blue-200',
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
};

export default function AdopterHistoryPage({
    adoptedPets = [],
    allApplications = [],
    adopterProfile,
    lifestyleProfile,
}: {
    adoptedPets: ApplicationItem[];
    allApplications: ApplicationItem[];
    adopterProfile: AdopterProfileData | null;
    lifestyleProfile: LifestyleProfileData | null;
}) {
    const [activeTab, setActiveTab] = useState<'adopted' | 'applications' | 'background'>('adopted');

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: route('dashboard') }, { title: 'My Pet History', href: '#' }]}>
            <Head title="My Pet History & Certificates" />

            <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
                
                {/* ── Page Header ── */}
                <div className="rounded-3xl bg-gradient-to-r from-amber-500/10 via-[#F5EDD7]/60 to-white border border-[#D4A017]/30 p-6 md:p-8 shadow-xs">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2.5">
                                <div className="h-10 w-10 rounded-2xl bg-[#D4A017] text-white flex items-center justify-center shadow-xs">
                                    <History className="h-5 w-5" />
                                </div>
                                <h1 className="text-2xl font-black text-gray-900">My Pet History &amp; Records</h1>
                            </div>
                            <p className="text-xs text-gray-600 max-w-xl">
                                Track all your adopted companion animals, official Municipal Agriculture Office (MAO) certificates, and historical adoption applications.
                            </p>
                        </div>

                        {/* Quick Stats Pills */}
                        <div className="flex items-center gap-3">
                            <div className="bg-white/80 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-gray-200 shadow-2xs text-center">
                                <span className="text-xs text-gray-500 block font-medium">Adopted Pets</span>
                                <span className="text-xl font-black text-green-700">{adoptedPets.length}</span>
                            </div>
                            <div className="bg-white/80 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-gray-200 shadow-2xs text-center">
                                <span className="text-xs text-gray-500 block font-medium">Total Applications</span>
                                <span className="text-xl font-black text-gray-800">{allApplications.length}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Navigation Pill Tabs ── */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 p-1.5 bg-gray-100/90 rounded-2xl w-fit flex-wrap">
                        <button
                            onClick={() => setActiveTab('adopted')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                activeTab === 'adopted'
                                    ? 'bg-white text-[#B8860B] shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <Award className="h-4 w-4" />
                            Adopted Pets ({adoptedPets.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('applications')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                activeTab === 'applications'
                                    ? 'bg-white text-[#B8860B] shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <FileText className="h-4 w-4" />
                            Applications ({allApplications.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('background')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                activeTab === 'background'
                                    ? 'bg-white text-[#B8860B] shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <ShieldCheck className="h-4 w-4" />
                            Pet Background
                        </button>
                    </div>

                    {/* ── TAB 1: Adopted Pets & Municipal Certificates ── */}
                    {activeTab === 'adopted' && (
                        <div className="space-y-6">
                            {adoptedPets.length === 0 ? (
                                <Card className="border-gray-200 text-center py-16 px-4 space-y-3">
                                    <Award className="h-12 w-12 text-gray-300 mx-auto" />
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-gray-900 text-base">No Completed Adoptions Yet</h3>
                                        <p className="text-xs text-gray-500 max-w-md mx-auto">
                                            When your adoption application is officially approved by the Municipal Agriculture Office (MAO), your pet details and official certificate will appear here.
                                        </p>
                                    </div>
                                    <div className="pt-2">
                                        <Link
                                            href={route('pets.index')}
                                            className={cn(buttonVariants({ variant: 'default' }), "bg-[#D4A017] hover:bg-[#B8860B] text-white text-xs font-bold shadow-xs")}
                                        >
                                            Browse Available Rescues
                                        </Link>
                                    </div>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {adoptedPets.map((app) => {
                                        const petPhoto = app.pet.photos?.[0]?.photo_path || '/placeholder-pet.png';
                                        return (
                                            <Card key={app.id} className="border-[#D4A017]/30 bg-gradient-to-b from-white to-amber-50/20 shadow-sm overflow-hidden flex flex-col justify-between">
                                                <CardHeader className="p-5 pb-3 border-b border-gray-100">
                                                    <div className="flex justify-between items-start gap-3">
                                                        <div className="flex items-center gap-3.5">
                                                            <div className="h-14 w-14 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-amber-200">
                                                                <img src={petPhoto} alt={app.pet.name} className="w-full h-full object-cover" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <CardTitle className="text-lg font-black text-gray-900">{app.pet.name}</CardTitle>
                                                                    <Badge className="bg-green-600 text-white text-[10px] font-bold">Adopted</Badge>
                                                                </div>
                                                                <CardDescription className="text-xs text-gray-500 capitalize">
                                                                    {app.pet.species} {app.pet.breed ? `\u2022 ${app.pet.breed}` : ''}
                                                                </CardDescription>
                                                            </div>
                                                        </div>

                                                        <div className="text-right">
                                                            <span className="inline-flex items-center gap-1 text-xs font-black text-[#B8860B] bg-[#F5EDD7] px-2.5 py-1 rounded-xl border border-amber-200">
                                                                <Sparkles className="h-3 w-3" />
                                                                {Math.round(parseFloat(app.dss_score))}% Match
                                                            </span>
                                                        </div>
                                                    </div>
                                                </CardHeader>

                                                <CardContent className="p-5 space-y-4 text-xs">
                                                    {/* Official Municipal Certificate Badge */}
                                                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/70 flex items-center justify-between">
                                                        <div className="space-y-0.5">
                                                            <span className="text-[10px] uppercase font-bold text-amber-800 block">Municipal Certificate</span>
                                                            <span className="font-mono font-bold text-gray-900 text-xs">{app.certificate_number || 'CERT-MAO-ISSUED'}</span>
                                                        </div>
                                                        <Badge variant="outline" className="bg-white text-green-700 border-green-300 font-bold text-[10px]">
                                                            RA 8485 Verified
                                                        </Badge>
                                                    </div>

                                                    {/* Pet Identity & Shelter Details */}
                                                    <div className="grid grid-cols-2 gap-2 text-gray-600 pt-1">
                                                        <div className="space-y-0.5">
                                                            <span className="text-[10px] text-gray-400 block uppercase">Collar Tag</span>
                                                            <span className="font-bold text-gray-800 flex items-center gap-1">
                                                                <Tag className="h-3 w-3 text-amber-600" />
                                                                {app.pet.tag_number || 'Standard Tag'}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <span className="text-[10px] text-gray-400 block uppercase">Shelter Facility</span>
                                                            <span className="font-medium text-gray-800 truncate block">{app.pet.shelter.name}</span>
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <span className="text-[10px] text-gray-400 block uppercase">Adoption Date</span>
                                                            <span className="font-medium text-gray-800">
                                                                {app.resolved_at ? new Date(app.resolved_at).toLocaleDateString() : 'Confirmed'}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <span className="text-[10px] text-gray-400 block uppercase">Microchip ID</span>
                                                            <span className="font-mono text-gray-700">{app.pet.microchip_number || 'Recorded'}</span>
                                                        </div>
                                                    </div>

                                                    {/* Action Button */}
                                                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                                                        <Link
                                                            href={route('application.show', { id: app.id })}
                                                            className="text-xs font-bold text-[#B8860B] hover:underline flex items-center gap-1"
                                                        >
                                                            View Digital Adoption Pass <ArrowRight className="h-3.5 w-3.5" />
                                                        </Link>
                                                        <Link href={route('pets.show', app.pet.id)} className="text-xs text-gray-400 hover:text-gray-700">
                                                            Pet Profile
                                                        </Link>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── TAB 2: Full Application Archive ── */}
                    {activeTab === 'applications' && (
                        <Card className="border-gray-200 shadow-xs overflow-hidden">
                            <CardHeader className="p-5 border-b border-gray-100">
                                <CardTitle className="text-base font-bold text-gray-900">Historical Application Log</CardTitle>
                                <CardDescription className="text-xs text-gray-500">
                                    Chronological archive of all adoption requests submitted under your verified profile.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="p-0">
                                {allApplications.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400 text-xs">
                                        No adoption applications recorded yet.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {allApplications.map((app) => {
                                            const petPhoto = app.pet.photos?.[0]?.photo_path || '/placeholder-pet.png';
                                            return (
                                                <div key={app.id} className="p-5 flex items-start justify-between flex-wrap gap-4 hover:bg-gray-50/50 transition">
                                                    <div className="flex items-start gap-4">
                                                        <div className="h-12 w-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                                                            <img src={petPhoto} alt={app.pet.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-gray-900 text-sm">{app.pet.name}</span>
                                                                <span className="text-xs text-gray-400 capitalize">({app.pet.species})</span>
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_BADGE[app.status] || 'bg-gray-100 text-gray-700'}`}>
                                                                    {app.status.replace(/_/g, ' ')}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-500">
                                                                Shelter: <strong>{app.pet.shelter.name}</strong> &bull; Applied: {new Date(app.submitted_at).toLocaleDateString()}
                                                            </p>
                                                            <p className="text-[11px] text-gray-400 font-mono">
                                                                Ref #{app.reference_number}
                                                                {app.certificate_number && ` \u2022 Cert #${app.certificate_number}`}
                                                            </p>

                                                            {/* Reviewer Feedback / Notes if any */}
                                                            {(app.staff_notes || app.mao_remarks) && (
                                                                <p className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded-lg border border-gray-100 mt-1 max-w-xl">
                                                                    "{app.mao_remarks || app.staff_notes}"
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#B8860B] bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                                                            <Sparkles className="h-3 w-3" />
                                                            {Math.round(parseFloat(app.dss_score))}% Match
                                                        </span>
                                                        <Link
                                                            href={route('application.show', { id: app.id })}
                                                            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), "text-xs h-7 px-2.5 border-gray-200")}
                                                        >
                                                            View Status
                                                        </Link>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* ── TAB 3: Household Pet Background ── */}
                    {activeTab === 'background' && (
                        <Card className="border-gray-200 shadow-xs">
                            <CardHeader className="p-5 border-b border-gray-100 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-bold text-gray-900">Declared Animal Ownership Background</CardTitle>
                                    <CardDescription className="text-xs text-gray-500">
                                        Household pet history provided during onboarding and used by the 8-Factor DSS Matching Engine.
                                    </CardDescription>
                                </div>
                                <Link
                                    href={route('onboarding.personal.edit')}
                                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), "text-xs font-semibold border-amber-300 text-[#B8860B] hover:bg-amber-50")}
                                >
                                    Edit Declaration
                                </Link>
                            </CardHeader>

                            <CardContent className="p-6 space-y-6 text-xs">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    
                                    {/* Experience Background */}
                                    <div className="space-y-4 p-4 rounded-2xl bg-gray-50/70 border border-gray-100">
                                        <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                            <UserCheck className="h-4 w-4 text-[#D4A017]" />
                                            Past Pet Experience
                                        </h4>
                                        <div className="space-y-2.5 text-gray-600">
                                            <div className="flex justify-between border-b border-gray-100 pb-1.5">
                                                <span className="text-gray-500">Owned Pets Before:</span>
                                                <span className="font-bold text-gray-800 capitalize">
                                                    {adopterProfile?.had_pets_before?.replace(/_/g, ' ') || 'None declared'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-100 pb-1.5">
                                                <span className="text-gray-500">Pet Living Area:</span>
                                                <span className="font-bold text-gray-800 capitalize">
                                                    {adopterProfile?.pet_stay === 'inside' ? 'Indoors with Family' : (adopterProfile?.pet_stay === 'outside' ? 'Outdoor Yard' : 'Mixed / Indoors')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-100 pb-1.5">
                                                <span className="text-gray-500">Other Pets in Household:</span>
                                                <span className="font-bold text-gray-800 capitalize">
                                                    {lifestyleProfile?.other_pets?.replace(/_/g, ' ') || 'None'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Past Pet Surrender Record:</span>
                                                <span className={`font-bold ${adopterProfile?.surrendered_pet ? 'text-red-600' : 'text-green-600'}`}>
                                                    {adopterProfile?.surrendered_pet ? 'Declared Past Surrender' : 'Clean (No Surrenders)'}
                                                </span>
                                            </div>
                                        </div>

                                        {adopterProfile?.previous_pet_notes && (
                                            <div className="pt-2 border-t border-gray-200/60">
                                                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Previous Pet Details:</span>
                                                <p className="text-gray-700 italic">"{adopterProfile.previous_pet_notes}"</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Current Housing & Care Setup */}
                                    <div className="space-y-4 p-4 rounded-2xl bg-gray-50/70 border border-gray-100">
                                        <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                            <Building className="h-4 w-4 text-[#D4A017]" />
                                            Housing &amp; Capacity Setup
                                        </h4>
                                        <div className="space-y-2.5 text-gray-600">
                                            <div className="flex justify-between border-b border-gray-100 pb-1.5">
                                                <span className="text-gray-500">Residence Type:</span>
                                                <span className="font-bold text-gray-800 capitalize">
                                                    {lifestyleProfile?.housing_type?.replace(/_/g, ' ') || 'Not specified'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-100 pb-1.5">
                                                <span className="text-gray-500">Fenced Outdoor Yard:</span>
                                                <span className="font-bold text-gray-800">
                                                    {lifestyleProfile?.has_yard ? 'Yes (Secure Yard)' : 'No Dedicated Yard'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-100 pb-1.5">
                                                <span className="text-gray-500">Children in Household:</span>
                                                <span className="font-bold text-gray-800 capitalize">
                                                    {lifestyleProfile?.has_children?.replace(/_/g, ' ') || 'None'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Adoption Motivation:</span>
                                                <span className="font-bold text-gray-800">
                                                    {adopterProfile?.adoption_reason || 'Companionship'}
                                                </span>
                                            </div>
                                        </div>

                                        {adopterProfile?.adoption_reason_text && (
                                            <div className="pt-2 border-t border-gray-200/60">
                                                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Adopter Statement:</span>
                                                <p className="text-gray-700 italic">"{adopterProfile.adoption_reason_text}"</p>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
