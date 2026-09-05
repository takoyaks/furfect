import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import OnboardingLayout from '@/layouts/onboarding-layout';
import { Home, Activity, Users, Briefcase, Heart, PawPrint, ArrowRight, Lock } from 'lucide-react';

interface Lifestyle {
    housing_type?: string;
    has_aircon?: string;
    outdoor_access?: string;
    activity_level?: string;
    work_schedule?: string;
    household_size?: number;
    household_agrees?: boolean;
    has_children?: string;
    other_pets?: string;
    occupation?: string;
    monthly_income?: string;
    pet_experience?: string;
    health_conditions?: string[];
    preferred_type?: string;
    preferred_size?: string[];
    preferred_gender?: string;
    preferred_coat?: string[];
}

export default function LifestyleQuiz({ 
    lifestyle, 
    isLocked, 
    lockedUntil 
}: { 
    lifestyle: Lifestyle | null;
    isLocked: boolean;
    lockedUntil: string | null;
}) {
    const { data, setData, post, processing, errors } = useForm({
        housing_type: lifestyle?.housing_type || 'apartment',
        has_aircon: lifestyle?.has_aircon || 'stable',
        outdoor_access: lifestyle?.outdoor_access || 'none',
        activity_level: lifestyle?.activity_level || 'moderate',
        work_schedule: lifestyle?.work_schedule || 'office',
        household_size: lifestyle?.household_size || 2,
        household_agrees: lifestyle?.household_agrees ?? true,
        has_children: lifestyle?.has_children || 'none',
        other_pets: lifestyle?.other_pets || 'none',
        occupation: lifestyle?.occupation || '',
        monthly_income: lifestyle?.monthly_income || '20001_40000',
        pet_experience: lifestyle?.pet_experience || 'had_before',
        health_conditions: lifestyle?.health_conditions || [],
        preferred_type: lifestyle?.preferred_type || 'none',
        preferred_size: lifestyle?.preferred_size || [],
        preferred_gender: lifestyle?.preferred_gender || 'none',
        preferred_coat: lifestyle?.preferred_coat || [],
    });

    const handleHealthCheckbox = (val: string, checked: boolean) => {
        let list = [...data.health_conditions];
        if (checked) {
            list.push(val);
        } else {
            list = list.filter(item => item !== val);
        }
        setData('health_conditions', list);
    };

    const handlePreferredSize = (val: string, checked: boolean) => {
        let list = [...data.preferred_size];
        if (checked) {
            list.push(val);
        } else {
            list = list.filter(item => item !== val);
        }
        setData('preferred_size', list);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('onboarding.lifestyle.store'));
    };

    return (
        <OnboardingLayout currentStep={2}>
            <Head title="Lifestyle Profile" />
                {isLocked && (
                    <Alert className="mb-6 bg-amber-50 border-amber-300">
                        <Lock className="h-4 w-4 text-amber-700" />
                        <AlertTitle className="text-amber-800 font-semibold">Lifestyle Profile Locked</AlertTitle>
                        <AlertDescription className="text-amber-700 text-sm">
                            Your lifestyle profile is locked until{' '}
                            <strong>{lockedUntil ? new Date(lockedUntil).toLocaleDateString() : ''}</strong>. 
                            Changes can only be made once every 3 months to ensure matching integrity.
                        </AlertDescription>
                    </Alert>
                )}

                <Card className="border-[#D4A017]/20 shadow-lg">
                    <CardHeader className="bg-[#F5EDD7]/50 border-b border-[#D4A017]/10">
                        <div className="text-sm font-semibold text-[#D4A017] mb-1">Step 2 of 2 - Lifestyle Profile</div>
                        <CardTitle className="text-2xl font-bold text-[#444]">Tell Us About Your Lifestyle</CardTitle>
                        <CardDescription>Your answers help our Decision Support System calculate compatibility with available pets.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            
                            {/* Section 1: Living Situation */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                                    <h3 className="font-semibold text-lg text-[#D4A017] flex items-center gap-2"><Home className="size-5" /> Section 1: Living Situation</h3>
                                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold uppercase">High Weight</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>What type of house do you live in? *</Label>
                                        <Select disabled={isLocked} value={data.housing_type} onValueChange={val => setData('housing_type', val)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="house_with_yard">House with yard</SelectItem>
                                                <SelectItem value="apartment">Apartment</SelectItem>
                                                <SelectItem value="condo">Condo</SelectItem>
                                                <SelectItem value="house_no_yard">House without yard</SelectItem>
                                                <SelectItem value="rented_room">Rented room / boarding</SelectItem>
                                                <SelectItem value="rural">Rural / Farm</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Does your home have air conditioning? *</Label>
                                        <Select disabled={isLocked} value={data.has_aircon} onValueChange={val => setData('has_aircon', val)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="stable">Yes, stable aircon</SelectItem>
                                                <SelectItem value="sometimes">Yes, but only sometimes</SelectItem>
                                                <SelectItem value="none_electric">No aircon, uses electric fan</SelectItem>
                                                <SelectItem value="none_natural">No aircon, natural ventilation</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Does your home have secure outdoor access? *</Label>
                                        <Select disabled={isLocked} value={data.outdoor_access} onValueChange={val => setData('outdoor_access', val)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="fully_fenced">Yes, fully fenced yard</SelectItem>
                                                <SelectItem value="not_fenced">Yes, but not fenced</SelectItem>
                                                <SelectItem value="none">No outdoor access / yard</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Daily Lifestyle */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                                    <h3 className="font-semibold text-lg text-[#D4A017] flex items-center gap-2"><Activity className="size-5" /> Section 2: Daily Lifestyle</h3>
                                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold uppercase">High Weight</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>What is your activity level? *</Label>
                                        <Select disabled={isLocked} value={data.activity_level} onValueChange={val => setData('activity_level', val)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="very_light">Very light (mostly at home)</SelectItem>
                                                <SelectItem value="light">Light (occasional walks)</SelectItem>
                                                <SelectItem value="moderate">Moderate (regular exercise)</SelectItem>
                                                <SelectItem value="very_active">Very active (sporty / outdoors)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>What is your work/daily schedule? *</Label>
                                        <Select disabled={isLocked} value={data.work_schedule} onValueChange={val => setData('work_schedule', val)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="wfh">Work from home / Stay at home</SelectItem>
                                                <SelectItem value="office">Office hours (regular 8-5)</SelectItem>
                                                <SelectItem value="shifting">Shifting / irregular hours</SelectItem>
                                                <SelectItem value="student">Student</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Household */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                                    <h3 className="font-semibold text-lg text-[#D4A017]"><Users className="size-5" /> Section 3: Household</h3>
                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold uppercase">Medium Weight</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="household_size">How many people live in your household? *</Label>
                                        <Input 
                                            id="household_size" 
                                            type="number"
                                            disabled={isLocked}
                                            value={data.household_size} 
                                            onChange={e => setData('household_size', parseInt(e.target.value) || 1)} 
                                            required 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Do all household members agree to adopt? *</Label>
                                        <Select disabled={isLocked} value={data.household_agrees ? 'yes' : 'no'} onValueChange={val => setData('household_agrees', val === 'yes')}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="yes">Yes, everyone agrees</SelectItem>
                                                <SelectItem value="no">Not yet discussed / disagreements</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Children at home? *</Label>
                                        <Select disabled={isLocked} value={data.has_children} onValueChange={val => setData('has_children', val)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No children</SelectItem>
                                                <SelectItem value="young">Young children (below 7)</SelectItem>
                                                <SelectItem value="older">Older children (7-12)</SelectItem>
                                                <SelectItem value="teenagers">Teenagers (13+)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Other pets at home? *</Label>
                                        <Select disabled={isLocked} value={data.other_pets} onValueChange={val => setData('other_pets', val)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No other pets</SelectItem>
                                                <SelectItem value="dogs">Yes, other dogs</SelectItem>
                                                <SelectItem value="cats">Yes, other cats</SelectItem>
                                                <SelectItem value="both">Both dogs and cats</SelectItem>
                                                <SelectItem value="mixed">Mixed pets</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Financial Capacity */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                                    <h3 className="font-semibold text-lg text-[#D4A017]"><Briefcase className="size-5" /> Section 4: Financial Capacity</h3>
                                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold uppercase">High Weight</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="occupation">Occupation / Source of income *</Label>
                                        <Input 
                                            id="occupation" 
                                            disabled={isLocked}
                                            value={data.occupation} 
                                            onChange={e => setData('occupation', e.target.value)} 
                                            required 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Monthly household income range *</Label>
                                        <Select disabled={isLocked} value={data.monthly_income} onValueChange={val => setData('monthly_income', val)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="below_10000">Below ₱10,000</SelectItem>
                                                <SelectItem value="10000_20000">₱10,000 - ₱20,000</SelectItem>
                                                <SelectItem value="20001_40000">₱20,001 - ₱40,000</SelectItem>
                                                <SelectItem value="40001_60000">₱40,001 - ₱60,000</SelectItem>
                                                <SelectItem value="60001_100000">₱60,001 - ₱100,000</SelectItem>
                                                <SelectItem value="above_100000">Above ₱100,000</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Pet ownership experience *</Label>
                                        <Select disabled={isLocked} value={data.pet_experience} onValueChange={val => setData('pet_experience', val)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="first_time">First-time owner</SelectItem>
                                                <SelectItem value="had_before">Had pets before (not currently)</SelectItem>
                                                <SelectItem value="currently_have">Currently have pets</SelectItem>
                                                <SelectItem value="experienced_multiple">Experienced / multiple pets</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 5: Health Considerations */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                                    <h3 className="font-semibold text-lg text-[#D4A017]"><Heart className="size-5" /> Section 5: Health Considerations</h3>
                                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold uppercase">High Weight</span>
                                </div>
                                <div className="space-y-2">
                                    <Label>Do you or anyone in your household have any of the following? (Select all that apply) *</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                        {[
                                            { val: 'asthma', label: 'Asthma / Respiratory issues' },
                                            { val: 'fur_allergy', label: 'Pet fur / dander allergy' },
                                            { val: 'skin_allergy', label: 'Skin allergies / Dermatitis' },
                                            { val: 'immunocompromised', label: 'Immunocompromised condition' },
                                            { val: 'anxiety', label: 'Anxiety / Animal phobia' },
                                            { val: 'noise_sensitive', label: 'Sensitive to noise/loud barking' },
                                        ].map(item => (
                                            <div key={item.val} className="flex items-center space-x-2">
                                                <Checkbox 
                                                    id={item.val} 
                                                    disabled={isLocked}
                                                    checked={data.health_conditions.includes(item.val)}
                                                    onCheckedChange={checked => handleHealthCheckbox(item.val, !!checked)}
                                                />
                                                <Label htmlFor={item.val} className="cursor-pointer font-normal">{item.label}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Section 6: Soft Preferences */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                                    <h3 className="font-semibold text-lg text-[#D4A017] flex items-center gap-2"><PawPrint className="size-5" /> Section 6: Pet Preferences</h3>
                                    <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-bold uppercase">Low Weight</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="preferred_type">Preferred Pet Type</Label>
                                        <Select disabled={isLocked} value={data.preferred_type} onValueChange={val => setData('preferred_type', val)}>
                                            <SelectTrigger id="preferred_type" className="focus:ring-[#D4A017]"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="dog">Dog</SelectItem>
                                                <SelectItem value="cat">Cat</SelectItem>
                                                <SelectItem value="none">No preference</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.preferred_type && <p className="text-destructive text-xs">{errors.preferred_type}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="preferred_gender">Preferred Pet Gender</Label>
                                        <Select disabled={isLocked} value={data.preferred_gender} onValueChange={val => setData('preferred_gender', val)}>
                                            <SelectTrigger id="preferred_gender" className="focus:ring-[#D4A017]"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No preference / Any</SelectItem>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.preferred_gender && <p className="text-destructive text-xs">{errors.preferred_gender}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Preferred Size</Label>
                                        <div className="flex gap-4 mt-2.5">
                                            {['small', 'medium', 'large'].map(sz => (
                                                <div key={sz} className="flex items-center space-x-2">
                                                    <Checkbox 
                                                        id={`sz-${sz}`} 
                                                        disabled={isLocked}
                                                        checked={data.preferred_size.includes(sz)}
                                                        onCheckedChange={checked => handlePreferredSize(sz, !!checked)}
                                                        className="border-amber-400 data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017]"
                                                    />
                                                    <Label htmlFor={`sz-${sz}`} className="cursor-pointer font-normal capitalize text-sm">{sz}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-[#D4A017]/10">
                                <Button 
                                    type="button" 
                                    onClick={() => history.back()} 
                                    variant="outline"
                                >
                                    ← Back
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={processing || isLocked}
                                    className="bg-[#D4A017] hover:bg-[#B8860B] text-white font-semibold transition flex items-center gap-2"
                                >
                                    {processing ? 'Saving...' : <>Submit & View My Matches <ArrowRight className="size-4" /></>}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
        </OnboardingLayout>
    );
}
