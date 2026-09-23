import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Megaphone, Search, X, Calendar, ArrowRight, Tag } from 'lucide-react';
import { useState } from 'react';
import { AppFooter } from '@/components/app-footer';
import { getTheme } from '@/lib/theme-templates';

interface Announcement {
    id: number;
    title: string;
    slug?: string;
    category: string;
    content: string;
    image_path?: string | null;
    published_at?: string | null;
}

interface Props {
    config?: any;
    announcements: {
        data: Announcement[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
    };
    categories: string[];
    filters: {
        category: string;
        search: string;
    };
}

export default function AnnouncementsIndex({ config, announcements, categories = [], filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const activeCategory = filters.category || 'all';
    const theme = getTheme(config?.template_name);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('announcements.index'),
            {
                search: search || undefined,
                category: activeCategory !== 'all' ? activeCategory : undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleClearSearch = () => {
        setSearch('');
        router.get(
            route('announcements.index'),
            {
                search: undefined,
                category: activeCategory !== 'all' ? activeCategory : undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleSelectCategory = (cat: string) => {
        router.get(
            route('announcements.index'),
            {
                search: search || undefined,
                category: cat !== 'all' ? cat : undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Announcements', href: route('announcements.index') }]}>
            <Head title="Shelter Announcements & Updates — FurFect Match" />

            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
                {/* Header Banner */}
                <div className={`rounded-3xl p-8 md:p-10 shadow-xs space-y-4 ${theme.heroGradient}`}>
                    <div className={`inline-flex items-center gap-2 ${theme.heroBadge} px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider`}>
                        <Megaphone className="h-3.5 w-3.5" />
                        Virac Shelter News
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                        Shelter Announcements &amp; Updates
                    </h1>
                    <p className="text-gray-600 text-sm md:text-base max-w-3xl leading-relaxed">
                        Stay informed on upcoming adoption events, veterinary missions, vaccination drives, shelter announcements, and community animal welfare updates from Virac Animal Shelter.
                    </p>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
                    {/* Category Chips */}
                    <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                        <button
                            type="button"
                            onClick={() => handleSelectCategory('all')}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                activeCategory === 'all'
                                    ? `${theme.primaryButton} shadow-xs`
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            All Categories
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => handleSelectCategory(cat)}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all capitalize cursor-pointer ${
                                    activeCategory === cat
                                        ? `${theme.primaryButton} shadow-xs`
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Search Input with Clear Button */}
                    <form onSubmit={handleSearch} className="relative w-full sm:w-72 shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search updates..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-8 text-xs h-9 rounded-xl border-gray-200 focus:border-[#D4A017] focus:ring-[#D4A017]"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </form>
                </div>

                {/* Announcements Grid */}
                {announcements.data.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {announcements.data.map((item) => (
                            <Link
                                key={item.id}
                                href={route('announcements.show', item.id)}
                                className="group block focus:outline-none"
                            >
                                <Card className={`h-full border-gray-200 shadow-xs hover:shadow-md ${theme.hoverBorder} transition-all rounded-2xl overflow-hidden flex flex-col justify-between group-hover:-translate-y-0.5 duration-200`}>
                                    <div>
                                        {item.image_path ? (
                                            <div className="w-full h-48 bg-gray-100 relative overflow-hidden">
                                                <img
                                                    src={item.image_path.startsWith('http') || item.image_path.startsWith('/storage/') ? item.image_path : `/storage/${item.image_path}`}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <span className={`absolute top-3 left-3 text-[10px] font-bold ${theme.announcementBadge} px-2.5 py-0.5 rounded-full uppercase shadow-xs`}>
                                                    {item.category}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className={`w-full h-32 ${theme.announcementBanner} flex items-center justify-between px-6 border-b`}>
                                                <div className={`w-10 h-10 rounded-xl ${theme.iconBg} ${theme.iconText} flex items-center justify-center`}>
                                                    <Megaphone className="h-5 w-5" />
                                                </div>
                                                <span className={`text-[10px] font-bold ${theme.announcementBadge} px-2.5 py-0.5 rounded-full uppercase`}>
                                                    {item.category}
                                                </span>
                                            </div>
                                        )}

                                        <CardContent className="p-5 space-y-2.5">
                                            {item.published_at && (
                                                <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-amber-500" />
                                                    <span>{new Date(item.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                                </div>
                                            )}
                                            <h3 className={`font-bold text-base text-gray-900 group-hover:${theme.accentText} transition-colors line-clamp-2`}>
                                                {item.title}
                                            </h3>
                                            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed" title={item.content?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}>
                                                {item.content?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}
                                            </p>
                                        </CardContent>
                                    </div>

                                    <div className={`p-5 pt-0 flex items-center justify-between text-xs font-bold ${theme.accentText} transition-colors`}>
                                        <span>Read Full Update</span>
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className={`${theme.cardHighlightBg} border ${theme.cardHighlightBorder} rounded-2xl p-12 text-center space-y-3`}>
                        <div className={`w-12 h-12 rounded-full ${theme.iconBg} ${theme.iconText} flex items-center justify-center mx-auto`}>
                            <Megaphone className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold text-gray-800 text-base">No announcements found</h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto">
                            {search || activeCategory !== 'all'
                                ? 'No updates match your current filters. Try resetting the search or category.'
                                : 'Check back soon for new updates, vaccination drives, and shelter activities!'}
                        </p>
                        {(search || activeCategory !== 'all') && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSearch('');
                                    handleSelectCategory('all');
                                }}
                                className="text-xs mt-2 border-gray-300"
                            >
                                Clear All Filters
                            </Button>
                        )}
                    </div>
                )}

                {/* Pagination */}
                {announcements.last_page > 1 && (
                    <div className="flex justify-center items-center gap-1.5 pt-4">
                        {announcements.links.map((link, idx) => (
                            <Button
                                key={idx}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                className={`text-xs h-8 px-3 ${
                                    link.active ? `${theme.primaryButton}` : 'border-gray-200 text-gray-600'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <AppFooter config={config} />
        </AppLayout>
    );
}
