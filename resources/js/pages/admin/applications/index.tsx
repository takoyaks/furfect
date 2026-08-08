import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';

interface Application {
    id: number;
    reference_number: string;
    dss_score: string;
    status: string;
    submitted_at: string;
    adopter: { name: string };
    pet: { name: string; shelter: { name: string } };
}

export default function AdminApplications({ 
    applications, 
    filters 
}: { 
    applications: { data: Application[]; links: { url: string | null; label: string; active: boolean }[] };
    filters: any;
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'All statuses');

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.applications.index'), { search, status }, { preserveState: true });
    };

    const handleDelete = (appId: number) => {
        if (confirm('Are you sure you want to delete this application?')) {
            router.delete(route('admin.applications.destroy', appId));
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Manage Applications', href: '#' }]}>
            {/* <Head title="Manage Adoption Applications" /> */}
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Manage Applications</h2>
                        <p className="text-xs text-gray-500">Track and manage all adoption applications in the system.</p>
                    </div>
                </div>

                {/* Filters and List */}
                <Card className="border-gray-200">
                    <CardHeader className="pb-4">
                        <form onSubmit={handleSearchSubmit} className="flex gap-4 flex-wrap">
                            <div className="flex-1 min-w-[200px]">
                                <Input 
                                    placeholder="Search by reference number or adopter name..." 
                                    value={search} 
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="w-48">
                                <Select value={status} onValueChange={val => setStatus(val)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All statuses">All statuses</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="under_review">Under Review</SelectItem>
                                        <SelectItem value="mao_audit">MAO Audit</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" variant="secondary">Filter</Button>
                        </form>
                    </CardHeader>
                    <CardContent className="p-0 border-t border-gray-100 overflow-x-auto">
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
                                {applications.data.map(app => (
                                    <tr key={app.id} className="hover:bg-gray-50/20">
                                        <td className="p-3 font-semibold">{app.reference_number}</td>
                                        <td className="p-3 text-gray-800">{app.adopter.name}</td>
                                        <td className="p-3 text-gray-500 font-semibold">{app.pet.name}</td>
                                        <td className="p-3 text-gray-400">{app.pet.shelter.name}</td>
                                        <td className="p-3 text-center font-bold text-[#D4A017]">{Math.round(parseFloat(app.dss_score))}%</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                app.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {app.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="p-3 text-gray-400">{new Date(app.submitted_at).toLocaleDateString()}</td>
                                        <td className="p-3 space-x-2">
                                            <Link href={route('admin.applications.show', app.id)}>
                                                <Button variant="ghost" size="sm" className="text-xs text-[#D4A017]">
                                                    Audit
                                                </Button>
                                            </Link>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-xs text-red-500"
                                                onClick={() => handleDelete(app.id)}
                                            >
                                                Delete
                                            </Button>
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
                        {applications.links.map((link: { url: string | null; label: string; active: boolean }, i: number) => (
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
