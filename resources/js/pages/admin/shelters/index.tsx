import { Head, useForm, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';

interface Shelter {
    id: number;
    name: string;
    type: string;
    location: string;
    contact: string;
    email: string;
    status: string;
}

export default function AdminShelters({ 
    shelters, 
    filters 
}: { 
    shelters: { data: Shelter[]; links: any };
    filters: any;
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingShelter, setEditingShelter] = useState<Shelter | null>(null);

    const { data, setData, post, patch, processing, reset, errors } = useForm({
        name: '',
        type: 'Municipal Animal Shelter',
        location: '',
        contact: '',
        email: '',
        status: 'active',
    });

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.shelters.index'), { search }, { preserveState: true });
    };

    const handleAddShelter = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.shelters.store'), {
            onSuccess: () => {
                setIsAddOpen(false);
                reset();
            }
        });
    };

    const handleEditShelter = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingShelter) return;
        patch(route('admin.shelters.update', editingShelter.id), {
            onSuccess: () => {
                setEditingShelter(null);
                reset();
            }
        });
    };

    const handleDelete = (shelterId: number) => {
        if (confirm('Are you sure you want to delete this shelter registry?')) {
            router.delete(route('admin.shelters.destroy', shelterId));
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Manage Shelters', href: '#' }]}>
            <Head title="Manage Shelters" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Manage Shelters</h2>
                        <p className="text-xs text-gray-500">Partner shelters in Virac, Catanduanes.</p>
                    </div>
                    
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-[#D4A017] hover:bg-[#B8860B] text-white font-semibold">
                                + Add Shelter
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Register New Shelter</DialogTitle>
                                <DialogDescription>Add a shelter location details to system.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddShelter} className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="add-name">Shelter Name</Label>
                                    <Input id="add-name" value={data.name} onChange={e => setData('name', e.target.value)} required />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="add-type">Shelter Type</Label>
                                    <Input id="add-type" value={data.type} onChange={e => setData('type', e.target.value)} required />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="add-location">Location / Address</Label>
                                    <Input id="add-location" value={data.location} onChange={e => setData('location', e.target.value)} required />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="add-contact">Contact Number</Label>
                                    <Input id="add-contact" value={data.contact} onChange={e => setData('contact', e.target.value)} required />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="add-email">Email Address</Label>
                                    <Input id="add-email" type="email" value={data.email} onChange={e => setData('email', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="add-status">Status</Label>
                                    <Select value={data.status} onValueChange={val => setData('status', val)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="submit" disabled={processing} className="w-full bg-[#D4A017] hover:bg-[#B8860B] text-white">Add Shelter</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filters and Table List */}
                <Card className="border-gray-200">
                    <CardHeader className="pb-4">
                        <form onSubmit={handleSearchSubmit} className="flex gap-4">
                            <div className="flex-1">
                                <Input 
                                    placeholder="Search shelters by name or location..." 
                                    value={search} 
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <Button type="submit" variant="secondary">Filter</Button>
                        </form>
                    </CardHeader>
                    <CardContent className="p-0 border-t border-gray-100 overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-gray-50/50 text-gray-500 font-semibold border-b border-gray-100">
                                <tr>
                                    <th className="p-3">Shelter Name</th>
                                    <th className="p-3">Type</th>
                                    <th className="p-3">Location</th>
                                    <th className="p-3">Contact</th>
                                    <th className="p-3">Email</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                {shelters.data.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50/20">
                                        <td className="p-3 font-semibold">{s.name}</td>
                                        <td className="p-3 text-gray-500">{s.type}</td>
                                        <td className="p-3 text-gray-500">{s.location}</td>
                                        <td className="p-3 font-medium">{s.contact}</td>
                                        <td className="p-3 text-gray-400">{s.email || '-'}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="p-3 space-x-2">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-xs text-[#D4A017]"
                                                onClick={() => {
                                                    setEditingShelter(s);
                                                    setData({
                                                        name: s.name,
                                                        type: s.type,
                                                        location: s.location,
                                                        contact: s.contact,
                                                        email: s.email || '',
                                                        status: s.status,
                                                    });
                                                }}
                                            >
                                                Edit
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-xs text-red-500"
                                                onClick={() => handleDelete(s.id)}
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

                {/* Edit Shelter Dialog */}
                <Dialog open={editingShelter !== null} onOpenChange={open => !open && setEditingShelter(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Shelter Registry</DialogTitle>
                            <DialogDescription>Modify shelter location, email, or active status.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleEditShelter} className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="edit-name">Shelter Name</Label>
                                <Input id="edit-name" value={data.name} onChange={e => setData('name', e.target.value)} required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="edit-type">Shelter Type</Label>
                                <Input id="edit-type" value={data.type} onChange={e => setData('type', e.target.value)} required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="edit-location">Location / Address</Label>
                                <Input id="edit-location" value={data.location} onChange={e => setData('location', e.target.value)} required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="edit-contact">Contact Number</Label>
                                <Input id="edit-contact" value={data.contact} onChange={e => setData('contact', e.target.value)} required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="edit-email">Email Address</Label>
                                <Input id="edit-email" type="email" value={data.email} onChange={e => setData('email', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="edit-status">Status</Label>
                                <Select value={data.status} onValueChange={val => setData('status', val)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" disabled={processing} className="w-full bg-[#D4A017] hover:bg-[#B8860B] text-white">Save Changes</Button>
                        </form>
                    </DialogContent>
                </Dialog>

            </div>
        </AppLayout>
    );
}
