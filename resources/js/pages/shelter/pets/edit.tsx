import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useState, ChangeEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, X, Check, Dog, Cat, Sparkles, ShieldAlert, HeartHandshake, Tag, MapPin, Cpu, Calendar, PawPrint, ImagePlus } from 'lucide-react';

interface PetPhoto {
    id: number;
    photo_path: string;
    is_primary: boolean;
}

interface Pet {
    id: number;
    shelter_id: number;
    name: string;
    species: string;
    breed: string | null;
    tag_number?: string | null;
    microchip_number?: string | null;
    housing_area?: string | null;
    housing_notes?: string | null;
    intake_date?: string | null;
    age_years: number;
    gender: string;
    size: string;
    coat_color?: string | null;
    health_status: string | null;
    temperament: string[] | null;
    energy_level: string;
    maintenance_level?: string;
    requires_experience: boolean;
    requires_yard: boolean;
    requires_no_children: boolean;
    requires_no_other_pets: boolean;
    housing_compatible: string[] | null;
    adoption_fee: string;
    description: string | null;
    status: string;
    photos: PetPhoto[];
}

interface Shelter {
    id: number;
    name: string;
}

const TEMPERAMENT_OPTIONS = [
    'Calm',
    'Gentle',
    'Playful',
    'Energetic',
    'Friendly',
    'Affectionate',
    'Intelligent',
    'Protective',
    'Independent',
    'House-trained',
    'Shy',
    'Vocal',
];

const HEALTH_STATUS_PRESETS = [
    'Neutered',
    'Spayed',
    'Anti-Rabies Vaccinated',
    'Fully Vaccinated',
    'Dewormed',
];

const HOUSING_OPTIONS = [
    { id: 'house_with_yard', label: 'House with Yard' },
    { id: 'house_no_yard', label: 'House without Yard' },
    { id: 'apartment', label: 'Apartment' },
    { id: 'condo', label: 'Condominium' },
    { id: 'rented_room', label: 'Rented Room' },
    { id: 'rural', label: 'Rural / Farm' },
];

export default function EditPet({ pet, shelters = [] }: { pet: Pet; shelters: Shelter[] }) {
    const { systemSettings } = usePage().props as any;
    const pricingEnabled = systemSettings?.pricing_enabled ?? false;
    const { data, setData, post, processing, errors } = useForm({
        shelter_id: String(pet.shelter_id),
        name: pet.name || '',
        species: pet.species || 'dog',
        breed: pet.breed || '',
        tag_number: pet.tag_number || '',
        microchip_number: pet.microchip_number || '',
        housing_area: pet.housing_area || '',
        housing_notes: pet.housing_notes || '',
        intake_date: pet.intake_date ? pet.intake_date.split('T')[0] : '',
        age_years: String(pet.age_years || 1),
        gender: pet.gender || 'male',
        size: pet.size || 'medium',
        coat_color: pet.coat_color || 'mixed',
        health_status: pet.health_status || '',
        temperament: pet.temperament || [],
        energy_level: pet.energy_level || 'moderate',
        maintenance_level: pet.maintenance_level || 'medium',
        requires_experience: pet.requires_experience || false,
        requires_yard: pet.requires_yard || false,
        requires_no_children: pet.requires_no_children || false,
        requires_no_other_pets: pet.requires_no_other_pets || false,
        housing_compatible: pet.housing_compatible || ['house_with_yard', 'apartment'],
        adoption_fee: String(pet.adoption_fee || 0),
        description: pet.description || '',
        status: pet.status || 'available',
        photos: [] as File[],
    });

    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const selectedFiles = Array.from(e.target.files);
        const updatedPhotos = [...data.photos, ...selectedFiles];
        setData('photos', updatedPhotos);

        const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
        setPreviewUrls(prev => [...prev, ...newPreviews]);
    };

    const removeNewPhoto = (index: number) => {
        const updatedPhotos = data.photos.filter((_, i) => i !== index);
        const updatedPreviews = previewUrls.filter((_, i) => i !== index);
        setData('photos', updatedPhotos);
        setPreviewUrls(updatedPreviews);
    };

    const toggleTemperament = (tag: string) => {
        if (data.temperament.includes(tag)) {
            setData('temperament', data.temperament.filter(t => t !== tag));
        } else {
            setData('temperament', [...data.temperament, tag]);
        }
    };

    const toggleHousing = (housingId: string) => {
        if (data.housing_compatible.includes(housingId)) {
            setData('housing_compatible', data.housing_compatible.filter(h => h !== housingId));
        } else {
            setData('housing_compatible', [...data.housing_compatible, housingId]);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        // Uses POST with Inertia for file uploads, hitting update endpoint
        post(route('shelter.pets.update', pet.id));
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Manage Pets', href: route('shelter.pets.index') }, { title: `Edit ${pet.name}`, href: '#' }]}>
            <Head title={`Edit ${pet.name}`} />

            <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
                {/* Header Section */}
                <div className="flex items-center gap-4">
                    <Link
                        href={route('shelter.pets.index')}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 dark:border-neutral-800 dark:hover:bg-neutral-800 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-neutral-300" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            Edit Pet Listing <Sparkles className="w-5 h-5 text-[#D4A017]" />
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-neutral-400">
                            Update pet profile, status, and photos for {pet.name}.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: Basic Information */}
                    <Card className="border-gray-200 dark:border-neutral-800">
                        <CardHeader className="border-b border-gray-100 dark:border-neutral-800 pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-800 dark:text-neutral-200">
                                <Dog className="w-4 h-4 text-[#D4A017]" /> Basic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Listing Status */}
                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <Label htmlFor="status" className="font-semibold text-xs text-gray-700 dark:text-neutral-300">Listing Status *</Label>
                                <Select
                                    value={data.status}
                                    onValueChange={val => setData('status', val)}
                                >
                                    <SelectTrigger id="status" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="available">🟢 Available for Adoption</SelectItem>
                                        <SelectItem value="adopted">🎉 Adopted</SelectItem>
                                        <SelectItem value="archived">📦 Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Shelter Selection */}
                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <Label htmlFor="shelter_id" className="font-semibold text-xs text-gray-700 dark:text-neutral-300">Shelter Location *</Label>
                                <Select
                                    value={String(data.shelter_id)}
                                    onValueChange={val => setData('shelter_id', val)}
                                >
                                    <SelectTrigger id="shelter_id" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {shelters.map(shelter => (
                                            <SelectItem key={shelter.id} value={String(shelter.id)}>
                                                {shelter.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Pet Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="font-semibold text-xs text-gray-700 dark:text-neutral-300">Pet Name *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    leftIcon={<Tag className="size-4" />}
                                    required
                                />
                            </div>

                            {/* Species Selection Toggle */}
                            <div className="space-y-2">
                                <Label className="font-semibold text-xs text-gray-700 dark:text-neutral-300">Species *</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setData('species', 'dog')}
                                        className={`flex items-center justify-center gap-2 h-10 px-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
                                            data.species === 'dog'
                                                ? 'border-[#D4A017] bg-[#D4A017]/10 text-[#8B6508] dark:text-amber-300 shadow-xs ring-1 ring-[#D4A017]'
                                                : 'border-input hover:border-ring/50 hover:bg-accent/40 text-muted-foreground'
                                        }`}
                                    >
                                        <Dog className="size-4 text-[#D4A017]" />
                                        Dog / Canine
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData('species', 'cat')}
                                        className={`flex items-center justify-center gap-2 h-10 px-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
                                            data.species === 'cat'
                                                ? 'border-[#D4A017] bg-[#D4A017]/10 text-[#8B6508] dark:text-amber-300 shadow-xs ring-1 ring-[#D4A017]'
                                                : 'border-input hover:border-ring/50 hover:bg-accent/40 text-muted-foreground'
                                        }`}
                                    >
                                        <Cat className="size-4 text-[#D4A017]" />
                                        Cat / Feline
                                    </button>
                                </div>
                            </div>

                            {/* Breed */}
                            <div className="space-y-2">
                                <Label htmlFor="breed" className="font-semibold text-xs text-gray-700 dark:text-neutral-300">Breed</Label>
                                <Input
                                    id="breed"
                                    value={data.breed}
                                    onChange={e => setData('breed', e.target.value)}
                                    leftIcon={<PawPrint className="size-4" />}
                                />
                            </div>

                            {/* Age */}
                            <div className="space-y-2">
                                <Label htmlFor="age_years" className="font-semibold text-xs text-gray-700 dark:text-neutral-300">Age (Years) *</Label>
                                <Input
                                    id="age_years"
                                    type="number"
                                    min="0"
                                    max="30"
                                    value={data.age_years}
                                    onChange={e => setData('age_years', e.target.value)}
                                    leftIcon={<Calendar className="size-4" />}
                                    required
                                />
                            </div>

                            {/* Gender */}
                            <div className="space-y-2">
                                <Label htmlFor="gender" className="font-semibold text-xs text-gray-700 dark:text-neutral-300">Gender *</Label>
                                <Select
                                    value={data.gender}
                                    onValueChange={val => setData('gender', val)}
                                >
                                    <SelectTrigger id="gender" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">♂ Male</SelectItem>
                                        <SelectItem value="female">♀ Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Size */}
                            <div className="space-y-2">
                                <Label htmlFor="size" className="font-semibold text-xs text-gray-700 dark:text-neutral-300">Size Category *</Label>
                                <Select
                                    value={data.size}
                                    onValueChange={val => setData('size', val)}
                                >
                                    <SelectTrigger id="size" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="small">Small (&lt; 10 kg)</SelectItem>
                                        <SelectItem value="medium">Medium (10 - 25 kg)</SelectItem>
                                        <SelectItem value="large">Large (&gt; 25 kg)</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.size && <p className="text-xs text-red-500">{errors.size}</p>}
                            </div>

                            {/* Coat / Color */}
                            <div className="space-y-2">
                                <Label htmlFor="coat_color" className="font-semibold text-xs text-gray-700 dark:text-neutral-300">Coat / Color *</Label>
                                <Select
                                    value={data.coat_color}
                                    onValueChange={val => setData('coat_color', val)}
                                >
                                    <SelectTrigger id="coat_color" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="black">Black</SelectItem>
                                        <SelectItem value="white">White</SelectItem>
                                        <SelectItem value="brown">Brown</SelectItem>
                                        <SelectItem value="mixed">Mixed / Bi-color / Tri-color</SelectItem>
                                        <SelectItem value="golden">Golden / Cream / Tan</SelectItem>
                                        <SelectItem value="other">Other / Unique</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.coat_color && <p className="text-xs text-red-500">{errors.coat_color}</p>}
                            </div>

                            {/* Adoption Fee — only shown when pricing is enabled */}
                            {pricingEnabled && (
                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <Label htmlFor="adoption_fee" className="font-semibold text-xs text-gray-700 dark:text-neutral-300">Adoption Fee (₱) *</Label>
                                <Input
                                    id="adoption_fee"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.adoption_fee}
                                    onChange={e => setData('adoption_fee', e.target.value)}
                                    leftIcon={<span className="font-semibold text-xs text-muted-foreground">₱</span>}
                                    required
                                />
                                {errors.adoption_fee && <p className="text-xs text-red-500">{errors.adoption_fee}</p>}
                            </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Section 2: Behavioral & Health Attributes */}
                    <Card className="border-gray-200 dark:border-neutral-800">
                        <CardHeader className="border-b border-gray-100 dark:border-neutral-800 pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-800 dark:text-neutral-200">
                                <HeartHandshake className="w-4 h-4 text-[#D4A017]" /> Health & Behavioral Profile
                            </CardTitle>
                            <CardDescription>Energy level, maintenance needs, health status, and temperament traits used for DSS matching.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {/* Energy Level & Maintenance Level */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="energy_level" className="font-semibold text-xs text-gray-700 dark:text-neutral-300">Energy Level *</Label>
                                    <Select
                                        value={data.energy_level}
                                        onValueChange={val => setData('energy_level', val)}
                                    >
                                        <SelectTrigger id="energy_level" className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">🟢 Low (Lap pet / Calm)</SelectItem>
                                            <SelectItem value="moderate">🟡 Moderate (Regular walks)</SelectItem>
                                            <SelectItem value="high">🟠 High (Active play & runs)</SelectItem>
                                            <SelectItem value="very_active">🔴 Very Active (High endurance)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.energy_level && <p className="text-xs text-red-500">{errors.energy_level}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="maintenance_level" className="font-semibold text-xs text-gray-700 dark:text-neutral-300">Maintenance Level *</Label>
                                    <Select
                                        value={data.maintenance_level}
                                        onValueChange={val => setData('maintenance_level', val)}
                                    >
                                        <SelectTrigger id="maintenance_level" className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">🟢 Low Maintenance (Easy grooming, independent)</SelectItem>
                                            <SelectItem value="medium">🟡 Medium Maintenance (Regular brushing, standard care)</SelectItem>
                                            <SelectItem value="high">🟠 High Maintenance (Frequent grooming, strict medical/diet routine)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.maintenance_level && <p className="text-xs text-red-500">{errors.maintenance_level}</p>}
                                </div>
                            </div>

                            {/* Health & Vaccination Status */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="health_status" className="font-semibold text-xs text-gray-700 dark:text-neutral-300">Health & Vaccination Status</Label>
                                    <span className="text-[11px] text-muted-foreground">Click presets to quickly toggle notes</span>
                                </div>

                                {/* Quick Presets */}
                                <div className="flex flex-wrap gap-1.5 pb-1">
                                    {HEALTH_STATUS_PRESETS.map(preset => {
                                        const isActive = data.health_status.toLowerCase().includes(preset.toLowerCase());
                                        return (
                                            <button
                                                type="button"
                                                key={preset}
                                                onClick={() => {
                                                    let current = data.health_status.trim();
                                                    if (isActive) {
                                                        const regex = new RegExp(`(,\\s*)?${preset}|${preset}(,\\s*)?`, 'gi');
                                                        current = current.replace(regex, '').replace(/^,\s*|,\s*$/g, '').trim();
                                                    } else {
                                                        current = current ? `${current}, ${preset}` : preset;
                                                    }
                                                    setData('health_status', current);
                                                }}
                                                className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                                                    isActive 
                                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold'
                                                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                                }`}
                                            >
                                                {isActive ? `✓ ${preset}` : `+ ${preset}`}
                                            </button>
                                        );
                                    })}
                                </div>

                                <Input
                                    id="health_status"
                                    placeholder="e.g. Neutered, Spayed, Anti-Rabies Vaccinated, Dewormed"
                                    value={data.health_status}
                                    onChange={e => setData('health_status', e.target.value)}
                                    leftIcon={<HeartHandshake className="size-4" />}
                                />
                                {errors.health_status && <p className="text-xs text-red-500">{errors.health_status}</p>}
                            </div>

                            {/* Temperament Tags */}
                            <div className="space-y-2">
                                <Label className="font-semibold text-xs text-gray-700 dark:text-neutral-300">Temperament / Personality Traits</Label>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {TEMPERAMENT_OPTIONS.map(tag => {
                                        const isSelected = data.temperament.includes(tag);
                                        return (
                                            <button
                                                type="button"
                                                key={tag}
                                                onClick={() => toggleTemperament(tag)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 flex items-center gap-1.5 ${
                                                    isSelected
                                                        ? 'bg-[#D4A017] text-white shadow-xs font-semibold scale-100 ring-2 ring-[#D4A017]/30'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-neutral-800 dark:text-neutral-300 hover:scale-105 active:scale-95'
                                                }`}
                                            >
                                                {isSelected ? (
                                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                                ) : (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-neutral-500" />
                                                )}
                                                {tag}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 3: Housing & Special Environment Requirements */}
                    <Card className="border-gray-200 dark:border-neutral-800">
                        <CardHeader className="border-b border-gray-100 dark:border-neutral-800 pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-800 dark:text-neutral-200">
                                <ShieldAlert className="w-4 h-4 text-[#D4A017]" /> Housing Compatibility & Flags
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="space-y-2">
                                <Label className="font-semibold text-xs text-gray-700 dark:text-neutral-300">Compatible Housing Types *</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                                    {HOUSING_OPTIONS.map(option => (
                                        <label
                                            key={option.id}
                                            className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all duration-150 ${
                                                data.housing_compatible.includes(option.id)
                                                    ? 'border-[#D4A017] bg-[#D4A017]/10 font-semibold text-[#8B6508] dark:text-amber-300 shadow-xs ring-1 ring-[#D4A017]'
                                                    : 'border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800/50'
                                            }`}
                                        >
                                            <Checkbox
                                                checked={data.housing_compatible.includes(option.id)}
                                                onCheckedChange={() => toggleHousing(option.id)}
                                            />
                                            {option.label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 dark:border-neutral-800 pt-4">
                                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-neutral-800 hover:bg-gray-50/50 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer">
                                    <Checkbox
                                        checked={data.requires_yard}
                                        onCheckedChange={checked => setData('requires_yard', !!checked)}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <span className="text-xs font-semibold block text-gray-800 dark:text-neutral-200">Requires Fenced Yard</span>
                                        <span className="text-[11px] text-gray-500 dark:text-neutral-400">Pet needs an outdoor fenced yard space.</span>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-neutral-800 hover:bg-gray-50/50 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer">
                                    <Checkbox
                                        checked={data.requires_experience}
                                        onCheckedChange={checked => setData('requires_experience', !!checked)}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <span className="text-xs font-semibold block text-gray-800 dark:text-neutral-200">Requires Experienced Owner</span>
                                        <span className="text-[11px] text-gray-500 dark:text-neutral-400">Best suited for prior pet owners.</span>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-neutral-800 hover:bg-gray-50/50 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer">
                                    <Checkbox
                                        checked={data.requires_no_children}
                                        onCheckedChange={checked => setData('requires_no_children', !!checked)}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <span className="text-xs font-semibold block text-gray-800 dark:text-neutral-200">No Small Children (&lt; 10 yrs)</span>
                                        <span className="text-[11px] text-gray-500 dark:text-neutral-400">Pet prefers calm, adult-only environments.</span>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-neutral-800 hover:bg-gray-50/50 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer">
                                    <Checkbox
                                        checked={data.requires_no_other_pets}
                                        onCheckedChange={checked => setData('requires_no_other_pets', !!checked)}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <span className="text-xs font-semibold block text-gray-800 dark:text-neutral-200">No Other Pets in Household</span>
                                        <span className="text-[11px] text-gray-500 dark:text-neutral-400">Must be the only pet in the home.</span>
                                    </div>
                                </label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 3: Physical Identity & Shelter Facility Location */}
                    <Card className="border-gray-200 dark:border-neutral-800">
                        <CardHeader className="border-b border-gray-100 dark:border-neutral-800 pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-800 dark:text-neutral-200">
                                <Tag className="w-4 h-4 text-[#D4A017]" /> Physical Identity &amp; Shelter Facility Location
                            </CardTitle>
                            <CardDescription>Collar tags, microchip, and housing zone to allow staff and MAO officers to locate the pet quickly.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Tag / Collar Code */}
                                <div className="space-y-2">
                                    <Label htmlFor="tag_number" className="flex items-center gap-1.5">
                                        <Tag className="w-3.5 h-3.5 text-gray-500" />
                                        Physical Tag / Collar Code
                                    </Label>
                                    <Input
                                        id="tag_number"
                                        placeholder="e.g. TAG-D-2026-089 or Collar C-042"
                                        value={data.tag_number}
                                        onChange={e => setData('tag_number', e.target.value)}
                                        leftIcon={<Tag className="size-4" />}
                                    />
                                    <p className="text-[11px] text-gray-400">Assigned collar tag, ear tag, or intake tag for physical shelter identification.</p>
                                    {errors.tag_number && <p className="text-xs text-red-500">{errors.tag_number}</p>}
                                </div>

                                {/* Microchip Number */}
                                <div className="space-y-2">
                                    <Label htmlFor="microchip_number" className="flex items-center gap-1.5">
                                        <Cpu className="w-3.5 h-3.5 text-gray-500" />
                                        Microchip ID
                                    </Label>
                                    <Input
                                        id="microchip_number"
                                        placeholder="e.g. 900115800412345 (15-digit ISO)"
                                        value={data.microchip_number}
                                        onChange={e => setData('microchip_number', e.target.value)}
                                        leftIcon={<Cpu className="size-4" />}
                                    />
                                    <p className="text-[11px] text-gray-400">Electronic microchip identification if implanted.</p>
                                    {errors.microchip_number && <p className="text-xs text-red-500">{errors.microchip_number}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Housing Area / Enclosure Zone */}
                                <div className="space-y-2">
                                    <Label htmlFor="housing_area" className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-gray-500" />
                                        Shelter Housing Area / Zone *
                                    </Label>
                                    <Input
                                        id="housing_area"
                                        placeholder="e.g. Kennel Bay A-12, Cattery Pen 3, Quarantine Ward"
                                        value={data.housing_area}
                                        onChange={e => setData('housing_area', e.target.value)}
                                        leftIcon={<MapPin className="size-4" />}
                                    />
                                    <p className="text-[11px] text-gray-400">Specific room, bay, cage number, or foster location.</p>
                                    {errors.housing_area && <p className="text-xs text-red-500">{errors.housing_area}</p>}
                                </div>

                                {/* Intake Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="intake_date" className="font-semibold text-xs text-gray-700 dark:text-neutral-300 flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-[#D4A017]" />
                                        Shelter Intake Date
                                    </Label>
                                    <Input
                                        id="intake_date"
                                        type="date"
                                        value={data.intake_date}
                                        onChange={e => setData('intake_date', e.target.value)}
                                        leftIcon={<Calendar className="size-4" />}
                                    />
                                    <p className="text-[11px] text-gray-400">Date animal was admitted to the shelter facility.</p>
                                    {errors.intake_date && <p className="text-xs text-red-500">{errors.intake_date}</p>}
                                </div>
                            </div>

                            {/* Housing / Handling Notes */}
                            <div className="space-y-2">
                                <Label htmlFor="housing_notes" className="font-semibold text-xs text-gray-700 dark:text-neutral-300">Facility Enclosure Notes &amp; Handling Instructions</Label>
                                <Textarea
                                    id="housing_notes"
                                    rows={2}
                                    placeholder="e.g. Upper tier cage on left; quiet area needed; feeds separately."
                                    value={data.housing_notes}
                                    onChange={e => setData('housing_notes', e.target.value)}
                                />
                                {errors.housing_notes && <p className="text-xs text-red-500">{errors.housing_notes}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 4: Bio & Photos */}
                    <Card className="border-gray-200 dark:border-neutral-800">
                        <CardHeader className="border-b border-gray-100 dark:border-neutral-800 pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-800 dark:text-neutral-200">
                                <ImagePlus className="w-4 h-4 text-[#D4A017]" /> Description & Photos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="description" className="font-semibold text-xs text-gray-700 dark:text-neutral-300">Bio / Description</Label>
                                <Textarea
                                    id="description"
                                    rows={4}
                                    placeholder="Describe pet's background, personality, favorite activities, or backstory..."
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                />
                            </div>

                            {/* Existing Photos */}
                            {pet.photos && pet.photos.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="font-semibold text-xs text-gray-700 dark:text-neutral-300">Current Photos</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {pet.photos.map(p => (
                                            <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-700 shadow-xs group">
                                                <img src={p.photo_path} alt="Pet photo" className="size-full object-cover group-hover:scale-105 transition-transform duration-200" />
                                                {p.is_primary && (
                                                    <span className="absolute top-2 left-2 bg-[#D4A017] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
                                                        <Sparkles className="size-3" /> Primary
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New Photos Upload */}
                            <div className="space-y-2 pt-2">
                                <Label className="font-semibold text-xs text-gray-700 dark:text-neutral-300">Add More Photos</Label>
                                <div className="border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-2xl p-8 text-center hover:border-[#D4A017] hover:bg-[#D4A017]/5 group transition-all duration-200 relative bg-gray-50/50 dark:bg-neutral-800/20 cursor-pointer">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="absolute inset-0 size-full opacity-0 cursor-pointer"
                                    />
                                    <div className="size-12 rounded-full bg-[#D4A017]/10 text-[#D4A017] flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                                        <ImagePlus className="size-6" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-neutral-200">
                                        Click or drag &amp; drop photos here to add
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-neutral-400 mt-1">
                                        PNG, JPG, WEBP up to 4MB each.
                                    </p>
                                </div>

                                {previewUrls.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                                        {previewUrls.map((url, idx) => (
                                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-700 shadow-xs group">
                                                <img src={url} alt={`Preview ${idx}`} className="size-full object-cover group-hover:scale-105 transition-transform duration-200" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeNewPhoto(idx)}
                                                    className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-600 text-white p-1.5 rounded-full shadow-sm opacity-90 hover:opacity-100 hover:scale-110 transition-all"
                                                    title="Remove photo"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex justify-end items-center gap-3 pt-4">
                        <Link href={route('shelter.pets.index')}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-[#D4A017] hover:bg-[#B8860B] text-white font-semibold min-w-[140px]"
                        >
                            <PawPrint className="size-4 mr-2" />
                            {processing ? 'Saving...' : 'Update Pet Listing'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
