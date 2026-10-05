/**
 * Video handling and client-side pre-processing utilities.
 */

export interface VideoValidationResult {
    isValid: boolean;
    error?: string;
    duration?: number;
    posterFile?: File;
    previewUrl?: string;
}

/**
 * Validate a video file's size and duration, and extract an optimized poster snapshot frame.
 *
 * @param file The selected video File
 * @param maxDurationSeconds Maximum allowed duration in seconds (default: 60)
 * @param maxSizeBytes Maximum allowed file size in bytes (default: 50MB)
 */
export async function validateAndProcessVideo(
    file: File,
    maxDurationSeconds: number = 60,
    maxSizeBytes: number = 52428800 // 50MB
): Promise<VideoValidationResult> {
    if (!file.type.startsWith('video/')) {
        return { isValid: false, error: 'Selected file is not a supported video format.' };
    }

    if (file.size > maxSizeBytes) {
        const mb = Math.round(maxSizeBytes / (1024 * 1024));
        return { isValid: false, error: `Video file exceeds maximum allowed size of ${mb}MB.` };
    }

    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;

        const objectUrl = URL.createObjectURL(file);
        video.src = objectUrl;

        let isResolved = false;

        const cleanup = () => {
            video.removeAttribute('src');
            video.load();
        };

        const timeoutId = setTimeout(() => {
            if (!isResolved) {
                isResolved = true;
                cleanup();
                URL.revokeObjectURL(objectUrl);
                resolve({
                    isValid: true,
                    duration: 0,
                    previewUrl: objectUrl,
                });
            }
        }, 8000); // 8 second safety timeout for odd video formats

        video.onloadedmetadata = () => {
            const duration = Math.round(video.duration);

            if (duration > maxDurationSeconds) {
                clearTimeout(timeoutId);
                isResolved = true;
                cleanup();
                URL.revokeObjectURL(objectUrl);
                resolve({
                    isValid: false,
                    error: `Video length is ${duration}s. Maximum allowed duration is ${maxDurationSeconds}s.`,
                });
                return;
            }

            // Seek to 0.5s or midpoint to capture a good snapshot
            const seekTime = Math.min(1.0, video.duration > 1 ? 0.5 : video.duration / 2);
            video.currentTime = seekTime;
        };

        video.onseeked = () => {
            if (isResolved) return;
            clearTimeout(timeoutId);

            try {
                const canvas = document.createElement('canvas');
                const targetWidth = Math.min(video.videoWidth || 800, 1280);
                const scale = targetWidth / (video.videoWidth || targetWidth);
                const targetHeight = Math.round((video.videoHeight || 600) * scale);

                canvas.width = targetWidth;
                canvas.height = targetHeight;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
                    canvas.toBlob(
                        (blob) => {
                            isResolved = true;
                            cleanup();

                            if (blob) {
                                const posterFile = new File([blob], `${file.name.replace(/\.[^.]+$/, '')}_thumb.jpg`, {
                                    type: 'image/jpeg',
                                });
                                resolve({
                                    isValid: true,
                                    duration: Math.round(video.duration),
                                    posterFile,
                                    previewUrl: objectUrl,
                                });
                            } else {
                                resolve({
                                    isValid: true,
                                    duration: Math.round(video.duration),
                                    previewUrl: objectUrl,
                                });
                            }
                        },
                        'image/jpeg',
                        0.88
                    );
                    return;
                }
            } catch (err) {
                // If canvas export fails (e.g. cross-origin restriction), proceed with valid video
            }

            isResolved = true;
            cleanup();
            resolve({
                isValid: true,
                duration: Math.round(video.duration),
                previewUrl: objectUrl,
            });
        };

        video.onerror = () => {
            if (isResolved) return;
            clearTimeout(timeoutId);
            isResolved = true;
            cleanup();
            URL.revokeObjectURL(objectUrl);
            resolve({
                isValid: false,
                error: 'Could not read video metadata. Please ensure the file is a valid MP4, MOV, or WebM video.',
            });
        };
    });
}

/**
 * Format duration in seconds to M:SS (e.g. 65 -> "1:05")
 */
export function formatVideoDuration(seconds?: number | null): string {
    if (!seconds || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
