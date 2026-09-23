import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Tag, MapPin, Plus, Search, Filter, MoreVertical, Edit3, Eye, ExternalLink, Archive, Trash2 } from 'lucide-react';
import { useThemeTemplate } from '@/hooks/use-theme-template';
import { cn } from '@/lib/utils';

interface Pet {
    id: number;
    name: string;
    species: string;
    breed: string;
    tag_number?: string | null;
    microchip_number?: string | null;
    housing_area?: string | null;
    age_years: number;
    gender: string;
    size: string;
    adoption_fee: string;
    status: string;
    shelter: { name: string };
}

export default function ShelterPetsIndex({ 
    pets, 
    filters 
}: { 
    pets: { data: Pet[]; links: any };
    filters: any;
}) {
    const theme = useThemeTemplate();
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');

    const applyStatusFilter = (val: string) => {
        setStatus(val);
        router.get(
            route('shelter.pets.index'),
            {
                search: search || undefined,
                status: val === 'all' ? '' : val,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('shelter.pets.index'),
            {
                search: search || undefined,
                status: status === 'all' ? '' : status,
            },
            { preserveState: true }
        );
    };

    const handleArchive = (petId: number) => {
        if (confirm('Are you sure you want to archive this pet listing?')) {
            router.delete(route('shelter.pets.destroy', petId), {
                data: { action: 'archive' },
            });
        }
    };

    const handleDelete = (petId: number, petName: string) => {
        if (confirm(`Are you sure you want to permanently delete "${petName}"? This action cannot be undone and will permanently remove this pet listing and all associated photos.`)) {
            router.delete(route('shelter.pets.destroy', petId), {
                data: { action: 'delete' },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Manage Pets', href: '#' }]}>
            <Head title="Manage Shelter Pets" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Shelter Pets</h2>
                        <p className="text-xs text-gray-500 dark:text-neutral-400">View and update pet listings, collar tags, and facility housing areas.</p>
                    </div>
                    <Link href={route('shelter.pets.create')}>
                        <Button className={cn("text-white font-semibold flex items-center gap-1.5 shadow-sm", theme.primaryButton)}>
                            <Plus className="size-4" /> Add New Pet
                        </Button>
                    </Link>
                </div>

                {/* Filters and Catalog Table */}
                <Card className="border-gray-200 dark:border-neutral-800">
                    <CardHeader className="pb-4">
                        <form onSubmit={handleSearchSubmit} className="flex gap-4 flex-wrap items-center">
                            <div className="flex-1 min-w-[220px]">
                                <Input 
                                    placeholder="Search by name, tag #, microchip, or housing area..." 
                                    value={search} 
                                    onChange={e => setSearch(e.target.value)}
                                    leftIcon={<Search className="size-4" />}
                                />
                            </div>
                            <div className="w-52">
                                <Select value={status} onValueChange={applyStatusFilter}>
                                    <SelectTrigger className="bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 shadow-xs h-9">
                                        <div className="flex items-center gap-2 truncate">
                                            <Filter className="h-4 w-4 text-gray-500 shrink-0" />
                                            <SelectValue placeholder="Filter status" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All statuses</SelectItem>
                                        <SelectItem value="available">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                Available
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="adopted">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                Adopted
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="archived">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                                Archived
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </form>
                    </CardHeader>
                    <CardContent className="p-0 border-t border-gray-100 dark:border-neutral-800 overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-gray-50/50 dark:bg-neutral-800/50 text-gray-500 font-semibold border-b border-gray-100 dark:border-neutral-800">
                                <tr>
                                    <th className="p-3">Pet Name</th>
                                    <th className="p-3">Tag &amp; Facility Location</th>
                                    <th className="p-3">Species</th>
                                    <th className="p-3">Breed</th>
                                    <th className="p-3 text-center">Age</th>
                                    <th className="p-3">Shelter</th>
                                    <th className="p-3 text-center">Status</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800 text-gray-700 dark:text-neutral-300">
                                {pets.data.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50/20 dark:hover:bg-neutral-800/20">
                                        <td className="p-3 font-semibold text-gray-900 dark:text-white">
                                            {p.name}
                                        </td>
                                        <td className="p-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-[#B8860B] border border-amber-200">
                                                        <Tag className="h-3 w-3 shrink-0" />
                                                        {p.tag_number || 'No Tag'}
                                                    </span>
                                                    {p.microchip_number && (
                                                        <span className="text-[10px] text-gray-400 font-mono" title={`Microchip: ${p.microchip_number}`}>
                                                            [Chip]
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[11px] text-gray-600 dark:text-neutral-400 flex items-center gap-1 font-medium">
                                                    <MapPin className="h-3 w-3 shrink-0 text-gray-400" />
                                                    {p.housing_area || 'Unassigned Area'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-gray-500 capitalize">{p.species}</td>
                                        <td className="p-3 text-gray-500">{p.breed || '-'}</td>
                                        <td className="p-3 text-center">{p.age_years} yrs</td>
                                        <td className="p-3 text-gray-500">{p.shelter?.name || '-'}</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                p.status === 'available' ? 'bg-green-100 text-green-700' :
                                                p.status === 'adopted' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg cursor-pointer">
                                                        <MoreVertical className="size-4 text-gray-500" />
                                                        <span className="sr-only">Open menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-lg rounded-xl p-1 text-xs">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={route('shelter.pets.edit', p.id)} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-gray-700 dark:text-neutral-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-800 cursor-pointer">
                                                            <Edit3 className="size-3.5 text-amber-600" />
                                                            <span>Edit Pet Details</span>
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={route('pets.show', p.id) + '?view_only=1'} target="_blank" className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-gray-700 dark:text-neutral-200 hover:bg-theme-light hover:text-theme cursor-pointer">
                                                            <Eye className="size-3.5 text-theme" />
                                                            <span>View Pet</span>
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="my-1 border-gray-100 dark:border-neutral-800" />
                                                    <DropdownMenuItem
                                                        disabled={p.status === 'archived'}
                                                        onClick={() => handleArchive(p.id)}
                                                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-gray-600 dark:text-neutral-300 hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:text-orange-700 cursor-pointer disabled:opacity-50"
                                                    >
                                                        <Archive className="size-3.5 text-orange-500" />
                                                        <span>Archive Pet</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(p.id, p.name)}
                                                        variant="destructive"
                                                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 cursor-pointer"
                                                    >
                                                        <Trash2 className="size-3.5 text-red-500" />
                                                        <span>Delete Permanently</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                                {pets.data.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-6 text-center text-gray-500">
                                            No pet listings found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

            </div>
        </AppLayout>
    );
}
