import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface AuditRemarksSelectorProps {
    value: string;
    onChange: (value: string) => void;
    decision?: string; // 'approved' | 'rejected' | 'suitable' | 'not_suitable'
    id?: string;
    label?: string;
    className?: string;
    mode?: 'mao' | 'shelter';
    approvalPresets?: string[];
    rejectionPresets?: string[];
    required?: boolean;
    error?: string;
}

const MAO_APPROVAL_REMARKS = [
    'Statutory compliance verified under RA 8485 & RA 9482. Companion animal release authorized.',
    'Verified adequate shelter, secure enclosure, and confirmed household welfare commitment.',
    'High compatibility index and exemplary applicant track record. Official certificate issued.',
    'Passed municipal veterinary screening and verified living conditions without reservation.',
    'Adopter successfully completed orientation; compliant with responsible pet ownership mandate.',
];

const MAO_REJECTION_REMARKS = [
    'Failed statutory compliance: Housing or containment does not meet minimum animal welfare standards.',
    'Household consent unverified or documented opposition among co-habitants.',
    'Discrepancies identified during identity verification and residency background audit.',
    'Documented history of prior animal surrender, neglect, or welfare ordinance violations.',
    'Significant care capacity mismatch with the physical or behavioral needs of the animal.',
];

const SHELTER_APPROVAL_REMARKS = [
    'Applicant demonstrates excellent readiness, compatible home environment, and responsible pet care commitment.',
    'Household environment and care capacity align directly with the pet\'s energy level and behavioral profile.',
    'Verified residence suitability, household consent, and satisfactory living conditions during initial screening.',
    'Applicant has positive animal handling experience and strong capacity to support this pet\'s daily needs.',
    'Initial interview and questionnaire successfully validated. Endorsed for MAO statutory compliance review.',
];

const SHELTER_REJECTION_REMARKS = [
    'Housing conditions or containment area inadequate for this pet\'s breed, size, or physical exercise requirements.',
    'Significant lifestyle or energy level mismatch between applicant\'s routine and pet\'s behavioral requirements.',
    'Documented lack of household or landlord consent for keeping pets on the premises.',
    'Applicant care capacity or daily availability does not meet minimum requirements for this animal\'s welfare.',
    'Incomplete, unverified, or inconsistent information provided during initial screening evaluation.',
];

export function AuditRemarksSelector({
    value,
    onChange,
    decision = 'approved',
    id = 'official-audit-remarks',
    label,
    className = '',
    mode = 'mao',
    approvalPresets,
    rejectionPresets,
    required,
    error,
}: AuditRemarksSelectorProps) {
    const isApproval = decision === 'approved' || decision === 'suitable' || !decision || decision === '';
    const isRequired = required !== undefined ? required : isApproval;

    const activePresets = isApproval
        ? (approvalPresets || (mode === 'shelter' ? SHELTER_APPROVAL_REMARKS : MAO_APPROVAL_REMARKS))
        : (rejectionPresets || (mode === 'shelter' ? SHELTER_REJECTION_REMARKS : MAO_REJECTION_REMARKS));

    const defaultLabel = label || (mode === 'shelter'
        ? 'Staff Screening Remarks & Feedback'
        : 'Official Audit Remarks & Determination Notes');

    // Check if initial value is in activePresets
    const isPreset = activePresets.includes(value);

    // Track selected option: either the preset text, or 'others'
    const [selectedOption, setSelectedOption] = useState<string>(() => {
        if (!value) return '';
        if (isPreset) return value;
        return 'others';
    });

    // Custom text state when 'others' is chosen
    const [customText, setCustomText] = useState<string>(() => {
        return isPreset ? '' : value;
    });

    // Sync when external value changes (e.g., application switch or reset)
    useEffect(() => {
        if (!value) {
            setSelectedOption('');
            setCustomText('');
        } else if (activePresets.includes(value)) {
            setSelectedOption(value);
        } else {
            setSelectedOption('others');
            setCustomText((prev) => (prev !== value ? value : prev));
        }
    }, [value, activePresets]);

    // Sync when decision changes
    useEffect(() => {
        if (selectedOption !== 'others' && !activePresets.includes(selectedOption)) {
            // If current selection is not valid for new decision mode, reset
            setSelectedOption('');
            onChange('');
        }
    }, [decision, activePresets]);

    const handleSelectChange = (val: string) => {
        setSelectedOption(val);
        if (val === 'others') {
            onChange(customText);
        } else {
            onChange(val);
        }
    };

    const handleCustomTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        setCustomText(text);
        onChange(text);
    };

    const isShelter = mode === 'shelter';

    return (
        <div className={`space-y-2 ${className}`}>
            <div className="flex items-center justify-between">
                <Label htmlFor={id} className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {defaultLabel} {isRequired && <span className="text-red-500 font-bold">*</span>}
                </Label>
                {isRequired && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Required for approval</span>
                )}
            </div>

            <Select value={selectedOption} onValueChange={handleSelectChange}>
                <SelectTrigger id={id} className={`w-full min-w-0 max-w-full text-xs bg-white dark:bg-neutral-800 ${error ? 'border-red-400 ring-1 ring-red-400' : ''}`}>
                    <SelectValue placeholder={isShelter ? "Select standard screening remark or choose 'Others'..." : "Select standard remark or choose 'Others'..."} />
                </SelectTrigger>
                <SelectContent className="w-[var(--anchor-width)] max-w-[calc(100vw-2rem)]">
                    <SelectGroup>
                        {activePresets.map((remark, idx) => (
                            <SelectItem key={idx} value={remark} className="text-xs py-2 cursor-pointer whitespace-normal break-words text-left leading-relaxed">
                                {remark}
                            </SelectItem>
                        ))}
                        <SelectItem
                            value="others"
                            className={`text-xs font-semibold py-2 cursor-pointer border-t border-gray-100 dark:border-neutral-800 mt-1 whitespace-normal text-left ${
                                isShelter
                                    ? 'text-[#B8860B] dark:text-amber-400'
                                    : 'text-purple-700 dark:text-purple-400'
                            }`}
                        >
                            {isShelter ? 'Others (Specify Custom Screening Remarks)' : 'Others (Specify Custom Audit Remarks)'}
                        </SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>

            {error && (
                <p className="text-[11px] text-red-500 font-medium">{error}</p>
            )}

            {/* Show Textbox when 'others' is selected */}
            {selectedOption === 'others' && (
                <div className="pt-1 animate-in fade-in-50 duration-200 space-y-1">
                    <Textarea
                        value={customText}
                        onChange={handleCustomTextChange}
                        rows={3}
                        placeholder={
                            isApproval
                                ? (isShelter
                                    ? "Add notes for Municipal Agriculture Office or specific shelter observations..."
                                    : "Enter specific statutory compliance verification notes, special pickup instructions, or council observations...")
                                : (isShelter
                                    ? "Specify reasons why applicant or environment was found not suitable..."
                                    : "Specify clear statutory or welfare reasons for disapproval to notify applicant...")
                        }
                        className={`text-xs bg-white dark:bg-neutral-800 ${
                            isShelter ? 'focus:ring-[#D4A017]' : 'focus:ring-purple-500'
                        } ${error ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                        autoFocus
                    />
                    <p className="text-[10px] text-gray-400 italic">
                        {isShelter
                            ? "Custom remarks will be officially logged in the shelter screening record and application timeline."
                            : "Custom remarks will be officially logged in the application audit trail and timeline."}
                    </p>
                </div>
            )}
        </div>
    );
}
