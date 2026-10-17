import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Settings,
    Save,
    Sliders,
    Clock,
    ShieldCheck,
    FileSignature,
    FileText,
    Building2,
    CheckCircle2,
    AlertCircle,
    RotateCcw,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { RichTextEditor } from '@/components/rich-text-editor';
import { CertificateSignatoriesDialog } from '@/components/certificate-signatories-dialog';
import { type CertificateSignatory } from '@/components/adoption-certificate';
import { toast } from 'sonner';

interface Setting {
    id: number;
    key: string;
    value: string;
    type: string;
    label: string;
    description: string;
}

interface AdminSettingsProps {
    settings: Setting[];
    signatories?: CertificateSignatory[];
}

export default function AdminSettings({ settings = [], signatories: initialSignatories = [] }: AdminSettingsProps) {
    const [signatories, setSignatories] = useState<CertificateSignatory[]>(initialSignatories);
    const [isSignatoriesDialogOpen, setIsSignatoriesDialogOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<'all' | 'policies' | 'features' | 'signatories' | 'branding' | 'legal'>('all');

    // Populate form data dynamically
    const initialData: Record<string, string> = {};
    settings.forEach((s) => {
        initialData[s.key] = s.value ?? '';
    });

    const { data, setData, patch, processing, recentlySuccessful } = useForm(initialData);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('admin.settings.update'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('System configuration saved successfully.');
            },
        });
    };

    // Setting group keys
    const policyKeys = [
        'adopter_adoption_cooldown_months',
        'reapply_cooldown_days',
        'max_active_applications',
        'pickup_schedule_days',
        'dss_minimum_score',
        'lifestyle_lock_months',
    ];

    const featureKeys = [
        'ekyc_enabled',
        'pricing_enabled',
        'client_adoption_certificate_enabled',
    ];

    const brandingKeys = [
        'app_name',
        'shelter_name',
        'mao_office_name',
        'featured_pets_count',
    ];

    const legalKeys = [
        'consent_agreement_label',
        'terms_and_conditions_content',
        'shelter_policies_content',
    ];

    const policySettings = settings.filter((s) => policyKeys.includes(s.key));
    const featureSettings = settings.filter((s) => featureKeys.includes(s.key));
    const brandingSettings = settings.filter((s) => brandingKeys.includes(s.key));
    const legalSettings = settings.filter((s) => legalKeys.includes(s.key));
    const otherSettings = settings.filter(
        (s) =>
            !policyKeys.includes(s.key) &&
            !featureKeys.includes(s.key) &&
            !brandingKeys.includes(s.key) &&
            !legalKeys.includes(s.key)
    );

    const renderSettingInput = (setting: Setting) => {
        if (setting.type === 'boolean') {
            const isChecked = data[setting.key] === '1';
            return (
                <div
                    key={setting.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-[#D4A017]/30 transition"
                >
                    <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2">
                            <Label
                                htmlFor={setting.key}
                                className="font-bold text-gray-800 text-sm cursor-pointer"
                            >
                                {setting.label}
                            </Label>
                            <Badge
                                variant={isChecked ? 'default' : 'secondary'}
                                className={
                                    isChecked
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold'
                                        : 'bg-gray-200 text-gray-600 text-[11px]'
                                }
                            >
                                {isChecked ? 'Active' : 'Disabled'}
                            </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{setting.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Switch
                            id={setting.key}
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                                setData(setting.key, checked ? '1' : '0')
                            }
                            className="data-[state=checked]:bg-[#D4A017]"
                        />
                    </div>
                </div>
            );
        }

        if (setting.type === 'text') {
            return (
                <div
                    key={setting.id}
                    className="space-y-2 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-[#D4A017]/30 transition"
                >
                    <div>
                        <Label htmlFor={setting.key} className="font-bold text-gray-800 text-sm">
                            {setting.label}
                        </Label>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{setting.description}</p>
                    </div>
                    <RichTextEditor
                        id={setting.key}
                        value={data[setting.key] || ''}
                        onChange={(val) => setData(setting.key, val)}
                        placeholder="Enter custom agreement or policy content with rich formatting, or leave empty for default..."
                        minHeight="220px"
                    />
                </div>
            );
        }

        if (setting.type === 'integer') {
            return (
                <div
                    key={setting.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-[#D4A017]/30 transition"
                >
                    <div className="flex-1 pr-4">
                        <Label htmlFor={setting.key} className="font-bold text-gray-800 text-sm">
                            {setting.label}
                        </Label>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{setting.description}</p>
                    </div>
                    <div className="shrink-0">
                        <Input
                            id={setting.key}
                            type="number"
                            value={data[setting.key] ?? ''}
                            onChange={(e) => setData(setting.key, e.target.value)}
                            className="w-32 text-right font-medium focus-visible:ring-[#D4A017] border-gray-300"
                            required
                        />
                    </div>
                </div>
            );
        }

        // Generic string
        return (
            <div
                key={setting.id}
                className="space-y-1.5 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-[#D4A017]/30 transition"
            >
                <Label htmlFor={setting.key} className="font-bold text-gray-800 text-sm">
                    {setting.label}
                </Label>
                <Input
                    id={setting.key}
                    type="text"
                    value={data[setting.key] ?? ''}
                    onChange={(e) => setData(setting.key, e.target.value)}
                    className="focus-visible:ring-[#D4A017] border-gray-300 font-medium"
                    required
                />
                <p className="text-xs text-gray-500 leading-relaxed">{setting.description}</p>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'System Settings', href: route('admin.settings.index') }]}>
            <Head title="System Configuration Settings" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 max-w-7xl mx-auto w-full">
                {/* Header banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#F5EDD7] via-amber-50 to-[#FAF6EE] p-5 rounded-2xl border border-[#D4A017]/30 shadow-xs">
                    <div className="flex items-center gap-3.5">
                        <div className="h-12 w-12 rounded-xl bg-[#D4A017] text-white flex items-center justify-center shadow-xs">
                            <Settings className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 tracking-tight">System Configuration</h1>
                            <p className="text-xs text-gray-600 mt-0.5">
                                Manage operational limits, cooldown intervals, DSS compatibility parameters, digital signatories, and feature toggles.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleSubmit}
                            disabled={processing}
                            className="bg-[#D4A017] hover:bg-[#B8860B] text-white text-xs font-bold h-9 shadow-xs flex items-center gap-1.5"
                        >
                            <Save className="size-3.5" />
                            {processing ? 'Saving...' : 'Save All Changes'}
                        </Button>
                    </div>
                </div>

                {/* Filter Navigation Tabs */}
                <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
                    <button
                        type="button"
                        onClick={() => setActiveSection('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            activeSection === 'all'
                                ? 'bg-gray-900 text-white shadow-xs'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <Sliders className="size-3.5" />
                        All Settings ({settings.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection('policies')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            activeSection === 'policies'
                                ? 'bg-[#D4A017] text-white shadow-xs'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <Clock className="size-3.5" />
                        Adoption & Cooldowns ({policySettings.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection('features')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            activeSection === 'features'
                                ? 'bg-[#D4A017] text-white shadow-xs'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <ShieldCheck className="size-3.5" />
                        Feature Toggles ({featureSettings.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection('signatories')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            activeSection === 'signatories'
                                ? 'bg-[#D4A017] text-white shadow-xs'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <FileSignature className="size-3.5" />
                        Certificate Signatories ({signatories.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection('branding')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            activeSection === 'branding'
                                ? 'bg-[#D4A017] text-white shadow-xs'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <Building2 className="size-3.5" />
                        Organization & Branding ({brandingSettings.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection('legal')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            activeSection === 'legal'
                                ? 'bg-[#D4A017] text-white shadow-xs'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <FileText className="size-3.5" />
                        Legal Policies & Agreements ({legalSettings.length})
                    </button>
                </div>

                {/* Empty State Fallback if no settings */}
                {settings.length === 0 && (
                    <Card className="border-amber-200 bg-amber-50/50 p-8 text-center">
                        <AlertCircle className="size-12 text-amber-500 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-gray-800">No System Settings Found</h3>
                        <p className="text-xs text-gray-600 max-w-md mx-auto mt-1 mb-4">
                            The system configuration table is currently empty. Click below to reload and initialize the default platform settings.
                        </p>
                        <Button
                            onClick={() => router.reload()}
                            className="bg-[#D4A017] hover:bg-[#B8860B] text-white font-bold text-xs"
                        >
                            <RotateCcw className="size-3.5 mr-1.5" />
                            Reload & Seed Settings
                        </Button>
                    </Card>
                )}

                {/* Settings Form */}
                {settings.length > 0 && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 1. Adoption Policies & Cooldown Limits */}
                        {(activeSection === 'all' || activeSection === 'policies') && policySettings.length > 0 && (
                            <Card className="border-gray-200 shadow-xs">
                                <CardHeader className="bg-amber-50/40 border-b border-gray-100 flex flex-row items-center gap-2 py-4">
                                    <Clock className="h-5 w-5 text-[#D4A017]" />
                                    <div>
                                        <CardTitle className="text-base font-bold text-gray-800">
                                            Adoption Policies & Cooldown Intervals
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Configure adopter limitations, re-application cooldowns, and DSS eligibility thresholds.
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-5 space-y-3">
                                    {policySettings.map(renderSettingInput)}
                                </CardContent>
                            </Card>
                        )}

                        {/* 2. Feature Toggles */}
                        {(activeSection === 'all' || activeSection === 'features') && featureSettings.length > 0 && (
                            <Card className="border-gray-200 shadow-xs">
                                <CardHeader className="bg-amber-50/40 border-b border-gray-100 flex flex-row items-center gap-2 py-4">
                                    <ShieldCheck className="h-5 w-5 text-[#D4A017]" />
                                    <div>
                                        <CardTitle className="text-base font-bold text-gray-800">
                                            Platform Feature Toggles
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Enable or disable core system modules such as eKYC verification and public pricing display.
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-5 space-y-3">
                                    {featureSettings.map(renderSettingInput)}
                                </CardContent>
                            </Card>
                        )}

                        {/* 3. Adoption Certificate Signatories Overview Card */}
                        {(activeSection === 'all' || activeSection === 'signatories') && (
                            <Card className="border-gray-200 shadow-xs">
                                <CardHeader className="bg-amber-50/40 border-b border-gray-100 flex flex-row items-center justify-between py-4">
                                    <div className="flex items-center gap-2">
                                        <FileSignature className="h-5 w-5 text-[#D4A017]" />
                                        <div>
                                            <CardTitle className="text-base font-bold text-gray-800">
                                                Official Adoption Certificate Signatories
                                            </CardTitle>
                                            <CardDescription className="text-xs">
                                                Configurable signatories printed on official certificates. Supports up to 4 signatories with digital signature images.
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() => setIsSignatoriesDialogOpen(true)}
                                        size="sm"
                                        className="bg-[#D4A017] hover:bg-[#B8860B] text-white text-xs font-bold shrink-0"
                                    >
                                        <FileSignature className="size-3.5 mr-1.5" />
                                        Configure Signatories
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {signatories.map((sig, idx) => (
                                            <div
                                                key={sig.id || idx}
                                                className={`p-3.5 rounded-xl border transition ${
                                                    sig.enabled
                                                        ? 'border-amber-200 bg-amber-50/20'
                                                        : 'border-gray-200 bg-gray-50/50 opacity-60'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                        Signatory #{idx + 1}
                                                    </span>
                                                    <Badge
                                                        variant={sig.enabled ? 'default' : 'secondary'}
                                                        className={
                                                            sig.enabled
                                                                ? 'bg-emerald-600 text-white text-[10px] font-semibold h-4 px-1.5'
                                                                : 'bg-gray-200 text-gray-500 text-[10px] h-4 px-1.5'
                                                        }
                                                    >
                                                        {sig.enabled ? 'Enabled' : 'Disabled'}
                                                    </Badge>
                                                </div>

                                                <p className="text-xs font-bold text-gray-800 truncate" title={sig.name}>
                                                    {sig.name || 'Untitled Signatory'}
                                                </p>
                                                <p className="text-[11px] text-gray-500 truncate" title={sig.position || sig.title}>
                                                    {sig.position || sig.title || 'No position specified'}
                                                </p>

                                                <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                                                    <span className="text-gray-400 text-[10px]">Digital Signature</span>
                                                    {sig.signature_url ? (
                                                        <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                                                            <CheckCircle2 className="size-3" /> Attached
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 italic text-[10px]">None</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* 4. Organization & Branding */}
                        {(activeSection === 'all' || activeSection === 'branding') && brandingSettings.length > 0 && (
                            <Card className="border-gray-200 shadow-xs">
                                <CardHeader className="bg-amber-50/40 border-b border-gray-100 flex flex-row items-center gap-2 py-4">
                                    <Building2 className="h-5 w-5 text-[#D4A017]" />
                                    <div>
                                        <CardTitle className="text-base font-bold text-gray-800">
                                            Organization & Application Branding
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Customize application labels, partner shelter naming, and public catalog settings.
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-5 space-y-3">
                                    {brandingSettings.map(renderSettingInput)}
                                </CardContent>
                            </Card>
                        )}

                        {/* 5. Legal Policies & Agreements */}
                        {(activeSection === 'all' || activeSection === 'legal') && legalSettings.length > 0 && (
                            <Card className="border-gray-200 shadow-xs">
                                <CardHeader className="bg-amber-50/40 border-b border-gray-100 flex flex-row items-center gap-2 py-4">
                                    <FileText className="h-5 w-5 text-[#D4A017]" />
                                    <div>
                                        <CardTitle className="text-base font-bold text-gray-800">
                                            Terms, Policies & Onboarding Disclaimers
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Configure rich text terms and conditions, adoption agreements, and registration consent disclaimers.
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-5 space-y-4">
                                    {legalSettings.map(renderSettingInput)}
                                </CardContent>
                            </Card>
                        )}

                        {/* 6. Other / Custom Settings */}
                        {(activeSection === 'all') && otherSettings.length > 0 && (
                            <Card className="border-gray-200 shadow-xs">
                                <CardHeader className="bg-amber-50/40 border-b border-gray-100 flex flex-row items-center gap-2 py-4">
                                    <Sliders className="h-5 w-5 text-[#D4A017]" />
                                    <div>
                                        <CardTitle className="text-base font-bold text-gray-800">
                                            Additional Parameters
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Other customizable system properties and parameters.
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-5 space-y-3">
                                    {otherSettings.map(renderSettingInput)}
                                </CardContent>
                            </Card>
                        )}

                        {/* Bottom sticky save bar */}
                        <div className="sticky bottom-4 z-10 flex items-center justify-between p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-lg">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                {recentlySuccessful ? (
                                    <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                                        <CheckCircle2 className="size-4" /> Changes saved successfully!
                                    </span>
                                ) : (
                                    <span>Adjusted parameters take effect immediately upon saving.</span>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-[#D4A017] hover:bg-[#B8860B] text-white font-bold text-xs h-9 px-6 shadow-xs flex items-center gap-1.5"
                            >
                                <Save className="size-4" />
                                {processing ? 'Saving...' : 'Save Configuration'}
                            </Button>
                        </div>
                    </form>
                )}
            </div>

            {/* Certificate Signatories Dialog */}
            <CertificateSignatoriesDialog
                open={isSignatoriesDialogOpen}
                onOpenChange={setIsSignatoriesDialogOpen}
                signatories={signatories}
                onSignatoriesUpdated={(updated) => {
                    setSignatories(updated);
                    setIsSignatoriesDialogOpen(false);
                }}
            />
        </AppLayout>
    );
}
