import { Link, usePage } from '@inertiajs/react';
import { Home as HomeIcon, Heart, Sparkles, FileCheck, HelpCircle, Info, Menu, Award } from 'lucide-react';
import { NotificationCenter } from '@/components/notification-center';
import AppLogo from '@/components/app-logo';
import AppLogoIcon from '@/components/app-logo-icon';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { UserMenuContent } from '@/components/user-menu-content';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { dashboard, login, register } from '@/routes';
import type { BreadcrumbItem, NavItem } from '@/types';

type Props = {
    breadcrumbs?: BreadcrumbItem[];
};

const activeItemStyles =
    'text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100';

export function AppHeader({ breadcrumbs = [] }: Props) {
    const page = usePage();
    const { auth } = page.props;
    const getInitials = useInitials();
    const { isCurrentUrl, whenCurrentUrl } = useCurrentUrl();

    const mainNavItems: NavItem[] = auth.user
        ? [
              {
                  title: 'Home',
                  href: dashboard(),
                  icon: HomeIcon,
              },
              {
                  title: 'Browse Pets',
                  href: route('pets.index'),
                  icon: Heart,
              },
              {
                  title: 'My Matches',
                  href: route('matches.index'),
                  icon: Sparkles,
              },
            //   {
            //       title: 'How It Works',
            //       href: route('how-it-works'),
            //       icon: HelpCircle,
            //   },
            //   {
            //       title: 'About Us',
            //       href: route('about'),
            //       icon: Info,
            //   },
              {
                  title: 'My Application',
                  href: route('application.show'),
                  icon: FileCheck,
              },
              {
                  title: 'Pet History',
                  href: route('history.index'),
                  icon: Award,
              },
          ]
        : [
              {
                  title: 'Home',
                  href: route('home'),
                  icon: HomeIcon,
              },
              {
                  title: 'Browse Pets',
                  href: route('pets.index'),
                  icon: Heart,
              },
            //   {
            //       title: 'How It Works',
            //       href: route('how-it-works'),
            //       icon: HelpCircle,
            //   },
            //   {
            //       title: 'About Us',
            //       href: route('about'),
            //       icon: Info,
            //   },
          ];

    return (
        <>
            <div className="border-b border-sidebar-border/80">
                <div className="mx-auto flex h-16 items-center px-4 md:max-w-7xl">
                    {/* Mobile Menu */}
                    <div className="lg:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="mr-2 h-[34px] w-[34px]"
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="left"
                                className="flex h-full w-64 flex-col items-stretch justify-between bg-sidebar"
                            >
                                <SheetTitle className="sr-only">
                                    Navigation menu
                                </SheetTitle>
                                <SheetHeader className="flex justify-start text-left">
                                    <AppLogoIcon className="h-6 w-6 fill-current text-black dark:text-white" />
                                </SheetHeader>
                                <div className="flex h-full flex-1 flex-col space-y-4 p-4">
                                    <div className="flex h-full flex-col justify-between text-sm">
                                        <div className="flex flex-col space-y-4">
                                            {mainNavItems.map((item) => (
                                                <Link
                                                    key={item.title}
                                                    href={item.href}
                                                    className="flex items-center space-x-2 font-medium"
                                                >
                                                    {item.icon && (
                                                        <item.icon className="h-5 w-5" />
                                                    )}
                                                    <span>{item.title}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <Link
                        href={dashboard()}
                        prefetch
                        className="flex items-center space-x-2"
                    >
                        <AppLogo />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="ml-6 hidden h-full items-center space-x-1 lg:flex">
                        {mainNavItems.map((item, index) => (
                            <Link
                                key={index}
                                href={item.href}
                                className={cn(
                                    navigationMenuTriggerStyle(),
                                    whenCurrentUrl(
                                        item.href,
                                        activeItemStyles,
                                    ),
                                    'relative h-9 cursor-pointer px-3 flex items-center',
                                )}
                            >
                                {item.icon && (
                                    <item.icon className="mr-2 h-4 w-4" />
                                )}
                                <span>{item.title}</span>
                                {isCurrentUrl(item.href) && (
                                    <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-black dark:bg-white"></div>
                                )}
                            </Link>
                        ))}
                    </div>

                    <div className="ml-auto flex items-center space-x-2">
                        {auth.user ? (
                            <>
                            <NotificationCenter />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="size-10 rounded-full p-1"
                                    >
                                        <Avatar className="size-8 overflow-hidden rounded-full">
                                            <AvatarImage
                                                src={auth.user?.avatar}
                                                alt={auth.user?.name}
                                            />
                                            <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                                {getInitials(auth.user?.name ?? '')}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end">
                                    <UserMenuContent user={auth.user} />
                                </DropdownMenuContent>
                            </DropdownMenu>
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link href={login()}>
                                    <Button variant="ghost" size="sm" className="text-xs font-semibold text-gray-700 hover:text-gray-900">
                                        Log in
                                    </Button>
                                </Link>
                                <Link href={register()}>
                                    <Button size="sm" className="text-xs font-semibold bg-[#D4A017] hover:bg-[#B8860B] text-white shadow-xs">
                                        Register
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {breadcrumbs.length > 1 && (
                <div className="flex w-full border-b border-sidebar-border/70">
                    <div className="mx-auto flex h-12 w-full items-center justify-start px-4 text-neutral-500 md:max-w-7xl">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            )}
        </>
    );
}
