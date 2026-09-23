import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, Settings, Award } from 'lucide-react';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import type { User } from '@/types';

type Props = {
    user: User;
};

export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();
    const { version } = usePage().props as { version?: string };

    const roles = (user?.roles as string[]) || [];
    const isStaffOrAdminOrMao = roles.some((r) => ['admin', 'shelter_staff', 'mao_officer'].includes(r));

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            <DropdownMenuGroup>
                <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <UserInfo user={user} showEmail={true} />
                    </div>
                </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                {!isStaffOrAdminOrMao && (
                    <DropdownMenuItem asChild>
                        <Link
                            className="flex items-center w-full cursor-pointer"
                            href={route('history.index')}
                            prefetch
                            onClick={cleanup}
                        >
                            <Award className="mr-2 h-4 w-4" />
                            <span>My Pet History</span>
                        </Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                    <Link
                        className="flex items-center w-full cursor-pointer"
                        href={edit()}
                        prefetch
                        onClick={cleanup}
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link
                    className="block w-full cursor-pointer"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="mr-2" />
                    Log out
                </Link>
            </DropdownMenuItem>
            {version && (
                <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1 text-[10px] font-mono text-muted-foreground/60 flex items-center justify-between select-none">
                        <span>FurFect</span>
                        <span>{version}</span>
                    </div>
                </>
            )}
        </>
    );
}
