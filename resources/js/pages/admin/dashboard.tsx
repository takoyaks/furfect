import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, ShieldAlert, Award, FileText, Settings, Users, PlusCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
// import { dashboard } from '@/routes';

interface Metric {
    total_applications: number;
    pending_review: number;
    approved_applications: number;
    pets_available: number;
}

interface Application {
    id: number;
    reference_number: string;
    status: string;
    submitted_at: string;
    adopter: { name: string };
    pet: { name: string; shelter: { name: string } };
}

export default function AdminDashboard({ 
    metrics, 
    recentApplications 
}: { 
    metrics: Metric; 
    recentApplications: Application[];
}) {
    return (
        <AppLayout >
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                
                {/* Stats grid cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { title: 'Total Applications', val: metrics.total_applications, sub: '+12 this week', icon: ClipboardList },
                        { title: 'Pending Review', val: metrics.pending_review, sub: 'Needs attention', icon: ShieldAlert },
                        { title: 'Approved', val: metrics.approved_applications, sub: 'This month', icon: FileText },
                        { title: 'Pets Available', val: metrics.pets_available, sub: 'Across shelters', icon: Award },
                    ].map(card => (
                        <Card key={card.title} className="border-gray-200 shadow hover:shadow-md transition">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase">{card.title}</span>
                                <card.icon className="h-4 w-4 text-[#D4A017]" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-extrabold text-gray-800">{card.val}</div>
                                <span className="text-[10px] text-gray-400 block mt-1">{card.sub}</span>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Dashboard grid panel layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Recent applications listing */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card className="border-gray-200 shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-md font-bold text-gray-800">Recent Applications</CardTitle>
                                    <CardDescription>Latest adoption requests submitted across shelters.</CardDescription>
                                </div>
                                <Link href={route('admin.applications.index')}>
                                    <Button variant="ghost" size="sm" className="text-xs text-[#D4A017]">View All →</Button>
                                </Link>
                            </CardHeader>
                            <CardContent className="p-0 border-t border-gray-100">
                                <div className="divide-y divide-gray-100">
                                    {recentApplications.map(app => (
                                        <div key={app.id} className="p-4 flex items-center justify-between text-xs gap-4 hover:bg-gray-50/50 transition">
                                            <div>
                                                <div className="font-bold text-gray-700">{app.adopter.name}</div>
                                                <div className="text-gray-400 mt-0.5">{app.pet.name} ({app.pet.shelter.name})</div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                    app.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {app.status}
                                                </span>
                                                <div className="text-gray-400 text-[10px] mt-1">{new Date(app.submitted_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick actions panel */}
                    <div className="space-y-4">
                        <Card className="border-gray-200 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-md font-bold text-gray-800">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 pt-2">
                                <Link href={route('shelter.pets.create')} className="block">
                                    <Button className="w-full bg-[#D4A017] hover:bg-[#B8860B] text-white flex items-center gap-1.5 text-xs">
                                        <PlusCircle className="h-4.5 w-4.5" />
                                        Add New Pet
                                    </Button>
                                </Link>
                                <Link href={route('admin.reports.index')} className="block">
                                    <Button variant="outline" className="w-full text-xs flex items-center gap-1.5 border-gray-200">
                                        <FileText className="h-4.5 w-4.5" />
                                        Generate Report
                                    </Button>
                                </Link>
                                <Link href={route('admin.users.index')} className="block">
                                    <Button variant="outline" className="w-full text-xs flex items-center gap-1.5 border-gray-200">
                                        <Users className="h-4.5 w-4.5" />
                                        Manage Users
                                    </Button>
                                </Link>
                                <Link href={route('admin.settings.index')} className="block">
                                    <Button variant="outline" className="w-full text-xs flex items-center gap-1.5 border-gray-200">
                                        <Settings className="h-4.5 w-4.5" />
                                        System Settings
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>

                </div>

            </div>
        </AppLayout>
    );
}
// AdminDashboard.layout = {
//     breadcrumbs: [
//         {
//             title: 'Dashboard',
//             href: dashboard(),
//         },
//     ],
// };