import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { getTheme, type ThemePalette } from '@/lib/theme-templates';

export function useThemeTemplate(): ThemePalette {
    const page = usePage();
    const props = page.props as any;

    const templateId: string =
        props.theme?.template ||
        props.config?.template_name ||
        'honey_warm';

    const theme = getTheme(templateId);

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.dataset.theme = theme.id;
        }
    }, [theme.id]);

    return theme;
}
