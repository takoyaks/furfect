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
import { ArrowLeft, Upload, X, Check, Dog, Sparkles, ShieldAlert, HeartHandshake } from 'lucide-react';

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
    age_years: number;
    gender: string;
    size: string;
    health_status: string | null;
    temperament: string[] | null;
    energy_level: string;
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
    'Friendly',
    'Playful',
    'Calm',
    'Gentle',
    'Intelligent',
    'Affectionate',
    'Protective',
    'Independent',
    'House-trained',
    'Vocal',
    'Energetic',
    'Shy',
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
        age_years: String(pet.age_years || 1),
        gender: pet.gender || 'male',
        size: pet.size || 'medium',
        health_status: pet.health_status || '',
        temperament: pet.temperament || [],
        energy_level: pet.energy_level || 'moderate',
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
                                <Label htmlFor="status">Listing Status *</Label>
                                <Select
                                    value={data.status}
                                    onValueChange={val => setData('status', val)}
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="available">Available for Adoption</SelectItem>
                                        <SelectItem value="adopted">Adopted</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Shelter Selection */}
                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <Label htmlFor="shelter_id">Shelter Location *</Label>
                                <Select
                                    value={String(data.shelter_id)}
                                    onValueChange={val => setData('shelter_id', val)}
                                >
                                    <SelectTrigger id="shelter_id">
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
                                <Label htmlFor="name">Pet Name *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    required
                                />
                            </div>

                            {/* Species */}
                            <div className="space-y-2">
                                <Label htmlFor="species">Species *</Label>
                                <Select
                                    value={data.species}
                                    onValueChange={val => setData('species', val)}
                                >
                                    <SelectTrigger id="species">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="dog">Dog</SelectItem>
                                        <SelectItem value="cat">Cat</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Breed */}
                            <div className="space-y-2">
                                <Label htmlFor="breed">Breed</Label>
                                <Input
                                    id="breed"
                                    value={data.breed}
                                    onChange={e => setData('breed', e.target.value)}
                                />
                            </div>

                            {/* Age */}
                            <div className="space-y-2">
                                <Label htmlFor="age_years">Age (Years) *</Label>
                                <Input
                                    id="age_years"
                                    type="number"
                                    min="0"
                                    max="30"
                                    value={data.age_years}
                                    onChange={e => setData('age_years', e.target.value)}
                                    required
                                />
                            </div>

                            {/* Gender */}
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender *</Label>
                                <Select
                                    value={data.gender}
                                    onValueChange={val => setData('gender', val)}
                                >
                                    <SelectTrigger id="gender">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Size */}
                            <div className="space-y-2">
                                <Label htmlFor="size">Size Category *</Label>
                                <Select
                                    value={data.size}
                                    onValueChange={val => setData('size', val)}
                                >
                                    <SelectTrigger id="size">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="small">Small (&lt; 10 kg)</SelectItem>
                                        <SelectItem value="medium">Medium (10 - 25 kg)</SelectItem>
                                        <SelectItem value="large">Large (&gt; 25 kg)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Adoption Fee — only shown when pricing is enabled */}
                            {pricingEnabled && (
                            <div className="space-y-2">
                                <Label htmlFor="adoption_fee">Adoption Fee (₱) *</Label>
                                <Input
                                    id="adoption_fee"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.adoption_fee}
                                    onChange={e => setData('adoption_fee', e.target.value)}
                                    required
                                />
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
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="energy_level">Energy Level *</Label>
                                    <Select
                                        value={data.energy_level}
                                        onValueChange={val => setData('energy_level', val)}
                                    >
                                        <SelectTrigger id="energy_level">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low (Lap pet / Calm)</SelectItem>
                                            <SelectItem value="moderate">Moderate (Regular walks)</SelectItem>
                                            <SelectItem value="high">High (Active play & runs)</SelectItem>
                                            <SelectItem value="very_active">Very Active (High endurance)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="health_status">Health & Vaccination Status</Label>
                                    <Input
                                        id="health_status"
                                        value={data.health_status}
                                        onChange={e => setData('health_status', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Temperament Tags */}
                            <div className="space-y-2">
                                <Label>Temperament / Personality Tags</Label>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {TEMPERAMENT_OPTIONS.map(tag => {
                                        const isSelected = data.temperament.includes(tag);
                                        return (
                                            <button
                                                type="button"
                                                key={tag}
                                                onClick={() => toggleTemperament(tag)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                                    isSelected
                                                        ? 'bg-[#D4A017] text-white shadow-sm'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-neutral-800 dark:text-neutral-300'
                                                }`}
                                            >
                                                {isSelected && <Check className="w-3 h-3 inline mr-1" />}
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
                                <Label>Compatible Housing Types *</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                                    {HOUSING_OPTIONS.map(option => (
                                        <label
                                            key={option.id}
                                            className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                                                data.housing_compatible.includes(option.id)
                                                    ? 'border-[#D4A017] bg-[#D4A017]/10 font-semibold text-[#8B6508] dark:text-amber-300'
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
                                <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-neutral-800 cursor-pointer">
                                    <Checkbox
                                        checked={data.requires_yard}
                                        onCheckedChange={checked => setData('requires_yard', !!checked)}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <span className="text-xs font-semibold block text-gray-800 dark:text-neutral-200">Requires Fenced Yard</span>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-neutral-800 cursor-pointer">
                                    <Checkbox
                                        checked={data.requires_experience}
                                        onCheckedChange={checked => setData('requires_experience', !!checked)}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <span className="text-xs font-semibold block text-gray-800 dark:text-neutral-200">Requires Experienced Owner</span>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-neutral-800 cursor-pointer">
                                    <Checkbox
                                        checked={data.requires_no_children}
                                        onCheckedChange={checked => setData('requires_no_children', !!checked)}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <span className="text-xs font-semibold block text-gray-800 dark:text-neutral-200">No Small Children</span>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-neutral-800 cursor-pointer">
                                    <Checkbox
                                        checked={data.requires_no_other_pets}
                                        onCheckedChange={checked => setData('requires_no_other_pets', !!checked)}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <span className="text-xs font-semibold block text-gray-800 dark:text-neutral-200">No Other Pets</span>
                                    </div>
                                </label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 4: Bio & Photos */}
                    <Card className="border-gray-200 dark:border-neutral-800">
                        <CardHeader className="border-b border-gray-100 dark:border-neutral-800 pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-800 dark:text-neutral-200">
                                <Upload className="w-4 h-4 text-[#D4A017]" /> Description & Photos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="description">Bio / Description</Label>
                                <Textarea
                                    id="description"
                                    rows={4}
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                />
                            </div>

                            {/* Existing Photos */}
                            {pet.photos && pet.photos.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Existing Photos</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {pet.photos.map(p => (
                                            <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-700">
                                                <img src={p.photo_path} alt="Pet photo" className="size-full object-cover" />
                                                {p.is_primary && (
                                                    <span className="absolute top-1 left-1 bg-[#D4A017] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                                                        Primary
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New Photos Upload */}
                            <div className="space-y-2 pt-2">
                                <Label>Add More Photos</Label>
                                <div className="border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-xl p-6 text-center hover:border-[#D4A017] transition-colors relative bg-gray-50/50 dark:bg-neutral-800/30">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="absolute inset-0 size-full opacity-0 cursor-pointer"
                                    />
                                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-xs font-medium text-gray-700 dark:text-neutral-300">
                                        Click to upload additional photos
                                    </p>
                                </div>

                                {previewUrls.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                                        {previewUrls.map((url, idx) => (
                                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-700">
                                                <img src={url} alt={`Preview ${idx}`} className="size-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeNewPhoto(idx)}
                                                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-90 hover:opacity-100"
                                                >
                                                    <X className="w-3 h-3" />
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
                            {processing ? 'Saving...' : 'Update Pet Listing'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
