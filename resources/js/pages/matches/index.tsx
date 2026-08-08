import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check, ShieldAlert, Award, FileText } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

interface Match {
    id: number;
    total_score: number;
    living_score: number;
    health_score: number;
    financial_score: number;
    activity_score: number;
    household_score: number;
    preference_score: number;
    match_reasons: string[];
    mismatch_reasons: string[];
    pet: {
        id: number;
        name: string;
        species: string;
        age_years: number;
        gender: string;
        size: string;
        energy_level: string;
        adoption_fee: string;
        description: string;
        photos?: { photo_path: string; is_primary: boolean }[];
        shelter: { name: string };
    };
}

export default function MatchesIndex({ 
    matches, 
    hasProfile, 
    lifestyle 
}: { 
    matches: Match[]; 
    hasProfile: boolean; 
    lifestyle: any;
}) {
    if (!hasProfile) {
        return (
            <AppLayout breadcrumbs={[{ title: 'My Matches', href: '#' }]}>
                <Head title="My Matches" />
                <div className="max-w-2xl mx-auto py-12 px-4 text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-[#D4A017] mb-4" />
                    <h2 className="text-2xl font-bold text-[#444] mb-2">No Lifestyle Profile Found</h2>
                    <p className="text-gray-600 mb-6">You must complete your lifestyle profile quiz before we can calculate your pet matches.</p>
                    <Link href={route('onboarding.personal.edit')}>
                        <Button className="bg-[#D4A017] hover:bg-[#B8860B] text-white">Start Onboarding →</Button>
                    </Link>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'My Matches', href: '#' }]}>
            <Head title="My Matches" />
            <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
                
                {/* Header Profile Summary */}
                <Card className="border-[#D4A017]/20 shadow-md">
                    <CardHeader className="bg-[#F5EDD7]/50 flex flex-row items-center justify-between flex-wrap gap-4 border-b border-[#D4A017]/10">
                        <div>
                            <CardTitle className="text-xl font-bold text-[#444]">Your Lifestyle Profile Summary</CardTitle>
                            <CardDescription>Based on these details, our rule-based DSS ranks the best pets for your situation.</CardDescription>
                        </div>
                        <Link href={route('onboarding.lifestyle.edit')}>
                            <Button variant="outline" className="border-[#D4A017] text-[#D4A017] hover:bg-[#D4A017]/10">
                                Edit Profile
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500 block">Housing:</span>
                                <span className="font-semibold capitalize">{lifestyle.housing_type.replace(/_/g, ' ')}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block">Schedule:</span>
                                <span className="font-semibold capitalize">{lifestyle.work_schedule.replace(/_/g, ' ')}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block">Activity Level:</span>
                                <span className="font-semibold capitalize">{lifestyle.activity_level.replace(/_/g, ' ')}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block">Household Size:</span>
                                <span className="font-semibold">{lifestyle.household_size} Person(s)</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* DSS Criteria Weights */}
                <Card className="border-[#D4A017]/20 shadow-md">
                    <CardHeader className="border-b border-[#D4A017]/10 bg-gray-50/50">
                        <CardTitle className="text-lg font-bold text-[#444] flex items-center gap-2">
                            <Award className="h-5 w-5 text-[#D4A017]" />
                            DSS Weighted Criteria Breakdown
                        </CardTitle>
                        <CardDescription>Weights determine the impact of each criteria when calculating compatibility score.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        {[
                            { name: 'Living Situation', wt: '25%', desc: 'Housing size, aircon, and fenced yard access.' },
                            { name: 'Health Considerations', wt: '20%', desc: 'Pet allergies, skin sensitivity, and asthma checks.' },
                            { name: 'Financial Capacity', wt: '20%', desc: 'Occupation status and capability to handle pet expenses.' },
                            { name: 'Activity Level & Schedule', wt: '15%', desc: 'Daily hours home, work type, and alignment with pet energy.' },
                            { name: 'Household Composition', wt: '10%', desc: 'Presence of kids or other domestic animals.' },
                            { name: 'Pet Preferences', wt: '10%', desc: 'Soft size, gender, and color preferences filters.' },
                        ].map(c => (
                            <div key={c.name} className="flex justify-between items-center text-sm gap-4">
                                <div className="flex-1">
                                    <div className="font-semibold text-gray-700">{c.name}</div>
                                    <div className="text-xs text-gray-500">{c.desc}</div>
                                </div>
                                <div className="text-right font-bold text-[#D4A017] w-12">{c.wt}</div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Top Matches Results */}
                <div>
                    <h3 className="text-2xl font-bold text-[#444] mb-6 flex items-center gap-2">
                        <FileText className="h-6 w-6 text-[#D4A017]" />
                        Your Top Matched Pets
                    </h3>
                    
                    {matches.length === 0 ? (
                        <p className="text-gray-500">No matching pets available at this moment. Check back soon!</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {matches.map((match, index) => {
                                const photo = match.pet.photos?.find(p => p.is_primary)?.photo_path || '/placeholder-pet.png';
                                return (
                                    <Card key={match.id} className="border-[#D4A017]/20 overflow-hidden shadow-lg flex flex-col justify-between">
                                        <div>
                                            <div className="relative h-48 bg-gray-100">
                                                <img 
                                                    src={photo} 
                                                    alt={match.pet.name} 
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-3 left-3 bg-[#D4A017] text-white text-xs font-bold px-2 py-1 rounded-full">
                                                    #{index + 1} Best Match
                                                </div>
                                                <div className="absolute top-3 right-3 bg-[#F5EDD7] border border-[#D4A017] text-[#D4A017] text-sm font-bold px-2 py-1 rounded-md">
                                                    {Math.round(match.total_score)}% Match
                                                </div>
                                            </div>
                                            
                                            <div className="p-5 space-y-4">
                                                <div>
                                                    <h4 className="text-xl font-bold text-gray-800">{match.pet.name}</h4>
                                                    <p className="text-xs text-gray-500 capitalize">{match.pet.age_years} yrs • {match.pet.gender} • {match.pet.size} • {match.pet.species}</p>
                                                </div>

                                                {/* Match justifications list */}
                                                <div className="space-y-2">
                                                    {match.match_reasons.slice(0, 3).map((r, i) => (
                                                        <div key={i} className="flex items-start gap-2 text-xs text-green-700 bg-green-50/50 p-2 rounded">
                                                            <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                                            <span>{r}</span>
                                                        </div>
                                                    ))}
                                                    {match.mismatch_reasons.slice(0, 1).map((r, i) => (
                                                        <div key={i} className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50/50 p-2 rounded">
                                                            <ShieldAlert className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                                            <span>{r}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-5 pt-0 grid grid-cols-2 gap-2 border-t border-gray-100 mt-4 pt-4">
                                            <Link href={route('pets.show', match.pet.id)}>
                                                <Button variant="outline" className="w-full text-[#444] border-gray-200">View Details</Button>
                                            </Link>
                                            <Link href={route('pets.show', match.pet.id)}>
                                                <Button className="w-full bg-[#D4A017] hover:bg-[#B8860B] text-white">Apply</Button>
                                            </Link>
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
