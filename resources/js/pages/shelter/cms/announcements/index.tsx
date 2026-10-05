import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Megaphone, Plus, Edit, Trash2, Calendar, Image as ImageIcon, Search, Film, Play, Video } from 'lucide-react';
import InputError from '@/components/input-error';
import { RichTextEditor } from '@/components/rich-text-editor';
import { validateAndProcessVideo, formatVideoDuration } from '@/lib/video-helper';

interface Announcement {
    id: number;
    title: string;
    category: string;
    content: string;
    image_path?: string;
    video_path?: string;
    video_thumbnail_path?: string;
    video_duration?: number;
    is_published: boolean;
    published_at?: string;
}

interface Props {
    announcements: {
        data: Announcement[];
        links: any[];
    };
    filters: {
        search?: string;
    };
}

export default function AnnouncementsIndex({ announcements, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [isOpen, setIsOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Announcement | null>(null);

    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [isValidatingVideo, setIsValidatingVideo] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm<{
        title: string;
        category: string;
        content: string;
        is_published: boolean;
        image: File | null;
        video: File | null;
        video_thumbnail: File | null;
        video_duration: number | null;
        delete_video: boolean;
    }>({
        title: '',
        category: 'General Notice',
        content: '',
        is_published: true,
        image: null,
        video: null,
        video_thumbnail: null,
        video_duration: null,
        delete_video: false,
    });

    const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setVideoError(null);
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        setIsValidatingVideo(true);
        const result = await validateAndProcessVideo(file, 180); // 3 minutes for announcements
        setIsValidatingVideo(false);

        if (!result.isValid) {
            setVideoError(result.error || 'Invalid video file.');
            return;
        }

        setData((prev) => ({
            ...prev,
            video: file,
            video_thumbnail: result.posterFile || null,
            video_duration: result.duration || null,
            delete_video: false,
        }));
        setVideoPreviewUrl(result.previewUrl || null);
    };

    const removeVideo = () => {
        if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
        setData((prev) => ({
            ...prev,
            video: null,
            video_thumbnail: null,
            video_duration: null,
            delete_video: !!editingItem?.video_path,
        }));
        setVideoPreviewUrl(null);
        setVideoError(null);
    };

    const openCreateModal = () => {
        setEditingItem(null);
        setVideoPreviewUrl(null);
        setVideoError(null);
        reset();
        setIsOpen(true);
    };

    const openEditModal = (item: Announcement) => {
        setEditingItem(item);
        setVideoPreviewUrl(null);
        setVideoError(null);
        setData({
            title: item.title,
            category: item.category,
            content: item.content,
            is_published: item.is_published,
            image: null,
            video: null,
            video_thumbnail: null,
            video_duration: null,
            delete_video: false,
        });
        setIsOpen(true);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('shelter.cms.announcements.index'), { search }, { preserveState: true });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            post(route('shelter.cms.announcements.update', editingItem.id), {
                forceFormData: true,
                onSuccess: () => {
                    setIsOpen(false);
                    reset();
                },
            });
        } else {
            post(route('shelter.cms.announcements.store'), {
                forceFormData: true,
                onSuccess: () => {
                    setIsOpen(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this announcement?')) {
            router.delete(route('shelter.cms.announcements.destroy', id));
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Content & Pages', href: '#' }, { title: 'Announcements', href: route('shelter.cms.announcements.index') }]}>
            {/* <Head title="Announcements Management — Admin Panel" /> */}

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Megaphone className="h-6 w-6 text-[#D4A017]" />
                            <h1 className="text-2xl font-bold text-gray-900">Shelter Announcements Manager</h1>
                        </div>
                        <p className="text-gray-500 text-xs">Create, publish, and manage shelter news, events, vaccination drives, and alerts.</p>
                    </div>

                    <Button onClick={openCreateModal} className="bg-[#D4A017] hover:bg-[#B8860B] text-white font-semibold gap-2">
                        <Plus className="h-4 w-4" />
                        Create Announcement
                    </Button>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <form onSubmit={handleSearch} className="flex items-center gap-2 w-full max-w-md">
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search announcements by title or category..."
                            className="text-xs"
                        />
                        <Button type="submit" variant="secondary" size="sm" className="gap-1 text-xs">
                            <Search className="h-3.5 w-3.5" />
                            Search
                        </Button>
                    </form>
                </div>

                {/* Table Listing */}
                <Card className="border-gray-200 shadow-sm">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="w-16">Graphic</TableHead>
                                    <TableHead>Announcement Details</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Published Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {announcements.data.length > 0 ? (
                                    announcements.data.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                {item.video_thumbnail_path || item.image_path ? (
                                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                                                        <img
                                                            src={(item.video_thumbnail_path || item.image_path)!.startsWith('http') || (item.video_thumbnail_path || item.image_path)!.startsWith('/storage/') ? (item.video_thumbnail_path || item.image_path)! : `/storage/${item.video_thumbnail_path || item.image_path}`}
                                                            alt={item.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        {item.video_path && (
                                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                                <Play className="size-3 fill-current text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                                        {item.video_path ? <Video className="h-5 w-5 text-amber-500" /> : <ImageIcon className="h-5 w-5" />}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-bold text-gray-900 text-sm">{item.title}</div>
                                                <div className="text-xs text-gray-500 line-clamp-1 max-w-md" title={item.content?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}>
                                                    {item.content?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-[11px] font-semibold text-[#B8860B] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                                    {item.category}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                                                    item.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {item.is_published ? 'Published' : 'Draft'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs text-gray-500">
                                                {item.published_at ? new Date(item.published_at).toLocaleDateString() : '—'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end items-center gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => openEditModal(item)} className="h-8 w-8 text-gray-600 hover:text-[#D4A017]">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-gray-600 hover:text-red-600">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-xs text-gray-400">
                                            No announcements found. Click "Create Announcement" to add one.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Create / Edit Modal */}
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingItem ? 'Edit Announcement' : 'Create New Announcement'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="title">Announcement Title *</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="e.g. Free Anti-Rabies Vaccination Drive"
                                    required
                                />
                                <InputError message={errors.title} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Category *</Label>
                                <Input
                                    id="category"
                                    value={data.category}
                                    onChange={(e) => setData('category', e.target.value)}
                                    placeholder="e.g. Adoption Drive, Notice, Event"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="content">Announcement Content Body (Rich Text) *</Label>
                                <RichTextEditor
                                    id="content"
                                    value={data.content}
                                    onChange={(val) => setData('content', val)}
                                    placeholder="Write full details of the announcement with headings, font styles, colors, and lists..."
                                    minHeight="220px"
                                />
                                <InputError message={errors.content} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="image">Feature Image Graphic (Optional)</Label>
                                <Input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setData('image', e.target.files?.[0] || null)}
                                    className="cursor-pointer text-xs"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="video" className="flex items-center gap-1.5 text-xs font-semibold">
                                        <Film className="size-3.5 text-[#D4A017]" /> Video Broadcast Clip (Optional)
                                    </Label>
                                    {(data.video_duration || editingItem?.video_duration) && (
                                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                            Duration: {formatVideoDuration(data.video_duration || editingItem?.video_duration)}
                                        </span>
                                    )}
                                </div>

                                {videoPreviewUrl ? (
                                    <div className="relative rounded-xl overflow-hidden bg-black p-2 border border-gray-200">
                                        <video
                                            src={videoPreviewUrl}
                                            controls
                                            playsInline
                                            preload="metadata"
                                            className="w-full max-h-48 object-contain mx-auto rounded-lg"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={removeVideo}
                                            className="absolute top-4 right-4 h-7 text-xs px-2"
                                        >
                                            Remove New Video
                                        </Button>
                                    </div>
                                ) : editingItem?.video_path && !data.delete_video ? (
                                    <div className="relative rounded-xl overflow-hidden bg-black p-2 border border-gray-200">
                                        <video
                                            src={editingItem.video_path.startsWith('http') || editingItem.video_path.startsWith('/storage/') ? editingItem.video_path : `/storage/${editingItem.video_path}`}
                                            poster={editingItem.video_thumbnail_path ? (editingItem.video_thumbnail_path.startsWith('http') || editingItem.video_thumbnail_path.startsWith('/storage/') ? editingItem.video_thumbnail_path : `/storage/${editingItem.video_thumbnail_path}`) : undefined}
                                            controls
                                            playsInline
                                            preload="metadata"
                                            className="w-full max-h-48 object-contain mx-auto rounded-lg"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={removeVideo}
                                            className="absolute top-4 right-4 h-7 text-xs px-2"
                                        >
                                            Delete Current Video
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <Input
                                            id="video"
                                            type="file"
                                            accept="video/mp4,video/quicktime,video/webm"
                                            onChange={handleVideoChange}
                                            disabled={isValidatingVideo}
                                            className="cursor-pointer text-xs"
                                        />
                                        <p className="text-[11px] text-gray-400">
                                            {isValidatingVideo ? 'Validating video & generating poster...' : 'MP4, MOV, WEBM up to 50MB (max 3 minutes). Auto-compressed for web.'}
                                        </p>
                                    </div>
                                )}

                                {videoError && <p className="text-xs text-red-500 font-medium">{videoError}</p>}
                                <InputError message={errors.video} />
                            </div>

                            <div className="flex items-center space-x-3 pt-2">
                                <Checkbox
                                    id="is_published"
                                    checked={data.is_published}
                                    onCheckedChange={(checked) => setData('is_published', !!checked)}
                                    className="border-gray-400 data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017]"
                                />
                                <Label htmlFor="is_published" className="text-xs font-semibold text-gray-800 cursor-pointer">
                                    Publish immediately to Home Page news feed
                                </Label>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="text-xs">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing} className="bg-[#D4A017] hover:bg-[#B8860B] text-white text-xs font-semibold">
                                    {processing ? 'Saving...' : editingItem ? 'Update Announcement' : 'Publish Announcement'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
