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
        name: 'FurFect Forest & Gold (Default)',
        primaryColor: '#467235',
        heroGradient: 'bg-gradient-to-br from-[#FFFDF0] via-[#FFF78D]/30 to-[#467235]/15 border border-[#467235]/25',
        heroBadge: 'bg-[#FFF78D] text-[#283F24] font-semibold border border-[#FFBF00]/40',
        primaryButton: 'bg-[#467235] hover:bg-[#283F24] text-white shadow-sm',
        primaryButtonGhost: 'text-[#467235] hover:text-[#283F24] hover:bg-[#FFF78D]/30',
        secondaryBadge: 'bg-[#FFF78D] text-[#283F24] border border-[#FFBF00]/30',
        accentText: 'text-[#467235]',
        accentBg: 'bg-[#FFF78D]/50',
        cardHighlightBg: 'bg-[#FFFDF0]',
        cardHighlightBorder: 'border-[#467235]/20',
        iconBg: 'bg-[#FFF78D]/60',
        iconText: 'text-[#467235]',
        stepNumberText: 'text-[#FFF78D]',
        stepIconBg: 'bg-[#FFF78D]',
        stepIconText: 'text-[#283F24]',
        ringColor: 'ring-[#467235]/30 border-[#467235]',
        hoverBorder: 'hover:border-[#467235]/40',
        announcementBadge: 'text-[#283F24] bg-[#FFF78D] border-[#FFBF00]/40',
        announcementBanner: 'bg-gradient-to-br from-[#FFFDF0] to-[#FFF78D]/40 border-[#467235]/20',
        ctaBannerBg: 'bg-[#283F24]',
        ctaBannerText: 'text-[#FFBF00]',
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
