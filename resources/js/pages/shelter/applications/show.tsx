import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Sparkles, Check, ShieldAlert, Award, FileText } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

interface Application {
    id: number;
    reference_number: string;
    dss_score: string;
    status: string;
    adopter: {
        name: string;
        email: string;
        adopter_profile?: {
            full_name: string;
            contact_number: string;
            date_of_birth: string;
            home_address: string;
            valid_id_type: string;
            valid_id_number: string;
            had_pets_before: string;
            previous_pet_notes: string;
            surrendered_pet: boolean;
            adoption_reason: string;
            adoption_reason_text: string;
            pet_stay: string;
        };
        lifestyle_profile?: {
            housing_type: string;
            has_aircon: string;
            outdoor_access: string;
            activity_level: string;
            work_schedule: string;
            household_size: number;
            household_agrees: boolean;
            has_children: string;
            other_pets: string;
            occupation: string;
            monthly_income: string;
            pet_experience: string;
            health_conditions: string[];
        };
    };
    pet: {
        name: string;
        species: string;
        breed: string;
        age_years: number;
        gender: string;
        size: string;
        energy_level: string;
        shelter: { name: string };
    };
}

export default function ShelterApplicationShow({ application }: { application: Application }) {
    const { data, setData, patch, processing, errors } = useForm({
        decision: 'suitable',
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('shelter.applications.update', application.id));
    };

    const isProcessed = application.status !== 'pending' && application.status !== 'under_review';
    const profile = application.adopter.adopter_profile;
    const lifestyle = application.adopter.lifestyle_profile;

    return (
        <AppLayout breadcrumbs={[
            { title: 'Review Applications', href: route('shelter.applications.index') },
            { title: application.reference_number, href: '#' }
        ]}>
            <Head title={`Review: ${application.reference_number}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                
                <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Review Application</h2>
                        <p className="text-xs text-gray-500">{application.reference_number} • {application.adopter.name} applying for {application.pet.name}</p>
                    </div>
                    <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full uppercase font-bold">
                        {application.status.replace(/_/g, ' ')}
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Applicant details */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* DSS Match Card */}
                        <Card className="border-[#D4A017]/20 shadow-md">
                            <CardHeader className="bg-[#F5EDD7]/30 border-b border-[#D4A017]/10">
                                <CardTitle className="text-md font-bold text-gray-800 flex items-center gap-1.5">
                                    <Sparkles className="h-5 w-5 text-[#D4A017]" />
                                    DSS Match Score Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-semibold text-gray-700">Lifestyle Fit Score:</span>
                                        <span className="text-lg font-bold text-[#D4A017]">{Math.round(parseFloat(application.dss_score))}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div className="h-2 rounded-full bg-[#D4A017]" style={{ width: `${application.dss_score}%` }} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Personal Info details */}
                        {profile && (
                            <Card className="border-gray-200 shadow-md">
                                <CardHeader>
                                    <CardTitle className="text-md font-bold text-gray-800">Applicant Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-gray-500 block">Full Name:</span>
                                            <span className="font-semibold">{profile.full_name}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block">Contact:</span>
                                            <span className="font-semibold">{profile.contact_number}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block">Email:</span>
                                            <span className="font-semibold">{application.adopter.email}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block">Address:</span>
                                            <span className="font-semibold">{profile.home_address}</span>
                                        </div>
                                    </div>

                                    {lifestyle && (
                                        <div className="border-t border-gray-100 pt-4 space-y-3">
                                            <h4 className="font-bold text-gray-700">Lifestyle Details</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                <div>
                                                    <span className="text-gray-500 block text-xs">Housing type:</span>
                                                    <span className="font-semibold capitalize text-sm">{lifestyle.housing_type.replace(/_/g, ' ')}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500 block text-xs">Air Conditioning:</span>
                                                    <span className="font-semibold capitalize text-sm">{lifestyle.has_aircon.replace(/_/g, ' ')}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500 block text-xs">Outdoor Access:</span>
                                                    <span className="font-semibold capitalize text-sm">{lifestyle.outdoor_access.replace(/_/g, ' ')}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500 block text-xs">Activity Level:</span>
                                                    <span className="font-semibold capitalize text-sm">{lifestyle.activity_level.replace(/_/g, ' ')}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500 block text-xs">Income Range:</span>
                                                    <span className="font-semibold capitalize text-sm">{lifestyle.monthly_income.replace(/_/g, ' ')}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500 block text-xs">Kids:</span>
                                                    <span className="font-semibold capitalize text-sm">{lifestyle.has_children.replace(/_/g, ' ')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {profile.previous_pet_notes && (
                                        <div className="border-t border-gray-100 pt-4">
                                            <span className="text-gray-500 block">Previous Pet Notes:</span>
                                            <p className="italic text-gray-600 mt-1">"{profile.previous_pet_notes}"</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                    </div>

                    {/* Decision column */}
                    <div>
                        <Card className="border-gray-200 shadow-md">
                            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                                <CardTitle className="text-md font-bold text-gray-800 flex items-center gap-1">
                                    <FileText className="h-4.5 w-4.5 text-gray-600" />
                                    Staff Decision
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {isProcessed ? (
                                    <div className="space-y-4 text-sm">
                                        <div className="p-3 bg-gray-50 rounded border border-gray-100">
                                            <div className="font-bold text-gray-700">Decision Recorded:</div>
                                            <div className="capitalize font-semibold text-[#D4A017] mt-1">{application.staff_decision?.replace(/_/g, ' ')}</div>
                                        </div>
                                        {application.staff_notes && (
                                            <div>
                                                <div className="font-bold text-gray-700">Notes:</div>
                                                <p className="text-gray-600 mt-1 italic">"{application.staff_notes}"</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="space-y-3">
                                            <Label>Mark suitable or not *</Label>
                                            
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-green-100 bg-green-50/20 hover:bg-green-50/50 cursor-pointer transition">
                                                    <input 
                                                        type="radio" 
                                                        name="decision" 
                                                        value="suitable" 
                                                        checked={data.decision === 'suitable'}
                                                        onChange={e => setData('decision', e.target.value)}
                                                        className="text-[#D4A017] focus:ring-[#D4A017]"
                                                    />
                                                    <div className="text-xs">
                                                        <span className="font-bold text-green-800 block">Suitable</span>
                                                        <span className="text-green-600">Forward to MAO for final audit.</span>
                                                    </div>
                                                </label>
                                                
                                                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-red-100 bg-red-50/20 hover:bg-red-50/50 cursor-pointer transition">
                                                    <input 
                                                        type="radio" 
                                                        name="decision" 
                                                        value="not_suitable" 
                                                        checked={data.decision === 'not_suitable'}
                                                        onChange={e => setData('decision', e.target.value)}
                                                        className="text-[#D4A017] focus:ring-[#D4A017]"
                                                    />
                                                    <div className="text-xs">
                                                        <span className="font-bold text-red-800 block">Not Suitable</span>
                                                        <span className="text-red-600">Send rejection notice to applicant.</span>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="notes">Notes / Remarks</Label>
                                            <textarea 
                                                id="notes" 
                                                value={data.notes} 
                                                onChange={e => setData('notes', e.target.value)}
                                                className="w-full min-h-[100px] p-2 border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A017] text-xs"
                                                placeholder="Add notes for MAO or rejection reason..."
                                            />
                                        </div>

                                        <Button 
                                            type="submit" 
                                            disabled={processing}
                                            className="w-full bg-[#D4A017] hover:bg-[#B8860B] text-white font-semibold transition"
                                        >
                                            {processing ? 'Submitting...' : 'Submit Decision'}
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
