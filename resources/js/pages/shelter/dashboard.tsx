import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    ClipboardList, 
    ShieldAlert, 
    Award, 
    Cat, 
    PlusCircle, 
    ArrowRight, 
    FileText, 
    Megaphone, 
    Sparkles, 
    Tag, 
    Eye,
    CheckCircle2
} from 'lucide-react';

interface Metric {
    pending_applications: number;
    under_review_applications: number;
    mao_audit_applications: number;
    approved_adoptions: number;
    pets_available: number;
    pets_adopted: number;
    total_pets: number;
}

interface Application {
    id: number;
    reference_number: string;
    status: string;
    dss_score: number;
    submitted_at: string;
    adopter: { name: string; email: string };
    pet: { 
        name: string; 
        species: string;
        shelter: { name: string };
        photos?: { photo_path: string; is_primary: boolean }[];
    };
}

interface PetItem {
    id: number;
    name: string;
    species: string;
    breed: string;
    status: string;
    tag_number?: string | null;
    microchip_number?: string | null;
    photos?: { photo_path: string; is_primary: boolean }[];
}

interface AnnouncementItem {
    id: number;
    title: string;
    category: string;
    content: string;
    is_published: boolean;
    published_at?: string;
}

export default function ShelterDashboard({
    metrics,
    recentApplications,
    recentPets,
    recentAnnouncements,
}: {
    metrics: Metric;
    recentApplications: Application[];
    recentPets: PetItem[];
    recentAnnouncements: AnnouncementItem[];
}) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Shelter Staff Dashboard', href: '#' }]}>
            <Head title="Shelter Staff Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 md:p-6">
                
                {/* Welcome Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-neutral-900 dark:to-neutral-900/50 border border-amber-200/60 dark:border-neutral-800 p-6 rounded-2xl shadow-xs">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-2 bg-[#D4A017] text-white rounded-xl shadow-xs">
                                <Cat className="size-6" />
                            </span>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shelter Operations Hub</h1>
                                <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                                    Manage shelter pets, review inbound adoption applications, and broadcast shelter announcements.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        <Link href={route('shelter.pets.create')}>
                            <Button className="bg-[#D4A017] hover:bg-[#B8860B] text-white font-semibold flex items-center gap-1.5 shadow-sm text-xs">
                                <PlusCircle className="size-4" /> Add New Pet
                            </Button>
                        </Link>
                        <Link href={route('shelter.cms.announcements.index')}>
                            <Button variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100/60 dark:border-neutral-700 dark:text-neutral-200 text-xs gap-1.5">
                                <Megaphone className="size-4 text-[#D4A017]" /> New Notice
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* KPI Metrics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        {
                            title: 'Needs Review',
                            val: metrics.pending_applications,
                            sub: 'Pending initial review',
                            icon: ClipboardList,
                            color: 'text-amber-600',
                            bgColor: 'bg-amber-50 dark:bg-amber-950/30',
                            border: 'border-amber-200 dark:border-amber-900/50',
                        },
                        {
                            title: 'Under Review',
                            val: metrics.under_review_applications,
                            sub: 'Staff processing',
                            icon: ShieldAlert,
                            color: 'text-blue-600',
                            bgColor: 'bg-blue-50 dark:bg-blue-950/30',
                            border: 'border-blue-200 dark:border-blue-900/50',
                        },
                        {
                            title: 'Pets Available',
                            val: metrics.pets_available,
                            sub: `${metrics.total_pets} total registered`,
                            icon: Award,
                            color: 'text-emerald-600',
                            bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
                            border: 'border-emerald-200 dark:border-emerald-900/50',
                        },
                        {
                            title: 'Adoptions Completed',
                            val: metrics.approved_adoptions,
                            sub: 'Permanently rehomed',
                            icon: CheckCircle2,
                            color: 'text-purple-600',
                            bgColor: 'bg-purple-50 dark:bg-purple-950/30',
                            border: 'border-purple-200 dark:border-purple-900/50',
                        },
                    ].map(card => (
                        <Card key={card.title} className={`border ${card.border} shadow-xs hover:shadow-md transition`}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <span className="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide">
                                    {card.title}
                                </span>
                                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                                    <card.icon className={`h-4 w-4 ${card.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{card.val}</div>
                                <span className="text-[11px] text-gray-400 dark:text-neutral-500 block mt-1">{card.sub}</span>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Main Content Grid: Recent Applications & Sidebar Widgets */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Recent Applications (Col Span 2) */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-gray-200 dark:border-neutral-800 shadow-xs">
                            <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <div>
                                    <CardTitle className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        <ClipboardList className="size-4 text-[#D4A017]" />
                                        Inbound Adoption Requests
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Recent applications submitted to your shelter requiring review and scoring verification.
                                    </CardDescription>
                                </div>
                                <Link href={route('shelter.applications.index')}>
                                    <Button variant="ghost" size="sm" className="text-xs text-[#D4A017] hover:text-[#B8860B] gap-1">
                                        View All <ArrowRight className="size-3.5" />
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent className="p-0 border-t border-gray-100 dark:border-neutral-800 overflow-x-auto">
                                {recentApplications.length === 0 ? (
                                    <div className="p-8 text-center text-xs text-gray-400">
                                        No recent adoption applications found.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100 dark:divide-neutral-800">
                                        {recentApplications.map(app => {
                                            const photo = app.pet.photos?.find(p => p.is_primary)?.photo_path || '/placeholder-pet.png';
                                            return (
                                                <div key={app.id} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50/60 dark:hover:bg-neutral-800/40 transition">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <img 
                                                            src={photo} 
                                                            alt={app.pet.name} 
                                                            className="size-10 rounded-full object-cover border border-amber-200 shrink-0" 
                                                        />
                                                        <div className="truncate">
                                                            <div className="font-semibold text-xs text-gray-900 dark:text-white truncate">
                                                                {app.adopter.name}
                                                            </div>
                                                            <div className="text-[11px] text-gray-500 dark:text-neutral-400">
                                                                Adopting: <span className="font-medium text-gray-700 dark:text-neutral-200">{app.pet.name}</span>
                                                            </div>
                                                            <div className="text-[10px] text-gray-400 font-mono">
                                                                Ref: {app.reference_number}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 shrink-0">
                                                        {app.dss_score !== undefined && (
                                                            <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-[#B8860B] border border-amber-200">
                                                                <Sparkles className="size-3" />
                                                                {Math.round(app.dss_score)}% DSS
                                                            </span>
                                                        )}

                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                            app.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                            app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                            app.status === 'under_review' ? 'bg-blue-100 text-blue-700' :
                                                            app.status === 'mao_audit' ? 'bg-purple-100 text-purple-700' :
                                                            'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {app.status.replace('_', ' ')}
                                                        </span>

                                                        <Link href={route('shelter.applications.show', app.id)}>
                                                            <Button size="sm" variant="secondary" className="h-7 text-xs px-2.5">
                                                                <Eye className="size-3.5 mr-1" /> Review
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Pets Catalog Quick-Glance */}
                        <Card className="border-gray-200 dark:border-neutral-800 shadow-xs">
                            <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <div>
                                    <CardTitle className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        <Cat className="size-4 text-[#D4A017]" />
                                        Shelter Pet Profiles
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Recently listed animals ready for adoption matching.
                                    </CardDescription>
                                </div>
                                <Link href={route('shelter.pets.index')}>
                                    <Button variant="ghost" size="sm" className="text-xs text-[#D4A017] hover:text-[#B8860B] gap-1">
                                        Manage All <ArrowRight className="size-3.5" />
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent className="p-0 border-t border-gray-100 dark:border-neutral-800">
                                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-neutral-800">
                                    {recentPets.map(pet => {
                                        const photo = pet.photos?.find(p => p.is_primary)?.photo_path || '/placeholder-pet.png';
                                        return (
                                            <div key={pet.id} className="p-4 flex items-center gap-3 hover:bg-gray-50/50 dark:hover:bg-neutral-800/40 transition">
                                                <img 
                                                    src={photo} 
                                                    alt={pet.name} 
                                                    className="size-12 rounded-xl object-cover border border-gray-200 shrink-0" 
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <span className="font-bold text-xs text-gray-900 dark:text-white truncate">
                                                            {pet.name}
                                                        </span>
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize ${
                                                            pet.status === 'available' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                            pet.status === 'adopted' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                                            'bg-gray-50 text-gray-600 border border-gray-200'
                                                        }`}>
                                                            {pet.status}
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-gray-500 dark:text-neutral-400 capitalize">
                                                        {pet.species} &bull; {pet.breed || 'Mixed'}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        {pet.tag_number && (
                                                            <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 font-mono">
                                                                <Tag className="size-2.5" /> {pet.tag_number}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Quick Links & Shelter Announcements */}
                    <div className="space-y-6">
                        {/* Quick Actions Panel */}
                        <Card className="border-gray-200 dark:border-neutral-800 shadow-xs">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold text-gray-800 dark:text-white">Quick Tasks</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Link href={route('shelter.pets.create')} className="block">
                                    <Button variant="outline" className="w-full justify-start text-xs h-9 gap-2">
                                        <PlusCircle className="size-4 text-[#D4A017]" />
                                        Register New Pet
                                    </Button>
                                </Link>
                                <Link href={route('shelter.applications.index')} className="block">
                                    <Button variant="outline" className="w-full justify-start text-xs h-9 gap-2">
                                        <ClipboardList className="size-4 text-blue-500" />
                                        Review Applications ({metrics.pending_applications})
                                    </Button>
                                </Link>
                                <Link href={route('shelter.reports.index')} className="block">
                                    <Button variant="outline" className="w-full justify-start text-xs h-9 gap-2">
                                        <FileText className="size-4 text-emerald-500" />
                                        Adoption Analytics &amp; Reports
                                    </Button>
                                </Link>
                                <Link href={route('shelter.cms.announcements.index')} className="block">
                                    <Button variant="outline" className="w-full justify-start text-xs h-9 gap-2">
                                        <Megaphone className="size-4 text-purple-500" />
                                        Manage Announcements
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        {/* Recent Announcements Widget */}
                        <Card className="border-gray-200 dark:border-neutral-800 shadow-xs">
                            <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <div>
                                    <CardTitle className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
                                        <Megaphone className="size-4 text-[#D4A017]" />
                                        Public Announcements
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Broadcasted on the public portal
                                    </CardDescription>
                                </div>
                                <Link href={route('shelter.cms.announcements.index')}>
                                    <Button variant="ghost" size="sm" className="text-xs text-[#D4A017]">
                                        Edit
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent className="p-0 border-t border-gray-100 dark:border-neutral-800">
                                {recentAnnouncements.length === 0 ? (
                                    <div className="p-6 text-center text-xs text-gray-400">
                                        No announcements published yet.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100 dark:divide-neutral-800">
                                        {recentAnnouncements.map(notice => (
                                            <div key={notice.id} className="p-3.5 space-y-1 hover:bg-gray-50/50 transition">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                                        {notice.category}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        {notice.published_at ? new Date(notice.published_at).toLocaleDateString() : 'Draft'}
                                                    </span>
                                                </div>
                                                <h4 className="text-xs font-semibold text-gray-800 dark:text-neutral-200 line-clamp-1">
                                                    {notice.title}
                                                </h4>
                                                <p className="text-[11px] text-gray-500 dark:text-neutral-400 line-clamp-2">
                                                    {notice.content}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                </div>

            </div>
        </AppLayout>
    );
}
