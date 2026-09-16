export interface ThemePalette {
    id: string;
    name: string;
    primaryColor: string;
    heroGradient: string;
    heroBadge: string;
    primaryButton: string;
    primaryButtonGhost: string;
    secondaryBadge: string;
    accentText: string;
    accentBg: string;
    cardHighlightBg: string;
    cardHighlightBorder: string;
    iconBg: string;
    iconText: string;
    stepNumberText: string;
    stepIconBg: string;
    stepIconText: string;
    ringColor: string;
    hoverBorder: string;
    announcementBadge: string;
    announcementBanner: string;
    ctaBannerBg: string;
    ctaBannerText: string;
}

export const THEME_TEMPLATES: Record<string, ThemePalette> = {
    honey_warm: {
        id: 'honey_warm',
        name: 'Warm Honey (Default)',
        primaryColor: '#D4A017',
        heroGradient: 'bg-gradient-to-br from-[#FDFBF7] via-[#F5EDD7]/40 to-[#EADAA2]/20 border border-[#D4A017]/20',
        heroBadge: 'bg-[#F5EDD7] text-[#B8860B]',
        primaryButton: 'bg-[#D4A017] hover:bg-[#B8860B] text-white',
        primaryButtonGhost: 'text-[#D4A017] hover:text-[#B8860B]',
        secondaryBadge: 'bg-[#F5EDD7] text-[#B8860B]',
        accentText: 'text-[#D4A017]',
        accentBg: 'bg-amber-100',
        cardHighlightBg: 'bg-[#FDFBF7]',
        cardHighlightBorder: 'border-[#D4A017]/20',
        iconBg: 'bg-amber-100',
        iconText: 'text-[#D4A017]',
        stepNumberText: 'text-amber-100',
        stepIconBg: 'bg-amber-100',
        stepIconText: 'text-[#D4A017]',
        ringColor: 'ring-[#D4A017]/30 border-[#D4A017]',
        hoverBorder: 'hover:border-amber-300',
        announcementBadge: 'text-[#D4A017] bg-amber-50 border-amber-200',
        announcementBanner: 'bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-100',
        ctaBannerBg: 'bg-[#D4A017]',
        ctaBannerText: 'text-[#B8860B]',
    },
    emerald_nature: {
        id: 'emerald_nature',
        name: 'Emerald Nature',
        primaryColor: '#059669',
        heroGradient: 'bg-gradient-to-br from-[#F4FBF7] via-[#D1FAE5]/40 to-[#A7F3D0]/20 border border-emerald-500/20',
        heroBadge: 'bg-emerald-100 text-emerald-800',
        primaryButton: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        primaryButtonGhost: 'text-emerald-600 hover:text-emerald-700',
        secondaryBadge: 'bg-emerald-100 text-emerald-800',
        accentText: 'text-emerald-600',
        accentBg: 'bg-emerald-100',
        cardHighlightBg: 'bg-[#F4FBF7]',
        cardHighlightBorder: 'border-emerald-500/20',
        iconBg: 'bg-emerald-100',
        iconText: 'text-emerald-600',
        stepNumberText: 'text-emerald-100',
        stepIconBg: 'bg-emerald-100',
        stepIconText: 'text-emerald-600',
        ringColor: 'ring-emerald-500/30 border-emerald-600',
        hoverBorder: 'hover:border-emerald-300',
        announcementBadge: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        announcementBanner: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-100',
        ctaBannerBg: 'bg-emerald-600',
        ctaBannerText: 'text-emerald-700',
    },
    modern_slate: {
        id: 'modern_slate',
        name: 'Modern Slate',
        primaryColor: '#3B82F6',
        heroGradient: 'bg-gradient-to-br from-[#F8FAFC] via-[#DBEAFE]/40 to-[#BFDBFE]/20 border border-blue-500/20',
        heroBadge: 'bg-blue-100 text-blue-800',
        primaryButton: 'bg-blue-600 hover:bg-blue-700 text-white',
        primaryButtonGhost: 'text-blue-600 hover:text-blue-700',
        secondaryBadge: 'bg-blue-100 text-blue-800',
        accentText: 'text-blue-600',
        accentBg: 'bg-blue-100',
        cardHighlightBg: 'bg-[#F8FAFC]',
        cardHighlightBorder: 'border-blue-500/20',
        iconBg: 'bg-blue-100',
        iconText: 'text-blue-600',
        stepNumberText: 'text-blue-100',
        stepIconBg: 'bg-blue-100',
        stepIconText: 'text-blue-600',
        ringColor: 'ring-blue-500/30 border-blue-600',
        hoverBorder: 'hover:border-blue-300',
        announcementBadge: 'text-blue-700 bg-blue-50 border-blue-200',
        announcementBanner: 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-100',
        ctaBannerBg: 'bg-blue-600',
        ctaBannerText: 'text-blue-700',
    },
};

export function getTheme(templateName?: string): ThemePalette {
    if (templateName && THEME_TEMPLATES[templateName]) {
        return THEME_TEMPLATES[templateName];
    }
    return THEME_TEMPLATES.honey_warm;
}
