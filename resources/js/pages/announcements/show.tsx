import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft, Megaphone, ShieldCheck, Heart, ArrowRight, Share2, Check } from 'lucide-react';
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
    created_at?: string;
}

interface Props {
    config?: any;
    announcement: Announcement;
    recentAnnouncements?: Announcement[];
}

export default function AnnouncementShow({ config, announcement, recentAnnouncements = [] }: Props) {
    const [copied, setCopied] = useState(false);
    const theme = getTheme(config?.template_name);

    const handleShare = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Announcements', href: route('announcements.index') },
                { title: announcement.title, href: route('announcements.show', announcement.id) },
            ]}
        >
            <Head title={`${announcement.title} — Shelter Announcements`} />

            <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
                {/* Back Button & Share */}
                <div className="flex items-center justify-between">
                    <Link href={route('announcements.index')}>
                        <Button variant="ghost" size="sm" className="text-xs font-semibold text-gray-600 hover:text-gray-900 gap-1.5 -ml-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Announcements
                        </Button>
                    </Link>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShare}
                        className="text-xs font-semibold border-gray-200 text-gray-700 hover:bg-gray-50 gap-1.5 rounded-xl"
                    >
                        {copied ? (
                            <>
                                <Check className="h-3.5 w-3.5 text-green-600" />
                                <span className="text-green-600">Link Copied!</span>
                            </>
                        ) : (
                            <>
                                <Share2 className="h-3.5 w-3.5 text-gray-500" />
                                <span>Share</span>
                            </>
                        )}
                    </Button>
                </div>

                {/* Main Article Container */}
                <article className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
                    {/* Header Meta */}
                    <div className="space-y-3 border-b border-gray-100 pb-6">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[11px] font-bold ${theme.announcementBadge} px-3 py-1 rounded-full uppercase tracking-wider`}>
                                {announcement.category}
                            </span>
                            {announcement.published_at && (
                                <div className="text-xs text-gray-400 flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-amber-500" />
                                    <span>
                                        Published on{' '}
                                        {new Date(announcement.published_at).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </span>
                                </div>
                            )}
                        </div>

                        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-snug">
                            {announcement.title}
                        </h1>
                    </div>

                    {/* Featured Image */}
                    {announcement.image_path && (
                        <div className="w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-xs max-h-[480px]">
                            <img
                                src={announcement.image_path.startsWith('http') || announcement.image_path.startsWith('/storage/') ? announcement.image_path : `/storage/${announcement.image_path}`}
                                alt={announcement.title}
                                className="w-full h-auto object-cover max-h-[480px]"
                            />
                        </div>
                    )}

                    {/* Article Content */}
                    <div className="prose max-w-none text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-line py-2">
                        {announcement.content}
                    </div>

                    {/* Official Banner Tag */}
                    <div className={`${theme.cardHighlightBg} border ${theme.cardHighlightBorder} rounded-2xl p-5 flex items-start sm:items-center gap-4 mt-6`}>
                        <div className={`w-10 h-10 rounded-xl ${theme.iconBg} ${theme.iconText} flex items-center justify-center shrink-0`}>
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                            <h4 className="font-bold text-xs sm:text-sm text-gray-900">Official Municipal Notice</h4>
                            <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">
                                Issued by the Virac Municipal Animal Office (MAO) and Virac Animal Shelter. For inquiries, contact the shelter hotline.
                            </p>
                        </div>
                    </div>
                </article>

                {/* Call To Action Box */}
                <div className={`rounded-3xl p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md ${theme.ctaBannerBg}`}>
                    <div className="space-y-1 text-center sm:text-left">
                        <h3 className="font-extrabold text-xl text-white">Looking for a Furry Companion?</h3>
                        <p className="text-white/80 text-xs sm:text-sm max-w-md">
                            Browse all healthy rescued pets currently available for adoption in Virac.
                        </p>
                    </div>
                    <Link href={route('pets.index')}>
                        <Button className={`bg-white ${theme.ctaBannerText} hover:bg-white/90 font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs gap-1.5 shrink-0`}>
                            <Heart className={`h-4 w-4 ${theme.accentText} fill-current`} />
                            Explore Available Pets
                        </Button>
                    </Link>
                </div>

                {/* Recent Announcements Section */}
                {recentAnnouncements.length > 0 && (
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                <Megaphone className={`h-4 w-4 ${theme.accentText}`} />
                                More Announcements &amp; Updates
                            </h3>
                            <Link href={route('announcements.index')}>
                                <Button variant="ghost" className={`text-xs font-bold ${theme.primaryButtonGhost} gap-1`}>
                                    View All <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {recentAnnouncements.map((item) => (
                                <Link
                                    key={item.id}
                                    href={route('announcements.show', item.id)}
                                    className="group block focus:outline-none"
                                >
                                    <Card className={`h-full border-gray-200 shadow-xs hover:shadow-md ${theme.hoverBorder} transition-all rounded-xl overflow-hidden p-4 space-y-2 flex flex-col justify-between`}>
                                        <div className="space-y-1.5">
                                            <span className={`text-[9px] font-bold ${theme.announcementBadge} px-2 py-0.5 rounded uppercase`}>
                                                {item.category}
                                            </span>
                                            <h4 className={`font-bold text-xs text-gray-900 group-hover:${theme.accentText} transition-colors line-clamp-2`}>
                                                {item.title}
                                            </h4>
                                        </div>
                                        {item.published_at && (
                                            <div className="text-[10px] text-gray-400 flex items-center gap-1 pt-2 border-t border-gray-100">
                                                <Calendar className="h-3 w-3" />
                                                <span>{new Date(item.published_at).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <AppFooter config={config} />
        </AppLayout>
    );
}
