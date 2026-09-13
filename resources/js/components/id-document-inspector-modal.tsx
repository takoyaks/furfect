import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, RotateCw, ZoomIn, ZoomOut, AlertCircle, ShieldCheck } from 'lucide-react';

interface IdDocumentInspectorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    idType: string;
    idNumber: string;
    applicantName?: string;
    documentUrl: string | null;
    side: 'front' | 'back';
}

export function IdDocumentInspectorModal({
    open,
    onOpenChange,
    title,
    idType,
    idNumber,
    applicantName,
    documentUrl,
    side,
}: IdDocumentInspectorModalProps) {
    const [zoom, setZoom] = useState<number>(1);
    const [rotation, setRotation] = useState<number>(0);
    const [loadError, setLoadError] = useState<boolean>(false);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
    const handleRotate = () => setRotation(prev => (prev + 90) % 360);
    const handleReset = () => {
        setZoom(1);
        setRotation(0);
        setLoadError(false);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) handleReset();
            onOpenChange(val);
        }}>
            <DialogContent className="sm:max-w-4xl max-h-[92vh] p-4 flex flex-col bg-white overflow-hidden shadow-2xl border-gray-200">
                <DialogHeader className="border-b border-gray-100 pb-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap pr-6">
                        <div>
                            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <ShieldCheck className="size-4 text-[#D4A017]" />
                                {title} ({side === 'front' ? 'Front Side' : 'Back Side'})
                            </DialogTitle>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {applicantName ? `${applicantName} • ` : ''}
                                <span className="font-semibold text-gray-700">{idType}</span> — <span className="font-mono text-gray-700">{idNumber}</span>
                            </p>
                        </div>

                        {documentUrl && (
                            <div className="flex items-center gap-1.5">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleZoomOut}
                                    disabled={zoom <= 0.5}
                                    className="h-7 px-2 text-xs"
                                    title="Zoom Out"
                                >
                                    <ZoomOut className="size-3.5" />
                                </Button>
                                <span className="text-[11px] font-mono w-10 text-center text-gray-600">
                                    {Math.round(zoom * 100)}%
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleZoomIn}
                                    disabled={zoom >= 3}
                                    className="h-7 px-2 text-xs"
                                    title="Zoom In"
                                >
                                    <ZoomIn className="size-3.5" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRotate}
                                    className="h-7 px-2 text-xs"
                                    title="Rotate 90°"
                                >
                                    <RotateCw className="size-3.5" />
                                </Button>
                                <a
                                    href={documentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-xs font-semibold text-[#8B6508] bg-[#F5EDD7] hover:bg-[#D4A017]/30 border border-[#D4A017]/30 transition"
                                    title="Open raw image in new tab"
                                >
                                    <ExternalLink className="size-3" />
                                    <span>New Tab</span>
                                </a>
                            </div>
                        )}
                    </div>
                </DialogHeader>

                <div className="relative flex-1 min-h-[360px] max-h-[70vh] bg-neutral-900/5 rounded-xl border border-gray-200 overflow-auto flex items-center justify-center p-4">
                    {documentUrl ? (
                        loadError ? (
                            <div className="text-center p-6 space-y-3">
                                <AlertCircle className="size-8 text-amber-500 mx-auto" />
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-gray-800">Preview not available inline</p>
                                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                                        The document might be a PDF or protected by your browser settings. You can view or download it directly.
                                    </p>
                                </div>
                                <a
                                    href={documentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#D4A017] hover:bg-[#B8860B] transition"
                                >
                                    <ExternalLink className="size-3.5" />
                                    Open Document Directly
                                </a>
                            </div>
                        ) : (
                            <div className="transition-transform duration-150 ease-out flex items-center justify-center">
                                <img
                                    src={documentUrl}
                                    alt={`${idType} ${side}`}
                                    style={{
                                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                        transformOrigin: 'center center',
                                    }}
                                    className="max-h-[64vh] max-w-full object-contain rounded-md shadow-md transition-transform"
                                    onError={() => setLoadError(true)}
                                />
                            </div>
                        )
                    ) : (
                        <p className="text-xs text-gray-500">No document attached.</p>
                    )}
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-gray-500">
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                        <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                        Decrypted securely on-the-fly via AES-256
                    </span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="text-xs h-7"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
