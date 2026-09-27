import { useState, useRef, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    ShieldCheck,
    Check,
    X,
    Sparkles,
    Filter,
    SlidersHorizontal,
    Layers,
    TableProperties,
    FileCheck,
    Tag,
    MapPin,
    CheckCircle2,
    XCircle,
    ExternalLink,
    Eye,
    Zap,
    AlertTriangle,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { AdoptionCertificateModal } from '@/components/adoption-certificate-modal';
import { AdoptionPassModal } from '@/components/adoption-pass-modal';
import { IdDocumentInspectorModal } from '@/components/id-document-inspector-modal';
import { IdentityVerificationReport } from '@/components/identity-verification-report';
import { IdentityVerificationBadge } from '@/components/identity-verification-badge';
import { DssScoreCard } from '@/components/dss-score-card';
import { ApplicationTimelineCard, TimelineEvent } from '@/components/application-timeline-card';

interface ChecklistItem {
    label: string;
    description: string;
    auto_compliant?: boolean;
    compliance_reason?: string;
}

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
    reviewed_at?: string | null;
    target_sla_at?: string | null;
    pickup_deadline_at?: string | null;
    certificate_number?: string | null;
    mao_decision?: string | null;
    mao_remarks?: string | null;
    mao_checklist?: Record<string, boolean> | null;
    submitted_at: string;
    resolved_at?: string | null;
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
            monthly_income?: string;
            pet_experience?: string;
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
        age_years: number;
        gender: string;
        size: string;
        energy_level: string;
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
    staff?: { id?: number; name: string } | null;
    mao_officer?: { id?: number; name: string } | null;
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
    mao_audit: 'bg-purple-100 text-purple-800 border-purple-200',
    approved:  'bg-green-100 text-green-800 border-green-200',
    rejected:  'bg-red-100 text-red-800 border-red-200',
};

const STATUS_LABELS: Record<string, string> = {
    mao_audit: 'PENDING AUDIT',
    approved:  'APPROVED',
    rejected:  'REJECTED',
};

export default function MaoApplicationIndex({
    applications,
    selectedApplication: initialSelectedApp,
    dssMatch: initialDssMatch,
    competingApplications: initialCompeting = [],
    adopterTrackRecord: initialTrackRecord,
    defaultChecklist: initialChecklistObj,
    dossierData = {},
    filters,
}: {
    applications: PaginatedApplications;
    selectedApplication?: Application | null;
    dssMatch?: any;
    competingApplications?: CompetingApp[];
    adopterTrackRecord?: AdopterTrackRecord | null;
    defaultChecklist?: Record<string, ChecklistItem> | null;
    dossierData?: Record<number, {
        application: Application;
        dssMatch?: any;
        competingApplications?: CompetingApp[];
        adopterTrackRecord?: AdopterTrackRecord | null;
        defaultChecklist?: Record<string, ChecklistItem>;
    }>;
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

    // Selected ID state for 0ms instant client-side switching
    const [selectedId, setSelectedId] = useState<number | null>(
        filters.selected ? Number(filters.selected) : (initialSelectedApp?.id ?? applications.data[0]?.id ?? null)
    );

    useEffect(() => {
        if (initialSelectedApp?.id) {
            setSelectedId(initialSelectedApp.id);
        }
    }, [initialSelectedApp?.id]);

    // Active bundle from preloaded dossierData, falling back to initial props or applications.data
    const currentBundle = selectedId && dossierData[selectedId] ? dossierData[selectedId] : null;

    const selectedApplication = currentBundle?.application
        ?? (selectedId ? applications.data.find(a => a.id === selectedId) : null)
        ?? initialSelectedApp;

    const dssMatch = currentBundle?.dssMatch ?? initialDssMatch;
    const competingApplications = currentBundle?.competingApplications ?? initialCompeting;
    const adopterTrackRecord = currentBundle?.adopterTrackRecord ?? initialTrackRecord;
    const activeChecklist = currentBundle?.defaultChecklist ?? initialChecklistObj ?? {};

    const tabsListRef = useRef<HTMLDivElement>(null);

    // Active inspection modal state
    const [activeIdModal, setActiveIdModal] = useState<{ open: boolean; side: 'front' | 'back' }>({
        open: false,
        side: 'front',
    });

    // MAO Statutory Compliance Audit Modal state
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

    // Build initial checklist boolean map based on saved checklist or auto-compliant status
    const buildInitialChecklistState = (app: Application | null, checklist: Record<string, ChecklistItem>) => {
        if (!app) return {};
        return Object.fromEntries(
            Object.keys(checklist).map(key => [
                key,
                app.mao_checklist
                    ? Boolean(app.mao_checklist[key])
                    : Boolean(checklist[key]?.auto_compliant ?? app.fast_track_eligible ?? false),
            ])
        );
    };

    // Form state for MAO Audit
    const { data: auditData, setData: setAuditData, patch, processing } = useForm<{
        decision: string;
        remarks: string;
        checklist: Record<string, boolean>;
    }>({
        decision: selectedApplication?.mao_decision ?? 'approved',
        remarks: selectedApplication?.mao_remarks ?? '',
        checklist: buildInitialChecklistState(selectedApplication ?? null, activeChecklist),
    });

    // Reset audit form when selected application changes
    useEffect(() => {
        if (selectedApplication) {
            setAuditData({
                decision: selectedApplication.mao_decision || 'approved',
                remarks: selectedApplication.mao_remarks || '',
                checklist: buildInitialChecklistState(selectedApplication, activeChecklist),
            });
            setSelectedPhotoIdx(0);
        }
    }, [selectedApplication?.id]);

    const handleSelectApplication = (appId: number) => {
        if (appId === selectedId) {
            return;
        }

        setSelectedId(appId);
        setSelectedPhotoIdx(0);

        // Update URL query string silently without triggering Inertia network visit or loading bar
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('selected', String(appId));
            window.history.replaceState({}, '', url.toString());
        }
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
            route('mao.applications.index'),
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

    const toggleChecklist = (key: string) => {
        setAuditData('checklist', {
            ...auditData.checklist,
            [key]: !auditData.checklist[key],
        });
    };

    const handleAuditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedApplication) return;

        patch(route('mao.applications.update', selectedApplication.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsAuditModalOpen(false);
            },
        });
    };

    const activeProfile = selectedApplication?.adopter?.adopter_profile;
    const activeLifestyle = selectedApplication?.adopter?.lifestyle_profile;
    const isResolved = selectedApplication?.status === 'approved' || selectedApplication?.status === 'rejected';
    const petPhotos = selectedApplication?.pet?.photos || [];
    const currentPetPhoto = petPhotos[selectedPhotoIdx]?.photo_path
        || petPhotos[selectedPhotoIdx]?.photo_url
        || petPhotos.find(p => p.is_primary)?.photo_path
        || petPhotos[0]?.photo_path
        || null;

    const allChecklistItemsVerified = Object.keys(activeChecklist).length > 0 &&
        Object.keys(activeChecklist).every(key => Boolean(auditData.checklist[key]));

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: route('mao.dashboard') },
            { title: 'Compliance Audits', href: route('mao.applications.index') },
        ]}>
            <Head title="Compliance Audits - Municipal Workspace" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 max-w-[1600px] mx-auto w-full">

                {/* Top Action & View Toolbar */}
                <div className="flex justify-between items-center flex-wrap gap-4 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6 text-purple-600" />
                            Municipal Compliance Audits
                        </h1>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Mandated statutory review, municipal welfare audit, and certificate issuance under Republic Acts 8485 &amp; 9482.
                        </p>
                    </div>

                    {/* View Switcher: Split vs Full Table */}
                    {/* <div className="flex items-center gap-2">
                        <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs">
                            <button
                                type="button"
                                onClick={() => setViewMode('split')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                                    viewMode === 'split'
                                        ? 'bg-white text-purple-900 shadow-2xs font-bold'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <Layers className="size-3.5" />
                                <span>Split Workspace</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('table')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                                    viewMode === 'table'
                                        ? 'bg-white text-purple-900 shadow-2xs font-bold'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <TableProperties className="size-3.5" />
                                <span>Table View</span>
                            </button>
                        </div>
                    </div> */}
                </div>

                {viewMode === 'table' ? (
                    /* Full Table View Mode */
                    <Card className="border-gray-200 shadow-2xs overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-3 px-4">
                            <div className="flex justify-between items-center flex-wrap gap-3">
                                <form onSubmit={handleSearchSubmit} className="relative w-72">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                                    <Input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search Reference, Adopter, Pet..."
                                        className="pl-9 pr-3 h-8 text-xs bg-white border-gray-200 rounded-lg"
                                    />
                                </form>
                                <div className="flex items-center gap-2">
                                    <Select value={statusFilter} onValueChange={(val) => handleFilterChange({ status: val })}>
                                        <SelectTrigger className="h-8 text-xs bg-white border-gray-200 w-36">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="mao_audit">Pending Audit</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold text-[11px]">
                                        <th className="py-3 px-4">Ref Number</th>
                                        <th className="py-3 px-4">Applicant</th>
                                        <th className="py-3 px-4">Pet Target</th>
                                        <th className="py-3 px-4">Shelter</th>
                                        <th className="py-3 px-4">DSS Score</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4">Submitted</th>
                                        <th className="py-3 px-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {applications.data.map((app) => (
                                        <tr key={app.id} className="hover:bg-purple-50/20 transition">
                                            <td className="py-3 px-4 font-mono font-bold text-gray-900">{app.reference_number}</td>
                                            <td className="py-3 px-4 font-medium text-gray-900 uppercase">{app.adopter.name}</td>
                                            <td className="py-3 px-4 text-gray-700">{app.pet.name}</td>
                                            <td className="py-3 px-4 text-gray-600">{app.pet.shelter.name}</td>
                                            <td className="py-3 px-4 font-bold text-purple-700">{Math.round(parseFloat(app.dss_score))}%</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${STATUS_BADGE[app.status] ?? 'bg-gray-100 text-gray-700'}`}>
                                                    {STATUS_LABELS[app.status] || app.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-gray-500">{new Date(app.submitted_at).toLocaleDateString()}</td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {app.status === 'mao_audit' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                handleSelectApplication(app.id);
                                                                setIsAuditModalOpen(true);
                                                            }}
                                                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-7 px-2.5 shadow-xs cursor-pointer"
                                                        >
                                                            Audit
                                                        </Button>
                                                    )}
                                                    {app.status === 'approved' && (
                                                        <>
                                                            <AdoptionPassModal application={app as any} />
                                                            <AdoptionCertificateModal application={app as any} />
                                                        </>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            handleSelectApplication(app.id);
                                                            setViewMode('split');
                                                        }}
                                                        className="text-xs border-purple-200 text-purple-800 hover:bg-purple-50 h-7 px-2.5 cursor-pointer"
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
                    /* Master-Detail Split Workspace */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                        
                        {/* ──────────────────────────────────────────────────────────── */}
                        {/* LEFT COLUMN: SCROLLABLE AUDIT APPLICATION MASTER LIST        */}
                        {/* ──────────────────────────────────────────────────────────── */}
                        <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-3 bg-white p-4 rounded-2xl border border-gray-200/90 shadow-2xs">
                            
                            <div className="space-y-2.5">
                                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    <span>Audits Queue</span>
                                    <Badge variant="outline" className="text-[11px] font-bold bg-purple-50 text-purple-700 border-purple-200">
                                        {applications.total}
                                    </Badge>
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
                                            <SelectItem value="mao_audit">Pending Audit</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
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
                                            <SelectItem value="newest">Newest First</SelectItem>
                                            <SelectItem value="oldest">Oldest First</SelectItem>
                                            <SelectItem value="dss_high">Highest Match</SelectItem>
                                            <SelectItem value="dss_low">Lowest Match</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Scrollable Cards Container */}
                            <div className="flex flex-col gap-2 max-h-[calc(100vh-270px)] overflow-y-auto pr-1 pt-1">
                                {applications.data.length === 0 ? (
                                    <div className="text-center py-12 px-4 rounded-xl border border-dashed border-gray-200 text-gray-500 space-y-2">
                                        <Filter className="size-8 mx-auto text-gray-300" />
                                        <p className="text-xs font-semibold">No compliance audit applications found.</p>
                                        <p className="text-[11px] text-gray-400">Try adjusting your search criteria or status filter.</p>
                                    </div>
                                ) : (
                                    applications.data.map((app) => {
                                        const isSelected = app.id === selectedId;

                                        return (
                                            <div
                                                key={app.id}
                                                onClick={() => handleSelectApplication(app.id)}
                                                className={`relative group rounded-xl p-3.5 border transition cursor-pointer select-none ${
                                                    isSelected
                                                        ? 'bg-gradient-to-r from-purple-500/10 via-[#FAF5FF] to-purple-500/5 text-gray-900 border-purple-600 shadow-sm ring-2 ring-purple-600/30'
                                                        : 'bg-white text-gray-800 border-gray-200/90 hover:border-purple-300 hover:bg-purple-50/20 shadow-2xs'
                                                }`}
                                            >
                                                {/* Arrow pointer indicator on active card (pointing right to detail pane) */}
                                                {isSelected && (
                                                    <div 
                                                        className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0 border-y-8 border-y-transparent border-l-8 border-l-purple-600 z-10" 
                                                        aria-hidden="true"
                                                    />
                                                )}

                                                <div className="flex justify-between items-center gap-2">
                                                    <div className="min-w-0 flex-1 space-y-0.5">
                                                        <h3 className={`font-bold text-sm leading-tight truncate uppercase ${
                                                            isSelected ? 'text-purple-900 font-black' : 'text-gray-900'
                                                        }`}>
                                                            {app.adopter.name}
                                                        </h3>
                                                        <p className={`text-[11px] font-mono font-medium truncate ${
                                                            isSelected ? 'text-purple-700 font-bold' : 'text-blue-600'
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

                            {/* Pagination Controls */}
                            {applications.links && applications.links.length > 3 && (
                                <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                                    <span className="text-[11px] text-gray-500">
                                        Showing {applications.from || 0} to {applications.to || 0} of {applications.total}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        {applications.links.map((link, idx) => {
                                            if (idx === 0) {
                                                return link.url ? (
                                                    <Link
                                                        key={idx}
                                                        href={link.url}
                                                        preserveState
                                                        preserveScroll
                                                        className="p-1 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
                                                    >
                                                        <ChevronLeft className="size-4" />
                                                    </Link>
                                                ) : null;
                                            }
                                            if (idx === applications.links.length - 1) {
                                                return link.url ? (
                                                    <Link
                                                        key={idx}
                                                        href={link.url}
                                                        preserveState
                                                        preserveScroll
                                                        className="p-1 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
                                                    >
                                                        <ChevronRight className="size-4" />
                                                    </Link>
                                                ) : null;
                                            }
                                            return null;
                                        })}
                                    </div>
                                </div>
                            )}
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
                                            <div className="size-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-400 flex items-center justify-center text-white font-black text-lg shadow-2xs">
                                                {selectedApplication.adopter.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                                                        {selectedApplication.adopter.name}
                                                    </h2>
                                                    {selectedApplication.fast_track_eligible && (
                                                        <Badge className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 gap-1">
                                                            <Zap className="size-3" /> Fast-Track
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

                                                {/* Action Buttons under Adopter Name */}
                                                <div className="flex items-center gap-2 flex-wrap mt-3">
                                                    {selectedApplication.status === 'mao_audit' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => setIsAuditModalOpen(true)}
                                                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9 px-4 rounded-lg shadow-xs cursor-pointer transition flex items-center gap-1.5"
                                                        >
                                                            <ShieldCheck className="h-4 w-4" />
                                                            Execute Compliance Audit
                                                        </Button>
                                                    )}

                                                    {selectedApplication.status === 'approved' && (
                                                        <>
                                                            <AdoptionPassModal application={selectedApplication as any} />
                                                            <AdoptionCertificateModal application={selectedApplication as any} />
                                                            {selectedApplication.certificate_number && (
                                                                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                                                                    <FileCheck className="size-3.5 text-emerald-600" />
                                                                    Cert: {selectedApplication.certificate_number}
                                                                </span>
                                                            )}
                                                        </>
                                                    )}

                                                    {selectedApplication.status === 'rejected' && (
                                                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs px-2.5 py-1">
                                                            Audit Disapproved
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Contact & ID Quick Badges */}
                                        <div className="flex flex-col items-end gap-1.5 text-right text-xs">
                                            <IdentityVerificationBadge
                                                isVerified={activeProfile?.is_identity_verified}
                                                faceMatchScore={activeProfile?.face_match_score}
                                                livenessVerified={activeProfile?.liveness_verified}
                                                showDetails
                                            />
                                            <span className="text-gray-500 font-mono text-[11px]">{selectedApplication.adopter.email}</span>
                                            {activeProfile?.contact_number && (
                                                <span className="text-gray-500 font-mono text-[11px]">{activeProfile.contact_number}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Statutory Compliance Audit Summary Banner */}
                                    <div className="p-4 rounded-xl border border-purple-200/80 bg-gradient-to-r from-purple-50/60 via-indigo-50/30 to-purple-50/40 space-y-3">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center gap-2">
                                                <ShieldCheck className="size-4 text-purple-700" />
                                                <span className="text-xs font-bold uppercase tracking-wider text-purple-900">
                                                    Statutory Compliance Audit (RA 8485 &amp; RA 9482)
                                                </span>
                                            </div>
                                            {isResolved ? (
                                                <Badge className={selectedApplication.status === 'approved' ? 'bg-green-600 text-white font-bold text-[10px]' : 'bg-red-600 text-white font-bold text-[10px]'}>
                                                    Audit Finalized: {selectedApplication.status.toUpperCase()}
                                                </Badge>
                                            ) : (
                                                <span className="text-[11px] text-purple-700 font-semibold">
                                                    Pending Municipal Determination
                                                </span>
                                            )}
                                        </div>

                                        {/* 5-Criteria Quick Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                                            {Object.entries(activeChecklist).map(([key, item]) => {
                                                const passed = isResolved
                                                    ? (selectedApplication.mao_checklist ? Boolean(selectedApplication.mao_checklist[key]) : false)
                                                    : Boolean(item.auto_compliant);

                                                return (
                                                    <div key={key} className="flex items-start gap-2 p-2 rounded-lg bg-white/90 border border-purple-100 shadow-2xs">
                                                        {passed ? (
                                                            <CheckCircle2 className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                                                        ) : (
                                                            <XCircle className="size-4 text-amber-600 mt-0.5 shrink-0" />
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <div className={`font-bold text-[11px] truncate ${passed ? 'text-emerald-900' : 'text-amber-900'}`}>
                                                                {item.label}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500 line-clamp-1">
                                                                {item.compliance_reason || item.description}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {selectedApplication.mao_remarks && (
                                            <div className="p-2.5 rounded-lg bg-white/90 border border-purple-100 text-xs">
                                                <span className="font-bold text-gray-600 text-[10px] uppercase block">Official Officer Remarks:</span>
                                                <p className="italic text-gray-800 text-[11px] mt-0.5">"{selectedApplication.mao_remarks}"</p>
                                            </div>
                                        )}
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
                                                        ? 'bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs'
                                                        : 'bg-neutral-100 text-neutral-600 hover:bg-purple-50 hover:text-purple-700 font-medium'
                                                }`}
                                            >
                                                Compatibility
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('pet')}
                                                className={`px-4 py-2 rounded-lg text-xs transition cursor-pointer ${
                                                    activeTab === 'pet'
                                                        ? 'bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs'
                                                        : 'bg-neutral-100 text-neutral-600 hover:bg-purple-50 hover:text-purple-700 font-medium'
                                                }`}
                                            >
                                                Pet Profile
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('identity')}
                                                className={`px-4 py-2 rounded-lg text-xs transition cursor-pointer ${
                                                    activeTab === 'identity'
                                                        ? 'bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs'
                                                        : 'bg-neutral-100 text-neutral-600 hover:bg-purple-50 hover:text-purple-700 font-medium'
                                                }`}
                                            >
                                                Applicant &amp; Identity
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('profile')}
                                                className={`px-4 py-2 rounded-lg text-xs transition cursor-pointer ${
                                                    activeTab === 'profile'
                                                        ? 'bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs'
                                                        : 'bg-neutral-100 text-neutral-600 hover:bg-purple-50 hover:text-purple-700 font-medium'
                                                }`}
                                            >
                                                Adopter Profile
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('welfare')}
                                                className={`px-4 py-2 rounded-lg text-xs transition cursor-pointer ${
                                                    activeTab === 'welfare'
                                                        ? 'bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs'
                                                        : 'bg-neutral-100 text-neutral-600 hover:bg-purple-50 hover:text-purple-700 font-medium'
                                                }`}
                                            >
                                                Welfare &amp; History
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('audit')}
                                                className={`px-4 py-2 rounded-lg text-xs transition cursor-pointer ${
                                                    activeTab === 'audit'
                                                        ? 'bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs'
                                                        : 'bg-neutral-100 text-neutral-600 hover:bg-purple-50 hover:text-purple-700 font-medium'
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
                                                    <span className="text-xs font-bold uppercase tracking-wider text-purple-900">
                                                        Adopter Profile vs. Pet Requirements Matrix
                                                    </span>
                                                    <Badge variant="outline" className="text-[10px] bg-white text-gray-600">
                                                        8-Factor Analysis
                                                    </Badge>
                                                </div>
                                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                                    <div className="p-3.5 bg-purple-50/40 border border-purple-100/80 rounded-xl space-y-2">
                                                        <span className="font-bold text-purple-900 block uppercase text-[11px]">
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
                                                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold uppercase tracking-wider text-purple-900">
                                                            Competing Applicants for {selectedApplication.pet.name} ({competingApplications.length})
                                                        </span>
                                                        <span className="text-[10px] text-purple-700 font-semibold">Ranked by Match %</span>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        {competingApplications.map((comp) => (
                                                            <div
                                                                key={comp.id}
                                                                onClick={() => handleSelectApplication(comp.id)}
                                                                className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-purple-200/80 hover:border-purple-600 transition cursor-pointer text-xs"
                                                            >
                                                                <div>
                                                                    <span className="font-bold text-gray-900">{comp.adopter.name}</span>
                                                                    <span className="text-gray-400 font-mono text-[10px] ml-2">#{comp.reference_number}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[11px] border border-purple-200">
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
                                    {/* TAB CONTENT 2: PET PROFILE & PHOTO GALLERY                  */}
                                    {/* ──────────────────────────────────────────────────────────── */}
                                    {activeTab === 'pet' && (
                                        <div className="space-y-6 pt-2 animate-in fade-in-50 duration-200">
                                            <div className="rounded-xl border border-gray-200 p-5 space-y-5">
                                                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-purple-900">
                                                        PET PROFILE &amp; HOUSING SPECIFICATIONS
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-800 border border-purple-200">
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

                                                        {/* Photo Thumbnails */}
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
                                                                                    ? 'border-purple-600 ring-2 ring-purple-600/30'
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
                                                                    <Badge key={tIdx} variant="outline" className="bg-purple-50 border-purple-200 text-purple-800 font-bold text-[10px] capitalize">
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
                                    {/* TAB CONTENT 3: APPLICANT & IDENTITY VERIFICATION            */}
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
                                                    <span className="text-xs font-bold uppercase tracking-wider text-purple-900">
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
                                                                    className="inline-flex items-center text-[11px] font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-full border border-purple-200 transition cursor-pointer"
                                                                >
                                                                    Inspect Front ID
                                                                </button>
                                                            )}
                                                            {activeProfile?.id_document_back_path && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setActiveIdModal({ open: true, side: 'back' })}
                                                                    className="inline-flex items-center text-[11px] font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-full border border-purple-200 transition cursor-pointer"
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
                                    {/* TAB CONTENT 4: ADOPTER PROFILE & LIFESTYLE                   */}
                                    {/* ──────────────────────────────────────────────────────────── */}
                                    {activeTab === 'profile' && (
                                        <div className="space-y-6 pt-2 animate-in fade-in-50 duration-200">
                                            <div className="rounded-xl border border-gray-200 p-5 space-y-4">
                                                <span className="text-xs font-bold uppercase tracking-wider text-purple-900 block border-b border-gray-100 pb-2">
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
                                    {/* TAB CONTENT 5: MUNICIPAL WELFARE RECORD (RA 8485)            */}
                                    {/* ──────────────────────────────────────────────────────────── */}
                                    {activeTab === 'welfare' && (
                                        <div className="space-y-6 pt-2 animate-in fade-in-50 duration-200">
                                            <div className="rounded-xl border border-gray-200 p-5 space-y-4">
                                                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-purple-900">
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
                                                            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200/80">
                                                                <span className="text-[10px] text-purple-800 font-bold block uppercase">Total Requests</span>
                                                                <span className="text-xl font-black text-purple-900">{adopterTrackRecord.total_applications}</span>
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

                                                            {adopterTrackRecord.previous_pet_notes && (
                                                                <div className="flex items-start py-1.5 border-b border-gray-50">
                                                                    <span className="w-52 text-gray-500 font-medium">Previous Pet Care Notes</span>
                                                                    <span className="text-gray-400 mr-2">:</span>
                                                                    <span className="text-gray-800 italic">"{adopterTrackRecord.previous_pet_notes}"</span>
                                                                </div>
                                                            )}

                                                            <div className="flex items-start py-1.5">
                                                                <span className="w-52 text-gray-500 font-medium">Pet Living Location</span>
                                                                <span className="text-gray-400 mr-2">:</span>
                                                                <span className="font-bold text-gray-900 capitalize">{adopterTrackRecord.pet_stay?.replace(/_/g, ' ') || 'Inside'}</span>
                                                            </div>
                                                        </div>

                                                        {/* Previously Adopted Pets List */}
                                                        {adopterTrackRecord.prior_adopted_pets && adopterTrackRecord.prior_adopted_pets.length > 0 && (
                                                            <div className="pt-3 border-t border-gray-100 space-y-2">
                                                                <span className="text-xs font-bold text-gray-800 uppercase block">
                                                                    Previously Adopted Animals in Municipal Registry
                                                                </span>
                                                                <div className="space-y-1.5">
                                                                    {adopterTrackRecord.prior_adopted_pets.map((p) => (
                                                                        <div key={p.id} className="p-2.5 bg-gray-50 rounded-lg border border-gray-200/80 flex items-center justify-between text-xs">
                                                                            <div>
                                                                                <span className="font-bold text-gray-900">{p.pet.name}</span>
                                                                                <span className="text-gray-500 ml-1.5">({p.pet.species})</span>
                                                                            </div>
                                                                            <span className="font-mono text-gray-500 text-[10px]">
                                                                                {p.certificate_number || p.reference_number}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-gray-400 italic">No previous municipal adoption records found.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* ──────────────────────────────────────────────────────────── */}
                                    {/* TAB CONTENT 6: AUDIT TRAIL & LIFECYCLE TIMELINE              */}
                                    {/* ──────────────────────────────────────────────────────────── */}
                                    {activeTab === 'audit' && (
                                        <div className="space-y-6 pt-2 animate-in fade-in-50 duration-200">
                                            <ApplicationTimelineCard
                                                timelines={selectedApplication.timelines || []}
                                                currentStatus={selectedApplication.status}
                                                pickupDeadlineAt={selectedApplication.pickup_deadline_at}
                                                userRole="mao"
                                            />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-gray-400 space-y-3">
                                    <ShieldCheck className="size-12 text-gray-300" />
                                    <p className="text-sm font-semibold">Select an application from the queue to view audit dossier.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ──────────────────────────────────────────────────────────────────── */}
            {/* FRONT & BACK ID INSPECTOR MODAL                                      */}
            {/* ──────────────────────────────────────────────────────────────────── */}
            {activeProfile && (
                <IdDocumentInspectorModal
                    open={activeIdModal.open}
                    onOpenChange={(open) => setActiveIdModal(prev => ({ ...prev, open }))}
                    documentUrl={
                        activeIdModal.side === 'front'
                            ? (activeProfile.id_document_path || '')
                            : (activeProfile.id_document_back_path || '')
                    }
                    documentName={
                        activeIdModal.side === 'front'
                            ? (activeProfile.id_document_name || 'Front Government ID')
                            : (activeProfile.id_document_back_name || 'Back Government ID')
                    }
                    applicantName={activeProfile.full_name || selectedApplication?.adopter?.name || 'Applicant'}
                    idType={activeProfile.valid_id_type || 'Government ID'}
                    idNumber={activeProfile.valid_id_number || 'N/A'}
                    side={activeIdModal.side}
                />
            )}

            {/* ──────────────────────────────────────────────────────────────────── */}
            {/* MAO STATUTORY COMPLIANCE AUDIT MODAL                                 */}
            {/* ──────────────────────────────────────────────────────────────────── */}
            {selectedApplication && (
                <Dialog open={isAuditModalOpen} onOpenChange={setIsAuditModalOpen}>
                    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-purple-600" />
                                Municipal Statutory Compliance Audit
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500">
                                Mandated review under RA 8485 (Animal Welfare Act) &amp; RA 9482 (Anti-Rabies Act) for application <strong className="font-mono text-gray-800">{selectedApplication.reference_number}</strong>
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleAuditSubmit} className="space-y-4 pt-2">
                            {/* Applicant Quick Header */}
                            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 flex items-center justify-between text-xs">
                                <div>
                                    <span className="font-bold text-purple-950 uppercase block">{selectedApplication.adopter.name}</span>
                                    <span className="text-gray-500 text-[11px]">Adopting <strong>{selectedApplication.pet.name}</strong> ({selectedApplication.pet.species})</span>
                                </div>
                                <span className="font-mono font-bold text-purple-800 bg-white px-2.5 py-1 rounded-md border border-purple-200">
                                    DSS: {Math.round(parseFloat(selectedApplication.dss_score))}%
                                </span>
                            </div>

                            {/* Statutory Compliance Checklist */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                        Statutory Compliance Checklist *
                                    </Label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const recomputed = Object.fromEntries(
                                                Object.keys(activeChecklist).map(key => [
                                                    key,
                                                    Boolean(activeChecklist[key]?.auto_compliant ?? false),
                                                ])
                                            );
                                            setAuditData('checklist', recomputed);
                                        }}
                                        className="text-[10px] text-purple-700 hover:text-purple-900 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                                        title="Restore automated compliance evaluation checks"
                                    >
                                        <Sparkles className="size-3 text-purple-600" />
                                        <span>Re-apply Auto Checks</span>
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {Object.entries(activeChecklist).map(([key, item]) => (
                                        <label
                                            key={key}
                                            className="flex items-start gap-2.5 p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-purple-50/30 cursor-pointer transition select-none"
                                        >
                                            <div
                                                className={`w-4 h-4 mt-0.5 shrink-0 rounded border-2 flex items-center justify-center transition-all ${
                                                    auditData.checklist[key] ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
                                                }`}
                                                onClick={() => toggleChecklist(key)}
                                            >
                                                {auditData.checklist[key] && <Check className="h-3 w-3 text-white" />}
                                            </div>
                                            <div className="text-xs flex-1" onClick={() => toggleChecklist(key)}>
                                                <div className="font-bold text-gray-800">{item.label}</div>
                                                <div className="text-gray-400 text-[10px]">{item.description}</div>
                                                {item.compliance_reason && (
                                                    <div className="mt-1 flex items-center gap-1.5">
                                                        {item.auto_compliant ? (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                                                                <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
                                                                <span>{item.compliance_reason}</span>
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                                                                <XCircle className="size-3 text-amber-600 shrink-0" />
                                                                <span>{item.compliance_reason}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                {!allChecklistItemsVerified && (
                                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-amber-800 text-[11px]">
                                        <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600" />
                                        <span>Notice: All compliance items must be verified before executing approval.</span>
                                    </div>
                                )}
                            </div>

                            {/* Final Determination Selection */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                    Final Municipal Determination *
                                </Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                                        auditData.decision === 'approved'
                                            ? 'bg-green-50 border-green-500 shadow-2xs'
                                            : 'bg-white border-gray-200 hover:bg-gray-50'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="audit_decision"
                                            value="approved"
                                            checked={auditData.decision === 'approved'}
                                            onChange={(e) => setAuditData('decision', e.target.value)}
                                            className="mt-0.5 text-green-600"
                                        />
                                        <div className="text-xs">
                                            <span className="font-bold text-green-950 block">
                                                Approve &amp; Issue Certificate
                                            </span>
                                            <span className="text-[10px] text-green-800 block mt-0.5 leading-snug">
                                                Mandatory 7-day pickup deadline assigned. Pet marked adopted and digital certificate generated.
                                            </span>
                                        </div>
                                    </label>

                                    <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                                        auditData.decision === 'rejected'
                                            ? 'bg-red-50 border-red-500 shadow-2xs'
                                            : 'bg-white border-gray-200 hover:bg-gray-50'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="audit_decision"
                                            value="rejected"
                                            checked={auditData.decision === 'rejected'}
                                            onChange={(e) => setAuditData('decision', e.target.value)}
                                            className="mt-0.5 text-red-600"
                                        />
                                        <div className="text-xs">
                                            <span className="font-bold text-red-950 block">
                                                Disapprove / Reject
                                            </span>
                                            <span className="text-[10px] text-red-800 block mt-0.5 leading-snug">
                                                Applicant notified with reasons. Pet returned to available shelter catalog for other candidates.
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Officer Remarks */}
                            <div className="space-y-1.5">
                                <Label htmlFor="modal-mao-remarks" className="text-xs font-bold text-gray-700">
                                    Official Audit Remarks &amp; Feedback
                                </Label>
                                <Textarea
                                    id="modal-mao-remarks"
                                    value={auditData.remarks}
                                    onChange={(e) => setAuditData('remarks', e.target.value)}
                                    rows={3}
                                    placeholder="Add notes explaining statutory compliance verification or reasons for decision..."
                                    className="text-xs"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsAuditModalOpen(false)}
                                    className="text-xs h-9 px-3.5 rounded-lg cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9 px-4 rounded-lg transition cursor-pointer"
                                >
                                    {processing ? 'Recording Determination...' : 'Finalize Compliance Determination'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </AppLayout>
    );
}
