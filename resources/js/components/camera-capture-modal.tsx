import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, Check, X, AlertCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CameraCaptureModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    showGuideOverlay?: boolean;
    fileNamePrefix?: string;
    aspectRatio?: number | string;
    onCapture: (file: File) => void;
}

export function CameraCaptureModal({
    open,
    onOpenChange,
    title = 'Capture ID Document',
    description,
    showGuideOverlay = true,
    fileNamePrefix = 'capture',
    onCapture,
}: CameraCaptureModalProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);

    // Start video stream when modal opens
    useEffect(() => {
        if (!open) {
            stopCamera();
            setCapturedDataUrl(null);
            setCameraError(null);
            return;
        }

        startCamera();

        return () => {
            stopCamera();
        };
    }, [open]);

    const startCamera = async () => {
        setCameraError(null);
        setCapturedDataUrl(null);

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera access is not supported by your browser or connection environment.');
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Prefer back camera on mobile/tablets
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
                audio: false,
            });

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(() => {});
                setIsStreaming(true);
            }
        } catch (err: any) {
            console.error('Camera access error:', err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setCameraError('Camera permission was denied. Please allow camera access in your browser settings.');
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setCameraError('No camera device found on your device.');
            } else {
                setCameraError(err.message || 'Unable to access camera.');
            }
            setIsStreaming(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setIsStreaming(false);
    };

    const handleTakePhoto = () => {
        if (!videoRef.current) return;

        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setCapturedDataUrl(dataUrl);
        stopCamera();
    };

    const handleRetake = () => {
        setCapturedDataUrl(null);
        startCamera();
    };

    const handleConfirm = () => {
        if (!capturedDataUrl) return;

        // Convert base64 DataURL to File
        const arr = capturedDataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }

        const fileName = `${fileNamePrefix}_${Date.now()}.jpg`;
        const file = new File([u8arr], fileName, { type: mime });

        onCapture(file);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-slate-950 text-white border-slate-800">
                <DialogHeader className="p-4 pb-2 bg-slate-900 border-b border-slate-800">
                    <DialogTitle className="text-base text-white flex items-center gap-2">
                        <Camera className="size-4 text-[#D4A017]" />
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-400">
                        {description || 'Position your subject clearly within the frame. Ensure good lighting.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="relative aspect-4/3 w-full bg-black flex items-center justify-center overflow-hidden">
                    {cameraError ? (
                        <div className="p-6 text-center space-y-3">
                            <AlertCircle className="size-10 text-red-400 mx-auto" />
                            <p className="text-xs text-red-300 max-w-xs">{cameraError}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={startCamera}
                                className="text-white border-slate-700 hover:bg-slate-800"
                            >
                                <RefreshCw className="size-3.5 mr-1.5" /> Retry Camera
                            </Button>
                        </div>
                    ) : capturedDataUrl ? (
                        <img
                            src={capturedDataUrl}
                            alt="Captured Photo"
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />
                            {/* Visual guide overlay */}
                            {showGuideOverlay && (
                                <div className="absolute inset-x-8 inset-y-6 pointer-events-none border-2 border-dashed border-[#D4A017]/80 rounded-xl flex items-end justify-center pb-2 bg-black/10">
                                    <span className="text-[11px] font-medium text-[#F5EDD7] bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs">
                                        Align Subject Here
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <DialogFooter className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between sm:justify-between flex-row">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
                    >
                        <X className="size-4 mr-1" /> Cancel
                    </Button>

                    <div className="flex items-center gap-2">
                        {capturedDataUrl ? (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRetake}
                                    className="text-xs text-slate-200 border-slate-700 hover:bg-slate-800"
                                >
                                    <RefreshCw className="size-3.5 mr-1.5" /> Retake
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleConfirm}
                                    className="bg-[#D4A017] hover:bg-[#B8860B] text-slate-950 font-bold text-xs"
                                >
                                    <Check className="size-3.5 mr-1.5" /> Use Photo
                                </Button>
                            </>
                        ) : (
                            <Button
                                type="button"
                                size="sm"
                                disabled={!isStreaming || !!cameraError}
                                onClick={handleTakePhoto}
                                className="bg-[#D4A017] hover:bg-[#B8860B] text-slate-950 font-bold text-xs"
                            >
                                <Camera className="size-3.5 mr-1.5" /> Take Photo
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
