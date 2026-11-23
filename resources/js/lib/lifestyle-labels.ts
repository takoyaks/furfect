export const OTHER_OPTION_SENTINEL = '__other__';

export const WORK_SCHEDULE_OPTIONS = [
    { value: 'always_at_home', label: 'Always at home' },
    { value: 'frequently_at_home', label: 'Frequently at home' },
    { value: 'travel_sometimes', label: 'I travel sometimes' },
    { value: 'travel_a_lot', label: 'I travel a lot' },
    { value: 'others', label: 'Others' },
] as const;

export const LEGACY_WORK_SCHEDULE_MAP: Record<string, string> = {
    wfh: 'always_at_home',
    office: 'frequently_at_home',
    shifting: 'travel_sometimes',
    student: 'frequently_at_home',
};

export function normalizeWorkSchedule(schedule?: string | null): string {
    if (!schedule) {
        return 'frequently_at_home';
    }
    if (WORK_SCHEDULE_OPTIONS.some((opt) => opt.value === schedule)) {
        return schedule;
    }
    return LEGACY_WORK_SCHEDULE_MAP[schedule] ?? 'frequently_at_home';
}

export function formatWorkSchedule(schedule?: string | null, otherText?: string | null): string {
    if (!schedule) {
        return 'N/A';
    }

    const match = WORK_SCHEDULE_OPTIONS.find((opt) => opt.value === schedule);
    if (match) {
        if (schedule === 'others' && otherText?.trim()) {
            return `Others: ${otherText.trim()}`;
        }
        return match.label;
    }

    const legacyLabels: Record<string, string> = {
        wfh: 'Work / Stay at home',
        office: 'Office hours (8am - 5pm)',
        shifting: 'Shifting / irregular hours',
        student: 'Student',
    };

    return legacyLabels[schedule] ?? schedule.replace(/_/g, ' ');
}

export const PET_OWNERSHIP_HISTORY_OPTIONS = [
    { value: 'currently_have', label: 'Currently have pet(s)' },
    { value: 'had_before', label: 'Had pet(s) before' },
    { value: 'never', label: 'Never owned a pet (First-time adopter)' },
] as const;

export const PREVIOUS_PET_HISTORY_OPTIONS = [
    'Still living happily with me / my family',
    'Passed away due to old age / natural causes',
    'Passed away due to illness or accident',
    'Rehomed to a trusted family member or friend',
    'Left with family when I moved',
    'Lost / ran away',
] as const;

export const ADOPTION_REASON_OPTIONS = [
    { value: 'Companionship', label: 'Companionship' },
    { value: 'For family/children', label: 'For family / children' },
    { value: 'Emotional Support', label: 'Emotional Support' },
    { value: 'To rescue/give a shelter pet a home', label: 'To rescue / give a shelter pet a home' },
    { value: 'Companion for existing pet', label: 'Companion for an existing pet' },
    { value: 'For security/guard', label: 'For security / guard' },
    { value: 'Other', label: 'Other' },
] as const;

export const ADOPTION_INTENTION_OPTIONS = [
    'I want to give a rescued shelter pet a safe, loving, and permanent home.',
    'I am looking for a loyal daily companion to share my home and routine with.',
    'Our family is ready to welcome and care for a new pet together.',
    'I want to adopt a companion to support my mental and emotional well-being.',
    'I want a companion pet to keep my current pet company.',
    'I have the time, space, and financial capacity to responsibly care for a pet.',
] as const;
