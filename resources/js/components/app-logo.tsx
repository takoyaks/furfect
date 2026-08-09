import { usePage } from '@inertiajs/react';

import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
<div className="flex aspect-square size-8 items-center justify-center rounded-md">
    <AppLogoIcon className="size-8 object-contain" />
</div>

<div className="ml-1 grid flex-1 text-left text-sm group-data-[collapsible=icon]:hidden">
    <span className="mb-0.5 truncate leading-tight font-semibold">
        {name}
    </span>
</div>
        </>
    );
}
