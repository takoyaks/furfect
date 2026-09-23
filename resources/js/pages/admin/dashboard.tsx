import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    ClipboardList, 
    ShieldAlert, 
    Award, 
    PlusCircle, 
    FileText, 
    Megaphone, 
    CheckCircle2,
    Users,
    Settings,
    Home,
    ShieldCheck,
    BarChart3,
    PieChart as PieChartIcon,
    Activity,
    Layers,
    TrendingUp
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
    total_users: number;
    total_shelters: number;
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

interface ShelterComparison {
    id: number;
    name: string;
    active_pets_count: number;
    adopted_pets_count: number;
    total_pets_count: number;
}

interface DssScoreDistribution {
    high: number;
    medium: number;
    low: number;
}

interface AdminDashboardProps {
    metrics: Metric;
    monthlyTrends: MonthlyTrend[];
    statusDistribution: StatusDistribution;
    speciesStats: SpeciesStats;
    shelterComparison: ShelterComparison[];
    dssScoreDistribution: DssScoreDistribution;
}

export default function AdminDashboard({
    metrics,
    monthlyTrends = [],
    statusDistribution,
    speciesStats,
    shelterComparison = [],
    dssScoreDistribution,
}: AdminDashboardProps) {
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
            name: 'Applications Inflow',
            data: monthlyTrends.map(t => t.submitted),
        },
        {
            name: 'Approved Adoptions',
            data: monthlyTrends.map(t => t.approved),
        },
    ];

    // 2. Status Distribution Donut Chart
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
        labels: ['Pending Initial', 'Under Staff Review', 'MAO Statutory Audit', 'Approved Placement', 'Rejected / Ineligible'],
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
                            label: 'Total Pipeline',
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

    // 3. Species & Inventory Breakdown (Stacked Bar Chart)
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
            name: 'Available for Adoption',
            data: [speciesStats?.dogs_available || 0, speciesStats?.cats_available || 0],
        },
        {
            name: 'Successfully Adopted',
            data: [speciesStats?.dogs_adopted || 0, speciesStats?.cats_adopted || 0],
        },
    ];

    // 4. Shelter Comparison Bar Chart
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
            categories: shelterComparison.map(s => s.name),
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
            name: 'Available Pets',
            data: shelterComparison.map(s => s.active_pets_count),
        },
        {
            name: 'Adopted Pets',
            data: shelterComparison.map(s => s.adopted_pets_count),
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
            name: 'Applications',
            data: [
                dssScoreDistribution?.high || 0,
                dssScoreDistribution?.medium || 0,
                dssScoreDistribution?.low || 0,
            ],
        },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Admin Analytics & Operations', href: '#' }]}>
            <Head title="Admin Dashboard Analytics" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 md:p-6 bg-[#FCFDF9]">
                
                {/* Welcome & Management Header */}
                <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${theme.portalBanner} p-6 rounded-2xl shadow-xs`}>
                    <div>
                        <div className="flex items-center gap-3">
                            <span className={`p-2.5 ${theme.tabActive} rounded-xl shadow-xs`}>
                                <ShieldCheck className="size-6" />
                            </span>
                            <div>
                                <h1 className={`text-2xl font-black ${theme.portalBannerTitle} tracking-tight`}>Admin Operations &amp; Analytics Center</h1>
                                <p className="text-xs text-gray-600 mt-0.5">
                                    Real-time graphical oversight across adoption pipelines, shelter capacities, species demographics, and match scores.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                        <Link href={route('shelter.pets.create')}>
                            <Button className={`${theme.tabActive} flex items-center gap-1.5 shadow-sm text-xs`}>
                                <PlusCircle className="size-4" /> Add Pet
                            </Button>
                        </Link>
                        <Link href={route('admin.reports.index')}>
                            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs gap-1.5 bg-white">
                                <FileText className="size-4" /> Full Reports
                            </Button>
                        </Link>
                        <Link href={route('admin.cms.announcements.index')}>
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
                            sub: 'Pending initial review',
                            icon: ClipboardList,
                            color: theme.accentIcon,
                            bgColor: theme.iconBg,
                            border: theme.kpiBorder,
                        },
                        {
                            title: 'MAO Audit Pending',
                            val: metrics.mao_audit_applications,
                            sub: 'Statutory compliance queue',
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
                            sub: 'Successfully placed in homes',
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

                {/* Primary Graphical Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left 2 Cols: Monthly Inflow vs Adoptions Velocity */}
                    <Card className="lg:col-span-2 border-[#467235]/20 shadow-xs bg-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-100">
                            <div>
                                <CardTitle className="text-base font-bold text-[#283F24] flex items-center gap-2">
                                    <TrendingUp className={cn("size-4", theme.accentIcon)} />
                                    Adoption &amp; Application Velocity
                                </CardTitle>
                                <CardDescription className="text-xs text-[#283F24]/60">
                                    6-month trend comparing inbound adoption applications against approved pet placements.
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

                    {/* Right Col: Application Pipeline Donut */}
                    <Card className="border-[#467235]/20 shadow-xs bg-white">
                        <CardHeader className="pb-2 border-b border-gray-100">
                            <CardTitle className="text-base font-bold text-[#283F24] flex items-center gap-2">
                                <PieChartIcon className={cn("size-4", theme.iconText)} />
                                Application Pipeline Funnel
                            </CardTitle>
                            <CardDescription className="text-xs text-[#283F24]/60">
                                Status distribution of all submitted adoption requests.
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

                {/* Secondary Graphical Section: Inventory, Shelters & DSS Match Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Species & Inventory Breakdown */}
                    <Card className="border-[#467235]/20 shadow-xs bg-white">
                        <CardHeader className="pb-2 border-b border-gray-100">
                            <CardTitle className="text-sm font-bold text-[#283F24] flex items-center gap-2">
                                <Layers className={cn("size-4", theme.accentIcon)} />
                                Pet Demographics &amp; Inventory
                            </CardTitle>
                            <CardDescription className="text-xs text-[#283F24]/60">
                                Available vs Adopted counts for canines and felines.
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

                    {/* Shelter Facility Comparison */}
                    <Card className="border-[#467235]/20 shadow-xs bg-white">
                        <CardHeader className="pb-2 border-b border-gray-100">
                            <CardTitle className="text-sm font-bold text-[#283F24] flex items-center gap-2">
                                <Home className={cn("size-4", theme.iconText)} />
                                Shelter Capacity &amp; Placement
                            </CardTitle>
                            <CardDescription className="text-xs text-[#283F24]/60">
                                Active animal registry and adoption velocity per facility.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {shelterComparison.length === 0 ? (
                                <div className="h-[250px] flex items-center justify-center text-xs text-gray-400">
                                    No shelter facility data available.
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

                    {/* DSS Compatibility Score Distribution */}
                    <Card className="border-[#467235]/20 shadow-xs bg-white">
                        <CardHeader className="pb-2 border-b border-gray-100">
                            <CardTitle className="text-sm font-bold text-[#283F24] flex items-center gap-2">
                                <BarChart3 className={cn("size-4", theme.iconText)} />
                                DSS Match Score Tiers
                            </CardTitle>
                            <CardDescription className="text-xs text-[#283F24]/60">
                                Algorithmic compatibility distribution of applications.
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

                {/* Quick Navigation Footer Links */}
                <div className="bg-white border border-[#467235]/20 rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <span className="text-xs font-bold text-[#283F24] uppercase tracking-wider flex items-center gap-1.5">
                            <Activity className={cn("size-4", theme.accentIcon)} /> Operations Quick Access
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Link href={route('admin.applications.index')}>
                                <Button variant="ghost" size="sm" className="text-xs text-[#283F24] hover:bg-[#FFF78D]/40">
                                    <ClipboardList className={cn("size-3.5 mr-1", theme.accentIcon)} /> Applications ({metrics.pending_applications})
                                </Button>
                            </Link>
                            <Link href={route('admin.pets.index')}>
                                <Button variant="ghost" size="sm" className="text-xs text-[#283F24] hover:bg-[#FFF78D]/40">
                                    <Award className={cn("size-3.5 mr-1", theme.iconText)} /> Pets Catalog ({metrics.total_pets})
                                </Button>
                            </Link>
                            <Link href={route('admin.users.index')}>
                                <Button variant="ghost" size="sm" className="text-xs text-[#283F24] hover:bg-[#FFF78D]/40">
                                    <Users className={cn("size-3.5 mr-1", theme.iconText)} /> Users ({metrics.total_users})
                                </Button>
                            </Link>
                            <Link href={route('admin.shelters.index')}>
                                <Button variant="ghost" size="sm" className="text-xs text-[#283F24] hover:bg-[#FFF78D]/40">
                                    <Home className={cn("size-3.5 mr-1", theme.iconText)} /> Shelters ({metrics.total_shelters})
                                </Button>
                            </Link>
                            <Link href={route('admin.settings.index')}>
                                <Button variant="ghost" size="sm" className="text-xs text-[#283F24] hover:bg-[#FFF78D]/40">
                                    <Settings className="size-3.5 mr-1 text-gray-500" /> Settings
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}