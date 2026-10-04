import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, ShieldAlert, LogOut } from 'lucide-react';

interface InactivityWarningModalProps {
    isOpen: boolean;
    secondsRemaining: number;
    onStayLoggedIn: () => void;
    onLogoutNow: () => void;
}

export function InactivityWarningModal({
    isOpen,
    secondsRemaining,
    onStayLoggedIn,
    onLogoutNow,
}: InactivityWarningModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onStayLoggedIn()}>
            <DialogContent className="sm:max-w-md bg-white p-6 rounded-2xl shadow-xl border-amber-200">
                <DialogHeader className="text-left space-y-2">
                    <div className="size-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-1 shadow-2xs">
                        <ShieldAlert className="size-6 text-amber-600 animate-pulse" />
                    </div>
                    <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                        Session Inactivity Warning
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-500 leading-relaxed">
                        You have been inactive for an extended period. For your security and compliance with municipal animal welfare data privacy standards, your session will automatically terminate in:
                    </DialogDescription>
                </DialogHeader>

                <div className="my-3 py-3 px-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-900 text-xs font-semibold">
                        <Clock className="size-4 text-amber-600 shrink-0" />
                        <span>Auto-Logout Countdown:</span>
                    </div>
                    <span className="font-mono text-lg font-extrabold text-amber-700 bg-white px-3 py-0.5 rounded-lg border border-amber-200 shadow-2xs">
                        {secondsRemaining}s
                    </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onLogoutNow}
                        className="text-xs h-9 px-3.5 text-gray-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                    >
                        <LogOut className="size-3.5 mr-1" />
                        Log Out Now
                    </Button>
                    <Button
                        type="button"
                        onClick={onStayLoggedIn}
                        className="bg-[#D4A017] hover:bg-[#B8860B] text-white text-xs h-9 px-4 font-bold shadow-xs cursor-pointer transition"
                    >
                        Keep Me Logged In
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
