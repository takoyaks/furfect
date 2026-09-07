import { Head, Link, router, usePage } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, ClipboardList, ShieldAlert, Award, FileCheck, Clock, MapPin, Phone, Calendar, ArrowRight, Sparkles, Building, QrCode, Tag, HeartHandshake, Zap, Users, Printer } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { ApplicationTimelineCard, TimelineEvent } from '@/components/application-timeline-card';
import { DssScoreCard } from '@/components/dss-score-card';
import { AdoptionPickupPass } from '@/components/adoption-pickup-pass';
import { AdoptionPassModal } from '@/components/adoption-pass-modal';
import { cn } from '@/lib/utils';

interface PetRecommendation {
    pet: {
        id: number;
        name: string;
        species: string;
        breed?: string;
        age_years: number;
        gender: string;
        size: string;
        photos?: { photo_path: string }[];
        shelter: { name: string; location: string };
    };
    total_score: number;
    fast_track_eligible?: boolean;
    match_reasons?: string[];
}

interface Application {
    id: number;
    reference_number: string;
    dss_score: string;
    fast_track_eligible?: boolean;
    dss_breakdown?: any;
    status: 'pending' | 'under_review' | 'mao_audit' | 'approved' | 'rejected';
    staff_decision?: string;
    staff_notes?: string;
    reviewed_at?: string;
    target_sla_at?: string;
    pickup_deadline_at?: string;
    certificate_number?: string;
    mao_decision?: string;
    mao_remarks?: string;
    resolved_at?: string;
    submitted_at: string;
    pet: {
        id: number;
        name: string;
        species: string;
        breed?: string;
        tag_number?: string | null;
        housing_area?: string | null;
        adoption_fee: string;
        photos?: { photo_path: string }[];
        shelter: { name: string; location: string; contact?: string };
    };
    timelines?: TimelineEvent[];
}

export default function ApplicationStatus({
    application,
    isWaitlisted = false,
    recommendedPets = [],
}: {
    application: Application | null;
    isWaitlisted?: boolean;
    recommendedPets?: PetRecommendation[];
}) {
    const { systemSettings } = usePage().props as any;
    const pricingEnabled = systemSettings?.pricing_enabled ?? false;

    if (!application) {
        return (
            <AppLayout breadcrumbs={[{ title: 'My Application', href: '#' }]}>
                <Head title="My Application" />
                <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
                    <div className="w-16 h-16 bg-amber-50 text-[#D4A017] rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <ClipboardList className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">No Active Adoption Application</h2>
                    <p className="text-gray-600 text-sm max-w-md mx-auto">
                        You don't currently have an active adoption application. Browse our available rescued pets to find your compatible companion!
                    </p>
                    <div className="pt-2">
                        <Link
                            href={route('pets.index')}
                            className={cn(buttonVariants({ variant: 'default' }), "bg-[#D4A017] hover:bg-[#B8860B] text-white font-semibold")}
                        >
                            Browse Available Pets
                        </Link>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const rawPhoto = application.pet.photos?.[0]?.photo_path;
    const petPhoto = rawPhoto
        ? (rawPhoto.startsWith('http') || rawPhoto.startsWith('/') ? rawPhoto : `/storage/${rawPhoto}`)
        : '/placeholder-pet.png';

    // Multi-stage status determination
    const steps = [
        {
            num: 1,
            title: 'Submitted',
            desc: 'Application received & DSS computed',
            date: application.submitted_at,
        },
        {
            num: 2,
            title: 'Shelter Screening',
            desc: 'Virac Shelter staff interview & check',
            date: application.reviewed_at,
        },
        {
            num: 3,
            title: 'MAO Compliance Audit',
            desc: 'Municipal Agriculture Office review (RA 8485)',
            date: application.status === 'mao_audit' || application.resolved_at ? (application.reviewed_at || application.submitted_at) : null,
        },
        {
            num: 4,
            title: 'Official Resolution',
            desc: application.status === 'approved' ? 'Adoption Approved' : (application.status === 'rejected' ? 'Application Closed' : 'Final Certificate Issuance'),
            date: application.resolved_at,
        },
    ];

    const getStageIndex = () => {
        switch (application.status) {
            case 'pending':
                return 1;
            case 'under_review':
                return 1;
            case 'mao_audit':
                return 2;
            case 'approved':
            case 'rejected':
                return 3;
            default:
                return 0;
        }
    };

    const currentStageIdx = getStageIndex();

    return (
        <AppLayout breadcrumbs={[{ title: 'My Application', href: '#' }]}>
            <Head title={`Application Status — ${application.reference_number}`} />

            <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8 print:hidden">
                {/* ── 1. Pet & Application Banner ────────────────────────────────── */}
                <div className="rounded-3xl bg-white border border-[#D4A017]/20 p-6 shadow-sm overflow-hidden relative">
                    <div className="flex items-center justify-between gap-6 flex-wrap md:flex-nowrap">
                        <div className="flex items-center gap-5">
                            <div className="h-20 w-20 rounded-2xl overflow-hidden shrink-0 bg-amber-50 border border-gray-200 shadow-sm">
                                <img src={petPhoto} alt={application.pet.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-black text-gray-900">{application.pet.name}</h2>
                                    {application.fast_track_eligible && (
                                        <Badge className="bg-emerald-600 text-white text-[10px] gap-1 font-bold">
                                            <Sparkles className="h-3 w-3" />
                                            Fast-Track
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 capitalize">
                                    {application.pet.species} &bull; {application.pet.shelter.name}
                                </p>
                                <p className="text-xs text-gray-400 font-mono">
                                    Ref: <span className="font-bold text-gray-700">{application.reference_number}</span> &bull; Submitted: {new Date(application.submitted_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex items-center gap-2">
                                <Link
                                    href={route('history.index')}
                                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), "text-xs font-bold border-amber-300 text-[#B8860B] hover:bg-amber-50 h-8 gap-1.5")}
                                >
                                    <Award className="h-3.5 w-3.5" />
                                    Pet History
                                </Link>
                                <span className="font-bold text-base text-[#D4A017] bg-[#F5EDD7] px-3 py-1 rounded-xl">
                                    {Math.round(Number(application.dss_score))}% Match
                                </span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                application.status === 'approved'
                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                    : application.status === 'rejected'
                                    ? 'bg-red-100 text-red-800 border border-red-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                                {application.status.replace(/_/g, ' ')}
                            </span>
                        </div>
                    </div>

                    {/* Priority Standby / Waitlist Alert */}
                    {isWaitlisted && (
                        <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3 text-xs">
                            <div className="flex items-start gap-3">
                                <Clock className="h-5 w-5 text-[#B8860B] shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <span className="font-bold text-amber-900 block text-sm">Priority Standby / Waitlist Status</span>
                                    <p className="text-amber-800 leading-relaxed">
                                        Another applicant for <strong>{application.pet.name}</strong> is currently undergoing Municipal Agriculture Office (MAO) compliance audit. You are on priority standby: if the primary candidate does not pass or forfeits, your application will be immediately evaluated.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between flex-wrap gap-2">
                                <span className="text-[11px] text-amber-700 font-medium">
                                    Prefer not to wait? You can switch to another available pet or withdraw anytime with zero penalty.
                                </span>
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={route('pets.index')}
                                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), "text-xs border-amber-300 text-amber-900 hover:bg-amber-100/70 h-8")}
                                    >
                                        Browse Other Pets
                                    </Link>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                            if (confirm('Are you sure you want to withdraw from the waitlist? You will be able to apply for another pet immediately.')) {
                                                router.post(route('application.withdraw'));
                                            }
                                        }}
                                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
                                    >
                                        Withdraw from Standby
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── 2. Interactive Stepper ──────────────────────────────────────── */}
                <Card className="border-gray-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-5">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-[#D4A017]" />
                                Multi-Agency Adoption Workflow Status
                            </CardTitle>
                            {application.target_sla_at && application.status !== 'approved' && application.status !== 'rejected' && (
                                <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                                    Target SLA: {new Date(application.target_sla_at).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
                            {steps.map((s, idx) => {
                                const isPassed = currentStageIdx > idx || (currentStageIdx === idx && application.status === 'approved');
                                const isCurrent = currentStageIdx === idx && application.status !== 'approved' && application.status !== 'rejected';
                                const isDisapproved = currentStageIdx === idx && application.status === 'rejected';

                                return (
                                    <div
                                        key={s.num}
                                        className={`p-4 rounded-2xl border transition relative space-y-2 ${
                                            isPassed
                                                ? 'bg-green-50/40 border-green-200'
                                                : isCurrent
                                                ? 'bg-[#FDFBF7] border-[#D4A017] shadow-sm ring-2 ring-[#D4A017]/20'
                                                : isDisapproved
                                                ? 'bg-red-50/40 border-red-200'
                                                : 'bg-gray-50/40 border-gray-200 opacity-60'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                                    isPassed
                                                        ? 'bg-green-600 text-white'
                                                        : isCurrent
                                                        ? 'bg-[#D4A017] text-white'
                                                        : isDisapproved
                                                        ? 'bg-red-600 text-white'
                                                        : 'bg-gray-200 text-gray-600'
                                                }`}
                                            >
                                                {isPassed ? <Check className="h-4 w-4" /> : isDisapproved ? <X className="h-4 w-4" /> : s.num}
                                            </div>
                                            {s.date && (
                                                <span className="text-[10px] text-gray-400">
                                                    {new Date(s.date).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-900">{s.title}</h4>
                                            <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{s.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* ── 3. Approved State: Digital Adoption Pass / Certificate ─────── */}
                {application.status === 'approved' && (
                    <Card className="border-green-300 bg-gradient-to-br from-green-50/80 via-white to-emerald-50/40 shadow-md overflow-hidden">
                        <CardHeader className="border-b border-green-200 bg-green-100/40 p-6">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-green-600 text-white flex items-center justify-center shadow-md">
                                        <FileCheck className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-wider text-green-700">Official Municipal Certificate</div>
                                        <CardTitle className="text-xl font-black text-gray-900">
                                            Adoption Approved — Pickup Pass Issued
                                        </CardTitle>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {application.certificate_number && (
                                        <div className="bg-white border border-green-300 px-3.5 py-1.5 rounded-xl text-center shadow-xs">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 block">Certificate No.</span>
                                            <span className="font-mono font-black text-sm text-green-800">{application.certificate_number}</span>
                                        </div>
                                    )}
                                    <AdoptionPassModal application={application as any} />
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 space-y-4">
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        Congratulations! The <strong>Municipal Agriculture Office (MAO)</strong> has officially verified and approved your adoption application for <strong>{application.pet.name}</strong> under the <strong>Animal Welfare Act (RA 8485)</strong> and <strong>Anti-Rabies Act (RA 9482)</strong>.
                                    </p>

                                    <div className="bg-white border border-green-200 rounded-2xl p-5 space-y-3 shadow-xs">
                                        <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                                            <Calendar className="h-4 w-4 text-[#D4A017]" />
                                            7-Day Pet Pickup Schedule &amp; Instructions
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-600">
                                            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/50 space-y-1">
                                                <span className="font-bold text-gray-700 block">Pickup Deadline:</span>
                                                <span className="font-bold text-[#B8860B] text-sm">
                                                    {application.pickup_deadline_at
                                                        ? new Date(application.pickup_deadline_at).toLocaleDateString()
                                                        : 'Within 7 Days of Approval'}
                                                </span>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                                                <span className="font-bold text-gray-700 block">Pickup Facility:</span>
                                                <span>{application.pet.shelter.name} &bull; {application.pet.shelter.location}</span>
                                            </div>
                                            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200/50 space-y-1 sm:col-span-2">
                                                <span className="font-bold text-blue-900 block">Designated Animal Housing Location:</span>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-semibold text-gray-800 flex items-center gap-1">
                                                        <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                                        {application.pet.housing_area || 'Main Shelter Bay'}
                                                    </span>
                                                    {application.pet.tag_number && (
                                                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-[#B8860B]">
                                                            <Tag className="h-3 w-3 shrink-0" />
                                                            Collar Tag: {application.pet.tag_number}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-gray-100 text-xs text-gray-600 space-y-1.5">
                                            <span className="font-bold text-gray-800 block">What to Bring upon Pickup:</span>
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li>Your valid government-issued ID matching this application.</li>
                                                <li>Your Application Reference (<strong>{application.reference_number}</strong>).</li>
                                                <li>A secure pet crate / carrier (for cats) or a collar &amp; leash (for dogs).</li>
                                                {pricingEnabled && parseFloat(application.pet.adoption_fee) > 0 && (
                                                    <li>Adoption Fee: <strong>₱{parseFloat(application.pet.adoption_fee).toLocaleString()}</strong> in cash (in-person only).</li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 flex flex-col justify-between bg-white border border-green-200 rounded-2xl p-5 text-center shadow-xs">
                                    <div className="space-y-2">
                                        <div className="w-16 h-16 rounded-2xl bg-green-50 text-green-700 flex items-center justify-center mx-auto border border-green-200">
                                            <QrCode className="h-8 w-8" />
                                        </div>
                                        <h5 className="font-bold text-sm text-gray-900">Official Municipal Pass</h5>
                                        <p className="text-[11px] text-gray-500">Present this reference screen to Virac Animal Shelter staff during pet turnover.</p>
                                    </div>
                                    <Link
                                        href={route('pets.show', application.pet.id)}
                                        className={cn(buttonVariants({ variant: 'outline' }), "w-full text-xs font-semibold border-green-300 text-green-800 hover:bg-green-50")}
                                    >
                                        View Unlocked Pet Details &rarr;
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ── 4. Rejected State: Constructive Breakdown ───────────────────── */}
                {application.status === 'rejected' && (
                    <Card className="border-red-300 bg-red-50/40 shadow-sm overflow-hidden">
                        <CardHeader className="border-b border-red-200 bg-red-100/40 p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
                                    <ShieldAlert className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold text-red-900">
                                        Application Review Decision — Disapproved
                                    </CardTitle>
                                    <CardDescription className="text-xs text-red-700">
                                        Review assessed compatibility constraints under municipal shelter criteria
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 space-y-4">
                            <p className="text-xs text-gray-700 leading-relaxed">
                                Our municipal review team thoroughly evaluated your application. At this time, this specific pet's behavioral, space, or care requirements were not optimal for your current lifestyle profile.
                            </p>

                            {(application.mao_remarks || application.staff_notes) && (
                                <div className="bg-white border border-red-200 p-4 rounded-xl space-y-1">
                                    <span className="text-xs font-bold text-red-900 uppercase">Reviewer Feedback:</span>
                                    <p className="text-xs text-gray-700 italic">
                                        "{application.mao_remarks || application.staff_notes}"
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-3 pt-2">
                                <Link
                                    href={route('pets.index')}
                                    className={cn(buttonVariants({ variant: 'default' }), "bg-[#D4A017] hover:bg-[#B8860B] text-white text-xs font-semibold")}
                                >
                                    Browse Other Compatible Pets
                                </Link>
                                <Link
                                    href={route('onboarding.lifestyle.edit')}
                                    className={cn(buttonVariants({ variant: 'outline' }), "text-xs font-semibold")}
                                >
                                    Update Lifestyle Profile
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ── 5. Automated DSS Alternative Pet Recommendations ─────────────── */}
                {recommendedPets.length > 0 && (
                    <Card className="border-[#D4A017]/40 bg-gradient-to-b from-white via-amber-50/20 to-amber-50/30 shadow-sm overflow-hidden">
                        <CardHeader className="bg-[#F5EDD7]/60 border-b border-[#D4A017]/20 p-5">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-[#D4A017]" />
                                        <CardTitle className="text-base font-bold text-gray-900">
                                            Recommended Compatible Matches for You
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-xs text-gray-600">
                                        Based on your verified lifestyle profile, our DSS matching algorithm identified these available pets as top companions.
                                    </CardDescription>
                                </div>
                                <Badge className="bg-[#D4A017] text-white font-bold text-xs gap-1">
                                    <HeartHandshake className="h-3.5 w-3.5" /> Instant Transfer
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {recommendedPets.map((rec) => {
                                    const recPhoto = rec.pet.photos?.[0]?.photo_path || '/placeholder-pet.png';
                                    return (
                                        <div key={rec.pet.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                                            <div>
                                                <div className="h-40 bg-gray-100 relative overflow-hidden">
                                                    <img src={recPhoto} alt={rec.pet.name} className="w-full h-full object-cover" />
                                                    <div className="absolute top-2 right-2">
                                                        <span className="inline-flex items-center gap-1 font-black text-xs text-[#B8860B] bg-white/95 px-2 py-0.5 rounded-lg shadow-sm border border-amber-200">
                                                            <Sparkles className="h-3 w-3" />
                                                            {Math.round(rec.total_score)}% Match
                                                        </span>
                                                    </div>
                                                    {rec.fast_track_eligible && (
                                                        <div className="absolute bottom-2 left-2">
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-emerald-600 px-2 py-0.5 rounded-md shadow-sm">
                                                                <Zap className="h-3 w-3 fill-white" /> Fast-Track
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="p-4 space-y-2">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-bold text-sm text-gray-900">{rec.pet.name}</h4>
                                                            <p className="text-[11px] text-gray-500 capitalize">{rec.pet.species} &bull; {rec.pet.age_years} yr(s)</p>
                                                        </div>
                                                    </div>

                                                    {rec.match_reasons && rec.match_reasons.length > 0 && (
                                                        <div className="p-2 bg-green-50/70 rounded-lg border border-green-200/60 text-[11px] text-green-900 space-y-0.5">
                                                            <span className="font-bold block text-[10px] uppercase text-green-800">Match Highlight:</span>
                                                            <p className="text-[10px] leading-tight text-green-700">{rec.match_reasons[0]}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="p-4 pt-0 space-y-2">
                                                <Button
                                                    onClick={() => router.post(route('application.transfer'), { pet_id: rec.pet.id })}
                                                    className="w-full bg-[#D4A017] hover:bg-[#B8860B] text-white text-xs font-bold shadow-xs gap-1.5 h-9"
                                                >
                                                    Apply to This Pet
                                                    <ArrowRight className="h-3.5 w-3.5" />
                                                </Button>
                                                <Link href={route('pets.show', rec.pet.id)} className="block text-center text-[11px] text-gray-500 hover:text-gray-900 font-medium">
                                                    View Pet Profile
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ── 5. Review Notes from Shelter/MAO for Pending / In-Review ───── */}
                {(application.status === 'pending' || application.status === 'under_review' || application.status === 'mao_audit') && (
                    <Card className="border-amber-200/80 bg-amber-50/30 shadow-xs">
                        <CardContent className="p-5 flex items-start gap-4">
                            <Building className="h-5 w-5 text-[#D4A017] shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                                    {application.status === 'mao_audit' ? 'Municipal Compliance Audit in Progress' : 'Shelter Review in Progress'}
                                </h4>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    {application.status === 'mao_audit'
                                        ? 'Shelter screening has endorsed your application. The Municipal Agriculture Office is now conducting statutory verification under RA 8485.'
                                        : (application.staff_notes || 'Thank you for your application. Shelter staff are reviewing your home setup and lifestyle profile. Expected review time is within 24 to 48 hours.')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ── 6. Full Audit Trail Timeline ────────────────────────────────── */}
                <ApplicationTimelineCard
                    timelines={application.timelines || []}
                    status={application.status}
                    slaTarget={application.target_sla_at}
                    certificateNumber={application.certificate_number}
                />
            </div>

            {/* ── 7. Clean Print-Only Formal Adoption Pass ─────────────────────── */}
            {application.status === 'approved' && (
                <div className="hidden print:block w-full">
                    <AdoptionPickupPass application={application as any} />
                </div>
            )}
        </AppLayout>
    );
}
