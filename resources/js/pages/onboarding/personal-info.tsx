import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

import OnboardingLayout from '@/layouts/onboarding-layout';
import { TermsAndPoliciesModal } from '@/components/terms-and-policies-modal';

interface Profile {
    full_name?: string;
    contact_number?: string;
    date_of_birth?: string;
    home_address?: string;
    valid_id_type?: string;
    valid_id_number?: string;
    had_pets_before?: string;
    previous_pet_notes?: string;
    surrendered_pet?: boolean;
    adoption_reason?: string;
    adoption_reason_text?: string;
    pet_stay?: string;
}

export default function PersonalInfo({ profile }: { profile: Profile | null }) {
    const { data, setData, post, processing, errors } = useForm({
        full_name: profile?.full_name || '',
        contact_number: profile?.contact_number || '',
        date_of_birth: profile?.date_of_birth || '',
        home_address: profile?.home_address || '',
        valid_id_type: profile?.valid_id_type || '',
        valid_id_number: profile?.valid_id_number || '',
        had_pets_before: profile?.had_pets_before || 'never',
        previous_pet_notes: profile?.previous_pet_notes || '',
        surrendered_pet: profile?.surrendered_pet || false,
        adoption_reason: profile?.adoption_reason || 'Companionship',
        adoption_reason_text: profile?.adoption_reason_text || '',
        pet_stay: profile?.pet_stay || 'inside',
        terms_read: false,
        info_confirmed: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('onboarding.personal.store'));
    };

    return (
        <OnboardingLayout currentStep={1}>
            <Head title="Personal Information — Onboarding" />
            <Card className="border-[#D4A017]/20 shadow-lg">
                    <CardHeader className="bg-[#F5EDD7]/50 border-b border-[#D4A017]/10">
                        <div className="text-sm font-semibold text-[#D4A017] mb-1">Step 1 of 2 - Personal Information</div>
                        <CardTitle className="text-2xl font-bold text-[#444]">Welcome to FurFect Match!</CardTitle>
                        <CardDescription>Let's start with your basic information. Fill it once and it stays on your account for all future applications.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name">Full Name *</Label>
                                    <Input 
                                        id="full_name" 
                                        value={data.full_name} 
                                        onChange={e => setData('full_name', e.target.value)} 
                                        required 
                                        className="focus-visible:ring-[#D4A017]"
                                    />
                                    {errors.full_name && <p className="text-red-500 text-xs">{errors.full_name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contact_number">Contact Number *</Label>
                                    <Input 
                                        id="contact_number" 
                                        value={data.contact_number} 
                                        onChange={e => setData('contact_number', e.target.value)} 
                                        required
                                        className="focus-visible:ring-[#D4A017]"
                                    />
                                    {errors.contact_number && <p className="text-red-500 text-xs">{errors.contact_number}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date_of_birth">Date of Birth *</Label>
                                    <Input 
                                        id="date_of_birth" 
                                        type="date"
                                        value={data.date_of_birth} 
                                        onChange={e => setData('date_of_birth', e.target.value)} 
                                        required
                                        className="focus-visible:ring-[#D4A017]"
                                    />
                                    {errors.date_of_birth && <p className="text-red-500 text-xs">{errors.date_of_birth}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="valid_id_type">Valid ID Type *</Label>
                                    <Select 
                                        value={data.valid_id_type} 
                                        onValueChange={val => setData('valid_id_type', val)}
                                    >
                                        <SelectTrigger className="focus:ring-[#D4A017]">
                                            <SelectValue placeholder="Select your valid ID" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="National ID">National ID</SelectItem>
                                            <SelectItem value="Drivers License">Driver's License</SelectItem>
                                            <SelectItem value="Passport">Passport</SelectItem>
                                            <SelectItem value="UMID">UMID</SelectItem>
                                            <SelectItem value="SSS/GSIS ID">SSS/GSIS ID</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.valid_id_type && <p className="text-red-500 text-xs">{errors.valid_id_type}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="valid_id_number">ID Number *</Label>
                                    <Input 
                                        id="valid_id_number" 
                                        value={data.valid_id_number} 
                                        onChange={e => setData('valid_id_number', e.target.value)} 
                                        required
                                        className="focus-visible:ring-[#D4A017]"
                                    />
                                    {errors.valid_id_number && <p className="text-red-500 text-xs">{errors.valid_id_number}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pet_stay">Where will the pet primarily stay? *</Label>
                                    <Select 
                                        value={data.pet_stay} 
                                        onValueChange={val => setData('pet_stay', val)}
                                    >
                                        <SelectTrigger className="focus:ring-[#D4A017]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="inside">Inside the house</SelectItem>
                                            <SelectItem value="outdoors">Outdoors / Yard</SelectItem>
                                            <SelectItem value="both">Both indoors and outdoors</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.pet_stay && <p className="text-red-500 text-xs">{errors.pet_stay}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="home_address">Complete Home Address *</Label>
                                <Input 
                                    id="home_address" 
                                    value={data.home_address} 
                                    onChange={e => setData('home_address', e.target.value)} 
                                    required
                                    className="focus-visible:ring-[#D4A017]"
                                />
                                {errors.home_address && <p className="text-red-500 text-xs">{errors.home_address}</p>}
                            </div>

                            <div className="border-t border-[#D4A017]/10 pt-4 space-y-4">
                                <h3 className="font-semibold text-lg text-[#444]">Pet Ownership History</h3>
                                <div className="space-y-2">
                                    <Label>Have you owned a pet before? *</Label>
                                    <div className="flex gap-4">
                                        {['currently_have', 'had_before', 'never'].map(opt => (
                                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="had_pets_before" 
                                                    value={opt} 
                                                    checked={data.had_pets_before === opt}
                                                    onChange={e => setData('had_pets_before', e.target.value)}
                                                    className="text-[#D4A017] focus:ring-[#D4A017]"
                                                />
                                                <span className="capitalize">{opt.replace('_', ' ')}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {data.had_pets_before !== 'never' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="previous_pet_notes">If yes, what happened to your previous pet(s)?</Label>
                                        <Input 
                                            id="previous_pet_notes" 
                                            value={data.previous_pet_notes} 
                                            onChange={e => setData('previous_pet_notes', e.target.value)} 
                                            placeholder="e.g., Still with me, passed away naturally, etc."
                                            className="focus-visible:ring-[#D4A017]"
                                        />
                                    </div>
                                )}

                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="surrendered_pet" 
                                        checked={data.surrendered_pet} 
                                        onCheckedChange={checked => setData('surrendered_pet', !!checked)}
                                    />
                                    <Label htmlFor="surrendered_pet" className="cursor-pointer">Have you ever surrendered a pet to a shelter? *</Label>
                                </div>
                            </div>

                            <div className="border-t border-[#D4A017]/10 pt-4 space-y-4">
                                <h3 className="font-semibold text-lg text-[#444]">Reason for Adoption</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="adoption_reason">Primary reason for adopting a pet *</Label>
                                    <Select 
                                        value={data.adoption_reason} 
                                        onValueChange={val => setData('adoption_reason', val)}
                                    >
                                        <SelectTrigger className="focus:ring-[#D4A017]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Companionship">Companionship</SelectItem>
                                            <SelectItem value="For family/children">For family / children</SelectItem>
                                            <SelectItem value="For security/guard">For security / guard</SelectItem>
                                            <SelectItem value="Emotional Support">Emotional Support</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="adoption_reason_text">Tell us about yourself and why you want to adopt *</Label>
                                    <textarea 
                                        id="adoption_reason_text" 
                                        value={data.adoption_reason_text} 
                                        onChange={e => setData('adoption_reason_text', e.target.value)} 
                                        required
                                        className="w-full min-h-[100px] p-2 border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A017] text-sm"
                                        placeholder="In your own words, why do you think you'd be a good pet owner?"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-[#D4A017]/10 pt-4 space-y-4">
                                <h3 className="font-semibold text-lg text-[#444]">Declaration &amp; Agreement</h3>
                                <div className="space-y-3 bg-[#F5EDD7]/30 border border-[#D4A017]/20 p-4 rounded-lg">
                                    <div className="space-y-1">
                                        <div className="flex items-start space-x-3">
                                            <Checkbox 
                                                id="terms_read" 
                                                checked={data.terms_read} 
                                                onCheckedChange={checked => setData('terms_read', !!checked)}
                                                className="mt-0.5 border-[#D4A017] data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017]"
                                            />
                                            <div className="text-sm text-gray-700">
                                                <Label htmlFor="terms_read" className="cursor-pointer font-medium">
                                                    I have read adoption terms and condition *
                                                </Label>{' '}
                                                <TermsAndPoliciesModal
                                                    trigger={
                                                        <button
                                                            type="button"
                                                            className="font-semibold text-[#D4A017] underline hover:text-[#B8860B] text-xs inline-block ml-1"
                                                        >
                                                            (View Terms &amp; Policies)
                                                        </button>
                                                    }
                                                />
                                            </div>
                                        </div>
                                        {errors.terms_read && <p className="text-red-500 text-xs pl-7">{errors.terms_read}</p>}
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-start space-x-3">
                                            <Checkbox 
                                                id="info_confirmed" 
                                                checked={data.info_confirmed} 
                                                onCheckedChange={checked => setData('info_confirmed', !!checked)}
                                                className="mt-0.5 border-[#D4A017] data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017]"
                                            />
                                            <Label htmlFor="info_confirmed" className="cursor-pointer font-medium text-sm text-gray-700">
                                                I confirm all information are correct *
                                            </Label>
                                        </div>
                                        {errors.info_confirmed && <p className="text-red-500 text-xs pl-7">{errors.info_confirmed}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-[#D4A017]/10">
                                <Button 
                                    type="submit" 
                                    disabled={processing}
                                    className="bg-[#D4A017] hover:bg-[#B8860B] text-white font-semibold transition"
                                >
                                    {processing ? 'Saving...' : 'Next: Lifestyle Quiz →'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
        </OnboardingLayout>
    );
}

