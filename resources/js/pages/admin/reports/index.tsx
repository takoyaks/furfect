import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Check, X, ShieldAlert, Award } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

interface Stats {
    total_applications: number;
    approved_applications: number;
    rejected_applications: number;
    pending_audits: number;
}

interface Shelter {
    id: number;
    name: string;
    location: string;
    contact: string;
    total_pets_count: number;
    active_pets_count: number;
    status: string;
}

interface Application {
    id: number;
    reference_number: string;
    status: string;
    submitted_at: string;
    adopter: { name: string };
    pet: { name: string; shelter: { name: string } };
}

export default function AdminReports({ 
    stats, 
    shelters, 
    recentAdoptions 
}: { 
    stats: Stats; 
    shelters: Shelter[]; 
    recentAdoptions: Application[];
}) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Reports & Exports', href: '#' }]}>
            <Head title="Adoption Activity Reports" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                
                {/* Header Action Row */}
                <div className="flex justify-between items-center flex-wrap gap-4 border-b border-gray-100 pb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Reports Overview</h2>
                        <p className="text-xs text-gray-500">View adoption statistics and download activity reports.</p>
                    </div>
                    <div className="flex gap-2">
                        <a href={route('admin.reports.pdf')} target="_blank">
                            <Button variant="outline" className="border-gray-200 text-xs flex items-center gap-1.5">
                                <Download className="h-4 w-4" />
                                Download PDF
                            </Button>
                        </a>
                        <a href={route('admin.reports.excel')}>
                            <Button className="bg-[#D4A017] hover:bg-[#B8860B] text-white text-xs flex items-center gap-1.5">
                                <Download className="h-4 w-4" />
                                Download Excel (CSV)
                            </Button>
                        </a>
                    </div>
                </div>

                {/* Stats row cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { title: 'Total Applications', val: stats.total_applications, icon: FileText, color: 'text-gray-800' },
                        { title: 'Approved', val: stats.approved_applications, icon: Check, color: 'text-green-600' },
                        { title: 'Rejected', val: stats.rejected_applications, icon: X, color: 'text-red-500' },
                        { title: 'Pending Audits', val: stats.pending_audits, icon: ShieldAlert, color: 'text-amber-500' },
                    ].map(card => (
                        <Card key={card.title} className="border-gray-200">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase">{card.title}</span>
                                <card.icon className={`h-4 w-4 ${card.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-extrabold ${card.color}`}>{card.val}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Double columns content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Shelter stats */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card className="border-gray-200 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-md font-bold text-gray-800">Shelters Registry Stats</CardTitle>
                                <CardDescription>Adoption and catalog statistics per animal shelter.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 border-t border-gray-100 overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-gray-50/50 text-gray-500 font-semibold border-b border-gray-100">
                                        <tr>
                                            <th className="p-3">Shelter Name</th>
                                            <th className="p-3">Location</th>
                                            <th className="p-3 text-center">Active Pets</th>
                                            <th className="p-3 text-center">Total Registered</th>
                                            <th className="p-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-gray-700">
                                        {shelters.map(shelter => (
                                            <tr key={shelter.id} className="hover:bg-gray-50/20 transition">
                                                <td className="p-3 font-semibold">{shelter.name}</td>
                                                <td className="p-3 text-gray-500">{shelter.location}</td>
                                                <td className="p-3 text-center font-bold">{shelter.active_pets_count}</td>
                                                <td className="p-3 text-center text-gray-500">{shelter.total_pets_count}</td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                        shelter.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {shelter.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent adoptions success list */}
                    <div className="space-y-4">
                        <Card className="border-gray-200 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-md font-bold text-gray-800">Recent Adoptions Success</CardTitle>
                                <CardDescription>Latest finalized approved adoptions.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 border-t border-gray-100 divide-y divide-gray-100">
                                {recentAdoptions.length === 0 ? (
                                    <p className="p-4 text-xs text-gray-500">No approved adoptions yet.</p>
                                ) : (
                                    recentAdoptions.map(app => (
                                        <div key={app.id} className="p-4 flex items-center justify-between text-xs gap-3">
                                            <div>
                                                <div className="font-semibold text-gray-800">{app.pet.name}</div>
                                                <div className="text-gray-400 text-[10px] mt-0.5">{app.adopter.name} • {app.pet.shelter.name}</div>
                                            </div>
                                            <Award className="h-5 w-5 text-green-600 flex-shrink-0" />
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>

                </div>

            </div>
        </AppLayout>
    );
}
