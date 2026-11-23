import { Head, Link, usePoll } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Clock, Heart, MapPin, Sparkles } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { formatWorkSchedule } from '@/lib/lifestyle-labels';

interface Match {
    id: number;
    pet_id: number;
    matched_at: string | null;
    pet: {
        id: number;
        name: string;
        species: string;
        age_years: number;
        gender: string;
        size: string;
        coat_color?: string | null;
        energy_level: string;
        temperament?: string[];
        adoption_fee: string;
        description: string;
        photos?: { photo_path: string; is_primary: boolean }[];
        shelter: { name: string; location?: string } | null;
    };
}

interface AdoptionCooldown {
    is_restricted: boolean;
    cooldown_months: number;
    approved_date_formatted: string | null;
    eligible_date_formatted: string | null;
    remaining_days: number;
}

export default function MatchesIndex({
    matches,
    hasProfile,
    lifestyle,
    hasActiveApplication = false,
    adoptionCooldown,
}: {
    matches: Match[];
    hasProfile: boolean;
    lifestyle: any;
    hasActiveApplication?: boolean;
    adoptionCooldown?: AdoptionCooldown;
}) {
    usePoll(10000, { only: ['matches'] }, { autoStart: hasProfile });

    const seenPetIdsRef = useRef<Set<number> | null>(null);
    const [newMatchPetIds, setNewMatchPetIds] = useState<number[]>([]);

    useEffect(() => {
        if (!hasProfile) {
            return;
        }

        const currentPetIds = matches.map((m) => m.pet.id);

        if (seenPetIdsRef.current === null) {
            seenPetIdsRef.current = new Set(currentPetIds);
            return;
        }

        const newlyAdded = matches.filter((m) => !seenPetIdsRef.current?.has(m.pet.id));
        if (newlyAdded.length > 0) {
            newlyAdded.forEach((m) => {
                seenPetIdsRef.current?.add(m.pet.id);
                toast.success(`New compatible pet available: ${m.pet.name}!`, {
                    description: `${m.pet.name} (${m.pet.species}, ${m.pet.size}) matches your lifestyle profile.`,
                });
            });
            setNewMatchPetIds((prev) => Array.from(new Set([...prev, ...newlyAdded.map((m) => m.pet.id)])));
        }
    }, [matches, hasProfile]);

    if (!hasProfile) {
        return (
            <AppLayout breadcrumbs={[{ title: 'My Matches', href: '#' }]}>
                <Head title="My Matches" />
                <div className="max-w-2xl mx-auto py-12 px-4 text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-[#D4A017] mb-4" />
                    <h2 className="text-2xl font-bold text-[#444] mb-2">No Lifestyle Profile Found</h2>
                    <p className="text-gray-600 mb-6">
                        You must complete your lifestyle profile quiz before we can find compatible pets for you.
                    </p>
                    <Link href={route('onboarding.personal.edit')}>
                        <Button className="bg-[#D4A017] hover:bg-[#B8860B] text-white">Start Onboarding →</Button>
                    </Link>
                </div>
            </AppLayout>
        );
    }

    const isApplyDisabled = Boolean(adoptionCooldown?.is_restricted || hasActiveApplication);

    return (
        <AppLayout breadcrumbs={[{ title: 'My Matches', href: '#' }]}>
            <Head title="My Matches" />
            <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
                {/* Post-Approval Cooldown Alert */}
                {adoptionCooldown?.is_restricted && (
                    <Alert className="bg-amber-50 border-amber-300 text-amber-900">
                        <Clock className="h-4 w-4 text-[#B8860B]" />
                        <AlertTitle className="font-bold text-amber-950">
                            {adoptionCooldown.cooldown_months}-Month Post-Approval Application Cooldown Active
                        </AlertTitle>
                        <AlertDescription className="text-xs text-amber-800 mt-1">
                            Your previous adoption application was approved on{' '}
                            <strong>{adoptionCooldown.approved_date_formatted}</strong>. To give your companion dedicated care,
                            you can submit a new application starting on{' '}
                            <strong>{adoptionCooldown.eligible_date_formatted}</strong> ({adoptionCooldown.remaining_days} day(s) remaining).
                        </AlertDescription>
                    </Alert>
                )}

                {/* Header Profile Summary */}
                <Card className="border-[#D4A017]/20 shadow-md">
                    <CardHeader className="bg-[#F5EDD7]/50 flex flex-row items-center justify-between flex-wrap gap-4 border-b border-[#D4A017]/10">
                        <div>
                            <CardTitle className="text-xl font-bold text-[#444]">Your Lifestyle Profile Summary</CardTitle>
                            <CardDescription>
                                Based on your home and daily lifestyle profile, here are pets that fit your household.
                            </CardDescription>
                        </div>
                        <Link href={route('onboarding.lifestyle.edit')}>
                            <Button variant="outline" className="border-[#D4A017] text-[#D4A017] hover:bg-[#D4A017]/10">
                                View / Edit Profile
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500 block text-xs">Housing</span>
                                <span className="font-semibold capitalize">{lifestyle?.housing_type?.replace(/_/g, ' ') || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs">Occupation</span>
                                <span className="font-semibold">{lifestyle?.occupation || 'Not specified'}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs">Daily Schedule</span>
                                <span className="font-semibold">
                                    {formatWorkSchedule(lifestyle?.work_schedule, lifestyle?.work_schedule_other)}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs">Activity Level</span>
                                <span className="font-semibold capitalize">{lifestyle?.activity_level?.replace(/_/g, ' ') || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs">Household Size</span>
                                <span className="font-semibold">{lifestyle?.household_size} Person(s)</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Matched Pets Listing (DSS scores & breakdowns hidden for applicants) */}
                <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                        <h3 className="text-2xl font-bold text-[#444] flex items-center gap-2">
                            <Heart className="h-6 w-6 text-[#D4A017]" />
                            Your Recommended Pets
                        </h3>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full w-fit">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            Live match updates active
                        </span>
                    </div>

                    {matches.length === 0 ? (
                        <Card className="border-gray-200 p-8 text-center text-gray-500">
                            No matching pets available at this moment. You will be notified automatically as soon as a compatible pet arrives!
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {matches.map((match) => {
                                const photo = match.pet.photos?.find((p) => p.is_primary)?.photo_path || match.pet.photos?.[0]?.photo_path || '/placeholder-pet.png';
                                const isNewMatch = newMatchPetIds.includes(match.pet.id);

                                return (
                                    <Card key={match.id} className="border-[#D4A017]/20 overflow-hidden shadow-lg flex flex-col justify-between">
                                        <div>
                                            <div className="relative h-48 bg-gray-100">
                                                <img
                                                    src={photo}
                                                    alt={match.pet.name}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-3 left-3 bg-[#D4A017] text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                                                    <Sparkles className="h-3 w-3" />
                                                    Recommended Match
                                                </div>
                                                {isNewMatch && (
                                                    <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                                                        New
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-5 space-y-3">
                                                <div>
                                                    <h4 className="text-xl font-bold text-gray-800">{match.pet.name}</h4>
                                                    <p className="text-xs text-gray-500 capitalize">
                                                        {match.pet.age_years} yrs • {match.pet.gender} • {match.pet.size} • {match.pet.species}
                                                        {match.pet.coat_color ? ` • ${match.pet.coat_color}` : ''}
                                                    </p>
                                                </div>

                                                {match.pet.shelter && (
                                                    <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                                        <MapPin className="h-3.5 w-3.5 text-[#D4A017] shrink-0" />
                                                        <span className="truncate">{match.pet.shelter.name}</span>
                                                    </p>
                                                )}

                                                {match.pet.temperament && match.pet.temperament.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                                        {match.pet.temperament.slice(0, 3).map((tag) => (
                                                            <span
                                                                key={tag}
                                                                className="text-[11px] bg-[#F5EDD7] text-[#B8860B] font-medium px-2.5 py-0.5 rounded-full capitalize"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-5 pt-4 grid grid-cols-2 gap-2 border-t border-gray-100 mt-2">
                                            <Link href={route('pets.show', match.pet.id)}>
                                                <Button variant="outline" className="w-full text-[#444] border-gray-200">
                                                    View Details
                                                </Button>
                                            </Link>
                                            {isApplyDisabled ? (
                                                <Button disabled className="w-full bg-gray-200 text-gray-500 cursor-not-allowed">
                                                    {adoptionCooldown?.is_restricted ? 'Cooldown' : 'Applied'}
                                                </Button>
                                            ) : (
                                                <Link href={route('pets.show', match.pet.id)}>
                                                    <Button className="w-full bg-[#D4A017] hover:bg-[#B8860B] text-white">Apply</Button>
                                                </Link>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
