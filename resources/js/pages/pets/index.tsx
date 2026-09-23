import { Head, Link, router, usePage } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Heart, Search, Eye, Sparkles, AlertCircle } from 'lucide-react';
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
    coat_color?: string;
    health_status?: string;
    energy_level: string;
    maintenance_level?: string;
    adoption_fee: string;
    temperament: string[];
    description: string;
    photos?: { photo_path: string; is_primary: boolean }[];
    shelter: { name: string };
}

export default function PetsIndex({ 
    pets, 
    filters,
    savedPetIds = [],
    dssScores = {}
}: { 
    pets: { data: Pet[]; links: any; meta?: any; current_page: number; last_page: number };
    filters: any;
    savedPetIds: number[];
    dssScores: Record<number, number>;
}) {
    const { systemSettings } = usePage().props as any;
    const pricingEnabled = systemSettings?.pricing_enabled ?? false;
    const [search, setSearch] = useState(filters.search || '');
    const [species, setSpecies] = useState(filters.species || 'All types');
    const [age, setAge] = useState(filters.age || 'All ages');
    const [size, setSize] = useState(filters.size || 'Any');
    const [gender, setGender] = useState(filters.gender || 'Any');
    const [maintenance, setMaintenance] = useState(filters.maintenance || 'Any');
    const [color, setColor] = useState(filters.color || 'Any');
    const [fee, setFee] = useState(filters.fee || 'all');

    const updateFilter = (newFilters: Partial<{
        search: string;
        species: string;
        age: string;
        size: string;
        gender: string;
        maintenance: string;
        color: string;
        fee: string;
    }>) => {
        const nextFilters = {
            search,
            species,
            age,
            size,
            gender,
            maintenance,
            color,
            fee,
            ...newFilters,
        };

        router.get(route('pets.index'), {
            search: nextFilters.search || undefined,
            species: nextFilters.species === 'All types' ? undefined : nextFilters.species,
            age: nextFilters.age === 'All ages' ? undefined : nextFilters.age,
            size: nextFilters.size === 'Any' ? undefined : nextFilters.size,
            gender: nextFilters.gender === 'Any' ? undefined : nextFilters.gender,
            maintenance: nextFilters.maintenance === 'Any' ? undefined : nextFilters.maintenance,
            color: nextFilters.color === 'Any' ? undefined : nextFilters.color,
            fee: nextFilters.fee === 'all' ? undefined : nextFilters.fee,
        }, { preserveState: true, replace: true });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateFilter({ search });
    };

    const resetFilters = () => {
        setSearch('');
        setSpecies('All types');
        setAge('All ages');
        setSize('Any');
        setGender('Any');
        setMaintenance('Any');
        setColor('Any');
        setFee('all');
        router.get(route('pets.index'), {}, { preserveState: true, replace: true });
    };

    const handleSaveToggle = (petId: number) => {
        router.post(route('saved-pets.toggle'), { pet_id: petId }, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Browse Pets', href: '#' }]}>
            <Head title="Browse Pets" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                
                {/* Anti-Bias Info Banner */}
                <Alert className="mb-6 bg-[#F5EDD7] border-[#D4A017]/30 text-amber-900">
                    <AlertCircle className="h-4 w-4 text-[#D4A017]" />
                    <AlertTitle className="font-semibold text-amber-900">Unbiased Matching Enforced</AlertTitle>
                    <AlertDescription className="text-amber-800 text-sm">
                        To ensure fair and unbiased matching, breed information is hidden during catalog browsing. 
                        Your DSS compatibility calculations are based purely on matching lifestyle factors, not appearance.
                    </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Filters Sidebar */}
                    <div className="space-y-6">
                        <Card className="border-gray-200">
                            <CardContent className="p-5 space-y-6">
                                <h3 className="font-bold text-lg text-gray-800 border-b border-gray-100 pb-2">Filters</h3>

                                {/* Pet Type */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Pet Type</label>
                                    <Select value={species} onValueChange={val => { setSpecies(val); updateFilter({ species: val }); }}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All types">All types</SelectItem>
                                            <SelectItem value="dog">Dogs</SelectItem>
                                            <SelectItem value="cat">Cats</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Age Range */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Age</label>
                                    <Select value={age} onValueChange={val => { setAge(val); updateFilter({ age: val }); }}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All ages">All ages</SelectItem>
                                            <SelectItem value="Puppy/Kitten (Under 1 yr)">Puppy/Kitten (Under 1 yr)</SelectItem>
                                            <SelectItem value="Young (1-3 yrs)">Young (1-3 yrs)</SelectItem>
                                            <SelectItem value="Adult (3-7 yrs)">Adult (3-7 yrs)</SelectItem>
                                            <SelectItem value="Senior (7+ yrs)">Senior (7+ yrs)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Size */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Size</label>
                                    <Select value={size} onValueChange={val => { setSize(val); updateFilter({ size: val }); }}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Any">Any</SelectItem>
                                            <SelectItem value="small">Small</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="large">Large</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Gender */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Gender</label>
                                    <Select value={gender} onValueChange={val => { setGender(val); updateFilter({ gender: val }); }}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Any">Any</SelectItem>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Maintenance Level */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Maintenance</label>
                                    <Select value={maintenance} onValueChange={val => { setMaintenance(val); updateFilter({ maintenance: val }); }}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Any">Any</SelectItem>
                                            <SelectItem value="low">Low Maintenance</SelectItem>
                                            <SelectItem value="medium">Medium Maintenance</SelectItem>
                                            <SelectItem value="high">High Maintenance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Color / Coat */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Color / Coat</label>
                                    <Select value={color} onValueChange={val => { setColor(val); updateFilter({ color: val }); }}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Any">Any</SelectItem>
                                            <SelectItem value="black">Black</SelectItem>
                                            <SelectItem value="white">White</SelectItem>
                                            <SelectItem value="brown">Brown</SelectItem>
                                            <SelectItem value="mixed">Mixed</SelectItem>
                                            <SelectItem value="golden">Golden / Cream</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button 
                                    type="button"
                                    variant="outline"
                                    onClick={resetFilters} 
                                    className="w-full text-gray-600 hover:text-gray-800"
                                >
                                    Reset Filters
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Catalog Listing */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Search and Metadata */}
                        <form onSubmit={handleSearchSubmit} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input 
                                    placeholder="Search by name, shelter, etc..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="pl-9 focus-visible:ring-[#D4A017]"
                                />
                            </div>
                            <Button type="submit" variant="secondary">Search</Button>
                        </form>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {pets.data.map(pet => {
                                const photo = pet.photos?.find(p => p.is_primary)?.photo_path || '/placeholder-pet.png';
                                const isSaved = savedPetIds.includes(pet.id);
                                const score = dssScores[pet.id];

                                return (
                                    <Card key={pet.id} className="border-gray-200 overflow-hidden shadow hover:shadow-md transition flex flex-col justify-between">
                                        <div>
                                            <div className="relative h-44 bg-gray-100 overflow-hidden group">
                                                <Link 
                                                    href={route('pets.show', pet.id)} 
                                                    className="block w-full h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4A017] focus:ring-inset"
                                                    title={`View ${pet.name}'s details`}
                                                >
                                                    <img 
                                                        src={photo} 
                                                        alt={pet.name} 
                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                </Link>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSaveToggle(pet.id);
                                                    }}
                                                    className="absolute top-3 right-3 p-1.5 bg-white/80 hover:bg-white rounded-full transition shadow z-10 cursor-pointer"
                                                    title={isSaved ? "Remove from Favorites" : "Save to Favorites"}
                                                >
                                                    <Heart className={`h-4.5 w-4.5 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                                                </button>

                                                {score !== undefined && (
                                                    <div className="absolute bottom-3 left-3 bg-[#D4A017] text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-xs pointer-events-none">
                                                        <Sparkles className="h-3 w-3" />
                                                        {Math.round(score)}% Match
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-4 space-y-3">
                                                <div>
                                                    <Link href={route('pets.show', pet.id)} className="hover:text-[#D4A017] transition-colors">
                                                        <h4 className="text-lg font-bold text-gray-800 hover:text-[#D4A017] transition-colors">{pet.name}</h4>
                                                    </Link>
                                                    <p className="text-xs text-gray-500 capitalize">
                                                        {pet.age_years} yrs • {pet.gender} • {pet.size}
                                                        {pet.coat_color ? ` • ${pet.coat_color}` : ''}
                                                    </p>
                                                </div>

                                                <div className="flex flex-wrap gap-1">
                                                    {pet.maintenance_level && (
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                                            pet.maintenance_level === 'low'
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : pet.maintenance_level === 'high'
                                                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                        }`}>
                                                            {pet.maintenance_level === 'low' ? 'Low Maint.' : pet.maintenance_level === 'high' ? 'High Maint.' : 'Med Maint.'}
                                                        </span>
                                                    )}
                                                    {pet.health_status && (pet.health_status.toLowerCase().includes('rabies') || pet.health_status.toLowerCase().includes('neutered') || pet.health_status.toLowerCase().includes('spayed')) && (
                                                        <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                                                            {pet.health_status.toLowerCase().includes('rabies') ? 'Anti-Rabies' : 'Altered'}
                                                        </span>
                                                    )}
                                                    {pet.temperament && pet.temperament.slice(0, 2).map(tag => (
                                                        <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 pt-0 border-t border-gray-100 mt-2 pt-3 flex items-center justify-end">
                                            <Link href={route('pets.show', pet.id)}>
                                                <Button size="sm" variant="outline" className="text-xs flex items-center gap-1 border-gray-200">
                                                    <Eye className="h-3.5 w-3.5" />
                                                    View Details
                                                </Button>
                                            </Link>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
