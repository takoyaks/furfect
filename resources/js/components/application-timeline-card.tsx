import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, XCircle, ArrowRight, ShieldCheck, UserCheck, FileText, Sparkles, Building } from 'lucide-react';

export interface TimelineEvent {
    id: number;
    application_id: number;
    actor_id?: number;
    actor_name?: string;
    actor_role?: string;
    stage: string;
    action: string;
    title: string;
    description?: string;
    metadata?: Record<string, any>;
    created_at: string;
}

export function ApplicationTimelineCard({
    timelines = [],
    status,
    slaTarget,
    certificateNumber,
}: {
    timelines: TimelineEvent[];
    status: string;
    slaTarget?: string | null;
    certificateNumber?: string | null;
}) {
    const getStageBadge = (stage: string) => {
        switch (stage) {
            case 'submitted':
                return <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">Application Intake</Badge>;
            case 'screening':
                return <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Shelter Screening</Badge>;
            case 'mao_audit':
                return <Badge variant="secondary" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">MAO Audit</Badge>;
            case 'resolved':
                return <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Final Resolution</Badge>;
            default:
                return <Badge variant="outline" className="text-[10px]">{stage}</Badge>;
        }
    };

    const getActorIcon = (role?: string) => {
        switch (role) {
            case 'mao_officer':
                return <ShieldCheck className="h-4 w-4 text-purple-600" />;
            case 'shelter_staff':
                return <Building className="h-4 w-4 text-theme" />;
            case 'adopter':
                return <UserCheck className="h-4 w-4 text-blue-600" />;
            default:
                return <Sparkles className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <Card className="border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-gray-50/60 border-b border-gray-100 p-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="space-y-0.5">
                        <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-theme" />
                            Official Audit Trail &amp; Processing History
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-500">
                            Transparent multi-agency log between Virac Animal Shelter and Municipal Agriculture Office (MAO)
                        </CardDescription>
                    </div>

                    {slaTarget && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-white border border-gray-200 px-3 py-1 rounded-full font-medium shadow-xs">
                            <Clock className="h-3.5 w-3.5 text-amber-500" />
                            <span>Target SLA: {new Date(slaTarget).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-5">
                {timelines.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400">
                        No processing events recorded yet.
                    </div>
                ) : (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                        {timelines.map((event, idx) => {
                            const isLatest = idx === timelines.length - 1;
                            const isApproved = event.action.includes('approved');
                            const isRejected = event.action.includes('rejected');

                            return (
                                <div key={event.id} className="relative group">
                                    {/* Timeline Marker Node */}
                                    <div
                                        className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 bg-white shadow-xs ${
                                            isApproved
                                                ? 'border-emerald-500 text-emerald-600'
                                                : isRejected
                                                ? 'border-red-500 text-red-600'
                                                : isLatest
                                                ? 'border-[#D4A017] text-[#D4A017] ring-4 ring-[#D4A017]/10'
                                                : 'border-gray-300 text-gray-400'
                                        }`}
                                    >
                                        {isApproved ? (
                                            <CheckCircle2 className="h-3 w-3 fill-emerald-100" />
                                        ) : isRejected ? (
                                            <XCircle className="h-3 w-3 fill-red-100" />
                                        ) : (
                                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                        )}
                                    </div>

                                    {/* Event Body Card */}
                                    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-xs space-y-2 hover:border-[#D4A017]/40 transition">
                                        <div className="flex items-start justify-between flex-wrap gap-2">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h5 className="text-sm font-bold text-gray-900">{event.title}</h5>
                                                    {getStageBadge(event.stage)}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        {getActorIcon(event.actor_role)}
                                                        <strong className="text-gray-700">{event.actor_name || 'System'}</strong>
                                                    </span>
                                                    <span>&bull;</span>
                                                    <span>{new Date(event.created_at).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {event.description && (
                                            <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/50 p-2.5 rounded-lg border border-gray-50">
                                                {event.description}
                                            </p>
                                        )}

                                        {/* Metadata Inspector (e.g. Certificate details, checklist summary) */}
                                        {event.metadata && (
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {event.metadata.certificate_number && (
                                                    <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                                        Cert: {event.metadata.certificate_number}
                                                    </span>
                                                )}
                                                {event.metadata.dss_score !== undefined && (
                                                    <span className="text-[11px] font-semibold text-[#B8860B] bg-[#F5EDD7] px-2 py-0.5 rounded">
                                                        DSS Match: {event.metadata.dss_score}%
                                                    </span>
                                                )}
                                                {event.metadata.pickup_deadline && (
                                                    <span className="text-[11px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                                        Pickup Deadline: {new Date(event.metadata.pickup_deadline).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
