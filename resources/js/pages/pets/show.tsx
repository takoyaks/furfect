import { Head, Link, router, usePage } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ShieldAlert, Award, Calendar, Phone, Heart, Sparkles, MapPin, BadgeCheck, Zap, CheckCircle2, ArrowRight, ZoomIn, X } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { DssScoreCard } from '@/components/dss-score-card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface Photo {
    id: number;
    photo_path: string;
}

interface Pet {
    id: number;
    name: string;
    species: string;
    breed: string;
    age_years: number;
    gender: string;
    size: string;
    coat_color?: string | null;
    energy_level: string;
    maintenance_level?: string;
    adoption_fee: string;
    health_status: string;
    status?: string;
    temperament: string[];
    description: string;
    photos: Photo[];
    shelter: {
        name: string;
        location: string;
        contact: string;
    };
}

interface DssData {
    total_score: number;
    lifestyle_score?: number;
    housing_score?: number;
    care_capacity_score?: number;
    experience_score?: number;
    other_pets_score?: number;
    family_children_score?: number;
    age_activity_score?: number;
    special_requirements_score?: number;
    fast_track_eligible?: boolean;
    breakdown_details?: Record<string, any>;
    match_reasons: string[];
    mismatch_reasons: string[];
}

export default function PetShow({
    pet,
    dssData,
    isSaved,
    hasActiveApplication,
    isApproved = false,
}: {
    pet: Pet;
    dssData: DssData | null;
    isSaved: boolean;
    hasActiveApplication: boolean;
    isApproved: boolean;
}) {
    const { systemSettings } = usePage().props as any;
    const pricingEnabled = systemSettings?.pricing_enabled ?? false;
    const [selectedPhoto, setSelectedPhoto] = useState(pet.photos[0]?.photo_path || '/placeholder-pet.png');
    const [isZoomOpen, setIsZoomOpen] = useState(false);

    const handleApply = () => {
        router.post(route('application.store'), { pet_id: pet.id });
    };

    const handleSaveToggle = () => {
        router.post(route('saved-pets.toggle'), { pet_id: pet.id }, { preserveScroll: true });
    };

    const totalScore = dssData ? Math.round(Number(dssData.total_score) || 0) : null;

    return (
        <AppLayout breadcrumbs={[{ title: 'Browse Pets', href: route('pets.index') }, { title: pet.name, href: '#' }]}>
            <Head title={pet.name} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    
                    {/* ── Left Column: Media, Description & 8-Factor DSS Score Card ── */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="space-y-4">
                            {/* Primary photo preview with Zoom */}
                            <div 
                                onClick={() => setIsZoomOpen(true)}
                                className="group relative h-[420px] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-xs cursor-zoom-in"
                                title="Click to zoom image"
                            >
                                <img 
                                    src={selectedPhoto} 
                                    alt={pet.name} 
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                    <div className="bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-xs shadow-lg">
                                        <ZoomIn className="size-4" /> Click to Zoom
                                    </div>
                                </div>
                            </div>
                            
                            {/* Thumbnails list */}
                            {pet.photos.length > 1 && (
                                <div className="flex gap-2.5 overflow-x-auto pb-2">
                                    {pet.photos.map(p => (
                                        <button 
                                            key={p.id} 
                                            onClick={() => setSelectedPhoto(p.photo_path)}
                                            className={`h-20 w-20 rounded-xl border-2 overflow-hidden shrink-0 transition-all ${selectedPhoto === p.photo_path ? 'border-[#D4A017] ring-2 ring-[#D4A017]/20 shadow-xs' : 'border-gray-200 opacity-70 hover:opacity-100'}`}
                                        >
                                            <img src={p.photo_path} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pet Description & Personality Tags */}
                        <Card className="border-gray-200 shadow-xs">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-start flex-wrap gap-3">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Meet {pet.name}</h2>
                                        <p className="text-xs text-gray-500 capitalize">
                                            {pet.gender} &bull; {pet.age_years} Year(s) old
                                            {pet.coat_color ? ` \u2022 ${pet.coat_color} Color` : ''}
                                            {` \u2022 ${pet.shelter.name}`}
                                        </p>
                                    </div>

                                    {/* Approved Adoption Badge — reveals breed info */}
                                    {isApproved && (
                                        <div className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                                            <BadgeCheck className="h-4 w-4 text-green-600" />
                                            Adoption Approved — Breed &amp; Details Unlocked
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2 pt-1">
                                    {pet.coat_color && (
                                        <span className="text-xs bg-amber-50 text-amber-800 border border-[#D4A017]/30 font-semibold px-3 py-1 rounded-full capitalize">
                                            Color: {pet.coat_color}
                                        </span>
                                    )}
                                    {pet.temperament && pet.temperament.map(tag => (
                                        <span key={tag} className="text-xs bg-[#F5EDD7] text-[#B8860B] font-semibold px-3 py-1 rounded-full capitalize">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <div className="pt-2 border-t border-gray-100">
                                    <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">About {pet.name}</h4>
                                    <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">{pet.description || 'No description provided.'}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* ── Full 8-Factor DSS Compatibility Score Matrix ── */}
                        {dssData ? (
                            <div className="space-y-2">
                                <DssScoreCard dss={dssData} compact={false} />
                            </div>
                        ) : null}
                    </div>

                    {/* ── Right Column: Sticky Action Card & Quick Specs ── */}
                    <div className="space-y-6 lg:sticky lg:top-4">
                        
                        {/* ── 1. Top Adoption Action & Match Summary Card ── */}
                        <Card className="border-[#D4A017]/40 shadow-md bg-gradient-to-b from-white via-amber-50/20 to-amber-50/40 overflow-hidden">
                            <CardHeader className="p-5 pb-4 border-b border-[#D4A017]/10">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <CardTitle className="text-xl font-bold text-gray-900">{pet.name}</CardTitle>
                                        <CardDescription className="text-xs text-gray-500 capitalize">{pet.species} &bull; {pet.shelter.name}</CardDescription>
                                    </div>
                                    {totalScore !== null && (
                                        <div className="text-right">
                                            <div className="inline-flex items-center gap-1 font-black text-xl text-[#B8860B] bg-[#F5EDD7] px-3 py-1 rounded-xl border border-[#D4A017]/30 shadow-xs">
                                                <Sparkles className="h-4 w-4" />
                                                {totalScore}%
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider mt-0.5">DSS Match</span>
                                        </div>
                                    )}
                                </div>

                                {dssData?.fast_track_eligible && (
                                    <div className="mt-3">
                                        <Badge className="bg-emerald-600 text-white font-bold text-xs gap-1 py-1 px-2.5 w-full justify-center shadow-xs">
                                            <Zap className="h-3.5 w-3.5 fill-white" /> Fast-Track Screening Eligible
                                        </Badge>
                                    </div>
                                )}
                            </CardHeader>

                            <CardContent className="p-5 space-y-4">
                                {pricingEnabled && (
                                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                                        <span className="text-xs text-gray-500 font-medium">Adoption Fee</span>
                                        <span className="font-bold text-base text-[#D4A017]">
                                            {parseFloat(pet.adoption_fee) === 0 ? 'Free Adoption' : `₱${parseFloat(pet.adoption_fee).toLocaleString()}`}
                                        </span>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <Button 
                                            onClick={handleSaveToggle} 
                                            variant="outline" 
                                            className="px-3 border-gray-200 hover:bg-red-50 hover:border-red-200 transition-colors"
                                            title="Save to Favorites"
                                        >
                                            <Heart className={`h-5 w-5 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                                        </Button>
                                        <Button 
                                            onClick={handleApply}
                                            disabled={hasActiveApplication || pet.status !== 'available'}
                                            className="flex-1 bg-[#D4A017] hover:bg-[#B8860B] text-white font-bold text-sm h-10 shadow-xs gap-1.5"
                                        >
                                            {hasActiveApplication ? (
                                                'Application Active'
                                            ) : pet.status !== 'available' ? (
                                                'Pet Unavailable'
                                            ) : (
                                                <>
                                                    Apply for Adoption
                                                    <ArrowRight className="h-4 w-4" />
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    {hasActiveApplication && (
                                        <p className="text-[11px] text-center text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                                            You currently have an active adoption application. Track progress in your portal.
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* ── 2. Pet Specifications ── */}
                        <Card className="border-gray-200 shadow-xs">
                            <CardHeader className="p-4 pb-2 border-b border-gray-100">
                                <CardTitle className="text-sm font-bold text-gray-800">Pet Specifications</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-2.5 text-xs">
                                <div className="flex justify-between border-b border-gray-50 pb-2">
                                    <span className="text-gray-500">Species</span>
                                    <span className="font-semibold capitalize text-gray-900">{pet.species}</span>
                                </div>
                                {isApproved && pet.breed && pet.breed !== 'Hidden' && (
                                    <div className="flex justify-between border-b border-gray-50 pb-2">
                                        <span className="text-gray-500">Breed</span>
                                        <span className="font-semibold capitalize text-gray-900">{pet.breed}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-b border-gray-50 pb-2">
                                    <span className="text-gray-500">Age</span>
                                    <span className="font-semibold text-gray-900">{pet.age_years} Year(s)</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-50 pb-2">
                                    <span className="text-gray-500">Gender</span>
                                    <span className="font-semibold capitalize text-gray-900">{pet.gender}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-50 pb-2">
                                    <span className="text-gray-500">Size Category</span>
                                    <span className="font-semibold capitalize text-gray-900">{pet.size}</span>
                                </div>
                                {pet.coat_color && (
                                    <div className="flex justify-between border-b border-gray-50 pb-2">
                                        <span className="text-gray-500">Coat / Color</span>
                                        <span className="font-semibold capitalize text-gray-900">{pet.coat_color}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-b border-gray-50 pb-2">
                                    <span className="text-gray-500">Energy Level</span>
                                    <span className="font-semibold capitalize text-gray-900">{pet.energy_level?.replace(/_/g, ' ')}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-50 pb-2">
                                    <span className="text-gray-500">Maintenance Level</span>
                                    <span className="font-semibold capitalize text-gray-900">
                                        {pet.maintenance_level === 'low' ? '🟢 Low' : pet.maintenance_level === 'high' ? '🟠 High' : '🟡 Medium'}
                                    </span>
                                </div>
                                <div className="flex justify-between pt-0.5">
                                    <span className="text-gray-500">Health &amp; Vaccine</span>
                                    <span className="font-semibold text-gray-900">{pet.health_status || 'Vaccinated'}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* ── 3. Shelter Information ── */}
                        <Card className="border-gray-200 bg-gray-50/50 shadow-2xs">
                            <CardContent className="p-4 space-y-2.5 text-xs text-gray-600">
                                <div className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                                    <Award className="h-4 w-4 text-[#D4A017]" />
                                    Shelter Information
                                </div>
                                <div className="space-y-1.5 pt-1">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                        <span className="font-medium text-gray-800">{pet.shelter.name} &bull; {pet.shelter.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                        <span>{pet.shelter.contact || 'No contact provided'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div>

            {/* ── High-Resolution Photo Zoom Modal ── */}
            <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
                <DialogContent 
                    className="sm:max-w-4xl max-h-[92vh] p-3 bg-black/95 border-neutral-800 text-white flex flex-col items-center justify-center overflow-hidden" 
                    showCloseButton={true}
                >
                    <div className="sr-only">
                        <DialogTitle>{pet.name} - Photo Zoom View</DialogTitle>
                    </div>

                    <div className="relative w-full max-h-[82vh] flex items-center justify-center overflow-auto rounded-lg">
                        <img 
                            src={selectedPhoto} 
                            alt={pet.name} 
                            className="max-h-[80vh] w-auto max-w-full object-contain rounded-md shadow-2xl transition-all"
                        />
                    </div>

                    {/* Modal bottom thumbnails */}
                    {pet.photos.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pt-2 pb-1 max-w-full">
                            {pet.photos.map(p => (
                                <button 
                                    key={p.id} 
                                    onClick={() => setSelectedPhoto(p.photo_path)}
                                    className={`h-14 w-14 rounded-lg border-2 overflow-hidden shrink-0 transition-all ${selectedPhoto === p.photo_path ? 'border-[#D4A017] ring-2 ring-[#D4A017]/40' : 'border-neutral-700 opacity-60 hover:opacity-100'}`}
                                >
                                    <img src={p.photo_path} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

