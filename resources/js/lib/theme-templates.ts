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
    accentIcon: string;
    stepNumberText: string;
    stepIconBg: string;
    stepIconText: string;
    ringColor: string;
    hoverBorder: string;
    announcementBadge: string;
    announcementBanner: string;
    ctaBannerBg: string;
    ctaBannerText: string;
    // System-wide Portal (Admin, Shelter, MAO, Adopter) tokens
    sidebarActive: string;
    sidebarActiveIcon: string;
    sidebarInactiveIcon: string;
    tabActive: string;
    tabInactive: string;
    portalBanner: string;
    portalBannerTitle: string;
    kpiBorder: string;
    kpiIconBg: string;
    badge: string;
}

export const THEME_TEMPLATES: Record<string, ThemePalette> = {
    honey_warm: {
        id: 'honey_warm',
        name: 'FurFect Forest & Gold (Default)',
        primaryColor: '#467235',
        heroGradient: 'bg-gradient-to-br from-[#FFFDF0] via-[#FFF78D]/30 to-[#467235]/15 border border-[#467235]/25',
        heroBadge: 'bg-[#FFF78D] text-[#283F24] font-semibold border border-[#FFBF00]/40',
        primaryButton: 'bg-[#467235] hover:bg-[#283F24] text-white shadow-xs',
        primaryButtonGhost: 'text-[#467235] hover:text-[#283F24] hover:bg-[#FFF78D]/30',
        secondaryBadge: 'bg-[#FFF78D] text-[#283F24] border border-[#FFBF00]/30',
        accentText: 'text-[#467235]',
        accentBg: 'bg-[#FFF78D]/50',
        cardHighlightBg: 'bg-[#FFFDF0]',
        cardHighlightBorder: 'border-[#467235]/20',
        iconBg: 'bg-[#FFF78D]/60',
        iconText: 'text-[#467235]',
        accentIcon: 'text-[#FFBF00]',
        stepNumberText: 'text-[#FFF78D]',
        stepIconBg: 'bg-[#FFF78D]',
        stepIconText: 'text-[#283F24]',
        ringColor: 'ring-[#467235]/30 border-[#467235]',
        hoverBorder: 'hover:border-[#467235]/40',
        announcementBadge: 'text-[#283F24] bg-[#FFF78D] border-[#FFBF00]/40',
        announcementBanner: 'bg-gradient-to-br from-[#FFFDF0] to-[#FFF78D]/40 border-[#467235]/20',
        ctaBannerBg: 'bg-[#283F24]',
        ctaBannerText: 'text-[#FFBF00]',
        sidebarActive: 'bg-[#FFF78D]/45 text-[#283F24] font-bold border-r-2 border-[#467235]',
        sidebarActiveIcon: 'text-[#467235]',
        sidebarInactiveIcon: 'text-gray-500 group-hover:text-[#467235]',
        tabActive: 'bg-[#FFBF00] text-[#283F24] shadow-xs font-bold',
        tabInactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
        portalBanner: 'bg-gradient-to-r from-[#FFFDF0] via-[#FFF78D]/30 to-[#467235]/10 border border-[#467235]/20',
        portalBannerTitle: 'text-[#283F24]',
        kpiBorder: 'border-[#467235]/20 hover:border-[#467235]/40',
        kpiIconBg: 'bg-[#FFF78D]/60 text-[#283F24]',
        badge: 'bg-[#FFF78D] text-[#283F24] border border-[#FFBF00]/40 font-bold',
    },
    emerald_nature: {
        id: 'emerald_nature',
        name: 'Emerald Nature',
        primaryColor: '#059669',
        heroGradient: 'bg-gradient-to-br from-[#F4FBF7] via-[#D1FAE5]/40 to-[#A7F3D0]/20 border border-emerald-500/20',
        heroBadge: 'bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300/40',
        primaryButton: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs',
        primaryButtonGhost: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50',
        secondaryBadge: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        accentText: 'text-emerald-600',
        accentBg: 'bg-emerald-100',
        cardHighlightBg: 'bg-[#F4FBF7]',
        cardHighlightBorder: 'border-emerald-500/20',
        iconBg: 'bg-emerald-100',
        iconText: 'text-emerald-600',
        accentIcon: 'text-emerald-500',
        stepNumberText: 'text-emerald-100',
        stepIconBg: 'bg-emerald-100',
        stepIconText: 'text-emerald-600',
        ringColor: 'ring-emerald-500/30 border-emerald-600',
        hoverBorder: 'hover:border-emerald-300',
        announcementBadge: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        announcementBanner: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-100',
        ctaBannerBg: 'bg-emerald-700',
        ctaBannerText: 'text-emerald-100',
        sidebarActive: 'bg-emerald-100/80 text-emerald-900 font-bold border-r-2 border-emerald-600',
        sidebarActiveIcon: 'text-emerald-700',
        sidebarInactiveIcon: 'text-gray-500 group-hover:text-emerald-600',
        tabActive: 'bg-emerald-600 text-white shadow-xs font-bold',
        tabInactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
        portalBanner: 'bg-gradient-to-r from-[#F4FBF7] via-[#D1FAE5]/30 to-emerald-500/10 border border-emerald-500/20',
        portalBannerTitle: 'text-emerald-950',
        kpiBorder: 'border-emerald-200 hover:border-emerald-300',
        kpiIconBg: 'bg-emerald-100 text-emerald-800',
        badge: 'bg-emerald-100 text-emerald-800 border border-emerald-300/50 font-bold',
    },
    modern_slate: {
        id: 'modern_slate',
        name: 'Modern Slate',
        primaryColor: '#3B82F6',
        heroGradient: 'bg-gradient-to-br from-[#F8FAFC] via-[#DBEAFE]/40 to-[#BFDBFE]/20 border border-blue-500/20',
        heroBadge: 'bg-blue-100 text-blue-800 font-semibold border border-blue-300/40',
        primaryButton: 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs',
        primaryButtonGhost: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50',
        secondaryBadge: 'bg-blue-100 text-blue-800 border border-blue-200',
        accentText: 'text-blue-600',
        accentBg: 'bg-blue-100',
        cardHighlightBg: 'bg-[#F8FAFC]',
        cardHighlightBorder: 'border-blue-500/20',
        iconBg: 'bg-blue-100',
        iconText: 'text-blue-600',
        accentIcon: 'text-blue-500',
        stepNumberText: 'text-blue-100',
        stepIconBg: 'bg-blue-100',
        stepIconText: 'text-blue-600',
        ringColor: 'ring-blue-500/30 border-blue-600',
        hoverBorder: 'hover:border-blue-300',
        announcementBadge: 'text-blue-700 bg-blue-50 border-blue-200',
        announcementBanner: 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-100',
        ctaBannerBg: 'bg-blue-700',
        ctaBannerText: 'text-blue-100',
        sidebarActive: 'bg-blue-100/80 text-blue-900 font-bold border-r-2 border-blue-600',
        sidebarActiveIcon: 'text-blue-700',
        sidebarInactiveIcon: 'text-gray-500 group-hover:text-blue-600',
        tabActive: 'bg-blue-600 text-white shadow-xs font-bold',
        tabInactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
        portalBanner: 'bg-gradient-to-r from-[#F8FAFC] via-[#DBEAFE]/30 to-blue-500/10 border border-blue-500/20',
        portalBannerTitle: 'text-slate-900',
        kpiBorder: 'border-blue-200 hover:border-blue-300',
        kpiIconBg: 'bg-blue-100 text-blue-800',
        badge: 'bg-blue-100 text-blue-800 border border-blue-300/50 font-bold',
    },
};

export function getTheme(templateName?: string): ThemePalette {
    if (templateName && THEME_TEMPLATES[templateName]) {
        return THEME_TEMPLATES[templateName];
    }
    return THEME_TEMPLATES.honey_warm;
}
