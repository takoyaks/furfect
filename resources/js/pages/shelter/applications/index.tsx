import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Filter, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { ConfirmPetReleaseModal } from '@/components/confirm-pet-release-modal';

interface Application {
    id: number;
    reference_number: string;
    dss_score: string;
    status: string;
    submitted_at: string;
    pickup_deadline_at?: string | null;
    adopter: {
        id: number;
        name: string;
        phone?: string | null;
        adopter_profile?: {
            full_name?: string | null;
            contact_number?: string | null;
            valid_id_type?: string | null;
            valid_id_number?: string | null;
        } | null;
    };
    pet: {
        id: number;
        name: string;
        species: string;
        breed?: string | null;
        tag_number?: string | null;
        housing_area?: string | null;
        shelter: { name: string; location: string };
    };
}

type PaginatedApplications = {
    data: Application[];
    links: { url: string | null; label: string; active: boolean }[];
};

const STATUS_BADGE: Record<string, string> = {
    pending:      'bg-amber-100 text-amber-700',
    under_review: 'bg-blue-100 text-blue-700',
    mao_audit:    'bg-purple-100 text-purple-700',
    approved:     'bg-green-100 text-green-700',
    rejected:     'bg-red-100 text-red-700',
    completed:    'bg-emerald-100 text-emerald-800 border border-emerald-200',
    unclaimed:    'bg-gray-100 text-gray-700 border border-gray-200',
};

export default function ShelterApplicationIndex({
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
            route('shelter.applications.index'),
            { status: val === 'all' ? '' : val },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Review Applications', href: '#' }]}>
            <Head title="Review Applications" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <ClipboardList className="h-6 w-6 text-[#D4A017]" />
                            Review Applications
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Review and process adoption applications for your shelter.
                        </p>
                    </div>
                    <div className="w-52 flex items-center gap-2">
                        <Select value={status} onValueChange={applyFilter}>
                            <SelectTrigger size="sm" className="bg-white border-gray-200 shadow-xs h-9">
                                <div className="flex items-center gap-2 truncate">
                                    <Filter className="h-4 w-4 text-gray-500 shrink-0" />
                                    <SelectValue placeholder="Filter status" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="pending">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                        Pending
                                    </div>
                                </SelectItem>
                                <SelectItem value="under_review">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        Under Review
                                    </div>
                                </SelectItem>
                                <SelectItem value="mao_audit">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                        MAO Audit
                                    </div>
                                </SelectItem>
                                <SelectItem value="approved">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        Approved (Pending Pickup)
                                    </div>
                                </SelectItem>
                                <SelectItem value="completed">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                                        Released / Completed
                                    </div>
                                </SelectItem>
                                <SelectItem value="rejected">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                        Rejected
                                    </div>
                                </SelectItem>
                                <SelectItem value="unclaimed">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                        Unclaimed
                                    </div>
                                </SelectItem>
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
                                    <th className="p-3">Adopter Name</th>
                                    <th className="p-3">Pet Name</th>
                                    <th className="p-3">Shelter</th>
                                    <th className="p-3 text-center">DSS Score</th>
                                    <th className="p-3 text-center">Status</th>
                                    <th className="p-3">Date Applied</th>
                                    <th className="p-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                {applications.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-gray-400">
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
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${STATUS_BADGE[app.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                                {app.status === 'completed' ? 'RELEASED / ADOPTED' : app.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="p-3 text-gray-400">
                                            {new Date(app.submitted_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {app.status === 'approved' && (
                                                    <ConfirmPetReleaseModal
                                                        application={app as any}
                                                        routePrefix="shelter"
                                                        trigger={
                                                            <Button
                                                                size="sm"
                                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1 h-7 px-2.5 shadow-xs cursor-pointer"
                                                            >
                                                                <ShieldCheck className="h-3.5 w-3.5" />
                                                                Confirm Release
                                                            </Button>
                                                        }
                                                    />
                                                )}
                                                <Link href={route('shelter.applications.show', app.id)}>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-xs border-[#D4A017]/40 text-[#D4A017] hover:bg-[#D4A017]/10 h-7 px-2.5"
                                                    >
                                                        Review
                                                    </Button>
                                                </Link>
                                            </div>
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
