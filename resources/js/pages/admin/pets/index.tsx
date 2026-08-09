import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';

interface Pet {
    id: number;
    name: string;
    species: string;
    breed: string;
    age_years: number;
    gender: string;
    size: string;
    adoption_fee: string;
    status: string;
    shelter: { name: string };
}

export default function AdminPets({ 
    pets, 
    filters 
}: { 
    pets: { data: Pet[]; links: any };
    filters: any;
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'All statuses');

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.pets.index'), { search, status }, { preserveState: true });
    };

    const handleArchive = (petId: number) => {
        if (confirm('Are you sure you want to archive this pet listing?')) {
            router.delete(route('admin.pets.destroy', petId));
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Manage Pets', href: '#' }]}>
            <Head title="Manage Pets" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Pets</h2>
                        <p className="text-xs text-gray-500 dark:text-neutral-400">Manage pet listings across all shelters.</p>
                    </div>
                    <Link href={route('shelter.pets.create')}>
                        <Button className="bg-[#D4A017] hover:bg-[#B8860B] text-white font-semibold flex items-center gap-1.5 shadow-sm">
                            + Add New Pet
                        </Button>
                    </Link>
                </div>

                {/* Filters and Catalog Table */}
                <Card className="border-gray-200">
                    <CardHeader className="pb-4">
                        <form onSubmit={handleSearchSubmit} className="flex gap-4 flex-wrap">
                            <div className="flex-1 min-w-[200px]">
                                <Input 
                                    placeholder="Search by pet name or breed..." 
                                    value={search} 
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="w-48">
                                <Select value={status} onValueChange={val => setStatus(val)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All statuses">All statuses</SelectItem>
                                        <SelectItem value="available">Available</SelectItem>
                                        <SelectItem value="adopted">Adopted</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
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
                                    <th className="p-3">Pet Name</th>
                                    <th className="p-3">Species</th>
                                    <th className="p-3">Breed</th>
                                    <th className="p-3 text-center">Age</th>
                                    <th className="p-3 text-right">Adoption Fee</th>
                                    <th className="p-3">Shelter</th>
                                    <th className="p-3 text-center">Status</th>
                                    <th className="p-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                {pets.data.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50/20">
                                        <td className="p-3 font-semibold">{p.name}</td>
                                        <td className="p-3 text-gray-500 capitalize">{p.species}</td>
                                        <td className="p-3 text-gray-500">{p.breed || '-'}</td>
                                        <td className="p-3 text-center">{p.age_years} yrs</td>
                                        <td className="p-3 text-right font-medium">
                                            {parseFloat(p.adoption_fee) === 0 ? 'Free' : `₱${parseFloat(p.adoption_fee).toLocaleString()}`}
                                        </td>
                                        <td className="p-3 text-gray-500">{p.shelter.name}</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                p.status === 'available' ? 'bg-green-100 text-green-700' :
                                                p.status === 'adopted' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <Link href={route('shelter.pets.edit', p.id)}>
                                                    <Button variant="outline" size="sm" className="text-xs">
                                                        Edit
                                                    </Button>
                                                </Link>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    disabled={p.status === 'archived'}
                                                    className="text-xs text-red-500"
                                                    onClick={() => handleArchive(p.id)}
                                                >
                                                    Archive
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

            </div>
        </AppLayout>
    );
}
