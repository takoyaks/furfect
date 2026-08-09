import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';

interface Application {
    id: number;
    reference_number: string;
    dss_score: string;
    status: string;
    staff_decision: string | null;
    submitted_at: string;
    adopter: { name: string };
    pet: { name: string; shelter: { name: string } };
}

type PaginatedApplications = {
    data: Application[];
    links: { url: string | null; label: string; active: boolean }[];
};

const STATUS_BADGE: Record<string, string> = {
    mao_audit: 'bg-purple-100 text-purple-700',
    approved:  'bg-green-100 text-green-700',
    rejected:  'bg-red-100 text-red-700',
};

const DECISION_BADGE: Record<string, string> = {
    suitable:     'bg-green-100 text-green-700',
    not_suitable: 'bg-red-100 text-red-700',
};

export default function MaoApplicationIndex({
    applications,
    filters,
}: {
    applications: PaginatedApplications;
    filters: { status?: string };
}) {
    const [status, setStatus] = useState(filters.status || 'all');

    const applyFilter = (val: string) => {
        setStatus(val);
        router.get(
            route('mao.applications.index'),
            { status: val === 'all' ? '' : val },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Compliance Audits', href: '#' }]}>
            <Head title="Compliance Audits" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6 text-[#D4A017]" />
                            Compliance Audits
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Applications awaiting MAO compliance verification and final decision.
                        </p>
                    </div>
                    <div className="w-44">
                        <Select value={status} onValueChange={applyFilter}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="mao_audit">Pending Audit</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Card className="border-gray-200">
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-gray-50/50 text-gray-500 font-semibold border-b border-gray-100">
                                <tr>
                                    <th className="p-3">Reference No</th>
                                    <th className="p-3">Adopter</th>
                                    <th className="p-3">Pet</th>
                                    <th className="p-3">Shelter</th>
                                    <th className="p-3 text-center">DSS Score</th>
                                    <th className="p-3 text-center">Staff Decision</th>
                                    <th className="p-3 text-center">Status</th>
                                    <th className="p-3">Date Applied</th>
                                    <th className="p-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                {applications.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center text-gray-400">
                                            No applications found.
                                        </td>
                                    </tr>
                                ) : applications.data.map(app => (
                                    <tr key={app.id} className="hover:bg-gray-50/20">
                                        <td className="p-3 font-semibold text-gray-800">{app.reference_number}</td>
                                        <td className="p-3">{app.adopter.name}</td>
                                        <td className="p-3 font-semibold">{app.pet.name}</td>
                                        <td className="p-3 text-gray-400">{app.pet.shelter.name}</td>
                                        <td className="p-3 text-center font-bold text-[#D4A017]">
                                            {Math.round(parseFloat(app.dss_score))}%
                                        </td>
                                        <td className="p-3 text-center">
                                            {app.staff_decision ? (
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${DECISION_BADGE[app.staff_decision] ?? 'bg-gray-100 text-gray-600'}`}>
                                                    {app.staff_decision.replace(/_/g, ' ')}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">—</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${STATUS_BADGE[app.status] ?? 'bg-amber-100 text-amber-700'}`}>
                                                {app.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="p-3 text-gray-400">
                                            {new Date(app.submitted_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-3">
                                            <Link href={route('mao.applications.show', app.id)}>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
                                                >
                                                    Audit
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
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
                                className={`text-xs min-w-8 h-7 px-2 ${link.active ? 'bg-[#D4A017] hover:bg-[#B8860B] text-white' : ''}`}
                                onClick={() => link.url && router.get(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
