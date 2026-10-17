import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Upload, Trash2, Plus, Loader2, Image as ImageIcon, CheckCircle, RefreshCcw } from 'lucide-react';
import { type CertificateSignatory } from '@/components/adoption-certificate';
import { toast } from 'sonner';

interface CertificateSignatoriesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    signatories: CertificateSignatory[];
    onSignatoriesUpdated: (signatories: CertificateSignatory[]) => void;
    title?: string;
    description?: string;
}

export function CertificateSignatoriesDialog({
    open,
    onOpenChange,
    signatories: initialSignatories,
    onSignatoriesUpdated,
    title,
    description,
}: CertificateSignatoriesDialogProps) {
    const [signatories, setSignatories] = useState<CertificateSignatory[]>(() => {
        return initialSignatories && initialSignatories.length > 0 ? initialSignatories : [
            {
                id: 'mao_officer',
                title: 'Municipal Agriculture Office (MAO)',
                name: 'Municipal Agriculture Office Staff',
                position: 'Municipal Agriculture Office (MAO)',
                signature_url: '',
                enabled: true,
            },
            {
                id: 'shelter_head',
                title: 'Releasing Facility Head / Veterinarian',
                name: 'Shelter Officer-in-Charge',
                position: 'Releasing Facility Head / Veterinarian',
                signature_url: '',
                enabled: true,
            },
            {
                id: 'adopter',
                title: 'Registered Legal Custodian',
                name: '{adopterName}',
                position: 'Registered Legal Custodian',
                signature_url: '',
                enabled: true,
            },
        ];
    });

    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRefs = React.useRef<{ [key: number]: HTMLInputElement | null }>({});

    const getCsrfToken = () => {
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        if (meta?.content) {
            return meta.content;
        }
        const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
        return match ? decodeURIComponent(match[1]) : '';
    };

    const handleFieldChange = (index: number, field: keyof CertificateSignatory, value: any) => {
        setSignatories((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const handleSignatureUpload = async (index: number, file: File) => {
        setUploadingIndex(index);
        const currentUrl = signatories[index]?.signature_url;
        const formData = new FormData();
        formData.append('signature', file);
        if (currentUrl) {
            formData.append('old_signature_url', currentUrl);
        }

        try {
            const csrfToken = getCsrfToken();
            const res = await fetch('/certificate-signatories/upload-signature', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
                body: formData,
            });

            const data = await res.json();
            if (res.ok && data.url) {
                handleFieldChange(index, 'signature_url', data.url);
                toast.success('Signature image uploaded successfully.');
            } else {
                toast.error(data.message || 'Failed to upload signature image.');
            }
        } catch (e: any) {
            console.error(e);
            toast.error('Network error uploading signature.');
        } finally {
            setUploadingIndex(null);
        }
    };

    const handleRemoveSignature = async (index: number) => {
        const url = signatories[index]?.signature_url;
        if (!url) return;

        handleFieldChange(index, 'signature_url', '');

        try {
            const csrfToken = getCsrfToken();
            await fetch('/certificate-signatories/delete-signature', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ signature_url: url }),
            });
            toast.success('Signature image removed successfully.');
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddSignatory = () => {
        if (signatories.length >= 4) {
            toast.warning('Maximum 4 signatories allowed on certificate layout.');
            return;
        }

        const newId = `signatory_${Date.now()}`;
        setSignatories((prev) => [
            ...prev,
            {
                id: newId,
                title: 'Attesting Official',
                name: 'Official Signatory Name',
                position: 'Official Title / Designation',
                signature_url: '',
                enabled: true,
            },
        ]);
    };

    const handleRemoveSignatory = async (index: number) => {
        if (signatories.length <= 1) {
            toast.warning('At least 1 signatory must remain configured.');
            return;
        }

        const removed = signatories[index];
        if (removed?.signature_url) {
            try {
                const csrfToken = getCsrfToken();
                await fetch('/certificate-signatories/delete-signature', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({ signature_url: removed.signature_url }),
                });
            } catch (e) {
                console.error(e);
            }
        }

        setSignatories((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const csrfToken = getCsrfToken();
            const res = await fetch('/certificate-signatories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ signatories }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success('Adoption certificate signatories saved successfully.');
                onSignatoriesUpdated(signatories);
                onOpenChange(false);
            } else {
                toast.error(data.message || 'Failed to save signatories.');
            }
        } catch (e) {
            console.error(e);
            toast.error('Error saving signatories.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetDefaults = () => {
        setSignatories([
            {
                id: 'mao_officer',
                title: 'Municipal Agriculture Office (MAO)',
                name: 'Municipal Agriculture Office Staff',
                position: 'Municipal Agriculture Office (MAO)',
                signature_url: '',
                enabled: true,
            },
            {
                id: 'shelter_head',
                title: 'Releasing Facility Head / Veterinarian',
                name: 'Shelter Officer-in-Charge',
                position: 'Releasing Facility Head / Veterinarian',
                signature_url: '',
                enabled: true,
            },
            {
                id: 'adopter',
                title: 'Registered Legal Custodian',
                name: '{adopterName}',
                position: 'Registered Legal Custodian',
                signature_url: '',
                enabled: true,
            },
        ]);
        toast.info('Reset to default signatories layout. Click Save to apply.');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-neutral-900">
                <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-neutral-800 bg-amber-50/50 dark:bg-amber-950/20">
                    <DialogTitle className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {title || 'Configure Document Signatories'}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
                        {description || 'Customize up to 4 signatories. You can edit names, titles, upload official signature images, and toggle them on/off.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            Active Signatories ({signatories.filter((s) => s.enabled).length} of {signatories.length} enabled)
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handleResetDefaults}
                                className="text-xs h-8 gap-1.5 cursor-pointer text-gray-600 hover:text-gray-900"
                            >
                                <RefreshCcw className="w-3.5 h-3.5" />
                                Reset Defaults
                            </Button>
                            {signatories.length < 4 && (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleAddSignatory}
                                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 gap-1 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Signatory
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        {signatories.map((sig, idx) => (
                            <div
                                key={sig.id || idx}
                                className={`p-4 rounded-xl border transition-all ${
                                    sig.enabled
                                        ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/30 dark:bg-amber-950/20'
                                        : 'border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/50 opacity-60'
                                }`}
                            >
                                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-neutral-800 mb-3">
                                    <div className="flex items-center gap-2.5">
                                        <Switch
                                            checked={sig.enabled}
                                            onCheckedChange={(checked) => handleFieldChange(idx, 'enabled', checked)}
                                        />
                                        <div>
                                            <span className="text-xs font-bold text-gray-900 dark:text-white">
                                                Signatory #{idx + 1}: {sig.title || 'Official Signatory'}
                                            </span>
                                            <span className="block text-[10px] text-gray-500">
                                                {sig.enabled ? 'Displayed on document' : 'Disabled (Hidden from document)'}
                                            </span>
                                        </div>
                                    </div>

                                    {signatories.length > 1 && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleRemoveSignatory(idx)}
                                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <Label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                                            Signatory Name
                                        </Label>
                                        <Input
                                            value={sig.name}
                                            onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                                            placeholder="e.g. Dr. Juan Dela Cruz, DVM or {adopterName}"
                                            className="h-8 text-xs bg-white dark:bg-neutral-800"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                            Use <code className="bg-gray-100 dark:bg-neutral-800 px-1 rounded">{'{adopterName}'}</code> to auto-insert adopter's name.
                                        </p>
                                    </div>

                                    <div>
                                        <Label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                                            Official Title / Position
                                        </Label>
                                        <Input
                                            value={sig.position}
                                            onChange={(e) => handleFieldChange(idx, 'position', e.target.value)}
                                            placeholder="e.g. Municipal Agricultural Officer"
                                            className="h-8 text-xs bg-white dark:bg-neutral-800"
                                        />
                                    </div>
                                </div>

                                {/* Signature Image & Cloudinary Upload */}
                                <div className="mt-3 pt-3 border-t border-gray-200/80 dark:border-neutral-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-28 rounded border border-dashed border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex items-center justify-center overflow-hidden relative">
                                            {sig.signature_url ? (
                                                <img
                                                    src={sig.signature_url}
                                                    alt="Signature"
                                                    className="h-full w-full object-contain p-1"
                                                />
                                            ) : (
                                                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                    <ImageIcon className="w-3.5 h-3.5" /> No Image
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 block">
                                                Official Digital Signature
                                            </span>
                                            <span className="text-[10px] text-gray-400 block">
                                                PNG with transparent background recommended.
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            ref={(el) => {
                                                fileInputRefs.current[idx] = el;
                                            }}
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                            className="hidden"
                                            disabled={uploadingIndex === idx}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    handleSignatureUpload(idx, file);
                                                }
                                                e.target.value = '';
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            disabled={uploadingIndex === idx}
                                            onClick={() => fileInputRefs.current[idx]?.click()}
                                            className="h-7 text-xs gap-1.5 cursor-pointer"
                                        >
                                            {uploadingIndex === idx ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    Uploading...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-3.5 h-3.5" />
                                                    {sig.signature_url ? 'Change Signature' : 'Upload Signature'}
                                                </>
                                            )}
                                        </Button>

                                        {sig.signature_url && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleRemoveSignature(idx)}
                                                className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter className="px-6 py-3.5 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50 flex items-center justify-between">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="text-xs h-8 cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 gap-1.5 cursor-pointer font-bold shadow-xs"
                    >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Save Signatories
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
