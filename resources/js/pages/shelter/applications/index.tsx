import { useState, useRef, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    FileText,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { ConfirmPetReleaseModal } from '@/components/confirm-pet-release-modal';
import { AdoptionCertificateModal } from '@/components/adoption-certificate-modal';
import { AdoptionPassModal } from '@/components/adoption-pass-modal';
import { IdDocumentInspectorModal } from '@/components/id-document-inspector-modal';
import { IdentityVerificationReport } from '@/components/identity-verification-report';
import { IdentityVerificationBadge } from '@/components/identity-verification-badge';
import { DssScoreCard } from '@/components/dss-score-card';
import { ApplicationTimelineCard, TimelineEvent } from '@/components/application-timeline-card';

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
    staff_decision?: string | null;
    staff_notes?: string | null;
    target_sla_at?: string | null;
    pickup_deadline_at?: string | null;
    released_at?: string | null;
    releasing_notes?: string | null;
    certificate_number?: string | null;
    submitted_at: string;
    user_id: number;
    pet_id: number;
    adopter: {
        id: number;
        name: string;
        email: string;
        phone?: string | null;
        adopter_profile?: {
            id?: number;
            user_id?: number;
            full_name?: string | null;
            contact_number?: string | null;
            date_of_birth?: string | null;
            home_address?: string | null;
            valid_id_type?: string | null;
            valid_id_number?: string | null;
            is_identity_verified?: boolean;
            face_match_score?: number | null;
            liveness_verified?: boolean;
            identity_verified_at?: string | null;
            id_document_path?: string | null;
            id_document_name?: string | null;
            id_document_back_path?: string | null;
            id_document_back_name?: string | null;
            had_pets_before?: string;
            previous_pet_notes?: string | null;
            surrendered_pet?: boolean;
            adoption_reason?: string;
            adoption_reason_text?: string;
            pet_stay?: string;
        } | null;
        latest_didit_verification?: any;
        lifestyle_profile?: {
            housing_type?: string;
            has_aircon?: string;
            outdoor_access?: string;
            activity_level?: string;
            work_schedule?: string;
            household_size?: number;
            household_agrees?: boolean;
            has_children?: string;
            other_pets?: string;
            occupation?: string;
            monthly_income?: string;
            pet_experience?: string;
            health_conditions?: string[];
        } | null;
    };
    pet: {
        id: number;
        name: string;
        species: string;
        breed?: string | null;
        tag_number?: string | null;
        microchip_number?: string | null;
        housing_area?: string | null;
        housing_notes?: string | null;
        intake_date?: string | null;
        age_years?: number;
        gender?: string;
        size?: string;
        energy_level?: string;
        coat_color?: string | null;
        health_status?: string | null;
        temperament?: string[] | null;
        maintenance_level?: string | null;
        description?: string | null;
        requires_yard?: boolean;
        requires_experience?: boolean;
        requires_no_children?: boolean;
        requires_no_other_pets?: boolean;
        photos?: Array<{ id: number; photo_path?: string; photo_url?: string; is_primary?: boolean }>;
        shelter: { name: string; location?: string };
    };
    staff?: { id: number; name: string } | null;
    releasing_officer?: { id: number; name: string } | null;
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

type PaginatedApplications = {
    data: Application[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

const STATUS_BADGE: Record<string, string> = {
    pending:      'bg-amber-100 text-amber-800 border-amber-200',
    under_review: 'bg-blue-100 text-blue-800 border-blue-200',
    mao_audit:    'bg-purple-100 text-purple-800 border-purple-200',
    approved:     'bg-green-100 text-green-800 border-green-200',
    rejected:     'bg-red-100 text-red-800 border-red-200',
    completed:    'bg-emerald-100 text-emerald-800 border-emerald-300',
    unclaimed:    'bg-gray-100 text-gray-700 border-gray-300',
};

const STATUS_LABELS: Record<string, string> = {
    pending:      'PENDING',
    under_review: 'UNDER REVIEW',
    mao_audit:    'MAO AUDIT',
    approved:     'APPROVED',
    rejected:     'REJECTED',
    completed:    'RELEASED',
    unclaimed:    'UNCLAIMED',
};

export default function ShelterApplicationIndex({
    applications,
    selectedApplication,
    dssMatch,
    competingApplications = [],
    adopterTrackRecord,
    filters,
}: {
    applications: PaginatedApplications;
    selectedApplication?: Application | null;
    dssMatch?: any;
    competingApplications?: CompetingApp[];
    adopterTrackRecord?: AdopterTrackRecord | null;
    filters: {
        status?: string;
        search?: string;
        sort?: string;
        year?: string;
        selected?: number;
    };
}) {
    const [viewMode, setViewMode] = useState<'split' | 'table'>('split');
    const [activeTab, setActiveTab] = useState<'compatibility' | 'pet' | 'identity' | 'profile' | 'welfare' | 'audit'>('compatibility');
    const [selectedPhotoIdx, setSelectedPhotoIdx] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [yearFilter, setYearFilter] = useState(filters.year || 'all');
    const [sortFilter, setSortFilter] = useState(filters.sort || 'newest');

    const tabsListRef = useRef<HTMLDivElement>(null);

    // Active inspection modal state
    const [activeIdModal, setActiveIdModal] = useState<{ open: boolean; side: 'front' | 'back' }>({
        open: false,
        side: 'front',
    });

    // Screening decision modal state
    const [isScreeningModalOpen, setIsScreeningModalOpen] = useState(false);

    // Decision form state
    const { data: decisionData, setData: setDecisionData, patch, processing } = useForm({
        decision: 'suitable',
        notes: '',
    });

    // Reset decision form if selected application changes
    useEffect(() => {
        if (selectedApplication) {
            setDecisionData({
                decision: selectedApplication.staff_decision || 'suitable',
                notes: selectedApplication.staff_notes || '',
            });
            setSelectedPhotoIdx(0);
        }
    }, [selectedApplication?.id]);

    const handleSelectApplication = (appId: number) => {
        if (appId === selectedApplication?.id) {
            return;
        }

        router.get(
            route('shelter.applications.index'),
            {
                search: searchTerm || undefined,
                status: statusFilter === 'all' ? undefined : statusFilter,
                year: yearFilter === 'all' ? undefined : yearFilter,
                sort: sortFilter !== 'newest' ? sortFilter : undefined,
                selected: appId,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['selectedApplication', 'dssMatch', 'competingApplications', 'adopterTrackRecord', 'filters'],
            }
        );
    };

    const handleFilterChange = (updates: Partial<{ search: string; status: string; year: string; sort: string }>) => {
        const newSearch = updates.search !== undefined ? updates.search : searchTerm;
        const newStatus = updates.status !== undefined ? updates.status : statusFilter;
        const newYear = updates.year !== undefined ? updates.year : yearFilter;
        const newSort = updates.sort !== undefined ? updates.sort : sortFilter;

        if (updates.search !== undefined) setSearchTerm(newSearch);
        if (updates.status !== undefined) setStatusFilter(newStatus);
        if (updates.year !== undefined) setYearFilter(newYear);
        if (updates.sort !== undefined) setSortFilter(newSort);

        router.get(
            route('shelter.applications.index'),
            {
                search: newSearch || undefined,
                status: newStatus === 'all' ? undefined : newStatus,
                year: newYear === 'all' ? undefined : newYear,
                sort: newSort !== 'newest' ? newSort : undefined,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilterChange({ search: searchTerm });
    };

    const scrollTabs = (direction: 'left' | 'right') => {
        if (tabsListRef.current) {
            const offset = direction === 'left' ? -180 : 180;
            tabsListRef.current.scrollBy({ left: offset, behavior: 'smooth' });
        }
    };

    const handleDecisionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedApplication) return;
        patch(route('shelter.applications.update', selectedApplication.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsScreeningModalOpen(false);
            },
        });
    };

    const activeProfile = selectedApplication?.adopter?.adopter_profile;
    const activeLifestyle = selectedApplication?.adopter?.lifestyle_profile;
    const isSelectedProcessed = selectedApplication?.status !== 'pending' && selectedApplication?.status !== 'under_review';
    const petPhotos = selectedApplication?.pet?.photos || [];
    const currentPetPhoto = petPhotos[selectedPhotoIdx]?.photo_path
        || petPhotos[selectedPhotoIdx]?.photo_url
        || petPhotos.find(p => p.is_primary)?.photo_path
        || petPhotos[0]?.photo_path
        || null;

    return (
        <AppLayout breadcrumbs={[{ title: 'Review Applications', href: '#' }]}>
            <Head title="Review Applications - Master Dossier" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 max-w-[1600px] mx-auto w-full">

                {/* Top Action & View Toolbar */}
                <div className="flex justify-between items-center flex-wrap gap-4 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                            Adoption Applications Desk
                        </h1>
                        <p className="text-xs text-gray-500">
                            Intelligent applicant screening, 8-factor DSS matching, and municipal welfare verification.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* View Switcher */}
                        {/* <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                            <button
                                type="button"
                                onClick={() => setViewMode('split')}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                                    viewMode === 'split'
                                        ? 'bg-white text-gray-900 shadow-2xs'
                                        : 'text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                Split View
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('table')}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                                    viewMode === 'table'
                                        ? 'bg-white text-gray-900 shadow-2xs'
                                        : 'text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                Table View
                            </button>
                        </div> */}
                    </div>
                </div>

                {/* Classic Table View Fallback */}
                {viewMode === 'table' ? (
                    <Card className="border-gray-200">
                        <CardContent className="p-0 overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-gray-50/50 text-gray-500 font-semibold border-b border-gray-100">
                                    <tr>
                                        <th className="p-3">Reference No</th>
                                        <th className="p-3">Adopter Name</th>
                                        <th className="p-3">Pet Name</th>
                                        <th className="p-3">Shelter</th>
                                        <th className="p-3 text-center">DSS Score</th>
                                        <th className="p-3 text-center">Status</th>
                                        <th className="p-3">Date Applied</th>
                                        <th className="p-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                    {applications.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="p-8 text-center text-gray-400">
                                                No applications found matching criteria.
                                            </td>
                                        </tr>
                                    ) : applications.data.map(app => (
                                        <tr key={app.id} className="hover:bg-gray-50/20">
                                            <td className="p-3 font-semibold text-gray-800">{app.reference_number}</td>
                                            <td className="p-3 font-medium">{app.adopter.name}</td>
                                            <td className="p-3 font-semibold text-gray-900">{app.pet.name}</td>
                                            <td className="p-3 text-gray-400">{app.pet.shelter.name}</td>
                                            <td className="p-3 text-center font-bold text-[#D4A017]">
                                                {Math.round(parseFloat(app.dss_score))}%
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${STATUS_BADGE[app.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                                    {STATUS_LABELS[app.status] || app.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="p-3 text-gray-400">
                                                {new Date(app.submitted_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {app.status === 'approved' && (
                                                        <ConfirmPetReleaseModal
                                                            application={app as any}
                                                            routePrefix="shelter"
                                                            trigger={
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-7 px-2.5 shadow-xs cursor-pointer"
                                                                >
                                                                    Release
                                                                </Button>
                                                            }
                                                        />
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            handleSelectApplication(app.id);
                                                            setViewMode('split');
                                                        }}
                                                        className="text-xs border-[#D4A017]/40 text-[#D4A017] hover:bg-[#D4A017]/10 h-7 px-2.5 cursor-pointer"
                                                    >
                                                        Review Dossier
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                ) : (
                    /* Master-Detail Split View */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                        
                        {/* ──────────────────────────────────────────────────────────── */}
                        {/* LEFT COLUMN: SCROLLABLE APPLICATION MASTER LIST             */}
                        {/* ──────────────────────────────────────────────────────────── */}
                        <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-3 bg-white p-4 rounded-2xl border border-gray-200/90 shadow-2xs">
                            
                            <div className="space-y-2.5">
                                <h2 className="text-base font-bold text-gray-900">
                                    Applications
                                </h2>

                                {/* Search Bar */}
                                <form onSubmit={handleSearchSubmit} className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                                    <Input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search Reference, Adopter, Pet..."
                                        className="pl-9 pr-3 h-9 text-xs bg-gray-50/70 border-gray-200 focus:bg-white rounded-xl"
                                    />
                                </form>

                                {/* Filter Controls Row */}
                                <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                                    {/* Status Filter */}
                                    <Select
                                        value={statusFilter}
                                        onValueChange={(val) => handleFilterChange({ status: val })}
                                    >
                                        <SelectTrigger className="h-8 text-[11px] bg-white border-gray-200 px-2 rounded-lg font-medium shadow-2xs truncate">
                                            <SelectValue placeholder="All Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">ALL STATUS</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="under_review">Under Review</SelectItem>
                                            <SelectItem value="mao_audit">MAO Audit</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="completed">Released</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                            <SelectItem value="unclaimed">Unclaimed</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {/* Year Filter */}
                                    <Select
                                        value={yearFilter}
                                        onValueChange={(val) => handleFilterChange({ year: val })}
                                    >
                                        <SelectTrigger className="h-8 text-[11px] bg-white border-gray-200 px-2 rounded-lg font-medium shadow-2xs truncate">
                                            <SelectValue placeholder="All Years" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">ALL YEARS</SelectItem>
                                            <SelectItem value="2026">2026</SelectItem>
                                            <SelectItem value="2025">2025</SelectItem>
                                            <SelectItem value="2024">2024</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {/* Sort Filter */}
                                    <Select
                                        value={sortFilter}
                                        onValueChange={(val) => handleFilterChange({ sort: val })}
                                    >
                                        <SelectTrigger className="h-8 text-[11px] bg-white border-gray-200 px-2 rounded-lg font-medium shadow-2xs truncate">
                                            <SelectValue placeholder="Sort" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="newest">Newest</SelectItem>
                                            <SelectItem value="oldest">Oldest</SelectItem>
                                            <SelectItem value="dss_high">Highest Match</SelectItem>
                                            <SelectItem value="dss_low">Lowest Match</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* List Summary & Compact Pagination Indicator */}
                            <div className="flex items-center justify-between text-xs text-gray-500 pt-1 pb-1 border-b border-gray-100">
                                <span className="font-semibold text-gray-700">
                                    Application List ({applications.total})
                                </span>
                                <div className="flex items-center gap-1.5 text-[11px]">
                                    <span>
                                        Page {applications.current_page} of {applications.last_page || 1}
                                    </span>
                                    <div className="flex items-center gap-0.5">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            disabled={applications.current_page <= 1}
                                            onClick={() => {
                                                const prev = applications.links.find(l => l.label.includes('Previous'));
                                                if (prev?.url) router.get(prev.url);
                                            }}
                                            className="size-6 p-0 h-6 w-6 text-gray-500 hover:text-gray-900 disabled:opacity-30 cursor-pointer"
                                        >
                                            <ChevronLeft className="size-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            disabled={applications.current_page >= applications.last_page}
                                            onClick={() => {
                                                const next = applications.links.find(l => l.label.includes('Next'));
                                                if (next?.url) router.get(next.url);
                                            }}
                                            className="size-6 p-0 h-6 w-6 text-gray-500 hover:text-gray-900 disabled:opacity-30 cursor-pointer"
                                        >
                                            <ChevronRight className="size-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable Cards Container */}
                            <div className="flex flex-col gap-2.5 max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
                                {applications.data.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400 text-xs">
                                        No applications found.
                                    </div>
                                ) : (
                                    applications.data.map((app) => {
                                        const isSelected = selectedApplication?.id === app.id;
                                        return (
                                            <div
                                                key={app.id}
                                                onClick={() => handleSelectApplication(app.id)}
                                                className={`relative group rounded-xl p-3.5 border transition cursor-pointer select-none ${
                                                    isSelected
                                                        ? 'bg-gradient-to-r from-amber-500/10 via-[#FDF9EE] to-amber-500/5 text-gray-900 border-[#D4A017] shadow-sm ring-2 ring-[#D4A017]/30'
                                                        : 'bg-white text-gray-800 border-gray-200/90 hover:border-amber-300/80 hover:bg-amber-50/20 shadow-2xs'
                                                }`}
                                            >
                                                {/* Arrow pointer indicator on active card (pointing right to detail pane) */}
                                                {isSelected && (
                                                    <div 
                                                        className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0 border-y-8 border-y-transparent border-l-8 border-l-[#D4A017] z-10" 
                                                        aria-hidden="true"
                                                    />
                                                )}

                                                <div className="flex justify-between items-center gap-2">
                                                    <div className="min-w-0 flex-1 space-y-0.5">
                                                        <h3 className={`font-bold text-sm leading-tight truncate uppercase ${
                                                            isSelected ? 'text-[#8B6508] font-black' : 'text-gray-900'
                                                        }`}>
                                                            {app.adopter.name}
                                                        </h3>
                                                        <p className={`text-[11px] font-mono font-medium truncate ${
                                                            isSelected ? 'text-[#B8860B] font-bold' : 'text-blue-600'
                                                        }`}>
                                                            {app.reference_number}
                                                        </p>
                                                    </div>

                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase shrink-0 border ${
                                                        STATUS_BADGE[app.status] ?? 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {STATUS_LABELS[app.status] || app.status.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* ──────────────────────────────────────────────────────────── */}
                        {/* RIGHT COLUMN: DETAIL DOSSIER & TABBED WORKSPACE             */}
                        {/* ──────────────────────────────────────────────────────────── */}
                        <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-4 bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs min-h-[640px]">
                            {selectedApplication ? (
                                <>
                                    {/* Detail Top Header */}
                                    <div className="flex justify-between items-center flex-wrap gap-4 pb-4 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="size-12 rounded-full bg-gradient-to-tr from-[#D4A017] to-amber-200 flex items-center justify-center text-gray-900 font-black text-lg shadow-2xs">
                                                {selectedApplication.adopter.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                                                        {selectedApplication.adopter.name}
                                                    </h2>
                                                    {selectedApplication.fast_track_eligible && (
                                                        <Badge className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5">
                                                            Fast-Track
                                                        </Badge>
                                                    )}
                                                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider border ${STATUS_BADGE[selectedApplication.status] ?? 'bg-gray-100 text-gray-700'}`}>
                                                        {STATUS_LABELS[selectedApplication.status] || selectedApplication.status.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                                    <span>Ref: <strong className="font-mono text-gray-800">{selectedApplication.reference_number}</strong></span>
                                                    <span>&bull;</span>
                                                    <span>Applying for: <strong className="text-gray-900">{selectedApplication.pet.name}</strong> ({selectedApplication.pet.breed || selectedApplication.pet.species})</span>
                                                    <span>&bull;</span>
                                                    <span>Shelter: <span className="text-gray-700">{selectedApplication.pet.shelter.name}</span></span>
                                                </p>

                                                {/* Action Buttons under Adopter Name: Approve (pending) / Print Pass & Cert & Release (ready for adoption) */}
                                                <div className="flex items-center gap-2 flex-wrap mt-3">
                                                    {(!isSelectedProcessed || ['pending', 'under_review'].includes(selectedApplication.status)) && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                if (!isSelectedProcessed) {
                                                                    setDecisionData('decision', 'suitable');
                                                                }
                                                                setIsScreeningModalOpen(true);
                                                            }}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 rounded-lg shadow-xs cursor-pointer transition"
                                                        >
                                                            Approve
                                                        </Button>
                                                    )}
                                                    {selectedApplication.status === 'approved' && (
                                                        <>
                                                            <ConfirmPetReleaseModal application={selectedApplication as any} routePrefix="shelter" />
                                                            <AdoptionPassModal application={selectedApplication as any} />
                                                            <AdoptionCertificateModal application={selectedApplication as any} />
                                                        </>
                                                    )}
                                                    {selectedApplication.status === 'completed' && (
                                                        <>
                                                            <AdoptionPassModal application={selectedApplication as any} />
                                                            <AdoptionCertificateModal application={selectedApplication as any} />
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Horizontal Pill Tab Bar with Scroll Chevrons */}
                                    <div className="flex items-center gap-1.5 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => scrollTabs('left')}
                                            className="p-1 rounded-md text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition cursor-pointer shrink-0"
                                            title="Scroll tabs left"
                                        >
                                            <ChevronLeft className="size-4" />
                                        </button>

                                        <div
                                            ref={tabsListRef}
                                            className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('compatibility')}
                                                className={`px-4 py-2 rounded-lg text-xs transition cursor-pointer ${
                                                    activeTab === 'compatibility'
                                                        ? 'bg-[#D4A017] hover:bg-[#B8860B] text-white font-bold shadow-xs'
                                                        : 'bg-neutral-100 text-neutral-600 hover:bg-amber-50 hover:text-[#B8860B] font-medium'
                                                }`}
                                            >
                                                Compatibility
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('pet')}
                                                className={`px-4 py-2 rounded-lg text-xs transition cursor-pointer ${
                                                    activeTab === 'pet'
                                                        ? 'bg-[#D4A017] hover:bg-[#B8860B] text-white font-bold shadow-xs'
                                                        : 'bg-neutral-100 text-neutral-600 hover:bg-amber-50 hover:text-[#B8860B] font-medium'
                                                }`}
                                            >
                                                Pet Profile
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('identity')}
                                                className={`px-4 py-2 rounded-lg text-xs transition cursor-pointer ${
                                                    activeTab === 'identity'
                                                        ? 'bg-[#D4A017] hover:bg-[#B8860B] text-white font-bold shadow-xs'
                                                        : 'bg-neutral-100 text-neutral-600 hover:bg-amber-50 hover:text-[#B8860B] font-medium'
                                                }`}
                                            >
                                                Applicant &amp; Identity
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('profile')}
                                                className={`px-4 py-2 rounded-lg text-xs transition cursor-pointer ${
                                                    activeTab === 'profile'
                                                        ? 'bg-[#D4A017] hover:bg-[#B8860B] text-white font-bold shadow-xs'
                                                        : 'bg-neutral-100 text-neutral-600 hover:bg-amber-50 hover:text-[#B8860B] font-medium'
                                                }`}
                                            >
                                                Adopter Profile
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('welfare')}
                                                className={`px-4 py-2 rounded-lg text-xs transition cursor-pointer ${
                                                    activeTab === 'welfare'
                                                        ? 'bg-[#D4A017] hover:bg-[#B8860B] text-white font-bold shadow-xs'
                                                        : 'bg-neutral-100 text-neutral-600 hover:bg-amber-50 hover:text-[#B8860B] font-medium'
                                                }`}
                                            >
                                                Welfare &amp; History
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('audit')}
                                                className={`px-4 py-2 rounded-lg text-xs transition cursor-pointer ${
                                                    activeTab === 'audit'
                                                        ? 'bg-[#D4A017] hover:bg-[#B8860B] text-white font-bold shadow-xs'
                                                        : 'bg-neutral-100 text-neutral-600 hover:bg-amber-50 hover:text-[#B8860B] font-medium'
                                                }`}
                                            >
                                                Audit Trail
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => scrollTabs('right')}
                                            className="p-1 rounded-md text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition cursor-pointer shrink-0"
                                            title="Scroll tabs right"
                                        >
                                            <ChevronRight className="size-4" />
                                        </button>
                                    </div>

                                    {/* ──────────────────────────────────────────────────────────── */}
                                    {/* TAB CONTENT 1: COMPATIBILITY SCORE & MATRIX                 */}
                                    {/* ──────────────────────────────────────────────────────────── */}
                                    {activeTab === 'compatibility' && (
                                        <div className="space-y-6 pt-2 animate-in fade-in-50 duration-200">
                                            {/* DSS Score Card Component */}
                                            <DssScoreCard dss={dssMatch || { total_score: Number(selectedApplication.dss_score) }} />

                                            {/* Side-by-Side Match Matrix */}
                                            <div className="rounded-xl border border-gray-200 overflow-hidden">
                                                <div className="bg-gray-50/70 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-[#B8860B]">
                                                        Adopter Profile vs. Pet Requirements Matrix
                                                    </span>
                                                    <Badge variant="outline" className="text-[10px] bg-white text-gray-600">
                                                        8-Factor Analysis
                                                    </Badge>
                                                </div>
                                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                                    <div className="p-3.5 bg-amber-50/40 border border-amber-100/80 rounded-xl space-y-2">
                                                        <span className="font-bold text-amber-900 block uppercase text-[11px]">
                                                            Adopter Living Profile
                                                        </span>
                                                        <div className="space-y-1.5 text-gray-700">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Housing Type:</span>
                                                                <span className="font-bold capitalize">{activeLifestyle?.housing_type?.replace(/_/g, ' ') || 'N/A'}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Outdoor Access:</span>
                                                                <span className="font-bold capitalize">{activeLifestyle?.outdoor_access?.replace(/_/g, ' ') || 'N/A'}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Activity Level:</span>
                                                                <span className="font-bold capitalize">{activeLifestyle?.activity_level?.replace(/_/g, ' ') || 'N/A'}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Experience:</span>
                                                                <span className="font-bold capitalize">{activeLifestyle?.pet_experience?.replace(/_/g, ' ') || 'N/A'}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Other Animals:</span>
                                                                <span className="font-bold capitalize">{activeLifestyle?.other_pets || 'None'}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Children:</span>
                                                                <span className="font-bold capitalize">{activeLifestyle?.has_children || 'None'}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Household Consent:</span>
                                                                <span className="font-bold">{activeLifestyle?.household_agrees ? 'Confirmed (Agreed)' : 'No'}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="p-3.5 bg-gray-50 border border-gray-200/80 rounded-xl space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-bold text-gray-900 block uppercase text-[11px]">
                                                                Pet Needs ({selectedApplication.pet.name})
                                                            </span>
                                                            <span className="inline-flex items-center rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-[#B8860B] border border-amber-200">
                                                                {selectedApplication.pet.tag_number || 'No Tag'}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-1.5 text-gray-700">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Housing Area:</span>
                                                                <span className="font-bold">{selectedApplication.pet.housing_area || 'Unassigned'}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Size / Energy:</span>
                                                                <span className="font-bold capitalize">{selectedApplication.pet.size} &bull; {selectedApplication.pet.energy_level}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Yard Required:</span>
                                                                <span className="font-bold">{selectedApplication.pet.requires_yard ? 'Strictly Required' : 'Not Required'}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Handler Skill:</span>
                                                                <span className="font-bold">{selectedApplication.pet.requires_experience ? 'Experience Needed' : 'Beginner Friendly'}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Other Pets OK:</span>
                                                                <span className="font-bold">{selectedApplication.pet.requires_no_other_pets ? 'No (Must be solo pet)' : 'Yes'}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Children OK:</span>
                                                                <span className="font-bold">{selectedApplication.pet.requires_no_children ? 'No (Adults only)' : 'Yes'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Competing Active Applications if any */}
                                            {competingApplications.length > 0 && (
                                                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                                                            Competing Applicants for {selectedApplication.pet.name} ({competingApplications.length})
                                                        </span>
                                                        <span className="text-[10px] text-amber-700 font-semibold">Ranked by Match %</span>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        {competingApplications.map((comp) => (
                                                            <div
                                                                key={comp.id}
                                                                onClick={() => handleSelectApplication(comp.id)}
                                                                className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-amber-200/80 hover:border-[#D4A017] transition cursor-pointer text-xs"
                                                            >
                                                                <div>
                                                                    <span className="font-bold text-gray-900">{comp.adopter.name}</span>
                                                                    <span className="text-gray-400 font-mono text-[10px] ml-2">#{comp.reference_number}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-[#B8860B] bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                                                                        {Math.round(parseFloat(comp.dss_score))}% Match
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-500 uppercase">{comp.status.replace(/_/g, ' ')}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ──────────────────────────────────────────────────────────── */}
                                    {/* TAB CONTENT: PET PROFILE & PHOTO GALLERY                    */}
                                    {/* ──────────────────────────────────────────────────────────── */}
                                    {activeTab === 'pet' && (
                                        <div className="space-y-6 pt-2 animate-in fade-in-50 duration-200">
                                            <div className="rounded-xl border border-gray-200 p-5 space-y-5">
                                                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-[#B8860B]">
                                                        PET PROFILE &amp; HOUSING SPECIFICATIONS
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-[#B8860B] border border-amber-200">
                                                        {selectedApplication.pet.species.toUpperCase()} &bull; #{selectedApplication.pet.tag_number || selectedApplication.pet.id}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                                    {/* Pet Photo Section */}
                                                    <div className="md:col-span-4 flex flex-col items-center gap-3">
                                                        <div className="w-full aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shadow-xs relative flex items-center justify-center">
                                                            {currentPetPhoto ? (
                                                                <img
                                                                    src={currentPetPhoto}
                                                                    alt={selectedApplication.pet.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="flex flex-col items-center justify-center p-6 text-center text-gray-400">
                                                                    <span className="text-xs font-semibold text-gray-600">No Photo Available</span>
                                                                    <span className="text-[10px] text-gray-400 mt-0.5">{selectedApplication.pet.name} ({selectedApplication.pet.species})</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Photo Thumbnails if multiple photos */}
                                                        {petPhotos.length > 1 && (
                                                            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
                                                                {petPhotos.map((photo, idx) => {
                                                                    const photoUrl = photo.photo_path || photo.photo_url;
                                                                    if (!photoUrl) return null;
                                                                    return (
                                                                        <button
                                                                            key={photo.id || idx}
                                                                            type="button"
                                                                            onClick={() => setSelectedPhotoIdx(idx)}
                                                                            className={`size-12 rounded-lg overflow-hidden border-2 transition cursor-pointer shrink-0 ${
                                                                                selectedPhotoIdx === idx
                                                                                    ? 'border-[#D4A017] ring-2 ring-[#D4A017]/30'
                                                                                    : 'border-gray-200 opacity-60 hover:opacity-100'
                                                                            }`}
                                                                        >
                                                                            <img
                                                                                src={photoUrl}
                                                                                alt={`Thumbnail ${idx + 1}`}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Key-Value Details */}
                                                    <div className="md:col-span-8 space-y-4">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
                                                            <div className="flex items-start">
                                                                <span className="w-32 text-gray-500 font-medium">Pet Name</span>
                                                                <span className="text-gray-400 mr-2">:</span>
                                                                <span className="font-bold text-gray-950 text-sm">{selectedApplication.pet.name}</span>
                                                            </div>

                                                            <div className="flex items-start">
                                                                <span className="w-32 text-gray-500 font-medium">Species</span>
                                                                <span className="text-gray-400 mr-2">:</span>
                                                                <span className="font-bold text-gray-900 capitalize">{selectedApplication.pet.species}</span>
                                                            </div>

                                                            <div className="flex items-start">
                                                                <span className="w-32 text-gray-500 font-medium">Breed</span>
                                                                <span className="text-gray-400 mr-2">:</span>
                                                                <span className="font-bold text-gray-900">{selectedApplication.pet.breed || 'Domestic / Mixed Breed'}</span>
                                                            </div>

                                                            <div className="flex items-start">
                                                                <span className="w-32 text-gray-500 font-medium">Age &amp; Gender</span>
                                                                <span className="text-gray-400 mr-2">:</span>
                                                                <span className="font-bold text-gray-900 capitalize">
                                                                    {selectedApplication.pet.age_years ? `${selectedApplication.pet.age_years} yrs` : 'Under 1 yr'} &bull; {selectedApplication.pet.gender}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-start">
                                                                <span className="w-32 text-gray-500 font-medium">Size</span>
                                                                <span className="text-gray-400 mr-2">:</span>
                                                                <span className="font-bold text-gray-900 capitalize">{selectedApplication.pet.size}</span>
                                                            </div>

                                                            <div className="flex items-start">
                                                                <span className="w-32 text-gray-500 font-medium">Energy Level</span>
                                                                <span className="text-gray-400 mr-2">:</span>
                                                                <span className="font-bold text-gray-900 capitalize">{selectedApplication.pet.energy_level}</span>
                                                            </div>

                                                            {selectedApplication.pet.coat_color && (
                                                                <div className="flex items-start">
                                                                    <span className="w-32 text-gray-500 font-medium">Coat / Color</span>
                                                                    <span className="text-gray-400 mr-2">:</span>
                                                                    <span className="font-bold text-gray-900 capitalize">{selectedApplication.pet.coat_color}</span>
                                                                </div>
                                                            )}

                                                            <div className="flex items-start">
                                                                <span className="w-32 text-gray-500 font-medium">Health Status</span>
                                                                <span className="text-gray-400 mr-2">:</span>
                                                                <span className="font-semibold text-emerald-700">
                                                                    {selectedApplication.pet.health_status || 'Up to date on vaccinations'}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-start">
                                                                <span className="w-32 text-gray-500 font-medium">Microchip ID</span>
                                                                <span className="text-gray-400 mr-2">:</span>
                                                                <span className="font-mono font-bold text-gray-800">{selectedApplication.pet.microchip_number || 'Not Registered'}</span>
                                                            </div>

                                                            <div className="flex items-start">
                                                                <span className="w-32 text-gray-500 font-medium">Shelter Tag</span>
                                                                <span className="text-gray-400 mr-2">:</span>
                                                                <span className="font-mono font-bold text-gray-800">{selectedApplication.pet.tag_number || 'N/A'}</span>
                                                            </div>

                                                            <div className="flex items-start sm:col-span-2">
                                                                <span className="w-32 text-gray-500 font-medium">Shelter Location</span>
                                                                <span className="text-gray-400 mr-2">:</span>
                                                                <span className="font-bold text-gray-900">
                                                                    {selectedApplication.pet.shelter.name} {selectedApplication.pet.shelter.location ? `(${selectedApplication.pet.shelter.location})` : ''}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-start sm:col-span-2">
                                                                <span className="w-32 text-gray-500 font-medium">Housing Area</span>
                                                                <span className="text-gray-400 mr-2">:</span>
                                                                <span className="font-bold text-gray-900">{selectedApplication.pet.housing_area || 'Unassigned / General Ward'}</span>
                                                            </div>

                                                            {selectedApplication.pet.housing_notes && (
                                                                <div className="flex items-start sm:col-span-2">
                                                                    <span className="w-32 text-gray-500 font-medium">Kennel / Staff Notes</span>
                                                                    <span className="text-gray-400 mr-2">:</span>
                                                                    <span className="text-gray-700 italic">"{selectedApplication.pet.housing_notes}"</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Temperament Tags */}
                                                        {selectedApplication.pet.temperament && Array.isArray(selectedApplication.pet.temperament) && selectedApplication.pet.temperament.length > 0 && (
                                                            <div className="pt-2 border-t border-gray-100 flex items-center gap-2 flex-wrap text-xs">
                                                                <span className="text-gray-500 font-medium">Temperament:</span>
                                                                {selectedApplication.pet.temperament.map((trait, tIdx) => (
                                                                    <Badge key={tIdx} variant="outline" className="bg-amber-50/70 border-amber-200 text-[#8B6508] font-bold text-[10px] capitalize">
                                                                        {trait}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Pet Description / Bio */}
                                                        {selectedApplication.pet.description && (
                                                            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 text-xs mt-2">
                                                                <span className="font-bold text-gray-700 block mb-1">About {selectedApplication.pet.name}:</span>
                                                                <p className="text-gray-600 leading-relaxed italic">
                                                                    "{selectedApplication.pet.description}"
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ──────────────────────────────────────────────────────────── */}
                                    {/* TAB CONTENT 2: APPLICANT INFORMATION & IDENTITY VERIFICATION */}
                                    {/* ──────────────────────────────────────────────────────────── */}
                                    {activeTab === 'identity' && (
                                        <div className="space-y-6 pt-2 animate-in fade-in-50 duration-200">
                                            {/* Automated Identity & Biometrics Report Component */}
                                            <IdentityVerificationReport
                                                verification={selectedApplication.adopter?.latest_didit_verification}
                                                adopterProfile={activeProfile as any}
                                            />

                                            {/* Key-Value Information Card */}
                                            <div className="rounded-xl border border-gray-200 p-5 space-y-4">
                                                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-[#B8860B]">
                                                        VERIFIED APPLICANT CREDENTIALS
                                                    </span>
                                                    <IdentityVerificationBadge
                                                        isVerified={activeProfile?.is_identity_verified}
                                                        faceMatchScore={activeProfile?.face_match_score}
                                                        livenessVerified={activeProfile?.liveness_verified}
                                                        showDetails
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-xs">
                                                    <div className="flex items-start">
                                                        <span className="w-36 text-gray-500 font-medium">Legal Full Name</span>
                                                        <span className="text-gray-400 mr-2">:</span>
                                                        <span className="font-bold text-gray-900">{activeProfile?.full_name || selectedApplication.adopter.name}</span>
                                                    </div>

                                                    <div className="flex items-start">
                                                        <span className="w-36 text-gray-500 font-medium">Contact Number</span>
                                                        <span className="text-gray-400 mr-2">:</span>
                                                        <span className="font-bold text-gray-900">{activeProfile?.contact_number || selectedApplication.adopter.phone || 'N/A'}</span>
                                                    </div>

                                                    <div className="flex items-start">
                                                        <span className="w-36 text-gray-500 font-medium">Email Address</span>
                                                        <span className="text-gray-400 mr-2">:</span>
                                                        <span className="font-bold text-gray-900">{selectedApplication.adopter.email}</span>
                                                    </div>

                                                    <div className="flex items-start">
                                                        <span className="w-36 text-gray-500 font-medium">Date of Birth</span>
                                                        <span className="text-gray-400 mr-2">:</span>
                                                        <span className="font-bold text-gray-900">{activeProfile?.date_of_birth || 'N/A'}</span>
                                                    </div>

                                                    <div className="flex items-start md:col-span-2">
                                                        <span className="w-36 text-gray-500 font-medium">Complete Address</span>
                                                        <span className="text-gray-400 mr-2">:</span>
                                                        <span className="font-bold text-gray-900">{activeProfile?.home_address || 'N/A'}</span>
                                                    </div>

                                                    <div className="flex items-start md:col-span-2 pt-2 border-t border-gray-100">
                                                        <span className="w-36 text-gray-500 font-medium">Government ID</span>
                                                        <span className="text-gray-400 mr-2">:</span>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-mono font-bold text-gray-900">
                                                                {activeProfile?.valid_id_type || 'ID'}: {activeProfile?.valid_id_number || 'N/A'}
                                                            </span>
                                                            {activeProfile?.id_document_path && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setActiveIdModal({ open: true, side: 'front' })}
                                                                    className="inline-flex items-center text-[11px] font-semibold text-[#8B6508] bg-[#F5EDD7] hover:bg-[#D4A017]/30 px-2.5 py-1 rounded-full border border-[#D4A017]/30 transition cursor-pointer"
                                                                >
                                                                    Inspect Front ID
                                                                </button>
                                                            )}
                                                            {activeProfile?.id_document_back_path && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setActiveIdModal({ open: true, side: 'back' })}
                                                                    className="inline-flex items-center text-[11px] font-semibold text-[#8B6508] bg-[#F5EDD7] hover:bg-[#D4A017]/30 px-2.5 py-1 rounded-full border border-[#D4A017]/30 transition cursor-pointer"
                                                                >
                                                                    Inspect Back ID
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ──────────────────────────────────────────────────────────── */}
                                    {/* TAB CONTENT 3: ADOPTER PROFILE & LIFESTYLE                   */}
                                    {/* ──────────────────────────────────────────────────────────── */}
                                    {activeTab === 'profile' && (
                                        <div className="space-y-6 pt-2 animate-in fade-in-50 duration-200">
                                            {/* Key-Value Lifestyle Information */}
                                            <div className="rounded-xl border border-gray-200 p-5 space-y-4">
                                                <span className="text-xs font-bold uppercase tracking-wider text-[#B8860B] block border-b border-gray-100 pb-2">
                                                    RESIDENCE, ROUTINE &amp; CARE CAPACITY
                                                </span>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
                                                    <div className="flex items-start">
                                                        <span className="w-44 text-gray-500 font-medium">Housing Classification</span>
                                                        <span className="text-gray-400 mr-2">:</span>
                                                        <span className="font-bold text-gray-900 capitalize">{activeLifestyle?.housing_type?.replace(/_/g, ' ') || 'N/A'}</span>
                                                    </div>

                                                    <div className="flex items-start">
                                                        <span className="w-44 text-gray-500 font-medium">Outdoor / Yard Access</span>
                                                        <span className="text-gray-400 mr-2">:</span>
                                                        <span className="font-bold text-gray-900 capitalize">{activeLifestyle?.outdoor_access?.replace(/_/g, ' ') || 'N/A'}</span>
                                                    </div>

                                                    <div className="flex items-start">
                                                        <span className="w-44 text-gray-500 font-medium">Climate / Air Conditioning</span>
                                                        <span className="text-gray-400 mr-2">:</span>
                                                        <span className="font-bold text-gray-900 capitalize">{activeLifestyle?.has_aircon || 'N/A'}</span>
                                                    </div>

                                                    <div className="flex items-start">
                                                        <span className="w-44 text-gray-500 font-medium">Pet Stay Location</span>
                                                        <span className="text-gray-400 mr-2">:</span>
                                                        <span className="font-bold text-gray-900 capitalize">{activeProfile?.pet_stay?.replace(/_/g, ' ') || 'Inside Home'}</span>
                                                    </div>

                                                    <div className="flex items-start">
                                                        <span className="w-44 text-gray-500 font-medium">Household Size</span>
                                                        <span className="text-gray-400 mr-2">:</span>
                                                        <span className="font-bold text-gray-900">{activeLifestyle?.household_size ? `${activeLifestyle.household_size} Members` : 'N/A'}</span>
                                                    </div>

                                                    <div className="flex items-start">
                                                        <span className="w-44 text-gray-500 font-medium">Household Consensus</span>
                                                        <span className="text-gray-400 mr-2">:</span>
                                                        <span className={`font-bold ${activeLifestyle?.household_agrees ? 'text-emerald-700' : 'text-red-600'}`}>
                                                            {activeLifestyle?.household_agrees ? 'All Members Agree' : 'Consent Pending'}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-start">
                                                        <span className="w-44 text-gray-500 font-medium">Children in House</span>
                                                        <span className="text-gray-400 mr-2">:</span>
                                                        <span className="font-bold text-gray-900 capitalize">{activeLifestyle?.has_children || 'None'}</span>
                                                    </div>

                                                    <div className="flex items-start">
                                                        <span className="w-44 text-gray-500 font-medium">Other Pets Owned</span>
                                                        <span className="text-gray-400 mr-2">:</span>
                                                        <span className="font-bold text-gray-900 capitalize">{activeLifestyle?.other_pets || 'None'}</span>
                                                    </div>

                                                    <div className="flex items-start">
                                                        <span className="w-44 text-gray-500 font-medium">Work Routine</span>
                                                        <span className="text-gray-400 mr-2">:</span>
                                                        <span className="font-bold text-gray-900 capitalize">{activeLifestyle?.work_schedule?.replace(/_/g, ' ') || 'N/A'}</span>
                                                    </div>

                                                    <div className="flex items-start">
                                                        <span className="w-44 text-gray-500 font-medium">Financial Stability</span>
                                                        <span className="text-gray-400 mr-2">:</span>
                                                        <span className="font-bold text-gray-900 capitalize">{activeLifestyle?.monthly_income ? `${activeLifestyle.monthly_income} / mo` : 'Declared Stable'}</span>
                                                    </div>

                                                    <div className="flex items-start md:col-span-2">
                                                        <span className="w-44 text-gray-500 font-medium">Primary Adoption Reason</span>
                                                        <span className="text-gray-400 mr-2">:</span>
                                                        <span className="font-bold text-gray-900">{activeProfile?.adoption_reason || 'Companion / Family Member'}</span>
                                                    </div>
                                                </div>

                                                {activeProfile?.adoption_reason_text && (
                                                    <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 text-xs mt-3">
                                                        <span className="font-bold text-gray-700 block mb-1">Applicant's Written Statement:</span>
                                                        <p className="italic text-gray-600 leading-relaxed">
                                                            "{activeProfile.adoption_reason_text}"
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* ──────────────────────────────────────────────────────────── */}
                                    {/* TAB CONTENT 4: MUNICIPAL WELFARE RECORD (RA 8485)            */}
                                    {/* ──────────────────────────────────────────────────────────── */}
                                    {activeTab === 'welfare' && (
                                        <div className="space-y-6 pt-2 animate-in fade-in-50 duration-200">
                                            {/* RA 8485 Compliance Box */}
                                            <div className="rounded-xl border border-gray-200 p-5 space-y-4">
                                                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-[#B8860B]">
                                                        MUNICIPAL ADOPTION HISTORY &amp; WELFARE RECORD
                                                    </span>
                                                    <Badge variant="outline" className="text-[10px] bg-gray-50 font-bold border-gray-300">
                                                        RA 8485 Audit Track
                                                    </Badge>
                                                </div>

                                                {adopterTrackRecord ? (
                                                    <div className="space-y-4">
                                                        {/* Summary Stat Tiles */}
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80">
                                                                <span className="text-[10px] text-emerald-800 font-bold block uppercase">Prior Adoptions</span>
                                                                <span className="text-xl font-black text-emerald-900">{adopterTrackRecord.prior_adopted_count}</span>
                                                            </div>
                                                            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200/80">
                                                                <span className="text-[10px] text-blue-800 font-bold block uppercase">Total Requests</span>
                                                                <span className="text-xl font-black text-blue-900">{adopterTrackRecord.total_applications}</span>
                                                            </div>
                                                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                                                <span className="text-[10px] text-gray-600 font-bold block uppercase">Prior Pets Kept</span>
                                                                <span className="text-xs font-bold text-gray-800 block capitalize mt-1">
                                                                    {adopterTrackRecord.had_pets_before?.replace(/_/g, ' ') || 'None'}
                                                                </span>
                                                            </div>
                                                            <div className={`p-3 rounded-xl border ${adopterTrackRecord.surrendered_pet ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                                                                <span className="text-[10px] font-bold block uppercase">Surrender Flag</span>
                                                                <span className="text-xs font-bold block mt-1">
                                                                    {adopterTrackRecord.surrendered_pet ? '⚠️ Has Surrender Flag' : '✓ Clean Record'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Key-Value Details */}
                                                        <div className="space-y-2 pt-2 text-xs">
                                                            <div className="flex items-start py-1.5 border-b border-gray-50">
                                                                <span className="w-52 text-gray-500 font-medium">Rejection History</span>
                                                                <span className="text-gray-400 mr-2">:</span>
                                                                <span className="font-bold text-gray-900">{adopterTrackRecord.prior_rejected_count} previous rejection(s)</span>
                                                            </div>

                                                            <div className="flex items-start py-1.5 border-b border-gray-50">
                                                                <span className="w-52 text-gray-500 font-medium">Declared Experience Notes</span>
                                                                <span className="text-gray-400 mr-2">:</span>
                                                                <span className="font-semibold text-gray-800 italic">
                                                                    {adopterTrackRecord.previous_pet_notes ? `"${adopterTrackRecord.previous_pet_notes}"` : 'No prior issues logged.'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Previously Adopted Pets List */}
                                                        {adopterTrackRecord.prior_adopted_pets && adopterTrackRecord.prior_adopted_pets.length > 0 && (
                                                            <div className="pt-2 border-t border-gray-100 space-y-2">
                                                                <span className="text-[11px] font-bold text-gray-700 block uppercase">Previously Adopted Municipal Animals:</span>
                                                                <div className="space-y-1.5">
                                                                    {adopterTrackRecord.prior_adopted_pets.map((p) => (
                                                                        <div key={p.id} className="flex justify-between items-center bg-gray-50 px-3.5 py-2 rounded-lg text-xs border border-gray-100">
                                                                            <span className="font-bold text-gray-800">{p.pet.name} ({p.pet.species})</span>
                                                                            <span className="font-mono text-gray-500 text-[11px]">Cert: {p.certificate_number || `#${p.reference_number}`}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-gray-400">Loading municipal track record...</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* ──────────────────────────────────────────────────────────── */}
                                    {/* TAB CONTENT 5: AUDIT TRAIL & STATUS TIMELINE                */}
                                    {/* ──────────────────────────────────────────────────────────── */}
                                    {activeTab === 'audit' && (
                                        <div className="space-y-6 pt-2 animate-in fade-in-50 duration-200">
                                            {/* SLA and Status Timeline Component */}
                                            <ApplicationTimelineCard
                                                timelines={selectedApplication.timelines || []}
                                                status={selectedApplication.status}
                                                slaTarget={selectedApplication.target_sla_at}
                                                certificateNumber={selectedApplication.certificate_number}
                                            />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400 my-auto">
                                    <FileText className="size-12 stroke-[1.5] mb-2 text-gray-300" />
                                    <p className="font-bold text-sm text-gray-600">No application selected</p>
                                    <p className="text-xs text-gray-400 mt-1">Select an application from the left panel to inspect its complete dossier.</p>
                                </div>
                            )}
                        </div>

                    </div>
                )}

            </div>

            {/* ID Document Inspector Modal */}
            {activeProfile && (
                <IdDocumentInspectorModal
                    open={activeIdModal.open}
                    onOpenChange={(open) => setActiveIdModal(prev => ({ ...prev, open }))}
                    title="Applicant Government ID"
                    applicantName={activeProfile.full_name || selectedApplication?.adopter.name || ''}
                    idType={activeProfile.valid_id_type || 'ID Document'}
                    idNumber={activeProfile.valid_id_number || ''}
                    side={activeIdModal.side}
                    documentUrl={
                        activeIdModal.side === 'front'
                            ? (activeProfile.id_document_path ? route('adopter.id-document.show', { profile: activeProfile.id || activeProfile.user_id || selectedApplication?.adopter.id, side: 'front' }) : null)
                            : (activeProfile.id_document_back_path ? route('adopter.id-document.show', { profile: activeProfile.id || activeProfile.user_id || selectedApplication?.adopter.id, side: 'back' }) : null)
                    }
                />
            )}

            {/* Shelter Screening & Workflow Handoff Modal */}
            {selectedApplication && (
                <Dialog open={isScreeningModalOpen} onOpenChange={setIsScreeningModalOpen}>
                    <DialogContent className="sm:max-w-lg bg-white p-6 rounded-2xl">
                        <DialogHeader className="space-y-1 pb-3 border-b border-gray-100 text-left">
                            <DialogTitle className="text-base font-bold text-gray-900 uppercase tracking-tight">
                                Shelter Screening Action &amp; Workflow Handoff
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500">
                                Applicant: <strong className="text-gray-800">{selectedApplication.adopter.name}</strong> &bull; Pet: <strong className="text-gray-800">{selectedApplication.pet.name}</strong> (Ref: <span className="font-mono text-gray-700">{selectedApplication.reference_number}</span>)
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleDecisionSubmit} className="space-y-4 pt-2 text-left">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-700">Screening Outcome *</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                                        decisionData.decision === 'suitable'
                                            ? 'bg-emerald-50 border-emerald-400'
                                            : 'bg-white border-gray-200 hover:bg-gray-50'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="screening_decision"
                                            value="suitable"
                                            checked={decisionData.decision === 'suitable'}
                                            onChange={(e) => setDecisionData('decision', e.target.value)}
                                            className="mt-0.5 text-[#D4A017]"
                                        />
                                        <div className="text-xs">
                                            <span className="font-bold text-emerald-950">
                                                Endorse as Suitable
                                            </span>
                                            <span className="text-[11px] text-emerald-800 block mt-0.5">
                                                Passes screening. Hands off to MAO for statutory compliance.
                                            </span>
                                        </div>
                                    </label>

                                    <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                                        decisionData.decision === 'not_suitable'
                                            ? 'bg-red-50 border-red-400'
                                            : 'bg-white border-gray-200 hover:bg-gray-50'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="screening_decision"
                                            value="not_suitable"
                                            checked={decisionData.decision === 'not_suitable'}
                                            onChange={(e) => setDecisionData('decision', e.target.value)}
                                            className="mt-0.5 text-[#D4A017]"
                                        />
                                        <div className="text-xs">
                                            <span className="font-bold text-red-950">
                                                Mark as Not Suitable
                                            </span>
                                            <span className="text-[11px] text-red-800 block mt-0.5">
                                                Disapproves request and releases pet back into shelter catalog.
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="modal-staff-notes" className="text-xs font-bold text-gray-700">
                                    Staff Screening Remarks &amp; Feedback
                                </Label>
                                <Textarea
                                    id="modal-staff-notes"
                                    value={decisionData.notes}
                                    onChange={(e) => setDecisionData('notes', e.target.value)}
                                    rows={3}
                                    placeholder="Add notes for Municipal Agriculture Office or reason for rejection..."
                                    className="text-xs"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsScreeningModalOpen(false)}
                                    className="text-xs h-9 px-3.5 rounded-lg cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-[#D4A017] hover:bg-[#B8860B] text-white font-bold text-xs h-9 px-4 rounded-lg transition cursor-pointer"
                                >
                                    {processing ? 'Submitting Decision...' : 'Record Decision & Execute Handoff'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </AppLayout>
    );
}
