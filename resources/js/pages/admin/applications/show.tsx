import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Sparkles, Check, X, ExternalLink, Eye, ShieldCheck, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { IdDocumentInspectorModal } from '@/components/id-document-inspector-modal';
import { IdentityVerificationReport } from '@/components/identity-verification-report';
import { IdentityVerificationBadge } from '@/components/identity-verification-badge';
import { AdoptionCertificateModal } from '@/components/adoption-certificate-modal';
import { AdoptionPassModal } from '@/components/adoption-pass-modal';
import { ConfirmPetReleaseModal } from '@/components/confirm-pet-release-modal';

interface ChecklistItem {
    label: string;
    description: string;
    auto_compliant?: boolean;
    compliance_reason?: string;
}

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
    released_at?: string | null;
    pickup_deadline_at?: string | null;
    releasing_officer?: { name: string } | null;
    releasing_notes?: string | null;
    release_checklist?: Record<string, boolean> | null;
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
        };
        latest_didit_verification?: any;
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

export default function AdminApplicationShow({
    application,
    defaultChecklist = {},
}: {
    application: Application;
    defaultChecklist?: Record<string, ChecklistItem>;
}) {
    const profile = application.adopter.adopter_profile;
    const lifestyle = application.adopter.lifestyle_profile;

    const [activeIdModal, setActiveIdModal] = useState<{ open: boolean; side: 'front' | 'back' }>({
        open: false,
        side: 'front',
    });

    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
    const [isVerifyingAdopter, setIsVerifyingAdopter] = useState(false);

    const handleManualVerifyAdopter = () => {
        if (!application.adopter?.id) return;
        const isVerified = Boolean(profile?.is_identity_verified);
        const actionText = isVerified ? 'revoke identity verification for' : 'manually approve and verify identity for';
        if (confirm(`Are you sure you want to ${actionText} ${application.adopter.name}? This will bypass Didit verification.`)) {
            setIsVerifyingAdopter(true);
            const targetUrl = (typeof route === 'function' && route('admin.users.toggle-verification', application.adopter.id))
                || `/admin/users/${application.adopter.id}/toggle-verification`;

            router.post(targetUrl, { action: isVerified ? 'revoke' : 'verify' }, {
                preserveScroll: true,
                onFinish: () => setIsVerifyingAdopter(false),
            });
        }
    };

    const buildInitialChecklistState = (app: Application, checklist: Record<string, ChecklistItem>) => {
        return Object.fromEntries(
            Object.keys(checklist).map(key => [
                key,
                app.mao_checklist
                    ? Boolean(app.mao_checklist[key])
                    : Boolean(checklist[key]?.auto_compliant ?? false),
            ])
        );
    };

    const { data: auditData, setData: setAuditData, post: postAudit, processing: auditProcessing } = useForm<{
        decision: string;
        remarks: string;
        checklist: Record<string, boolean>;
    }>({
        decision: application.mao_decision ?? 'approved',
        remarks: application.mao_remarks ?? '',
        checklist: buildInitialChecklistState(application, defaultChecklist),
    });

    const toggleChecklist = (key: string) => {
        setAuditData('checklist', {
            ...auditData.checklist,
            [key]: !auditData.checklist[key],
        });
    };

    const handleAuditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postAudit(route('admin.applications.audit', application.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsAuditModalOpen(false);
            },
        });
    };

    const allChecklistItemsVerified = Object.keys(defaultChecklist).length === 0 ||
        Object.keys(defaultChecklist).every(key => auditData.checklist[key]);

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
                    <div className="flex items-center gap-2 flex-wrap">
                        {application.status === 'mao_audit' && (
                            <Button
                                size="sm"
                                onClick={() => setIsAuditModalOpen(true)}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9 px-4 rounded-lg shadow-xs cursor-pointer transition flex items-center gap-1.5"
                            >
                                <ShieldCheck className="size-4" />
                                Conduct Statutory Audit
                            </Button>
                        )}
                        {application.status === 'approved' && (
                            <>
                                <ConfirmPetReleaseModal application={application as any} routePrefix="admin" />
                                <AdoptionCertificateModal application={application as any} />
                                <AdoptionPassModal application={application as any} />
                            </>
                        )}
                        {application.status === 'completed' && (
                            <>
                                <AdoptionCertificateModal application={application as any} />
                                <AdoptionPassModal application={application as any} />
                            </>
                        )}
                        <span className={`text-xs px-3.5 py-1 rounded-full uppercase font-bold tracking-wider ${
                            application.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : application.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : application.status === 'rejected' || application.status === 'unclaimed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-700'
                        }`}>
                            {application.status === 'completed' ? 'RELEASED / ADOPTED' : application.status.replace(/_/g, ' ')}
                        </span>
                    </div>
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

                        {/* Automated Identity & Biometric Verification Report */}
                        <IdentityVerificationReport
                            verification={application.adopter?.latest_didit_verification}
                            adopterProfile={profile}
                        />

                        {/* Adopter details */}
                        {profile && (
                            <Card className="border-gray-200 shadow-md">
                                <CardHeader className="flex flex-row items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <CardTitle className="text-sm font-bold text-gray-800">Adopter Profile</CardTitle>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={isVerifyingAdopter}
                                            onClick={handleManualVerifyAdopter}
                                            className={`h-6 text-[10px] px-2 rounded-md font-semibold ${
                                                profile?.is_identity_verified
                                                    ? 'text-red-700 hover:bg-red-50 hover:text-red-800'
                                                    : 'text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 border border-emerald-300'
                                            }`}
                                        >
                                            {isVerifyingAdopter ? 'Updating...' : (profile?.is_identity_verified ? 'Revoke Verification' : 'Manual Verify Adopter')}
                                        </Button>
                                    </div>
                                    <IdentityVerificationBadge
                                        isVerified={profile.is_identity_verified}
                                        faceMatchScore={profile.face_match_score}
                                        livenessVerified={profile.liveness_verified}
                                        showDetails
                                    />
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
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-gray-700">{profile.valid_id_type} — {profile.valid_id_number}</span>
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

                                {/* MAO Staff reviewed */}
                                {application.mao_decision && (
                                    <div className="border-l-2 border-blue-500 pl-3 py-1">
                                        <div className="font-bold text-gray-700">MAO Final decision: <span className="uppercase text-blue-600">{application.mao_decision}</span></div>
                                        <div className="text-gray-400 mt-0.5">By {application.mao_officer?.name || 'Officer'} • {application.resolved_at ? new Date(application.resolved_at).toLocaleString() : ''}</div>
                                        {application.mao_remarks && <p className="italic text-gray-500 mt-1">"{application.mao_remarks}"</p>}
                                    </div>
                                )}

                                {/* Physical Release / Handover Turnover */}
                                {application.status === 'completed' && (
                                    <div className="border-l-2 border-emerald-500 pl-3 py-1">
                                        <div className="font-bold text-gray-700">Physical Pet Turnover: <span className="uppercase text-emerald-600 font-black">RELEASED &amp; ADOPTED</span></div>
                                        <div className="text-gray-400 mt-0.5">By {application.releasing_officer?.name || 'Authorized Officer'} • {application.released_at ? new Date(application.released_at).toLocaleString() : ''}</div>
                                        {application.releasing_notes && <p className="italic text-gray-500 mt-1">"{application.releasing_notes}"</p>}
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
                                    <div className="space-y-3">
                                        <p className="text-gray-400 italic text-[11px]">MAO audit has not been completed yet.</p>
                                        {application.status === 'mao_audit' && (
                                            <Button
                                                size="sm"
                                                onClick={() => setIsAuditModalOpen(true)}
                                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9 rounded-lg shadow-xs cursor-pointer transition flex items-center justify-center gap-1.5"
                                            >
                                                <ShieldCheck className="size-4" />
                                                Conduct Statutory Audit
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Physical Turnover & Release Status */}
                        {application.status === 'approved' && (
                            <Card className="border-emerald-300 bg-emerald-50/60 shadow-md">
                                <CardHeader className="p-4 pb-2 border-b border-emerald-200">
                                    <CardTitle className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                        MAO Approved &bull; Ready for Release
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3 text-xs">
                                    <p className="text-emerald-800 leading-relaxed">
                                        Adopter has been issued the official Municipal Adoption Pass. Verify ID, carrier/gear, and turnover logbook before confirming release.
                                    </p>
                                    {application.pickup_deadline_at && (
                                        <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            Claim Deadline: {new Date(application.pickup_deadline_at).toLocaleDateString()}
                                        </div>
                                    )}
                                    <div className="pt-1">
                                        <ConfirmPetReleaseModal application={application as any} routePrefix="admin" />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {application.status === 'completed' && (
                            <Card className="border-emerald-300 bg-emerald-50/50 shadow-md">
                                <CardHeader className="p-4 pb-2 border-b border-emerald-200">
                                    <CardTitle className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                        Pet Handover Confirmed
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-2 text-xs text-emerald-800">
                                    <p><strong>Date Released:</strong> {application.released_at ? new Date(application.released_at).toLocaleDateString() : 'Recorded in registry'}</p>
                                    {application.releasing_officer && (
                                        <p><strong>Releasing Officer:</strong> {application.releasing_officer.name}</p>
                                    )}
                                    {application.releasing_notes && (
                                        <p className="italic text-gray-600">"{application.releasing_notes}"</p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {application.status === 'unclaimed' && (
                            <Card className="border-red-300 bg-red-50/50 shadow-md">
                                <CardHeader className="p-4 pb-2 border-b border-red-200">
                                    <CardTitle className="text-sm font-bold text-red-900 flex items-center gap-1.5">
                                        <Clock className="h-4 w-4 text-red-600" />
                                        Adoption Forfeited — Unclaimed
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-2 text-xs text-red-800">
                                    <p>The adopter did not pick up the pet within the scheduled deadline. The pet has been returned to the available catalog.</p>
                                    {application.releasing_notes && (
                                        <p className="italic text-gray-600">"{application.releasing_notes}"</p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        <Link href={route('admin.applications.index')} className="block">
                            <Button variant="outline" className="w-full text-xs border-gray-200">
                                ← Back to Applications
                            </Button>
                        </Link>

                    </div>
                </div>

            </div>

            {/* ID Document Inspector Modal */}
            {profile && (
                <IdDocumentInspectorModal
                    open={activeIdModal.open}
                    onOpenChange={(open) => setActiveIdModal(prev => ({ ...prev, open }))}
                    title="Applicant Verified ID Document"
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

            {/* Municipal Statutory Compliance Audit Modal (Admin Action) */}
            <Dialog open={isAuditModalOpen} onOpenChange={setIsAuditModalOpen}>
                <DialogContent className="sm:max-w-2xl bg-white p-6 rounded-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="space-y-1 pb-3 border-b border-gray-100 text-left">
                        <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-purple-600" />
                            Municipal Statutory Compliance Audit
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            Mandated review under RA 8485 (Animal Welfare Act) &amp; RA 9482 (Anti-Rabies Act) for application <strong className="font-mono text-gray-800">{application.reference_number}</strong>
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAuditSubmit} className="space-y-4 pt-2">
                        {/* Applicant Quick Header */}
                        <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 flex items-center justify-between text-xs">
                            <div>
                                <span className="font-bold text-purple-950 uppercase block">{application.adopter.name}</span>
                                <span className="text-gray-500 text-[11px]">Adopting <strong>{application.pet.name}</strong> ({application.pet.species})</span>
                            </div>
                            <span className="font-mono font-bold text-purple-800 bg-white px-2.5 py-1 rounded-md border border-purple-200">
                                DSS: {Math.round(parseFloat(application.dss_score))}%
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
                                            Object.keys(defaultChecklist).map(key => [
                                                key,
                                                Boolean(defaultChecklist[key]?.auto_compliant ?? false),
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
                                {Object.entries(defaultChecklist).map(([key, item]) => (
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
                                            Mandatory pickup deadline assigned. Pet marked adopted and digital certificate generated.
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
                                disabled={auditProcessing}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9 px-4 rounded-lg transition cursor-pointer"
                            >
                                {auditProcessing ? 'Recording Determination...' : 'Finalize Compliance Determination'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
