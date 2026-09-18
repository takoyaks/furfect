import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import type { Props as ApexChartProps } from 'react-apexcharts';

export const THEME_COLORS = {
    vibrantYellow: '#FFBF00',
    paleYellow: '#FFF78D',
    mutedGreen: '#467235',
    darkForestGreen: '#283F24',
    // Supplementary supportive shades
    emerald: '#10B981',
    blue: '#3B82F6',
    red: '#EF4444',
    gray: '#9CA3AF',
};

export const DEFAULT_CHART_PALETTE = [
    THEME_COLORS.vibrantYellow,
    THEME_COLORS.mutedGreen,
    THEME_COLORS.darkForestGreen,
    '#E5A900',
    '#5E9447',
    THEME_COLORS.paleYellow,
];

interface CustomChartProps extends ApexChartProps {
    className?: string;
}

export default function ApexChart({ className = '', ...props }: CustomChartProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className={`w-full flex items-center justify-center min-h-[260px] bg-amber-50/30 rounded-xl animate-pulse ${className}`}>
                <span className="text-xs text-[#283F24]/60 font-medium">Loading chart...</span>
            </div>
        );
    }

    return (
        <div className={`w-full overflow-hidden ${className}`}>
            <Chart {...props} />
        </div>
    );
}
