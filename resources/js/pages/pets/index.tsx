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
    energy_level: string;
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
    const [fee, setFee] = useState(filters.fee || 'all');

    const applyFilters = () => {
        router.get(route('pets.index'), {
            search,
            species,
            age,
            size,
            gender,
            fee
        }, { preserveState: true });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
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
                                    <Select value={species} onValueChange={val => setSpecies(val)}>
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
                                    <Select value={age} onValueChange={val => setAge(val)}>
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
                                    <Select value={size} onValueChange={val => setSize(val)}>
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
                                    <Select value={gender} onValueChange={val => setGender(val)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Any">Any</SelectItem>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Adoption Fee — only shown when pricing is enabled */}
                                {pricingEnabled && (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Adoption Fee</label>
                                    <Select value={fee} onValueChange={val => setFee(val)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All pets</SelectItem>
                                            <SelectItem value="free">Free adoption only</SelectItem>
                                            <SelectItem value="paid">Adoption fee applies</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                )}

                                <Button 
                                    onClick={applyFilters} 
                                    className="w-full bg-[#D4A017] hover:bg-[#B8860B] text-white"
                                >
                                    Apply Filters
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
                                            <div className="relative h-44 bg-gray-100">
                                                <img 
                                                    src={photo} 
                                                    alt={pet.name} 
                                                    className="w-full h-full object-cover"
                                                />
                                                <button 
                                                    onClick={() => handleSaveToggle(pet.id)}
                                                    className="absolute top-3 right-3 p-1.5 bg-white/80 hover:bg-white rounded-full transition shadow"
                                                >
                                                    <Heart className={`h-4.5 w-4.5 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                                                </button>

                                                {score !== undefined && (
                                                    <div className="absolute bottom-3 left-3 bg-[#D4A017] text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                                        <Sparkles className="h-3 w-3" />
                                                        {Math.round(score)}% Match
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-4 space-y-3">
                                                <div>
                                                    <h4 className="text-lg font-bold text-gray-800">{pet.name}</h4>
                                                    <span className="text-xs text-gray-500 font-semibold block italic mb-1">{pet.breed}</span>
                                                    <p className="text-xs text-gray-500 capitalize">{pet.age_years} yrs • {pet.gender} • {pet.size}</p>
                                                </div>

                                                <div className="flex flex-wrap gap-1">
                                                    {pet.temperament && pet.temperament.slice(0, 3).map(tag => (
                                                        <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 pt-0 border-t border-gray-100 mt-2 pt-3 flex items-center justify-between">
                                            {pricingEnabled ? (
                                                <span className="text-xs font-semibold text-gray-500">
                                                    {parseFloat(pet.adoption_fee) === 0 ? 'Free adoption' : `₱${parseFloat(pet.adoption_fee).toLocaleString()}`}
                                                </span>
                                            ) : (
                                                <span />
                                            )}
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
