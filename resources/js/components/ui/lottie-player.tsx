import { useEffect, useRef, useState } from 'react';
import type { AnimationItem } from 'lottie-web';
import lottie from 'lottie-web/build/player/lottie_light';

import { cn } from '@/lib/utils';

export interface LottiePlayerProps {
    src?: string;
    animationData?: Record<string, unknown>;
    loop?: boolean;
    autoplay?: boolean;
    className?: string;
    fallback?: React.ReactNode;
}

export function LottiePlayer({
    src,
    animationData,
    loop = true,
    autoplay = true,
    className,
    fallback,
}: LottiePlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const animRef = useRef<AnimationItem | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        if (!src && !animationData) {
            return;
        }

        let isMounted = true;

        if (animRef.current) {
            animRef.current.destroy();
            animRef.current = null;
        }

        try {
            const player = (lottie as any)?.default || lottie;

            if (!player || typeof player.loadAnimation !== 'function') {
                if (isMounted) {
                    setHasError(true);
                }
                return;
            }

            const anim = player.loadAnimation({
                container: containerRef.current,
                renderer: 'svg',
                loop,
                autoplay,
                ...(animationData ? { animationData } : { path: src }),
            });

            animRef.current = anim;

            anim.addEventListener('DOMLoaded', () => {
                if (isMounted) {
                    setIsLoaded(true);
                }
            });

            anim.addEventListener('data_ready', () => {
                if (isMounted) {
                    setIsLoaded(true);
                }
            });

            anim.addEventListener('data_failed', () => {
                if (isMounted) {
                    setHasError(true);
                }
            });

            anim.addEventListener('error', () => {
                if (isMounted) {
                    setHasError(true);
                }
            });
        } catch (err) {
            console.error('Lottie animation failed to load:', err);
            if (isMounted) {
                setHasError(true);
            }
        }

        return () => {
            isMounted = false;
            if (animRef.current) {
                animRef.current.destroy();
                animRef.current = null;
            }
        };
    }, [src, animationData, loop, autoplay]);

    return (
        <div
            className={cn(
                'relative flex items-center justify-center overflow-hidden',
                className,
            )}
        >
            {hasError ? (
                fallback ?? null
            ) : (
                <>
                    {!isLoaded && fallback && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            {fallback}
                        </div>
                    )}
                    <div
                        ref={containerRef}
                        className={cn(
                            'h-full w-full transition-opacity duration-300',
                            isLoaded ? 'opacity-100' : 'opacity-0',
                        )}
                    />
                </>
            )}
        </div>
    );
}

export default LottiePlayer;
