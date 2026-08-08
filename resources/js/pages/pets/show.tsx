import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Check, ShieldAlert, Award, Calendar, Phone, Heart, Sparkles, MapPin } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';

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
    energy_level: string;
    adoption_fee: string;
    health_status: string;
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
    living_score: number;
    health_score: number;
    financial_score: number;
    activity_score: number;
    household_score: number;
    preference_score: number;
    match_reasons: string[];
    mismatch_reasons: string[];
}

export default function PetShow({ 
    pet, 
    dssData, 
    isSaved,
    hasActiveApplication
}: { 
    pet: Pet; 
    dssData: DssData | null; 
    isSaved: boolean;
    hasActiveApplication: boolean;
}) {
    const [selectedPhoto, setSelectedPhoto] = useState(pet.photos[0]?.photo_path || '/placeholder-pet.png');

    const handleApply = () => {
        router.post(route('application.store'), { pet_id: pet.id });
    };

    const handleSaveToggle = () => {
        router.post(route('saved-pets.toggle'), { pet_id: pet.id }, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Browse Pets', href: route('pets.index') }, { title: pet.name, href: '#' }]}>
            <Head title={pet.name} />
            <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Pictures and Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="space-y-4">
                            {/* Primary photo preview */}
                            <div className="h-[400px] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                <img 
                                    src={selectedPhoto} 
                                    alt={pet.name} 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            
                            {/* Thumbnails list */}
                            {pet.photos.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {pet.photos.map(p => (
                                        <button 
                                            key={p.id} 
                                            onClick={() => setSelectedPhoto(p.photo_path)}
                                            className={`h-20 w-20 rounded border-2 overflow-hidden flex-shrink-0 ${selectedPhoto === p.photo_path ? 'border-[#D4A017]' : 'border-transparent'}`}
                                        >
                                            <img src={p.photo_path} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pet Description */}
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-gray-800">Meet {pet.name}</h2>
                            <div className="flex flex-wrap gap-2 py-2">
                                {pet.temperament && pet.temperament.map(tag => (
                                    <span key={tag} className="text-xs bg-[#F5EDD7] text-[#D4A017] font-semibold px-3 py-1 rounded-full capitalize">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <p className="text-gray-600 text-sm whitespace-pre-line pt-2">{pet.description}</p>
                        </div>
                    </div>

                    {/* Sidebar Match Engine Info & Action Card */}
                    <div className="space-y-6">
                        
                        {/* DSS Matching Card */}
                        {dssData ? (
                            <Card className={`border-2 ${dssData.total_score >= 60 ? 'border-green-200' : 'border-red-200'} shadow-lg`}>
                                <CardHeader className={`${dssData.total_score >= 60 ? 'bg-green-50/50' : 'bg-red-50/50'} border-b border-gray-100`}>
                                    <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-1.5">
                                        <Sparkles className="h-5 w-5 text-[#D4A017]" />
                                        Compatibility Analysis
                                    </CardTitle>
                                    <CardDescription>Generated by our Decision Support System.</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-semibold text-gray-700">Lifestyle Fit Score:</span>
                                            <span className={`text-lg font-bold ${dssData.total_score >= 60 ? 'text-green-600' : 'text-red-500'}`}>
                                                {Math.round(dssData.total_score)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full ${dssData.total_score >= 60 ? 'bg-green-500' : 'bg-red-400'}`}
                                                style={{ width: `${dssData.total_score}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Mismatch Warning */}
                                    {dssData.total_score < 60 && (
                                        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                                            <ShieldAlert className="h-4 w-4 text-red-600" />
                                            <AlertTitle className="font-bold">Not in top DSS matches</AlertTitle>
                                            <AlertDescription className="text-xs text-red-700">
                                                Applying for this pet may reduce approval chances due to compatibility gaps.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {/* Justification details */}
                                    <div className="space-y-2 pt-2 border-t border-gray-100">
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase">Analysis breakdown</h4>
                                        {dssData.match_reasons.slice(0, 3).map((reason, i) => (
                                            <div key={i} className="flex items-start gap-1.5 text-xs text-green-700">
                                                <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                                <span>{reason}</span>
                                            </div>
                                        ))}
                                        {dssData.mismatch_reasons.slice(0, 3).map((reason, i) => (
                                            <div key={i} className="flex items-start gap-1.5 text-xs text-red-700">
                                                <ShieldAlert className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                                                <span>{reason}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border-gray-200 shadow-md">
                                <CardHeader className="bg-gray-50/50">
                                    <CardTitle className="text-sm font-bold text-gray-700">See if this is a match</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 text-center space-y-4">
                                    <p className="text-xs text-gray-500">Log in and complete your lifestyle quiz to view compatibility score analyses.</p>
                                    <Link href={route('onboarding.personal.edit')}>
                                        <Button className="w-full bg-[#D4A017] hover:bg-[#B8860B] text-white">Start Onboarding</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        )}

                        {/* Pet specifications table */}
                        <Card className="border-gray-200 shadow-md">
                            <CardContent className="p-5 space-y-4">
                                <h3 className="font-bold text-md text-gray-800 border-b border-gray-100 pb-2">Pet Details</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between border-b border-gray-50 pb-1">
                                        <span className="text-gray-500">Species</span>
                                        <span className="font-semibold capitalize">{pet.species}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 pb-1">
                                        <span className="text-gray-500">Breed</span>
                                        <span className="font-semibold capitalize">{pet.breed}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 pb-1">
                                        <span className="text-gray-500">Age</span>
                                        <span className="font-semibold">{pet.age_years} Year(s)</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 pb-1">
                                        <span className="text-gray-500">Gender</span>
                                        <span className="font-semibold capitalize">{pet.gender}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 pb-1">
                                        <span className="text-gray-500">Size</span>
                                        <span className="font-semibold capitalize">{pet.size}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 pb-1">
                                        <span className="text-gray-500">Health</span>
                                        <span className="font-semibold">{pet.health_status || 'Vaccinated'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Adoption Fee</span>
                                        <span className="font-semibold text-[#D4A017]">
                                            {parseFloat(pet.adoption_fee) === 0 ? 'Free' : `₱${parseFloat(pet.adoption_fee).toLocaleString()}`}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Shelter details card */}
                        <Card className="border-gray-200 bg-gray-50/50">
                            <CardContent className="p-4 space-y-3 text-xs text-gray-600">
                                <div className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                                    <Award className="h-4 w-4 text-[#D4A017]" />
                                    Shelter Information
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> <span>{pet.shelter.name} — {pet.shelter.location}</span></div>
                                    <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> <span>{pet.shelter.contact}</span></div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action buttons */}
                        <div className="grid grid-cols-4 gap-2">
                            <Button 
                                onClick={handleSaveToggle} 
                                variant="outline" 
                                className="col-span-1 border-gray-200"
                            >
                                <Heart className={`h-5 w-5 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                            </Button>
                            <Button 
                                onClick={handleApply}
                                disabled={hasActiveApplication || pet.status !== 'available'}
                                className="col-span-3 bg-[#D4A017] hover:bg-[#B8860B] text-white font-semibold"
                            >
                                {hasActiveApplication ? 'Application Active' : 'Apply for Adoption'}
                            </Button>
                        </div>

                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
