import { Head, useForm, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';

interface User {
    id: number;
    name: string;
    email: string;
    created_at: string;
    roles: { name: string }[];
}

export default function AdminUsers({ 
    users, 
    roles, 
    filters 
}: { 
    users: { data: User[]; links: any };
    roles: string[];
    filters: any;
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [role, setRole] = useState(filters.role || 'All roles');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const { data, setData, post, patch, processing, reset, errors } = useForm({
        name: '',
        email: '',
        password: '',
        role: roles[0] || 'adopter',
    });

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.users.index'), { search, role }, { preserveState: true });
    };

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.users.store'), {
            onSuccess: () => {
                setIsAddOpen(false);
                reset();
            }
        });
    };

    const handleEditUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        patch(route('admin.users.update', editingUser.id), {
            onSuccess: () => {
                setEditingUser(null);
                reset();
            }
        });
    };

    const handleDeactivate = (userId: number) => {
        if (confirm('Are you sure you want to deactivate this account?')) {
            router.delete(route('admin.users.destroy', userId));
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Manage Users', href: '#' }]}>
            {/* <Head title="Manage Users" /> */}
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Manage Users</h2>
                        <p className="text-xs text-gray-500">All registered accounts in the system.</p>
                    </div>
                    
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-[#D4A017] hover:bg-[#B8860B] text-white font-semibold">
                                + Add User
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New User</DialogTitle>
                                <DialogDescription>Create a new account and assign a role.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddUser} className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="add-name">Full Name</Label>
                                    <Input id="add-name" value={data.name} onChange={e => setData('name', e.target.value)} required />
                                    {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="add-email">Email</Label>
                                    <Input id="add-email" type="email" value={data.email} onChange={setData => setData('email', setData.target.value)} required />
                                    {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="add-password">Password</Label>
                                    <Input id="add-password" type="password" value={data.password} onChange={setData => setData('password', setData.target.value)} required />
                                    {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="add-role">Role</Label>
                                    <Select value={data.role} onValueChange={val => setData('role', val)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {roles.map(r => (
                                                <SelectItem key={r} value={r} className="capitalize">{r.replace('_', ' ')}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="submit" disabled={processing} className="w-full bg-[#D4A017] hover:bg-[#B8860B] text-white">Create Account</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filters and List */}
                <Card className="border-gray-200">
                    <CardHeader className="pb-4">
                        <form onSubmit={handleSearchSubmit} className="flex gap-4 flex-wrap">
                            <div className="flex-1 min-w-[200px]">
                                <Input 
                                    placeholder="Search users..." 
                                    value={search} 
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="w-48">
                                <Select value={role} onValueChange={val => setRole(val)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All roles">All roles</SelectItem>
                                        {roles.map(r => (
                                            <SelectItem key={r} value={r} className="capitalize">{r.replace('_', ' ')}</SelectItem>
                                        ))}
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
                                    <th className="p-3">Full Name</th>
                                    <th className="p-3">Email</th>
                                    <th className="p-3">Role</th>
                                    <th className="p-3">Date Registered</th>
                                    {/* <th className="p-3">Status</th> */}
                                    <th className="p-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                {users.data.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50/20">
                                        <td className="p-3 font-semibold">{u.name}</td>
                                        <td className="p-3 text-gray-500">{u.email}</td>
                                        <td className="p-3">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                                                {u.roles[0]?.name?.replace('_', ' ') || 'User'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                                        {/* <td className="p-3">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-100 text-green-700">
                                                Available
                                            </span>
                                        </td> */}
                                        <td className="p-3 space-x-2">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-xs text-[#D4A017]"
                                                onClick={() => {
                                                    setEditingUser(u);
                                                    setData({
                                                        name: u.name,
                                                        email: u.email,
                                                        password: '',
                                                        role: u.roles[0]?.name || 'adopter',
                                                    });
                                                }}
                                            >
                                                Edit
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-xs text-red-500"
                                                onClick={() => handleDeactivate(u.id)}
                                            >
                                                Deactivate
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Edit User Dialog */}
                <Dialog open={editingUser !== null} onOpenChange={open => !open && setEditingUser(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit User Account</DialogTitle>
                            <DialogDescription>Modify name, email, or role permissions.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleEditUser} className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="edit-name">Full Name</Label>
                                <Input id="edit-name" value={data.name} onChange={e => setData('name', e.target.value)} required />
                                {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="edit-email">Email</Label>
                                <Input id="edit-email" type="email" value={data.email} onChange={setData => setData('email', setData.target.value)} required />
                                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="edit-role">Role</Label>
                                <Select value={data.role} onValueChange={val => setData('role', val)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {roles.map(r => (
                                            <SelectItem key={r} value={r} className="capitalize">{r.replace('_', ' ')}</SelectItem>
                                        ))}
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
