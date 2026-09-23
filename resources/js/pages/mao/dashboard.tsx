import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    ShieldCheck, 
    ShieldAlert, 
    CheckCircle2, 
    XCircle, 
    ClipboardList, 
    Award, 
    Home, 
    Activity, 
    AlertTriangle, 
    ArrowRight, 
    Percent, 
    BarChart3,
    PieChart as PieChartIcon,
    Layers,
    TrendingUp
} from 'lucide-react';
import ApexChart, { THEME_COLORS } from '@/components/charts/apex-chart';
import { useThemeTemplate } from '@/hooks/use-theme-template';
import { cn } from '@/lib/utils';
import type { ApexOptions } from 'apexcharts';

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
    approved: number;
    rejected: number;
}

interface StatusDistribution {
    approved: number;
    rejected: number;
    mao_audit: number;
    under_review: number;
    pending: number;
}

interface SpeciesStats {
    dogs_available: number;
    dogs_adopted: number;
    cats_available: number;
    cats_adopted: number;
}

interface DssScoreDistribution {
    high: number;
    medium: number;
    low: number;
}

interface MaoDashboardProps {
    metrics: Metrics;
    shelters: Shelter[];
    monthlyTrends: MonthlyTrend[];
    statusDistribution: StatusDistribution;
    speciesStats: SpeciesStats;
    dssScoreDistribution: DssScoreDistribution;
}

export default function MaoDashboard({
    metrics,
    shelters = [],
    monthlyTrends = [],
    statusDistribution,
    speciesStats,
    dssScoreDistribution,
}: MaoDashboardProps) {
    const theme = useThemeTemplate();
    const hasPendingAudits = metrics.pending_audits_count > 0;

    // 1. Monthly Compliance Decision Trajectory
    const monthlyComplianceOptions: ApexOptions = {
        chart: {
            type: 'area' as const,
            toolbar: { show: false },
            fontFamily: 'inherit',
        },
        colors: [THEME_COLORS.mutedGreen, '#EF4444'],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth' as const, width: 3 },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.45,
                opacityTo: 0.05,
                stops: [0, 95, 100],
            },
        },
        xaxis: {
            categories: monthlyTrends.map(t => t.month),
            labels: { style: { colors: '#283F24', fontSize: '11px', fontWeight: 500 } },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: { style: { colors: '#283F24', fontSize: '11px' } },
        },
        grid: {
            borderColor: '#f1f1f1',
            strokeDashArray: 4,
        },
        tooltip: {
            theme: 'light',
        },
        legend: {
            position: 'top' as const,
            horizontalAlign: 'right' as const,
            labels: { colors: '#283F24' },
        },
    };

    const monthlyComplianceSeries = [
        {
            name: 'Statutory Approvals (RA 8485 Compliant)',
            data: monthlyTrends.map(t => t.approved),
        },
        {
            name: 'Disapproved / Ineligible',
            data: monthlyTrends.map(t => t.rejected),
        },
    ];

    // 2. Audit Outcomes Distribution Donut
    const auditValues = [
        statusDistribution?.approved || 0,
        statusDistribution?.rejected || 0,
        statusDistribution?.mao_audit || 0,
        statusDistribution?.under_review || 0,
        statusDistribution?.pending || 0,
    ];
    const totalAudits = auditValues.reduce((a, b) => a + b, 0);

    const auditDonutOptions: ApexOptions = {
        chart: {
            type: 'donut' as const,
            fontFamily: 'inherit',
        },
        labels: [
            'Approved Placement',
            'Disapproved / Non-Compliant',
            'Awaiting MAO Statutory Audit',
            'Under Staff Review',
            'Pending Initial Intake',
        ],
        colors: [
            THEME_COLORS.mutedGreen,
            '#EF4444',
            THEME_COLORS.vibrantYellow,
            '#5E9447',
            THEME_COLORS.darkForestGreen,
        ],
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Total Dossiers',
                            color: '#283F24',
                            formatter: () => `${totalAudits}`,
                        },
                    },
                },
            },
        },
        legend: {
            position: 'bottom' as const,
            labels: { colors: '#283F24' },
        },
        dataLabels: { enabled: false },
        stroke: { width: 2, colors: ['#ffffff'] },
    };

    // 3. Municipal Shelter Capacity & Velocity (Grouped Bar Chart)
    const shelterChartOptions: ApexOptions = {
        chart: {
            type: 'bar' as const,
            toolbar: { show: false },
            fontFamily: 'inherit',
        },
        plotOptions: {
            bar: {
                horizontal: true,
                barHeight: '55%',
                borderRadius: 4,
            },
        },
        colors: [THEME_COLORS.vibrantYellow, THEME_COLORS.darkForestGreen],
        xaxis: {
            categories: shelters.map(s => s.name),
            labels: { style: { colors: '#283F24', fontSize: '10px' } },
        },
        yaxis: {
            labels: { style: { colors: '#283F24', fontSize: '11px', fontWeight: 500 } },
        },
        grid: {
            borderColor: '#f1f1f1',
            strokeDashArray: 4,
        },
        legend: {
            position: 'top' as const,
            labels: { colors: '#283F24' },
        },
    };

    const shelterChartSeries = [
        {
            name: 'Available for Adoption',
            data: shelters.map(s => s.active_pets_count),
        },
        {
            name: 'Certified Adoptions Placed',
            data: shelters.map(s => s.adopted_pets_count),
        },
    ];

    // 4. Species Demographics Breakdown
    const speciesChartOptions: ApexOptions = {
        chart: {
            type: 'bar' as const,
            stacked: true,
            toolbar: { show: false },
            fontFamily: 'inherit',
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '45%',
                borderRadius: 6,
            },
        },
        colors: [THEME_COLORS.vibrantYellow, THEME_COLORS.mutedGreen],
        xaxis: {
            categories: ['Canines (Dogs)', 'Felines (Cats)'],
            labels: { style: { colors: '#283F24', fontSize: '11px', fontWeight: 600 } },
        },
        yaxis: {
            labels: { style: { colors: '#283F24', fontSize: '11px' } },
        },
        grid: {
            borderColor: '#f1f1f1',
            strokeDashArray: 4,
        },
        legend: {
            position: 'top' as const,
            labels: { colors: '#283F24' },
        },
    };

    const speciesChartSeries = [
        {
            name: 'Available in Municipality',
            data: [speciesStats?.dogs_available || 0, speciesStats?.cats_available || 0],
        },
        {
            name: 'Adopted in Municipality',
            data: [speciesStats?.dogs_adopted || 0, speciesStats?.cats_adopted || 0],
        },
    ];

    // 5. DSS Score Compatibility Tier Distribution
    const dssChartOptions: ApexOptions = {
        chart: {
            type: 'bar' as const,
            toolbar: { show: false },
            fontFamily: 'inherit',
        },
        plotOptions: {
            bar: {
                columnWidth: '40%',
                borderRadius: 6,
                distributed: true,
            },
        },
        colors: [THEME_COLORS.mutedGreen, THEME_COLORS.vibrantYellow, '#EF4444'],
        xaxis: {
            categories: ['High Match (≥80%)', 'Moderate (50-79%)', 'Low Match (<50%)'],
            labels: { style: { colors: '#283F24', fontSize: '11px', fontWeight: 600 } },
        },
        yaxis: {
            labels: { style: { colors: '#283F24', fontSize: '11px' } },
        },
        grid: {
            borderColor: '#f1f1f1',
            strokeDashArray: 4,
        },
        legend: { show: false },
    };

    const dssChartSeries = [
        {
            name: 'Applications Audited',
            data: [
                dssScoreDistribution?.high || 0,
                dssScoreDistribution?.medium || 0,
                dssScoreDistribution?.low || 0,
            ],
        },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'MAO Compliance Dashboard', href: route('mao.dashboard') }]}>
            <Head title="MAO Compliance & Analytics Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 md:p-6 bg-[#FCFDF9]">

                {/* Top Header Row */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className={`p-2.5 ${theme.tabActive} rounded-xl shadow-xs`}>
                                <ShieldCheck className="size-6" />
                            </span>
                            <div>
                                <h1 className={`text-2xl font-black ${theme.portalBannerTitle} tracking-tight`}>
                                    Municipal Animal Welfare &amp; Statutory Analytics
                                </h1>
                                <p className="text-xs text-gray-600 mt-0.5">
                                    Virac Municipal Agriculture Office — Regulatory oversight &amp; compliance analytics (RA 8485 &amp; RA 9482).
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Link href={route('mao.reports.index')}>
                            <Button variant="outline" size="sm" className="text-xs border-gray-300 text-gray-700 gap-1.5 shadow-2xs bg-white">
                                <Activity className="h-3.5 w-3.5" />
                                Reports &amp; Analytics
                            </Button>
                        </Link>
                        <Link href={route('mao.applications.index', { status: 'mao_audit' })}>
                            <Button className={`${theme.tabActive} text-xs gap-1.5 shadow-xs`}>
                                <ClipboardList className="h-3.5 w-3.5" />
                                Audit Queue ({metrics.pending_audits_count})
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Urgent Pending Approval Notification Banner */}
                {hasPendingAudits ? (
                    <div className="bg-amber-50/60 border-l-4 border-amber-500 rounded-r-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-amber-500 text-white shadow-xs shrink-0 mt-0.5 sm:mt-0">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    Action Required: {metrics.pending_audits_count} {metrics.pending_audits_count === 1 ? 'Application Needs' : 'Applications Need'} Statutory Clearance
                                    <span className="animate-pulse flex h-2 w-2 rounded-full bg-amber-500" />
                                </h3>
                                <p className="text-xs text-gray-600 mt-0.5">
                                    Endorsed by shelter staff awaiting municipal statutory compliance sign-off under RA 8485 before pet release.
                                </p>
                            </div>
                        </div>
                        <Link href={route('mao.applications.index', { status: 'mao_audit' })} className="shrink-0">
                            <Button size="sm" className={`${theme.primaryButton} text-xs font-bold gap-1 shadow-xs`}>
                                Review Queue <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="bg-[#467235]/10 border border-[#467235]/30 rounded-xl p-4 flex items-center gap-3">
                        <CheckCircle2 className={cn("h-5 w-5 shrink-0", theme.iconText)} />
                        <div>
                            <span className="text-xs font-bold text-[#283F24]">Statutory Audit Queue Clear</span>
                            <p className="text-[11px] text-[#283F24]/75">All submitted applications have undergone statutory compliance evaluation.</p>
                        </div>
                    </div>
                )}

                {/* Analytical KPI Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    
                    {/* Pending Audits */}
                    <Card className="border-[#FFBF00]/50 shadow-2xs bg-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-3.5">
                            <span className="text-[11px] font-bold text-[#283F24]/70 uppercase tracking-wider">Awaiting Audit</span>
                            <ShieldAlert className={cn("h-4 w-4", theme.accentIcon)} />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0">
                            <div className="text-2xl font-black text-[#283F24]">{metrics.pending_audits_count}</div>
                            <span className="text-[10px] text-[#283F24]/60 font-medium">pending sign-off</span>
                        </CardContent>
                    </Card>

                    {/* Approved Adoptions */}
                    <Card className="border-[#467235]/40 shadow-2xs bg-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-3.5">
                            <span className="text-[11px] font-bold text-[#283F24]/70 uppercase tracking-wider">Approved</span>
                            <CheckCircle2 className={cn("h-4 w-4", theme.iconText)} />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0">
                            <div className="text-2xl font-black text-[#467235]">{metrics.approved_count}</div>
                            <span className="text-[10px] text-[#467235] font-semibold">{metrics.pass_rate}% compliance rate</span>
                        </CardContent>
                    </Card>

                    {/* Disapproved */}
                    <Card className="border-red-200 shadow-2xs bg-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-3.5">
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Disapproved</span>
                            <XCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0">
                            <div className="text-2xl font-black text-red-600">{metrics.rejected_count}</div>
                            <span className="text-[10px] text-red-600 font-medium">{metrics.rejection_rate}% non-compliant</span>
                        </CardContent>
                    </Card>

                    {/* Average DSS Compatibility */}
                    <Card className="border-[#FFBF00]/50 shadow-2xs bg-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-3.5">
                            <span className="text-[11px] font-bold text-[#283F24]/70 uppercase tracking-wider">Avg DSS Score</span>
                            <Percent className={cn("h-4 w-4", theme.accentIcon)} />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0">
                            <div className="text-2xl font-black text-[#283F24]">{metrics.avg_dss_score}%</div>
                            <span className="text-[10px] text-[#283F24]/60">compatibility avg</span>
                        </CardContent>
                    </Card>

                    {/* Pets Available in Municipality */}
                    <Card className="border-[#467235]/40 shadow-2xs bg-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-3.5">
                            <span className="text-[11px] font-bold text-[#283F24]/70 uppercase tracking-wider">Available Pets</span>
                            <Home className={cn("h-4 w-4", theme.iconText)} />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0">
                            <div className="text-2xl font-black text-[#283F24]">{metrics.total_pets_available}</div>
                            <span className="text-[10px] text-[#283F24]/60">{shelters.length} facilities</span>
                        </CardContent>
                    </Card>

                    {/* Total Adoptions Finalized */}
                    <Card className="border-[#467235]/40 shadow-2xs bg-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-3.5">
                            <span className="text-[11px] font-bold text-[#283F24]/70 uppercase tracking-wider">Adoptions Placed</span>
                            <Award className={cn("h-4 w-4", theme.iconText)} />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0">
                            <div className="text-2xl font-black text-[#283F24]">{metrics.total_pets_adopted}</div>
                            <span className="text-[10px] text-[#467235] font-medium">certified placed</span>
                        </CardContent>
                    </Card>
                </div>

                {/* Primary Graphical Section: Compliance Trajectory & Outcomes */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left 2 Cols: Monthly Compliance Decision Trajectory */}
                    <Card className="lg:col-span-2 border-[#467235]/20 shadow-xs bg-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-100">
                            <div>
                                <CardTitle className="text-base font-bold text-[#283F24] flex items-center gap-2">
                                    <TrendingUp className={cn("size-4", theme.iconText)} />
                                    Statutory Compliance &amp; Audit Trajectory
                                </CardTitle>
                                <CardDescription className="text-xs text-[#283F24]/60">
                                    Monthly volume of approved clearances vs non-compliant rejections under RA 8485 &amp; RA 9482.
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <ApexChart
                                options={monthlyComplianceOptions}
                                series={monthlyComplianceSeries}
                                type="area"
                                height={280}
                            />
                        </CardContent>
                    </Card>

                    {/* Right Col: Statutory Decision Outcomes Donut */}
                    <Card className="border-[#467235]/20 shadow-xs bg-white">
                        <CardHeader className="pb-2 border-b border-gray-100">
                            <CardTitle className="text-base font-bold text-[#283F24] flex items-center gap-2">
                                <PieChartIcon className={cn("size-4", theme.accentIcon)} />
                                Statutory Decision Outcomes
                            </CardTitle>
                            <CardDescription className="text-xs text-[#283F24]/60">
                                Distribution of municipal audit determinations.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <ApexChart
                                options={auditDonutOptions}
                                series={auditValues}
                                type="donut"
                                height={280}
                            />
                        </CardContent>
                    </Card>

                </div>

                {/* Secondary Graphical Section: Municipal Capacity, Demographics & DSS Match */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Municipal Shelter Capacity & Velocity */}
                    <Card className="border-[#467235]/20 shadow-xs bg-white">
                        <CardHeader className="pb-2 border-b border-gray-100">
                            <CardTitle className="text-sm font-bold text-[#283F24] flex items-center gap-2">
                                <Home className={cn("size-4", theme.iconText)} />
                                Shelter Capacity &amp; Velocity
                            </CardTitle>
                            <CardDescription className="text-xs text-[#283F24]/60">
                                Active vs placed animals across municipal shelters.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {shelters.length === 0 ? (
                                <div className="h-[250px] flex items-center justify-center text-xs text-gray-400">
                                    No shelter records available.
                                </div>
                            ) : (
                                <ApexChart
                                    options={shelterChartOptions}
                                    series={shelterChartSeries}
                                    type="bar"
                                    height={250}
                                />
                            )}
                        </CardContent>
                    </Card>

                    {/* Species Intake & Placement Breakdown */}
                    <Card className="border-[#467235]/20 shadow-xs bg-white">
                        <CardHeader className="pb-2 border-b border-gray-100">
                            <CardTitle className="text-sm font-bold text-[#283F24] flex items-center gap-2">
                                <Layers className={cn("size-4", theme.accentIcon)} />
                                Municipal Species Breakdown
                            </CardTitle>
                            <CardDescription className="text-xs text-[#283F24]/60">
                                Canine and feline population across Virac.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <ApexChart
                                options={speciesChartOptions}
                                series={speciesChartSeries}
                                type="bar"
                                height={250}
                            />
                        </CardContent>
                    </Card>

                    {/* DSS Compatibility Distribution */}
                    <Card className="border-[#467235]/20 shadow-xs bg-white">
                        <CardHeader className="pb-2 border-b border-gray-100">
                            <CardTitle className="text-sm font-bold text-[#283F24] flex items-center gap-2">
                                <BarChart3 className={cn("size-4", theme.iconText)} />
                                Compatibility Match Ratings
                            </CardTitle>
                            <CardDescription className="text-xs text-[#283F24]/60">
                                DSS match score distribution of applicants.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <ApexChart
                                options={dssChartOptions}
                                series={dssChartSeries}
                                type="bar"
                                height={250}
                            />
                        </CardContent>
                    </Card>

                </div>

                {/* Statutory Regulatory Framework Card & Quick Actions */}
                <div className="bg-[#FFF78D]/20 border border-[#FFBF00]/40 rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className={cn("size-5", theme.iconText)} />
                            <div>
                                <h4 className="text-xs font-bold text-[#283F24] uppercase tracking-wider">
                                    Statutory Mandate: Republic Acts 8485 &amp; 9482
                                </h4>
                                <p className="text-[11px] text-[#283F24]/75">
                                    Every pet adoption is evaluated against animal welfare standards, mandatory anti-rabies vaccination verification, and certified ownership registry.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link href={route('mao.applications.index')}>
                                <Button size="sm" variant="outline" className="text-xs border-[#467235]/40 text-[#283F24] bg-white hover:bg-[#FFF78D]/40">
                                    <ClipboardList className={cn("size-3.5 mr-1", theme.iconText)} /> All Applications
                                </Button>
                            </Link>
                            <Link href={route('mao.reports.index')}>
                                <Button size="sm" className="text-xs bg-[#467235] hover:bg-[#283F24] text-white font-bold">
                                    Export Regulatory Reports
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
