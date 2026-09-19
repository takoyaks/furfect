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
    lockedUntil,
    ekycEnabled = true,
}: { 
    lifestyle: Lifestyle | null;
    isLocked: boolean;
    lockedUntil: string | null;
    ekycEnabled?: boolean;
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
        pet_experience: lifestyle?.pet_experience || 'first_time',
        health_conditions: lifestyle?.health_conditions || [],
        preferred_type: lifestyle?.preferred_type || 'dog',
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

    const handlePreferredCoat = (val: string, checked: boolean) => {
        let list = [...data.preferred_coat];
        if (checked) {
            list.push(val);
        } else {
            list = list.filter(item => item !== val);
        }
        setData('preferred_coat', list);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('onboarding.lifestyle.store'));
    };

    return (
        <OnboardingLayout currentStep={3} ekycEnabled={ekycEnabled}>
            <Head title={ekycEnabled ? "Step 3: Lifestyle Compatibility Quiz - FurFect" : "Step 2: Lifestyle Compatibility Quiz - FurFect"} />
            
            {/* Locked Profile Alert */}
            {isLocked && (
                <Alert className="mb-4 bg-[#FFF78D]/60 border-[#FFBF00] text-[#283F24]">
                    <Lock className="h-4 w-4 text-[#467235]" />
                    <AlertTitle className="text-[#283F24] font-bold">Lifestyle Profile Locked</AlertTitle>
                    <AlertDescription className="text-gray-700 text-xs">
                        Your lifestyle profile is locked until{' '}
                        <strong>{lockedUntil ? new Date(lockedUntil).toLocaleDateString() : ''}</strong>. 
                        Changes can only be made once every 3 months to ensure matching integrity.
                    </AlertDescription>
                </Alert>
            )}

            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#FFFDF0] via-[#FFF78D]/30 to-[#467235]/10 border border-[#467235]/20 rounded-2xl p-5 shadow-xs mb-1">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#283F24] bg-[#FFF78D] px-2.5 py-1 rounded-full border border-[#FFBF00]/50 mb-1.5">
                            <Activity className="size-3.5 text-[#467235]" /> {ekycEnabled ? 'Step 3 of 3 — Lifestyle Compatibility Assessment' : 'Step 2 of 2 — Lifestyle Compatibility Assessment'}
                        </div>
                        <h1 className="text-2xl font-bold text-[#283F24]">Tell Us About Your Lifestyle</h1>
                        <p className="text-sm text-gray-600 mt-0.5">Your answers help our Decision Support System calculate compatibility with shelter pets.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 2-Column Responsive Layout for Desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    
                    {/* LEFT COLUMN: Sections 1, 2, 3 */}
                    <div className="space-y-6">
                        {/* Section 1: Living Situation */}
                        <Card className="border-[#467235]/20 shadow-xs">
                            <CardHeader className="bg-[#FFFDF0] border-b border-[#467235]/15 py-3 px-4 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-sm sm:text-base font-bold text-[#283F24] flex items-center gap-2">
                                    <Home className="size-4 text-[#467235]" /> Section 1: Living Situation
                                </CardTitle>
                                <span className="text-[10px] bg-[#FFF78D] text-[#283F24] border border-[#FFBF00]/50 px-2 py-0.5 rounded-full font-bold uppercase">High Weight</span>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-5 space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-700">What type of house do you live in? *</Label>
                                    <Select disabled={isLocked} value={data.housing_type} onValueChange={val => setData('housing_type', val)}>
                                        <SelectTrigger className="focus:ring-[#467235] text-xs"><SelectValue /></SelectTrigger>
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

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-700">Air conditioning? *</Label>
                                        <Select disabled={isLocked} value={data.has_aircon} onValueChange={val => setData('has_aircon', val)}>
                                            <SelectTrigger className="focus:ring-[#467235] text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="stable">Stable aircon</SelectItem>
                                                <SelectItem value="sometimes">Sometimes</SelectItem>
                                                <SelectItem value="none_electric">Electric fan only</SelectItem>
                                                <SelectItem value="none_natural">Natural ventilation</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-700">Outdoor access? *</Label>
                                        <Select disabled={isLocked} value={data.outdoor_access} onValueChange={val => setData('outdoor_access', val)}>
                                            <SelectTrigger className="focus:ring-[#467235] text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="fully_fenced">Fully fenced yard</SelectItem>
                                                <SelectItem value="not_fenced">Yard (not fenced)</SelectItem>
                                                <SelectItem value="none">No yard / None</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Section 2: Daily Lifestyle */}
                        <Card className="border-[#467235]/20 shadow-xs">
                            <CardHeader className="bg-[#FFFDF0] border-b border-[#467235]/15 py-3 px-4 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-sm sm:text-base font-bold text-[#283F24] flex items-center gap-2">
                                    <Activity className="size-4 text-[#467235]" /> Section 2: Daily Lifestyle
                                </CardTitle>
                                <span className="text-[10px] bg-[#FFF78D] text-[#283F24] border border-[#FFBF00]/50 px-2 py-0.5 rounded-full font-bold uppercase">High Weight</span>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-5 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-700">Activity Level *</Label>
                                        <Select disabled={isLocked} value={data.activity_level} onValueChange={val => setData('activity_level', val)}>
                                            <SelectTrigger className="focus:ring-[#467235] text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="very_light">Very light (mostly home)</SelectItem>
                                                <SelectItem value="light">Light (occasional walks)</SelectItem>
                                                <SelectItem value="moderate">Moderate (regular exercise)</SelectItem>
                                                <SelectItem value="very_active">Very active (sporty/outdoor)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-700">Work/Daily Schedule *</Label>
                                        <Select disabled={isLocked} value={data.work_schedule} onValueChange={val => setData('work_schedule', val)}>
                                            <SelectTrigger className="focus:ring-[#467235] text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="wfh">Work / Stay at home</SelectItem>
                                                <SelectItem value="office">Office hours (8am - 5pm)</SelectItem>
                                                <SelectItem value="shifting">Shifting / irregular hours</SelectItem>
                                                <SelectItem value="student">Student</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Section 3: Household */}
                        <Card className="border-[#467235]/20 shadow-xs">
                            <CardHeader className="bg-[#FFFDF0] border-b border-[#467235]/15 py-3 px-4 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-sm sm:text-base font-bold text-[#283F24] flex items-center gap-2">
                                    <Users className="size-4 text-[#467235]" /> Section 3: Household
                                </CardTitle>
                                <span className="text-[10px] bg-[#FFF78D]/60 text-[#283F24] border border-[#FFBF00]/30 px-2 py-0.5 rounded-full font-bold uppercase">Medium Weight</span>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-5 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="household_size" className="text-xs font-semibold text-gray-700">Household Members *</Label>
                                        <Input 
                                            id="household_size" 
                                            type="number"
                                            min="1"
                                            disabled={isLocked}
                                            value={data.household_size} 
                                            onChange={e => setData('household_size', parseInt(e.target.value) || 1)} 
                                            required 
                                            className="focus-visible:ring-[#467235] text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-700">Members Agree to Adopt? *</Label>
                                        <Select disabled={isLocked} value={data.household_agrees ? 'yes' : 'no'} onValueChange={val => setData('household_agrees', val === 'yes')}>
                                            <SelectTrigger className="focus:ring-[#467235] text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="yes">Yes, everyone agrees</SelectItem>
                                                <SelectItem value="no">Not yet discussed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-700">Children at home? *</Label>
                                        <Select disabled={isLocked} value={data.has_children} onValueChange={val => setData('has_children', val)}>
                                            <SelectTrigger className="focus:ring-[#467235] text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No children</SelectItem>
                                                <SelectItem value="young">Young children (&lt; 7)</SelectItem>
                                                <SelectItem value="older">Older children (7-12)</SelectItem>
                                                <SelectItem value="teenagers">Teenagers (13+)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-700">Other pets at home? *</Label>
                                        <Select disabled={isLocked} value={data.other_pets} onValueChange={val => setData('other_pets', val)}>
                                            <SelectTrigger className="focus:ring-[#467235] text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No other pets</SelectItem>
                                                <SelectItem value="dogs">Yes, other dogs</SelectItem>
                                                <SelectItem value="cats">Yes, other cats</SelectItem>
                                                <SelectItem value="both">Both dogs & cats</SelectItem>
                                                <SelectItem value="mixed">Mixed pets</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: Sections 4, 5, 6 */}
                    <div className="space-y-6">
                        {/* Section 4: Financial Capacity */}
                        <Card className="border-[#467235]/20 shadow-xs">
                            <CardHeader className="bg-[#FFFDF0] border-b border-[#467235]/15 py-3 px-4 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-sm sm:text-base font-bold text-[#283F24] flex items-center gap-2">
                                    <Briefcase className="size-4 text-[#467235]" /> Section 4: Financial Capacity
                                </CardTitle>
                                <span className="text-[10px] bg-[#FFF78D] text-[#283F24] border border-[#FFBF00]/50 px-2 py-0.5 rounded-full font-bold uppercase">High Weight</span>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-5 space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="occupation" className="text-xs font-semibold text-gray-700">Occupation / Source of Income *</Label>
                                    <Input 
                                        id="occupation" 
                                        disabled={isLocked}
                                        value={data.occupation} 
                                        onChange={e => setData('occupation', e.target.value)} 
                                        required 
                                        placeholder="e.g. Teacher, Freelancer, Business Owner"
                                        className="focus-visible:ring-[#467235] text-xs"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-700">Monthly Income Range *</Label>
                                        <Select disabled={isLocked} value={data.monthly_income} onValueChange={val => setData('monthly_income', val)}>
                                            <SelectTrigger className="focus:ring-[#467235] text-xs"><SelectValue /></SelectTrigger>
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
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-700">Pet Experience *</Label>
                                        <Select disabled={isLocked} value={data.pet_experience} onValueChange={val => setData('pet_experience', val)}>
                                            <SelectTrigger className="focus:ring-[#467235] text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="first_time">First-time owner</SelectItem>
                                                <SelectItem value="had_before">Had pets before</SelectItem>
                                                <SelectItem value="currently_have">Currently have pets</SelectItem>
                                                <SelectItem value="experienced_multiple">Experienced / Multi-pet</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Section 5: Health Considerations */}
                        <Card className="border-[#467235]/20 shadow-xs">
                            <CardHeader className="bg-[#FFFDF0] border-b border-[#467235]/15 py-3 px-4 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-sm sm:text-base font-bold text-[#283F24] flex items-center gap-2">
                                    <Heart className="size-4 text-[#467235]" /> Section 5: Health Considerations
                                </CardTitle>
                                <span className="text-[10px] bg-[#FFF78D] text-[#283F24] border border-[#FFBF00]/50 px-2 py-0.5 rounded-full font-bold uppercase">High Weight</span>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-5 space-y-3">
                                <Label className="text-xs font-semibold text-gray-700">Do you or household members have any of the following?</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                    {[
                                        { val: 'asthma', label: 'Asthma / Respiratory' },
                                        { val: 'fur_allergy', label: 'Pet fur / dander allergy' },
                                        { val: 'skin_allergy', label: 'Skin allergies / Dermatitis' },
                                        { val: 'immunocompromised', label: 'Immunocompromised' },
                                        { val: 'anxiety', label: 'Animal phobia / Anxiety' },
                                        { val: 'noise_sensitive', label: 'Sensitive to loud barking' },
                                    ].map(item => (
                                        <div key={item.val} className="flex items-center space-x-2 bg-[#FFFDF0] p-2 rounded-lg border border-[#467235]/15">
                                            <Checkbox 
                                                id={item.val} 
                                                disabled={isLocked}
                                                checked={data.health_conditions.includes(item.val)}
                                                onCheckedChange={checked => handleHealthCheckbox(item.val, !!checked)}
                                                className="data-[state=checked]:bg-[#467235] data-[state=checked]:border-[#467235]"
                                            />
                                            <Label htmlFor={item.val} className="cursor-pointer font-normal text-xs text-gray-700">{item.label}</Label>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Section 6: Soft Preferences */}
                        <Card className="border-[#467235]/20 shadow-xs">
                            <CardHeader className="bg-[#FFFDF0] border-b border-[#467235]/15 py-3 px-4 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-sm sm:text-base font-bold text-[#283F24] flex items-center gap-2">
                                    <PawPrint className="size-4 text-[#467235]" /> Section 6: Pet Preferences
                                </CardTitle>
                                <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-bold uppercase">Low Weight</span>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-5 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="preferred_type" className="text-xs font-semibold text-gray-700">Preferred Type</Label>
                                        <Select disabled={isLocked} value={data.preferred_type} onValueChange={val => setData('preferred_type', val)}>
                                            <SelectTrigger id="preferred_type" className="focus:ring-[#467235] text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="dog">Dog</SelectItem>
                                                <SelectItem value="cat">Cat</SelectItem>
                                                <SelectItem value="none">No preference</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="preferred_gender" className="text-xs font-semibold text-gray-700">Preferred Gender</Label>
                                        <Select disabled={isLocked} value={data.preferred_gender} onValueChange={val => setData('preferred_gender', val)}>
                                            <SelectTrigger id="preferred_gender" className="focus:ring-[#467235] text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Any / No preference</SelectItem>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-1.5 pt-1">
                                    <Label className="text-xs font-semibold text-gray-700">Preferred Size</Label>
                                    <div className="flex flex-wrap gap-4 pt-1">
                                        {['small', 'medium', 'large'].map(sz => (
                                            <div key={sz} className="flex items-center space-x-2">
                                                <Checkbox 
                                                    id={`sz-${sz}`} 
                                                    disabled={isLocked}
                                                    checked={data.preferred_size.includes(sz)}
                                                    onCheckedChange={checked => handlePreferredSize(sz, !!checked)}
                                                    className="data-[state=checked]:bg-[#467235] data-[state=checked]:border-[#467235]"
                                                />
                                                <Label htmlFor={`sz-${sz}`} className="cursor-pointer font-normal capitalize text-xs text-gray-700">{sz}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1.5 pt-1 border-t border-gray-100">
                                    <Label className="text-xs font-semibold text-gray-700">Preferred Coat / Color</Label>
                                    <div className="flex flex-wrap gap-3 pt-1">
                                        {[
                                            { val: 'black', label: 'Black' },
                                            { val: 'white', label: 'White' },
                                            { val: 'brown', label: 'Brown' },
                                            { val: 'mixed', label: 'Multi / Mixed' },
                                            { val: 'golden', label: 'Golden / Cream' },
                                        ].map(color => (
                                            <div key={color.val} className="flex items-center space-x-1.5">
                                                <Checkbox 
                                                    id={`color-${color.val}`} 
                                                    disabled={isLocked}
                                                    checked={data.preferred_coat.includes(color.val)}
                                                    onCheckedChange={checked => handlePreferredCoat(color.val, !!checked)}
                                                    className="data-[state=checked]:bg-[#467235] data-[state=checked]:border-[#467235]"
                                                />
                                                <Label htmlFor={`color-${color.val}`} className="cursor-pointer font-normal text-xs text-gray-700">{color.label}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* BOTTOM FULL-WIDTH: Action Footer */}
                <Card className="border-[#467235]/20 shadow-xs bg-[#FFFDF0]/60">
                    <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <Button 
                            type="button" 
                            onClick={() => history.back()} 
                            variant="outline"
                            className="w-full sm:w-auto border-[#467235]/30 text-[#283F24] hover:bg-[#FFF78D]/30 text-xs px-5 cursor-pointer"
                        >
                            ← Back to Personal Info
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={processing || isLocked}
                            className="w-full sm:w-auto bg-[#467235] hover:bg-[#283F24] text-white font-semibold transition-all px-6 py-2.5 shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {processing ? 'Processing DSS Scoring...' : <>Submit &amp; View My Matches <ArrowRight className="size-4" /></>}
                        </Button>
                    </CardContent>
                </Card>
            </form>
        </OnboardingLayout>
    );
}
