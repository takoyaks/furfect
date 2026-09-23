import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    FileText, Download, Check, X, ShieldAlert, 
    Percent, Activity, Dog, Cat, ArrowUpDown, HeartHandshake, Home
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import ReportFilterBar, { ReportFilterState } from '@/components/report-filter-bar';
import { useThemeTemplate } from '@/hooks/use-theme-template';
import { cn } from '@/lib/utils';

interface Stats {
    total_applications: number;
    approved_applications: number;
    rejected_applications: number;
    pending_applications: number;
    approval_rate: number;
    rejection_rate: number;
    avg_dss_score: number;
}

interface SpeciesBreakdown {
    dogs: number;
    cats: number;
}

interface PetMetrics {
    pets_available: number;
    pets_adopted: number;
}

interface Shelter {
    id: number;
    name: string;
}

interface Application {
    id: number;
    reference_number: string;
    status: string;
    dss_score: number;
    submitted_at: string;
    resolved_at: string | null;
    adopter: { name: string; email: string };
    pet: { name: string; species: string; shelter: { name: string } };
}

interface PaginatedApplications {
    data: Application[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    from: number;
    to: number;
}

const STATUS_BADGE: Record<string, string> = {
    approved: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    under_review: 'bg-blue-100 text-blue-700 border-blue-200',
    mao_audit: 'bg-purple-100 text-purple-700 border-purple-200',
};

export default function ShelterReports({ 
    stats, 
    speciesBreakdown,
    petMetrics,
    applications,
    shelters,
    filters,
    activeFilterDescriptions,
}: { 
    stats: Stats; 
    speciesBreakdown: SpeciesBreakdown;
    petMetrics: PetMetrics;
    applications: PaginatedApplications;
    shelters: Shelter[];
    filters: ReportFilterState;
    activeFilterDescriptions: Record<string, string>;
}) {
    const theme = useThemeTemplate();
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
        if (val && val !== 'all') {
            queryParams.set(key, String(val));
        }
    });
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const pdfUrl = `${route('shelter.reports.pdf')}${queryString}`;
    const excelUrl = `${route('shelter.reports.excel')}${queryString}`;

    const handleSort = (field: string) => {
        const nextDir = filters.sort_by === field && filters.sort_dir === 'asc' ? 'desc' : 'asc';
        router.get(route('shelter.reports.index'), {
            ...filters,
            sort_by: field,
            sort_dir: nextDir,
        }, {
            preserveState: true,
            replace: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Shelter Reports & Analytics', href: '#' }]}>
            <Head title="Shelter Adoption Reports & Activity" />
            <div className="flex h-full flex-1 flex-col gap-5 overflow-x-auto rounded-xl p-4 md:p-6">
                
                {/* Header Action Row */}
                <div className="flex justify-between items-center flex-wrap gap-4 border-b border-gray-100 pb-4">
                    <div>
                        <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">Shelter Adoption Reports</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Adoption analytics, filter criteria, and exportable reports for your shelter operations.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <a href={pdfUrl} target="_blank" rel="noreferrer">
                            <Button variant="outline" className="border-gray-200 text-xs flex items-center gap-1.5 shadow-2xs hover:bg-gray-50">
                                <Download className="h-4 w-4 text-red-600" />
                                Download PDF
                            </Button>
                        </a>
                        <a href={excelUrl}>
                            <Button className={cn("text-white text-xs flex items-center gap-1.5 shadow-xs", theme.primaryButton)}>
                                <Download className="h-4 w-4" />
                                Download Excel (CSV)
                            </Button>
                        </a>
                    </div>
                </div>

                {/* Filter Bar */}
                <ReportFilterBar
                    baseUrl={route('shelter.reports.index')}
                    filters={filters}
                    shelters={shelters}
                    showShelterFilter={false}
                    activeFilterDescriptions={activeFilterDescriptions}
                />

                {/* Dynamic KPI Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <Card className="border-gray-200/80 shadow-2xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-3.5">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Received</span>
                            <FileText className="h-4 w-4 text-gray-600" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0">
                            <div className="text-2xl font-black text-gray-800">{stats.total_applications}</div>
                            <span className="text-[10px] text-gray-400">matching criteria</span>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200/80 shadow-2xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-3.5">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Adoptions Approved</span>
                            <Check className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0">
                            <div className="text-2xl font-black text-green-600">{stats.approved_applications}</div>
                            <span className="text-[10px] text-green-700 font-semibold">{stats.approval_rate}% conversion</span>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200/80 shadow-2xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-3.5">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Rejected</span>
                            <X className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0">
                            <div className="text-2xl font-black text-red-500">{stats.rejected_applications}</div>
                            <span className="text-[10px] text-red-600 font-medium">{stats.rejection_rate}% rate</span>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200/80 shadow-2xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-3.5">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Awaiting Decision</span>
                            <ShieldAlert className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0">
                            <div className="text-2xl font-black text-amber-500">{stats.pending_applications}</div>
                            <span className="text-[10px] text-gray-400">in review / audit</span>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200/80 shadow-2xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-3.5">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Avg DSS Score</span>
                            <Percent className={cn("h-4 w-4", theme.accentIcon)} />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0">
                            <div className={cn("text-2xl font-black", theme.accentText)}>{stats.avg_dss_score}%</div>
                            <span className="text-[10px] text-gray-400">applicant compatibility</span>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200/80 shadow-2xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-3.5">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Active Inventory</span>
                            <Home className={cn("h-4 w-4", theme.iconText)} />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0">
                            <div className="text-2xl font-black text-purple-700">{petMetrics.pets_available}</div>
                            <span className="text-[10px] text-gray-400">pets seeking homes</span>
                        </CardContent>
                    </Card>
                </div>

                {/* Filtered Applications Activity Log Table */}
                <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-bold text-gray-800">
                                Shelter Applications Activity
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Showing {applications.from || 0} to {applications.to || 0} of {applications.total} applications matching your filters.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-gray-50/70 text-gray-600 font-semibold border-b border-gray-100">
                                <tr>
                                    <th className="p-3">Reference No</th>
                                    <th className="p-3">Adopter Name</th>
                                    <th className="p-3">Pet Name</th>
                                    <th className="p-3 text-center cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('dss_score')}>
                                        <div className="inline-flex items-center gap-1">
                                            DSS Score
                                            <ArrowUpDown className="h-3 w-3 text-gray-400" />
                                        </div>
                                    </th>
                                    <th className="p-3 text-center cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('status')}>
                                        <div className="inline-flex items-center gap-1">
                                            Status
                                            <ArrowUpDown className="h-3 w-3 text-gray-400" />
                                        </div>
                                    </th>
                                    <th className="p-3 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('submitted_at')}>
                                        <div className="inline-flex items-center gap-1">
                                            Date Applied
                                            <ArrowUpDown className="h-3 w-3 text-gray-400" />
                                        </div>
                                    </th>
                                    <th className="p-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                {applications.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-gray-400">
                                            No applications match the current filter criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    applications.data.map(app => (
                                        <tr key={app.id} className="hover:bg-gray-50/50 transition">
                                            <td className="p-3 font-semibold text-gray-900">
                                                <Link 
                                                    href={route('shelter.applications.show', app.id)} 
                                                    className="hover:text-[#D4A017] hover:underline"
                                                >
                                                    {app.reference_number}
                                                </Link>
                                            </td>
                                            <td className="p-3">
                                                <div className="font-medium text-gray-800">{app.adopter?.name || 'N/A'}</div>
                                                <div className="text-[10px] text-gray-400">{app.adopter?.email || ''}</div>
                                            </td>
                                            <td className="p-3">
                                                <div className="font-semibold text-gray-800">{app.pet?.name || 'N/A'}</div>
                                                <div className="text-[10px] text-gray-400 capitalize">{app.pet?.species || ''}</div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`font-bold ${
                                                    app.dss_score >= 80 ? 'text-green-600' : 
                                                    app.dss_score >= 50 ? 'text-[#D4A017]' : 'text-red-500'
                                                }`}>
                                                    {Math.round(app.dss_score)}%
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                                    STATUS_BADGE[app.status] || 'bg-gray-100 text-gray-700 border-gray-200'
                                                }`}>
                                                    {app.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="p-3 text-gray-500">
                                                {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="p-3 text-right">
                                                <Link href={route('shelter.applications.show', app.id)}>
                                                    <Button variant="ghost" size="sm" className="h-7 text-xs text-[#D4A017] hover:bg-[#D4A017]/10">
                                                        Review
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

                {/* Pagination */}
                {applications.links && applications.links.length > 3 && (
                    <div className="flex items-center gap-1 justify-end">
                        {applications.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'ghost'}
                                size="sm"
                                disabled={!link.url}
                                className={cn("text-xs min-w-8 h-7 px-2", link.active ? theme.primaryButton : '')}
                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true, replace: true, preserveScroll: true })}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
