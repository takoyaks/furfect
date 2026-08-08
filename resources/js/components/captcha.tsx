import { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface CaptchaProps {
    onVerify: (verified: boolean) => void;
    error?: string;
}

export default function Captcha({ onVerify, error }: CaptchaProps) {
    const [isChecked, setIsChecked] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [showPuzzle, setShowPuzzle] = useState(false);
    
    // Simple math puzzle for verification
    const [num1, setNum1] = useState(3);
    const [num2, setNum2] = useState(4);
    const [userAnswer, setUserAnswer] = useState('');
    const [puzzleError, setPuzzleError] = useState(false);

    const generatePuzzle = () => {
        const n1 = Math.floor(Math.random() * 9) + 1;
        const n2 = Math.floor(Math.random() * 9) + 1;
        setNum1(n1);
        setNum2(n2);
        setUserAnswer('');
        setPuzzleError(false);
    };

    useEffect(() => {
        generatePuzzle();
    }, []);

    const handleCheckboxChange = (checked: boolean) => {
        if (!checked) {
            setIsChecked(false);
            setIsVerified(false);
            onVerify(false);
            return;
        }

        if (isVerified) return;

        setIsChecked(true);
        setIsVerifying(true);
        
        // Brief loading pause before presenting challenge
        setTimeout(() => {
            setIsVerifying(false);
            setShowPuzzle(true);
        }, 400);
    };

    const doVerify = () => {
        if (parseInt(userAnswer.trim(), 10) === num1 + num2) {
            setIsVerified(true);
            setShowPuzzle(false);
            setPuzzleError(false);
            onVerify(true);
        } else {
            setPuzzleError(true);
            onVerify(false);
            generatePuzzle();
        }
    };

    const handleVerifyClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        doVerify();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            doVerify();
        }
    };

    return (
        <div className="space-y-2">
            <div className="border border-gray-200 bg-gray-50/80 rounded-lg p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-3">
                    {isVerifying ? (
                        <RefreshCw className="h-5 w-5 text-[#D4A017] animate-spin" />
                    ) : isVerified ? (
                        <div className="h-5 w-5 rounded bg-green-600 flex items-center justify-center text-white">
                            <Check className="h-4 w-4 stroke-[3]" />
                        </div>
                    ) : (
                        <Checkbox
                            id="captcha-check"
                            checked={isChecked}
                            onCheckedChange={handleCheckboxChange}
                            className="h-5 w-5 border-gray-400 data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017]"
                        />
                    )}
                    <Label htmlFor="captcha-check" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                        {isVerified ? "Human verification complete" : "I'm not a robot"}
                    </Label>
                </div>

                <div className="flex flex-col items-end opacity-70">
                    <ShieldCheck className="h-5 w-5 text-[#D4A017]" />
                    <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Security Check</span>
                </div>
            </div>

            {showPuzzle && (
                <div className="bg-white border border-[#D4A017]/40 rounded-md p-3 shadow-md space-y-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="text-xs font-semibold text-gray-700 flex justify-between items-center">
                        <span>Security Challenge: What is {num1} + {num2}?</span>
                        <button 
                            type="button" 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                generatePuzzle();
                            }}
                            className="text-[11px] text-[#D4A017] hover:underline flex items-center gap-1"
                        >
                            <RefreshCw className="h-3 w-3" /> Refresh
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Answer"
                            required
                            autoFocus
                            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#D4A017]"
                        />
                        <button
                            type="button"
                            onClick={handleVerifyClick}
                            className="px-3 py-1 bg-[#D4A017] hover:bg-[#B8860B] text-white text-xs font-semibold rounded transition"
                        >
                            Verify
                        </button>
                    </div>
                    {puzzleError && (
                        <p className="text-red-500 text-xs font-medium">Incorrect answer. Please try again.</p>
                    )}
                </div>
            )}

            {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
        </div>
    );
}
