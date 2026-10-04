import { useState, useEffect, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';

interface InactivityOptions {
    /** Total idle timeout in seconds before auto-logout (default: 15 minutes = 900s) */
    timeoutSeconds?: number;
    /** Idle threshold in seconds before showing the warning dialog (default: 14 minutes = 840s) */
    warningSeconds?: number;
    /** Whether the timer is currently enabled (e.g. only when user is authenticated) */
    enabled?: boolean;
}

export function useInactivityTimer({
    timeoutSeconds = 15 * 60, // 15 minutes
    warningSeconds = 14 * 60, // 14 minutes (60 seconds countdown)
    enabled = true,
}: InactivityOptions = {}) {
    const [isWarningOpen, setIsWarningOpen] = useState(false);
    const [secondsRemaining, setSecondsRemaining] = useState(timeoutSeconds - warningSeconds);

    const lastActivityRef = useRef<number>(Date.now());
    const isWarningOpenRef = useRef<boolean>(false);
    isWarningOpenRef.current = isWarningOpen;

    const performLogout = useCallback(() => {
        setIsWarningOpen(false);
        router.post(route('logout'), {}, {
            onFinish: () => {
                window.location.href = route('login');
            },
        });
    }, []);

    const resetTimer = useCallback(() => {
        lastActivityRef.current = Date.now();
        setIsWarningOpen(false);
        setSecondsRemaining(timeoutSeconds - warningSeconds);
    }, [timeoutSeconds, warningSeconds]);

    useEffect(() => {
        if (!enabled) return;

        // Throttled activity handler
        let lastThrottle = 0;
        const handleUserActivity = () => {
            const now = Date.now();
            if (now - lastThrottle < 2000) return; // throttle every 2s
            lastThrottle = now;

            // Only auto-reset if the warning dialog is not yet displayed
            if (!isWarningOpenRef.current) {
                lastActivityRef.current = now;
            }
        };

        const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach((evt) => {
            window.addEventListener(evt, handleUserActivity, { passive: true });
        });

        // Interval checker running every 1 second
        const intervalId = window.setInterval(() => {
            const now = Date.now();
            const idleElapsedSeconds = Math.floor((now - lastActivityRef.current) / 1000);

            if (idleElapsedSeconds >= timeoutSeconds) {
                // Time fully expired - trigger logout
                window.clearInterval(intervalId);
                performLogout();
            } else if (idleElapsedSeconds >= warningSeconds) {
                // Within warning window
                setIsWarningOpen(true);
                const remaining = Math.max(0, timeoutSeconds - idleElapsedSeconds);
                setSecondsRemaining(remaining);
            } else {
                if (isWarningOpenRef.current) {
                    setIsWarningOpen(false);
                }
            }
        }, 1000);

        return () => {
            window.clearInterval(intervalId);
            events.forEach((evt) => {
                window.removeEventListener(evt, handleUserActivity);
            });
        };
    }, [enabled, timeoutSeconds, warningSeconds, performLogout]);

    return {
        isWarningOpen,
        secondsRemaining,
        resetTimer,
        performLogout,
    };
}
