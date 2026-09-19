import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, CheckCircle2, AlertTriangle, Zap, ShieldCheck, Home, HeartHandshake, Award, Users, Activity, Stethoscope } from 'lucide-react';

interface DssMatchScoreData {
    total_score: number;
    lifestyle_score?: number;
    housing_score?: number;
    care_capacity_score?: number;
    experience_score?: number;
    other_pets_score?: number;
    family_children_score?: number;
    age_activity_score?: number;
    special_requirements_score?: number;
    fast_track_eligible?: boolean;
    breakdown_details?: Record<string, { score: number; weight: number; label: string; assessment: string; details: string }>;
    match_reasons?: string[];
    mismatch_reasons?: string[];
}

export function DssScoreCard({ dss, compact = false }: { dss: DssMatchScoreData | null; compact?: boolean }) {
    if (!dss) {
        return (
            <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-6 text-center text-gray-500 text-sm">
                    No Decision Support System (DSS) score calculated yet.
                </CardContent>
            </Card>
        );
    }

    const total = Math.round(Number(dss.total_score) || 0);

    const criteria = [
        {
            key: 'lifestyle',
            label: 'Lifestyle Compatibility',
            weight: '25%',
            score: Math.round(Number(dss.lifestyle_score ?? 100)),
            icon: Activity,
            desc: 'Activity rhythm & schedule',
        },
        {
            key: 'housing',
            label: 'Housing Compatibility',
            weight: '20%',
            score: Math.round(Number(dss.housing_score ?? 100)),
            icon: Home,
            desc: 'Residence space & outdoor security',
        },
        {
            key: 'care_capacity',
            label: 'Pet Needs & Care Capacity',
            weight: '15%',
            score: Math.round(Number(dss.care_capacity_score ?? 100)),
            icon: HeartHandshake,
            desc: 'Financial & veterinary maintenance',
        },
        {
            key: 'experience',
            label: 'Experience Compatibility',
            weight: '10%',
            score: Math.round(Number(dss.experience_score ?? 100)),
            icon: Award,
            desc: 'Past animal handling & knowledge',
        },
        {
            key: 'other_pets',
            label: 'Other Pets Compatibility',
            weight: '10%',
            score: Math.round(Number(dss.other_pets_score ?? 100)),
            icon: Users,
            desc: 'Multi-pet household dynamics',
        },
        {
            key: 'family_children',
            label: 'Family/Children Compatibility',
            weight: '10%',
            score: Math.round(Number(dss.family_children_score ?? 100)),
            icon: ShieldCheck,
            desc: 'Household consensus & child safety',
        },
        {
            key: 'age_activity',
            label: 'Age & Activity Alignment',
            weight: '5%',
            score: Math.round(Number(dss.age_activity_score ?? 100)),
            icon: Zap,
            desc: 'Pet life-stage energy fit',
        },
        {
            key: 'special_requirements',
            label: 'Special Requirements & Health',
            weight: '5%',
            score: Math.round(Number(dss.special_requirements_score ?? 100)),
            icon: Stethoscope,
            desc: 'Allergy, climate & medical capacity',
        },
    ];

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
        if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const getProgressColor = (score: number) => {
        if (score >= 80) return 'bg-green-600';
        if (score >= 60) return 'bg-amber-500';
        return 'bg-red-500';
    };

    return (
        <Card className="border-[#D4A017]/30 shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#F5EDD7]/80 to-amber-50/40 border-b border-[#D4A017]/10 p-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-[#D4A017]" />
                            <CardTitle className="text-lg font-bold text-gray-900">
                                8-Factor DSS Compatibility Score
                            </CardTitle>
                        </div>
                        <CardDescription className="text-xs text-gray-600">
                            Weighted multi-criteria analysis based on Municipal Animal Adoption Guidelines
                        </CardDescription>
                    </div>

                    <div className="flex items-center gap-3">
                        {dss.fast_track_eligible && (
                            <Badge className="bg-emerald-600 text-white font-bold text-xs gap-1 py-1 px-2.5 shadow-sm">
                                <Zap className="h-3.5 w-3.5 fill-white" />
                                Fast-Track Eligible
                            </Badge>
                        )}
                        <div className={`px-4 py-2 rounded-xl border font-black text-2xl flex items-center gap-1.5 shadow-inner ${getScoreColor(total)}`}>
                            {total}%
                            <span className="text-[11px] font-semibold text-gray-500 block uppercase">Match</span>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-5 space-y-6">
                {/* 8-Factor Bar Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {criteria.map((c) => {
                        const Icon = c.icon;
                        return (
                            <div key={c.key} className="p-3 rounded-xl border border-gray-100 bg-gray-50/40 space-y-2 hover:bg-white transition">
                                <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                                    <div className="flex items-center gap-1.5">
                                        <Icon className="h-4 w-4 text-[#D4A017]" />
                                        <span>{c.label}</span>
                                        <span className="text-[10px] text-gray-400 font-normal">({c.weight})</span>
                                    </div>
                                    <span className={`px-1.5 py-0.5 rounded font-mono text-[11px] font-bold ${getScoreColor(c.score)}`}>
                                        {c.score}%
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${getProgressColor(c.score)} transition-all duration-500`}
                                        style={{ width: `${c.score}%` }}
                                    />
                                </div>
                                <p className="text-[11px] text-gray-500 leading-tight">{c.desc}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Match Highlights & Considerations */}
                {!compact && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                        {dss.match_reasons && dss.match_reasons.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase text-green-800 flex items-center gap-1.5">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    Positive Compatibility Indicators
                                </h4>
                                <ul className="space-y-1.5">
                                    {dss.match_reasons.map((r, i) => (
                                        <li key={i} className="text-xs text-gray-600 bg-green-50/60 border border-green-100 px-2.5 py-1.5 rounded-lg flex items-start gap-1.5">
                                            <span className="text-green-600 font-bold">•</span>
                                            <span>{r}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {dss.mismatch_reasons && dss.mismatch_reasons.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase text-amber-800 flex items-center gap-1.5">
                                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                                    Review Considerations
                                </h4>
                                <ul className="space-y-1.5">
                                    {dss.mismatch_reasons.map((r, i) => (
                                        <li key={i} className="text-xs text-gray-600 bg-amber-50/60 border border-amber-100 px-2.5 py-1.5 rounded-lg flex items-start gap-1.5">
                                            <span className="text-amber-600 font-bold">•</span>
                                            <span>{r}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
