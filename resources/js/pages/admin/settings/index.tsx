import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Settings, ShieldCheck } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

interface Setting {
    id: number;
    key: string;
    value: string;
    type: string;
    label: string;
    description: string;
}

export default function AdminSettings({ settings }: { settings: Setting[] }) {
    // Populate form data dynamically
    const initialData: Record<string, string> = {};
    settings.forEach(s => {
        initialData[s.key] = s.value;
    });

    const { data, setData, patch, processing } = useForm(initialData);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('admin.settings.update'));
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'System Settings', href: '#' }]}>
            <Head title="System Configuration Settings" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                
                <Card className="border-[#D4A017]/20 shadow-md">
                    <CardHeader className="bg-[#F5EDD7]/50 border-b border-[#D4A017]/10 flex flex-row items-center gap-2">
                        <Settings className="h-5 w-5 text-[#D4A017]" />
                        <div>
                            <CardTitle className="text-lg font-bold text-gray-800">System Configuration</CardTitle>
                            <CardDescription>Adjust limits, cooldown intervals, and DSS compatibility parameters.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            
                            <div className="space-y-4">
                                {settings.map(setting => (
                                    <div key={setting.id} className="space-y-1.5 p-3 rounded border border-gray-100 bg-gray-50/20">
                                        <div className="flex justify-between items-center">
                                            <Label htmlFor={setting.key} className="font-bold text-gray-700 text-sm">{setting.label}</Label>
                                            <Input 
                                                id={setting.key}
                                                type={setting.type === 'integer' ? 'number' : 'text'}
                                                value={data[setting.key] || ''}
                                                onChange={e => setData(setting.key, e.target.value)}
                                                className="w-32 text-right focus-visible:ring-[#D4A017]"
                                                required
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400">{setting.description}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end pt-4 border-t border-gray-100">
                                <Button 
                                    type="submit" 
                                    disabled={processing}
                                    className="bg-[#D4A017] hover:bg-[#B8860B] text-white font-semibold transition flex items-center gap-1.5"
                                >
                                    <ShieldCheck className="h-4.5 w-4.5" />
                                    {processing ? 'Saving...' : 'Save Settings'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

            </div>
        </AppLayout>
    );
}
