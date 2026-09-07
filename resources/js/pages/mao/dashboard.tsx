import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    ShieldCheck, ShieldAlert, CheckCircle2, XCircle, 
    ClipboardList, Award, Home, Activity, AlertTriangle, 
    ArrowRight, Percent, Dog, Cat, Clock, ExternalLink, Calendar
} from 'lucide-react';

interface Metrics {
    total_applications: number;
    pending_audits_count: number;
    approved_count: number;
    rejected_count: number;
    pass_rate: number;
    rejection_rate: number;
    avg_dss_score: number;
    total_pets_available: number;
    total_pets_adopted: number;
    dogs_available: number;
    cats_available: number;
}

interface Application {
    id: number;
    reference_number: string;
    status: string;
    dss_score: number;
    submitted_at: string;
    resolved_at?: string | null;
    adopter?: {
        name: string;
        email: string;
        adopter_profile?: {
            contact_number?: string;
            home_address?: string;
        };
    };
    pet?: {
        name: string;
        species: string;
        shelter?: { name: string };
        photos?: { photo_path: string }[];
    };
    mao_officer?: { name: string } | null;
}

interface Shelter {
    id: number;
    name: string;
    location: string;
    total_pets_count: number;
    active_pets_count: number;
    adopted_pets_count: number;
    status: string;
}

interface MonthlyTrend {
    month: string;
    count: number;
}

interface Props {
    metrics: Metrics;
    pendingApplications: Application[];
    recentResolved: Application[];
    shelters: Shelter[];
    monthlyTrends: MonthlyTrend[];
}

export default function MaoDashboard({
    metrics,
    pendingApplications = [],
    recentResolved = [],
    shelters = [],
    monthlyTrends = [],
}: Props) {
    const hasPendingAudits = metrics.pending_audits_count > 0;

    return (
        <AppLayout breadcrumbs={[{ title: 'MAO Compliance Dashboard', href: route('mao.dashboard') }]}>
            <Head title="MAO Compliance & Analytics Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 md:p-6">

                {/* Top Header Row */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                                Municipal Animal Welfare Dashboard
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-800 border border-purple-200">
                                MAO Officer
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Virac Municipal Agriculture Office — Statutory adoption oversight (RA 8485 &amp; RA 9482 compliance).
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href={route('mao.reports.index')}>
                            <Button variant="outline" size="sm" className="text-xs border-gray-200 gap-1.5 shadow-2xs">
                                <Activity className="h-3.5 w-3.5 text-gray-500" />
                                Reports &amp; Analytics
                            </Button>
                        </Link>
                        <Link href={route('mao.applications.index')}>
                            <Button className="bg-[#D4A017] hover:bg-[#B8860B] text-white text-xs gap-1.5 shadow-xs">
                                <ClipboardList className="h-3.5 w-3.5" />
                                Audit Queue ({metrics.pending_audits_count})
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Urgent Pending Approval Notification Banner */}
                {hasPendingAudits ? (
                    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 rounded-r-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-amber-500 text-white shadow-xs shrink-0 mt-0.5 sm:mt-0">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    Action Required: {metrics.pending_audits_count} {metrics.pending_audits_count === 1 ? 'Application Needs' : 'Applications Need'} Official MAO Approval
                                    <span className="animate-pulse flex h-2 w-2 rounded-full bg-amber-500" />
                                </h3>
                                <p className="text-xs text-gray-600 mt-0.5">
                                    Adoption applications have been endorsed by shelter staff and require your statutory compliance sign-off under RA 8485 before pet release.
                                </p>
                            </div>
                        </div>
                        <Link href={route('mao.applications.index', { status: 'mao_audit' })} className="shrink-0">
                            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold gap-1 shadow-xs">
                                Review Queue <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-4 flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                        <div>
                            <span className="text-xs font-bold text-emerald-900">Audit Queue Clear</span>
                            <p className="text-[11px] text-emerald-700">All submitted applications have undergone statutory compliance evaluation.</p>
                        </div>
                    </div>
                )}

                {/* Analytical KPI Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    
                    {/* Pending Audits */}
                    <Card className="border-gray-200/80 shadow-2xs relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-bl-full -z-0 opacity-50" />
                        <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-3.5 relative z-10">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Awaiting Audit</span>
                            <ShieldAlert className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 relative z-10">
                            <div className="text-2xl font-black text-amber-600">{metrics.pending_audits_count}</div>
                            <span className="text-[10px] text-amber-700 font-medium">pending your decision</span>
                        </CardContent>
                    </Card>

                    {/* Approved Adoptions */}
                    <Card className="border-gray-200/80 shadow-2xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-3.5">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Approved</span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0">
                            <div className="text-2xl font-black text-emerald-600">{metrics.approved_count}</div>
                            <span className="text-[10px] text-emerald-700 font-semibold">{metrics.pass_rate}% compliance rate</span>
                        </CardContent>
                    </Card>

                    {/* Disapproved */}
                    <Card className="border-gray-200/80 shadow-2xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-3.5">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Disapproved</span>
                            <XCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0">
                            <div className="text-2xl font-black text-red-500">{metrics.rejected_count}</div>
                            <span className="text-[10px] text-red-600 font-medium">{metrics.rejection_rate}% non-compliant</span>
                        </CardContent>
                    </Card>

                    {/* Average DSS Compatibility */}
                    <Card className="border-gray-200/80 shadow-2xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-3.5">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Avg DSS Score</span>
                            <Percent className="h-4 w-4 text-[#D4A017]" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0">
                            <div className="text-2xl font-black text-[#D4A017]">{metrics.avg_dss_score}%</div>
                            <span className="text-[10px] text-gray-400">algorithm match</span>
                        </CardContent>
                    </Card>

                    {/* Pets Available in Municipality */}
                    <Card className="border-gray-200/80 shadow-2xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-3.5">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Available Pets</span>
                            <Home className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0">
                            <div className="text-2xl font-black text-purple-700">{metrics.total_pets_available}</div>
                            <span className="text-[10px] text-gray-400">across {shelters.length} shelters</span>
                        </CardContent>
                    </Card>

                    {/* Total Adoptions Finalized */}
                    <Card className="border-gray-200/80 shadow-2xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-3.5">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Adoptions Placed</span>
                            <Award className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0">
                            <div className="text-2xl font-black text-blue-700">{metrics.total_pets_adopted}</div>
                            <span className="text-[10px] text-gray-400">certified adoptions</span>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Split: Needs Approval Queue & Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left 2 Cols: Urgent Needs Approval Queue */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card className="border-gray-200 shadow-sm">
                            <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base font-bold text-gray-800">
                                            Urgent Pending Approval Queue
                                        </CardTitle>
                                        {hasPendingAudits && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                                {metrics.pending_audits_count} Pending
                                            </span>
                                        )}
                                    </div>
                                    <CardDescription className="text-xs">
                                        Endorsed by shelter staff awaiting MAO statutory compliance audit and certificate generation.
                                    </CardDescription>
                                </div>
                                <Link href={route('mao.applications.index', { status: 'mao_audit' })}>
                                    <Button variant="ghost" size="sm" className="text-xs text-[#D4A017] hover:text-[#B8860B]">
                                        View All ({metrics.pending_audits_count}) &rarr;
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent className="p-0 overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-gray-50/70 text-gray-600 font-semibold border-b border-gray-100">
                                        <tr>
                                            <th className="p-3">Reference No</th>
                                            <th className="p-3">Adopter</th>
                                            <th className="p-3">Pet &amp; Shelter</th>
                                            <th className="p-3 text-center">DSS Match</th>
                                            <th className="p-3">Applied</th>
                                            <th className="p-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-gray-700">
                                        {pendingApplications.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="p-8 text-center text-gray-400">
                                                    <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                                                    No applications currently awaiting statutory compliance approval.
                                                </td>
                                            </tr>
                                        ) : (
                                            pendingApplications.map(app => (
                                                <tr key={app.id} className="hover:bg-amber-50/30 transition">
                                                    <td className="p-3 font-semibold text-gray-900">
                                                        <Link 
                                                            href={route('mao.applications.show', app.id)}
                                                            className="hover:text-[#D4A017] hover:underline"
                                                        >
                                                            {app.reference_number}
                                                        </Link>
                                                        <div className="text-[10px] text-amber-700 font-medium flex items-center gap-1 mt-0.5">
                                                            <Clock className="h-3 w-3" /> Awaiting Audit
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="font-semibold text-gray-800">{app.adopter?.name}</div>
                                                        <div className="text-[10px] text-gray-400">{app.adopter?.email}</div>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="font-semibold text-gray-800">{app.pet?.name}</div>
                                                        <div className="text-[10px] text-gray-400 capitalize">
                                                            {app.pet?.species} • {app.pet?.shelter?.name}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className={`font-bold ${
                                                            app.dss_score >= 80 ? 'text-green-600' :
                                                            app.dss_score >= 50 ? 'text-[#D4A017]' : 'text-red-500'
                                                        }`}>
                                                            {Math.round(app.dss_score)}%
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-gray-500">
                                                        {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : '-'}
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <Link href={route('mao.applications.show', app.id)}>
                                                            <Button 
                                                                size="sm" 
                                                                className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold gap-1 shadow-2xs"
                                                            >
                                                                <ShieldCheck className="h-3.5 w-3.5" />
                                                                Audit
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>

                        {/* Municipal Shelter Capacity & Compliance Overview */}
                        <Card className="border-gray-200 shadow-sm">
                            <CardHeader className="pb-3 border-b border-gray-100">
                                <CardTitle className="text-sm font-bold text-gray-800">
                                    Municipal Shelter Oversight &amp; Placement Velocity
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Shelter capacity and active animal registry counts across Virac municipality.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-gray-50/50 text-gray-500 font-semibold border-b border-gray-100">
                                        <tr>
                                            <th className="p-3">Shelter Name</th>
                                            <th className="p-3">Location</th>
                                            <th className="p-3 text-center">Available Pets</th>
                                            <th className="p-3 text-center">Adopted</th>
                                            <th className="p-3 text-center">Total Catalog</th>
                                            <th className="p-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-gray-700">
                                        {shelters.map(s => (
                                            <tr key={s.id} className="hover:bg-gray-50/20 transition">
                                                <td className="p-3 font-semibold text-gray-900">{s.name}</td>
                                                <td className="p-3 text-gray-500">{s.location}</td>
                                                <td className="p-3 text-center font-bold text-green-600">{s.active_pets_count}</td>
                                                <td className="p-3 text-center font-semibold text-blue-600">{s.adopted_pets_count}</td>
                                                <td className="p-3 text-center text-gray-500">{s.total_pets_count}</td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                        s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {s.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>

                    </div>

                    {/* Right Col: Recent Finalized Audits & Quick Actions */}
                    <div className="space-y-4">

                        {/* Recent Finalized Audits */}
                        <Card className="border-gray-200 shadow-sm">
                            <CardHeader className="pb-3 border-b border-gray-100">
                                <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                                    <Award className="h-4 w-4 text-purple-600" />
                                    Recently Finalized Audits
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Official decisions and certification records.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 divide-y divide-gray-100">
                                {recentResolved.length === 0 ? (
                                    <p className="p-4 text-xs text-gray-400">No finalized audit decisions yet.</p>
                                ) : (
                                    recentResolved.map(app => (
                                        <div key={app.id} className="p-3 text-xs space-y-1 hover:bg-gray-50/40">
                                            <div className="flex items-center justify-between">
                                                <Link 
                                                    href={route('mao.applications.show', app.id)}
                                                    className="font-semibold text-gray-800 hover:text-[#D4A017]"
                                                >
                                                    {app.reference_number}
                                                </Link>
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                    app.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {app.status}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-gray-500">
                                                {app.adopter?.name} adopting {app.pet?.name}
                                            </div>
                                            <div className="text-[10px] text-gray-400 flex items-center justify-between pt-0.5">
                                                <span>Shelter: {app.pet?.shelter?.name}</span>
                                                <span>{app.resolved_at ? new Date(app.resolved_at).toLocaleDateString() : ''}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        {/* Statutory Compliance Guidelines Card */}
                        <Card className="border-purple-200/80 bg-purple-50/30 shadow-2xs">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold text-purple-900 flex items-center gap-1.5 uppercase tracking-wider">
                                    <ShieldCheck className="h-4 w-4 text-purple-600" />
                                    Statutory Audit Framework
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs text-purple-950/80 space-y-2">
                                <div className="p-2.5 rounded-lg bg-white border border-purple-100 shadow-2xs">
                                    <span className="font-bold text-purple-900 block">RA 8485: Animal Welfare Act</span>
                                    <span className="text-[11px] text-gray-500">Ensures adequate shelter, nutrition, and prevention of cruelty or abandonment.</span>
                                </div>
                                <div className="p-2.5 rounded-lg bg-white border border-purple-100 shadow-2xs">
                                    <span className="font-bold text-purple-900 block">RA 9482: Anti-Rabies Act</span>
                                    <span className="text-[11px] text-gray-500">Mandates pet registration, rabies vaccination tracking, and responsible pet ownership.</span>
                                </div>
                            </CardContent>
                        </Card>

                    </div>

                </div>

            </div>
        </AppLayout>
    );
}
