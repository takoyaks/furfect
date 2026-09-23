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
    FileText, 
    Megaphone, 
    CheckCircle2,
    BarChart3,
    PieChart as PieChartIcon,
    Layers,
    TrendingUp,
    Activity
} from 'lucide-react';
import ApexChart, { THEME_COLORS } from '@/components/charts/apex-chart';
import { useThemeTemplate } from '@/hooks/use-theme-template';
import { cn } from '@/lib/utils';
import type { ApexOptions } from 'apexcharts';

interface Metric {
    pending_applications: number;
    under_review_applications: number;
    mao_audit_applications: number;
    approved_adoptions: number;
    pets_available: number;
    pets_adopted: number;
    total_pets: number;
}

interface MonthlyTrend {
    month: string;
    submitted: number;
    approved: number;
}

interface StatusDistribution {
    pending: number;
    under_review: number;
    mao_audit: number;
    approved: number;
    rejected: number;
}

interface SpeciesStats {
    dogs_available: number;
    dogs_adopted: number;
    cats_available: number;
    cats_adopted: number;
}

interface PetStatusBreakdown {
    available: number;
    adopted: number;
    pending: number;
    other: number;
}

interface DssScoreDistribution {
    high: number;
    medium: number;
    low: number;
}

interface ShelterDashboardProps {
    metrics: Metric;
    monthlyTrends: MonthlyTrend[];
    statusDistribution: StatusDistribution;
    speciesStats: SpeciesStats;
    petStatusBreakdown: PetStatusBreakdown;
    dssScoreDistribution: DssScoreDistribution;
}

export default function ShelterDashboard({
    metrics,
    monthlyTrends = [],
    statusDistribution,
    speciesStats,
    petStatusBreakdown,
    dssScoreDistribution,
}: ShelterDashboardProps) {
    const theme = useThemeTemplate();

    // 1. Monthly Trends Chart Options
    const monthlyTrendsOptions: ApexOptions = {
        chart: {
            type: 'area' as const,
            toolbar: { show: false },
            fontFamily: 'inherit',
        },
        colors: [THEME_COLORS.vibrantYellow, THEME_COLORS.mutedGreen],
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

    const monthlyTrendsSeries = [
        {
            name: 'Inbound Applications',
            data: monthlyTrends.map(t => t.submitted),
        },
        {
            name: 'Adopted Placements',
            data: monthlyTrends.map(t => t.approved),
        },
    ];

    // 2. Status Pipeline Donut Chart
    const statusValues = [
        statusDistribution?.pending || 0,
        statusDistribution?.under_review || 0,
        statusDistribution?.mao_audit || 0,
        statusDistribution?.approved || 0,
        statusDistribution?.rejected || 0,
    ];
    const totalPipeline = statusValues.reduce((a, b) => a + b, 0);

    const statusDonutOptions: ApexOptions = {
        chart: {
            type: 'donut' as const,
            fontFamily: 'inherit',
        },
        labels: ['Pending Staff Review', 'Under Assessment', 'Forwarded to MAO', 'Approved Adoption', 'Rejected'],
        colors: [
            THEME_COLORS.vibrantYellow,
            '#5E9447',
            THEME_COLORS.darkForestGreen,
            THEME_COLORS.mutedGreen,
            '#EF4444',
        ],
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Applications',
                            color: '#283F24',
                            formatter: () => `${totalPipeline}`,
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

    // 3. Species Inventory Breakdown
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
            name: 'Available in Shelter',
            data: [speciesStats?.dogs_available || 0, speciesStats?.cats_available || 0],
        },
        {
            name: 'Adopted from Shelter',
            data: [speciesStats?.dogs_adopted || 0, speciesStats?.cats_adopted || 0],
        },
    ];

    // 4. Pet Status Breakdown Donut
    const petStatusValues = [
        petStatusBreakdown?.available || 0,
        petStatusBreakdown?.adopted || 0,
        petStatusBreakdown?.pending || 0,
    ];

    const petStatusDonutOptions: ApexOptions = {
        chart: {
            type: 'donut' as const,
            fontFamily: 'inherit',
        },
        labels: ['Available for Matching', 'Adopted', 'Adoption Pending'],
        colors: [
            THEME_COLORS.vibrantYellow,
            THEME_COLORS.mutedGreen,
            THEME_COLORS.darkForestGreen,
        ],
        plotOptions: {
            pie: {
                donut: {
                    size: '65%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Total Animals',
                            color: '#283F24',
                            formatter: () => `${metrics.total_pets}`,
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

    // 5. DSS Compatibility Score Tiers
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
            name: 'Applications',
            data: [
                dssScoreDistribution?.high || 0,
                dssScoreDistribution?.medium || 0,
                dssScoreDistribution?.low || 0,
            ],
        },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Shelter Staff Dashboard', href: '#' }]}>
            <Head title="Shelter Staff Dashboard & Analytics" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 md:p-6 bg-[#FCFDF9]">
                
                {/* Welcome Header */}
                <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${theme.portalBanner} p-6 rounded-2xl shadow-xs`}>
                    <div>
                        <div className="flex items-center gap-3">
                            <span className={`p-2.5 ${theme.tabActive} rounded-xl shadow-xs`}>
                                <Cat className="size-6" />
                            </span>
                            <div>
                                <h1 className={`text-2xl font-black ${theme.portalBannerTitle} tracking-tight`}>Shelter Operations &amp; Analytics Hub</h1>
                                <p className="text-xs text-gray-600 mt-0.5">
                                    Operational metrics, adoption velocity charts, animal intake status, and applicant compatibility distributions.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                        <Link href={route('shelter.pets.create')}>
                            <Button className={`${theme.tabActive} flex items-center gap-1.5 shadow-sm text-xs`}>
                                <PlusCircle className="size-4" /> Add Pet Profile
                            </Button>
                        </Link>
                        <Link href={route('shelter.applications.index')}>
                            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs gap-1.5 bg-white">
                                <ClipboardList className="size-4" /> Review Queue ({metrics.pending_applications})
                            </Button>
                        </Link>
                        <Link href={route('shelter.cms.announcements.index')}>
                            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs gap-1.5 bg-white">
                                <Megaphone className="size-4" /> Notices
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
                            sub: 'Pending initial staff review',
                            icon: ClipboardList,
                            color: theme.accentIcon,
                            bgColor: theme.iconBg,
                            border: theme.kpiBorder,
                        },
                        {
                            title: 'Under Review',
                            val: metrics.under_review_applications,
                            sub: 'Active verification in progress',
                            icon: ShieldAlert,
                            color: theme.iconText,
                            bgColor: theme.iconBg,
                            border: theme.kpiBorder,
                        },
                        {
                            title: 'Pets Available',
                            val: metrics.pets_available,
                            sub: `${metrics.total_pets} total registered pets`,
                            icon: Award,
                            color: theme.iconText,
                            bgColor: theme.iconBg,
                            border: theme.kpiBorder,
                        },
                        {
                            title: 'Adoptions Completed',
                            val: metrics.approved_adoptions,
                            sub: 'Permanently rehomed animals',
                            icon: CheckCircle2,
                            color: theme.iconText,
                            bgColor: theme.iconBg,
                            border: theme.kpiBorder,
                        },
                    ].map(card => (
                        <Card key={card.title} className={`border ${card.border} shadow-xs hover:shadow-md transition bg-white`}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <span className="text-xs font-bold text-[#283F24]/70 uppercase tracking-wide">
                                    {card.title}
                                </span>
                                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                                    <card.icon className={cn('h-4 w-4', card.color)} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black text-[#283F24]">{card.val}</div>
                                <span className="text-[11px] text-[#283F24]/60 block mt-1">{card.sub}</span>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Primary Graphical Section: Adoption Trajectory & Funnel */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left 2 Cols: Monthly Adoption & Inflow Velocity */}
                    <Card className="lg:col-span-2 border-[#467235]/20 shadow-xs bg-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-100">
                            <div>
                                <CardTitle className="text-base font-bold text-[#283F24] flex items-center gap-2">
                                    <TrendingUp className={cn("size-4", theme.accentIcon)} />
                                    Shelter Adoption &amp; Application Trajectory
                                </CardTitle>
                                <CardDescription className="text-xs text-[#283F24]/60">
                                    Monthly comparison between submitted applications and successfully finalized adoptions.
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <ApexChart
                                options={monthlyTrendsOptions}
                                series={monthlyTrendsSeries}
                                type="area"
                                height={280}
                            />
                        </CardContent>
                    </Card>

                    {/* Right Col: Application Funnel */}
                    <Card className="border-[#467235]/20 shadow-xs bg-white">
                        <CardHeader className="pb-2 border-b border-gray-100">
                            <CardTitle className="text-base font-bold text-[#283F24] flex items-center gap-2">
                                <PieChartIcon className={cn("size-4", theme.iconText)} />
                                Application Pipeline Funnel
                            </CardTitle>
                            <CardDescription className="text-xs text-[#283F24]/60">
                                Processing status of shelter adoption applications.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <ApexChart
                                options={statusDonutOptions}
                                series={statusValues}
                                type="donut"
                                height={280}
                            />
                        </CardContent>
                    </Card>

                </div>

                {/* Secondary Graphical Section: Inventory Breakdown & DSS Scores */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Species Inventory Breakdown */}
                    <Card className="border-[#467235]/20 shadow-xs bg-white">
                        <CardHeader className="pb-2 border-b border-gray-100">
                            <CardTitle className="text-sm font-bold text-[#283F24] flex items-center gap-2">
                                <Layers className={cn("size-4", theme.accentIcon)} />
                                Species Demographics
                            </CardTitle>
                            <CardDescription className="text-xs text-[#283F24]/60">
                                Shelter canines vs felines inventory.
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

                    {/* Shelter Pet Status Distribution Donut */}
                    <Card className="border-[#467235]/20 shadow-xs bg-white">
                        <CardHeader className="pb-2 border-b border-gray-100">
                            <CardTitle className="text-sm font-bold text-[#283F24] flex items-center gap-2">
                                <Award className={cn("size-4", theme.iconText)} />
                                Animal Status Distribution
                            </CardTitle>
                            <CardDescription className="text-xs text-[#283F24]/60">
                                Current availability and placement breakdown.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <ApexChart
                                options={petStatusDonutOptions}
                                series={petStatusValues}
                                type="donut"
                                height={250}
                            />
                        </CardContent>
                    </Card>

                    {/* DSS Compatibility Distribution */}
                    <Card className="border-[#467235]/20 shadow-xs bg-white">
                        <CardHeader className="pb-2 border-b border-gray-100">
                            <CardTitle className="text-sm font-bold text-[#283F24] flex items-center gap-2">
                                <BarChart3 className={cn("size-4", theme.iconText)} />
                                DSS Match Score Tiers
                            </CardTitle>
                            <CardDescription className="text-xs text-[#283F24]/60">
                                Compatibility score ratings of applicants.
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

                {/* Operations Quick Tasks Panel */}
                <div className="bg-white border border-[#467235]/20 rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <span className="text-xs font-bold text-[#283F24] uppercase tracking-wider flex items-center gap-1.5">
                            <Activity className={cn("size-4", theme.accentIcon)} /> Staff Tasks &amp; Fast Navigation
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Link href={route('shelter.pets.create')}>
                                <Button variant="ghost" size="sm" className="text-xs text-[#283F24] hover:bg-[#FFF78D]/40">
                                    <PlusCircle className={cn("size-3.5 mr-1", theme.accentIcon)} /> Add New Pet
                                </Button>
                            </Link>
                            <Link href={route('shelter.applications.index')}>
                                <Button variant="ghost" size="sm" className="text-xs text-[#283F24] hover:bg-[#FFF78D]/40">
                                    <ClipboardList className={cn("size-3.5 mr-1", theme.iconText)} /> Manage Applications ({metrics.pending_applications})
                                </Button>
                            </Link>
                            <Link href={route('shelter.pets.index')}>
                                <Button variant="ghost" size="sm" className="text-xs text-[#283F24] hover:bg-[#FFF78D]/40">
                                    <Cat className={cn("size-3.5 mr-1", theme.iconText)} /> Manage Pets ({metrics.total_pets})
                                </Button>
                            </Link>
                            <Link href={route('shelter.reports.index')}>
                                <Button variant="ghost" size="sm" className="text-xs text-[#283F24] hover:bg-[#FFF78D]/40">
                                    <FileText className={cn("size-3.5 mr-1", theme.iconText)} /> Reports &amp; Analytics
                                </Button>
                            </Link>
                            <Link href={route('shelter.cms.announcements.index')}>
                                <Button variant="ghost" size="sm" className="text-xs text-[#283F24] hover:bg-[#FFF78D]/40">
                                    <Megaphone className={cn("size-3.5 mr-1", theme.accentIcon)} /> Announcements
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
