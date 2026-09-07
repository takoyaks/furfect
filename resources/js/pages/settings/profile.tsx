import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Camera, Check, MapPin, Phone, Trash2 } from 'lucide-react';
import React, { useRef, useState } from 'react';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useInitials } from '@/hooks/use-initials';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;
    const getInitials = useInitials();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        name: auth.user.name || '',
        email: auth.user.email || '',
        phone: (auth.user.phone as string) || '',
        address: (auth.user.address as string) || '',
        bio: (auth.user.bio as string) || '',
        avatar: null as File | null,
        remove_avatar: false,
        _method: 'patch',
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData((prev) => ({
                ...prev,
                avatar: file,
                remove_avatar: false,
            }));
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handleRemoveAvatar = () => {
        setData((prev) => ({
            ...prev,
            avatar: null,
            remove_avatar: true,
        }));
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('profile.update'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            },
        });
    };

    // Format display role
    const userRole = (auth.user.roles && auth.user.roles[0])
        ? auth.user.roles[0]
            .replace('_', ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : 'Member';

    const currentAvatarSrc = !data.remove_avatar ? (previewUrl || auth.user.avatar || undefined) : undefined;

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile"
                    description="Manage your account profile picture, contact details, and personal information."
                />

                {/* Profile Overview Card */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-xs">
                    <div className="flex items-center gap-4">
                        <Avatar className="size-16 rounded-full border-2 border-primary/20 shadow-xs">
                            <AvatarImage
                                src={currentAvatarSrc}
                                alt={data.name || auth.user.name}
                                className="object-cover"
                            />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                                {getInitials(data.name || auth.user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground text-base">
                                    {auth.user.name}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                    {userRole}
                                </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground block mt-0.5">
                                {auth.user.email}
                            </span>
                            {auth.user.created_at && (
                                <span className="text-[11px] text-muted-foreground block mt-0.5">
                                    Joined {new Date(auth.user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Avatar Upload Section */}
                    <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
                        <div>
                            <Label className="text-sm font-semibold text-foreground">Profile Picture</Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Upload a photo to personalize your account across Furfect.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <Avatar className="size-20 rounded-full border border-border shadow-xs shrink-0">
                                <AvatarImage
                                    src={currentAvatarSrc}
                                    alt={data.name || auth.user.name}
                                    className="object-cover"
                                />
                                <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-xl">
                                    {getInitials(data.name || auth.user.name)}
                                </AvatarFallback>
                            </Avatar>

                            <div className="space-y-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    id="avatar-upload"
                                />

                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="cursor-pointer gap-1.5"
                                    >
                                        <Camera className="size-4" />
                                        <span>{currentAvatarSrc ? 'Change photo' : 'Upload photo'}</span>
                                    </Button>

                                    {currentAvatarSrc && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleRemoveAvatar}
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer gap-1.5"
                                        >
                                            <Trash2 className="size-4" />
                                            <span>Remove</span>
                                        </Button>
                                    )}
                                </div>

                                <p className="text-[11px] text-muted-foreground">
                                    Recommended: Square JPG, PNG, or WEBP. Max size 2MB.
                                </p>

                                <InputError message={errors.avatar} />
                            </div>
                        </div>
                    </div>

                    {/* Basic Information */}
                    <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
                        <div className="border-b border-border pb-3">
                            <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                General details identifying your account.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    autoComplete="name"
                                    placeholder="Enter your full name"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-1.5 sm:col-span-2">
                                <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                    autoComplete="username"
                                    placeholder="Enter your email address"
                                />
                                <InputError message={errors.email} />
                            </div>

                            {mustVerifyEmail && auth.user.email_verified_at === null && (
                                <div className="sm:col-span-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                                    <p>
                                        Your email address is unverified.{' '}
                                        <Link
                                            href={send()}
                                            as="button"
                                            className="underline font-medium hover:text-amber-900 cursor-pointer"
                                        >
                                            Click here to re-send the verification email.
                                        </Link>
                                    </p>

                                    {status === 'verification-link-sent' && (
                                        <div className="mt-2 text-sm font-medium text-green-700">
                                            A new verification link has been sent to your email address.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contact & Additional Details */}
                    <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
                        <div className="border-b border-border pb-3">
                            <h3 className="text-sm font-semibold text-foreground">Contact & Additional Details</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Optional contact details used for shelter communications and adoptions.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="phone">Phone / Contact Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            placeholder="+63 912 345 6789"
                                            className="pl-9"
                                        />
                                    </div>
                                    <InputError message={errors.phone} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="address">Address / Location</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                                        <Input
                                            id="address"
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            placeholder="Barangay, City, Province"
                                            className="pl-9"
                                        />
                                    </div>
                                    <InputError message={errors.address} />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="bio">Bio / About Me</Label>
                                    <span className="text-[11px] text-muted-foreground">
                                        {data.bio.length}/500
                                    </span>
                                </div>
                                <Textarea
                                    id="bio"
                                    value={data.bio}
                                    maxLength={500}
                                    onChange={(e) => setData('bio', e.target.value)}
                                    placeholder="Write a brief introduction about yourself, your pet experience, or your household..."
                                    rows={3}
                                />
                                <InputError message={errors.bio} />
                            </div>
                        </div>
                    </div>

                    {/* Submit Section */}
                    <div className="flex items-center gap-3">
                        <Button
                            type="submit"
                            disabled={processing}
                            data-test="update-profile-button"
                            className="cursor-pointer"
                        >
                            {processing ? 'Saving...' : 'Save changes'}
                        </Button>

                        {recentlySuccessful && (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                                <Check className="size-4" />
                                Saved successfully
                            </span>
                        )}
                    </div>
                </form>
            </div>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
