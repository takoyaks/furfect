import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { useThemeTemplate } from '@/hooks/use-theme-template';
import { 
    Search, 
    User as UserIcon, 
    Mail, 
    Lock, 
    Plus, 
    KeyRound, 
    UserCog, 
    Trash2, 
    Eye, 
    EyeOff, 
    Sparkles,
    Copy,
    Check,
    Users,
    ShieldCheck,
    CheckCircle2,
    AlertTriangle,
    RotateCcw,
    FileText,
    Heart,
    Activity
} from 'lucide-react';

interface AdopterProfileData {
    id: number;
    full_name: string;
    contact_number: string;
    date_of_birth: string;
    home_address: string;
    valid_id_type: string;
    valid_id_number: string;
    id_document_path?: string | null;
    id_document_back_path?: string | null;
    is_identity_verified: boolean;
    identity_verified_at?: string | null;
    identity_verification_provider?: string | null;
    profile_completed_at?: string | null;
    had_pets_before?: string;
    previous_pet_notes?: string | null;
    adoption_reason?: string;
}

interface LifestyleProfileData {
    id: number;
    housing_type: string;
    activity_level: string;
    work_schedule: string;
    household_size: number;
    has_children: string;
    other_pets: string;
    occupation?: string;
    monthly_income?: string;
    submitted_at?: string | null;
}

interface User {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    created_at: string;
    roles: { name: string }[];
    adopter_profile?: AdopterProfileData | null;
    lifestyle_profile?: LifestyleProfileData | null;
    applications_count?: number;
    saved_pets_count?: number;
    match_scores_count?: number;
}

interface Props {
    users: { 
        data: User[]; 
        links: any[];
        total: number;
    };
    roles: string[];
    tab: 'subscribers' | 'staff';
    counts: {
        subscribers: number;
        unverified_subscribers: number;
        staff: number;
    };
    filters: {
        search?: string;
        role?: string;
        verification?: string;
        tab?: string;
    };
}

export default function AdminUsers({ 
    users, 
    roles, 
    tab, 
    counts, 
    filters 
}: Props) {
    const theme = useThemeTemplate();
    const { auth } = usePage().props as any;
    const currentUserId = auth?.user?.id;

    const [currentTab, setCurrentTab] = useState<'subscribers' | 'staff'>(tab || 'subscribers');
    const [search, setSearch] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || 'all');
    const [verificationFilter, setVerificationFilter] = useState(filters.verification || 'all');

    // Modals
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [resettingUser, setResettingUser] = useState<User | null>(null);
    const [inspectingSubscriber, setInspectingSubscriber] = useState<User | null>(null);
    const [resettingSubscriber, setResettingSubscriber] = useState<User | null>(null);
    const [subscriberResetType, setSubscriberResetType] = useState<string>('quiz');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [copiedPassword, setCopiedPassword] = useState(false);

    const applyFilters = (newTab?: string, newSearch?: string, newRole?: string, newVerification?: string) => {
        const targetTab = newTab !== undefined ? newTab : currentTab;
        router.get(
            route('admin.users.index'),
            {
                tab: targetTab,
                search: (newSearch !== undefined ? newSearch : search) || undefined,
                role: targetTab === 'staff' && (newRole !== undefined ? newRole : roleFilter) !== 'all' ? (newRole !== undefined ? newRole : roleFilter) : undefined,
                verification: targetTab === 'subscribers' && (newVerification !== undefined ? newVerification : verificationFilter) !== 'all' ? (newVerification !== undefined ? newVerification : verificationFilter) : undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleTabChange = (t: 'subscribers' | 'staff') => {
        setCurrentTab(t);
        applyFilters(t, search, roleFilter, verificationFilter);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters(currentTab, search, roleFilter, verificationFilter);
    };

    const { data, setData, post, patch, processing, reset, errors } = useForm({
        name: '',
        email: '',
        password: '',
        role: roles[0] || 'shelter_staff',
    });

    const passwordForm = useForm({
        password: '',
        password_confirmation: '',
    });

    const openResetPassword = (u: User) => {
        setResettingUser(u);
        passwordForm.reset();
        passwordForm.clearErrors();
        setShowNewPassword(false);
        setCopiedPassword(false);
    };

    const handleResetPassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (!resettingUser) return;
        passwordForm.post(route('admin.users.reset-password', resettingUser.id), {
            onSuccess: () => {
                setResettingUser(null);
                passwordForm.reset();
            },
        });
    };

    const generateSecurePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
        let generated = '';
        for (let i = 0; i < 12; i++) {
            generated += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        passwordForm.setData({
            password: generated,
            password_confirmation: generated,
        });
        setShowNewPassword(true);
    };

    const copyGeneratedPassword = () => {
        if (passwordForm.data.password) {
            navigator.clipboard.writeText(passwordForm.data.password);
            setCopiedPassword(true);
            setTimeout(() => setCopiedPassword(false), 2000);
        }
    };

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.users.store'), {
            onSuccess: () => {
                setIsAddOpen(false);
                reset();
            }
        });
    };

    const handleEditUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        patch(route('admin.users.update', editingUser.id), {
            onSuccess: () => {
                setEditingUser(null);
                reset();
            }
        });
    };

    const handleDeactivate = (userId: number, name: string) => {
        if (confirm(`Are you sure you want to delete account for ${name}?`)) {
            router.delete(route('admin.users.destroy', userId));
        }
    };

    const [togglingVerificationId, setTogglingVerificationId] = useState<number | null>(null);

    const handleToggleVerification = (u: User) => {
        const isVerified = Boolean(u.adopter_profile?.is_identity_verified);
        const actionText = isVerified ? 'revoke identity verification for' : 'manually approve identity verification for';
        if (confirm(`Are you sure you want to ${actionText} ${u.name}?`)) {
            setTogglingVerificationId(u.id);
            router.post(route('admin.users.toggle-verification', u.id), {}, {
                preserveScroll: true,
                onFinish: () => setTogglingVerificationId(null),
            });
        }
    };

    const handleResetSubscriber = () => {
        if (!resettingSubscriber) return;
        router.post(route('admin.users.reset-subscriber', resettingSubscriber.id), {
            reset_type: subscriberResetType
        }, {
            onSuccess: () => {
                setResettingSubscriber(null);
            }
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Manage Users', href: '#' }]}>
            <Head title="Manage Users & Subscribers" />

            <div className="flex h-full flex-1 flex-col gap-5 p-4 sm:p-6 max-w-7xl mx-auto w-full">
                
                {/* Header & Main Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                            User & Subscriber Management
                        </h1>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Manage adopters, verify identity eKYC profiles, and configure staff access.
                        </p>
                    </div>

                    {currentTab === 'staff' && (
                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <Button className={`${theme.tabActive} text-xs h-9 shadow-xs flex items-center gap-1.5`}>
                                    <Plus className="size-4" /> Add Staff User
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Staff Member</DialogTitle>
                                    <DialogDescription className="text-xs">
                                        Create a new account for Shelter Staff, MAO Officer, or Admin.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleAddUser} className="space-y-4 text-xs">
                                    <div className="space-y-1">
                                        <Label htmlFor="add-name">Full Name</Label>
                                        <Input id="add-name" value={data.name} onChange={e => setData('name', e.target.value)} required leftIcon={<UserIcon className="size-4 text-gray-500" />} />
                                        {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="add-email">Email</Label>
                                        <Input id="add-email" type="email" value={data.email} onChange={e => setData('email', e.target.value)} required leftIcon={<Mail className="size-4 text-gray-500" />} />
                                        {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="add-password">Password</Label>
                                        <Input id="add-password" type="password" value={data.password} onChange={e => setData('password', e.target.value)} required leftIcon={<Lock className="size-4 text-gray-500" />} />
                                        {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="add-role">Role</Label>
                                        <Select value={data.role} onValueChange={val => setData('role', val)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {roles.filter(r => r !== 'adopter').map(r => (
                                                    <SelectItem key={r} value={r} className="capitalize">{r.replace('_', ' ')}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button type="submit" disabled={processing} className={`w-full ${theme.tabActive}`}>
                                        Create Staff Account
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {/* Sub-tab Switcher Banner */}
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                    <button
                        type="button"
                        onClick={() => handleTabChange('subscribers')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                            currentTab === 'subscribers'
                                ? theme.tabActive
                                : theme.tabInactive
                        }`}
                    >
                        <Users className="size-4" />
                        <span>Adopters</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            currentTab === 'subscribers' ? 'bg-black/20 text-current' : 'bg-gray-200 text-gray-700'
                        }`}>
                            {counts.subscribers}
                        </span>
                        {counts.unverified_subscribers > 0 && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded-full">
                                {counts.unverified_subscribers} pending eKYC
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabChange('staff')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                            currentTab === 'staff'
                                ? theme.tabActive
                                : theme.tabInactive
                        }`}
                    >
                        <ShieldCheck className="size-4" />
                        <span>Staff & Admins</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            currentTab === 'staff' ? 'bg-black/20 text-current' : 'bg-gray-200 text-gray-700'
                        }`}>
                            {counts.staff}
                        </span>
                    </button>
                </div>

                {/* Main Card with Table */}
                <Card className="border-gray-200 shadow-xs">
                    <CardHeader className="pb-3 pt-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                                <CardTitle className="text-sm font-bold text-gray-900">
                                    {currentTab === 'subscribers' ? 'Registered Adopters' : 'System Staff & Administrator Accounts'}
                                </CardTitle>
                                <CardDescription className="text-xs text-gray-500">
                                    {currentTab === 'subscribers' 
                                        ? 'Inspect identity documents, approve manual eKYC verification, and manage adopter preferences.'
                                        : 'Manage administrative roles, reset staff passwords, and control portal permissions.'}
                                </CardDescription>
                            </div>

                            {/* Search & Filters */}
                            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                                <Input
                                    placeholder="Search name, email, ID..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    leftIcon={<Search className="size-3.5 text-gray-400" />}
                                    className="h-8 text-xs w-full sm:w-56"
                                />

                                {currentTab === 'subscribers' && (
                                    <div className="w-36">
                                        <Select 
                                            value={verificationFilter} 
                                            onValueChange={val => {
                                                setVerificationFilter(val);
                                                applyFilters(currentTab, search, roleFilter, val);
                                            }}
                                        >
                                            <SelectTrigger className="h-8 text-xs bg-white">
                                                <SelectValue placeholder="Verification" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Verification</SelectItem>
                                                <SelectItem value="verified">Verified eKYC</SelectItem>
                                                <SelectItem value="unverified">Unverified</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {currentTab === 'staff' && (
                                    <div className="w-36">
                                        <Select 
                                            value={roleFilter} 
                                            onValueChange={val => {
                                                setRoleFilter(val);
                                                applyFilters(currentTab, search, val, verificationFilter);
                                            }}
                                        >
                                            <SelectTrigger className="h-8 text-xs bg-white">
                                                <SelectValue placeholder="Role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Roles</SelectItem>
                                                {roles.filter(r => r !== 'adopter').map(r => (
                                                    <SelectItem key={r} value={r} className="capitalize text-xs">{r.replace('_', ' ')}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <Button type="submit" size="sm" className="h-8 text-xs bg-[#FFBF00] hover:bg-[#E5A910] text-[#283F24] font-bold">
                                    Filter
                                </Button>
                            </form>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 border-t border-gray-100 overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-gray-50/70 text-gray-500 font-semibold border-b border-gray-100">
                                <tr>
                                    <th className="p-3">User Details</th>
                                    {currentTab === 'subscribers' ? (
                                        <>
                                            <th className="p-3">Identity / eKYC</th>
                                            <th className="p-3">Lifestyle Quiz</th>
                                            <th className="p-3">Applications & Matches</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="p-3">Role Permission</th>
                                            <th className="p-3">Status</th>
                                        </>
                                    )}
                                    <th className="p-3">Date Registered</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-400 text-xs">
                                            No {currentTab === 'subscribers' ? 'subscribers' : 'staff members'} found matching current filter.
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map(u => {
                                        const isCurrent = u.id === currentUserId;
                                        const profile = u.adopter_profile;
                                        const isVerified = Boolean(profile?.is_identity_verified);
                                        const hasQuiz = Boolean(u.lifestyle_profile?.submitted_at);
                                        const isToggling = togglingVerificationId === u.id;

                                        return (
                                            <tr key={u.id} className="hover:bg-gray-50/50">
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-[10px] text-gray-400 font-semibold">
                                                            #{u.id}
                                                        </span>
                                                        <div>
                                                            <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                                                                {u.name}
                                                                {isCurrent && (
                                                                    <span className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.2 rounded font-bold">
                                                                        YOU
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-[11px] text-gray-500">{u.email}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {currentTab === 'subscribers' ? (
                                                    <>
                                                        <td className="p-3">
                                                            <div className="flex items-center gap-1.5">
                                                                {isVerified ? (
                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                                        <CheckCircle2 className="size-3 text-emerald-600" />
                                                                        Verified {profile?.identity_verification_provider === 'manual_admin' ? '(Manual)' : '(Didit)'}
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                                                        <AlertTriangle className="size-3 text-amber-600" />
                                                                        Unverified
                                                                    </span>
                                                                )}

                                                                {/* One-click manual toggle button */}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    disabled={isToggling}
                                                                    onClick={() => handleToggleVerification(u)}
                                                                    className={`h-6 text-[10px] px-2 rounded-md font-semibold ${
                                                                        isVerified 
                                                                            ? 'text-red-700 hover:bg-red-50 hover:text-red-800' 
                                                                            : 'text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 border border-emerald-200'
                                                                    }`}
                                                                    title={isVerified ? "Click to Revoke Verification" : "Click to Manually Approve eKYC"}
                                                                >
                                                                    {isToggling ? 'Updating...' : (isVerified ? 'Revoke' : 'Manual Verify')}
                                                                </Button>
                                                            </div>
                                                        </td>

                                                        <td className="p-3">
                                                            {hasQuiz ? (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                                                    <Activity className="size-3 text-purple-600" />
                                                                    Submitted
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400 text-[10px] italic">Not submitted</span>
                                                            )}
                                                        </td>

                                                        <td className="p-3">
                                                            <div className="flex items-center gap-2">
                                                                <span title="Applications" className="inline-flex items-center gap-1 text-[10px] font-semibold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                                                                    <FileText className="size-3 text-gray-500" />
                                                                    {u.applications_count ?? 0}
                                                                </span>
                                                                <span title="Saved Pets" className="inline-flex items-center gap-1 text-[10px] font-semibold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-100">
                                                                    <Heart className="size-3 text-rose-500" />
                                                                    {u.saved_pets_count ?? 0}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="p-3">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                                                u.roles[0]?.name === 'admin' 
                                                                    ? 'bg-red-50 text-red-700 border-red-200' 
                                                                    : u.roles[0]?.name === 'shelter_staff' 
                                                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                                    : 'bg-purple-50 text-purple-700 border-purple-200'
                                                            }`}>
                                                                {u.roles[0]?.name?.replace('_', ' ') || 'Staff'}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-emerald-700 text-[11px] font-medium">
                                                            Active
                                                        </td>
                                                    </>
                                                )}

                                                <td className="p-3 text-gray-500 text-[11px]">
                                                    {new Date(u.created_at).toLocaleDateString()}
                                                </td>

                                                <td className="p-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {currentTab === 'subscribers' ? (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="size-7 rounded-lg text-theme hover:text-theme-hover hover:bg-theme-light"
                                                                    title="Inspect Subscriber Profile"
                                                                    onClick={() => setInspectingSubscriber(u)}
                                                                >
                                                                    <Eye className="size-3.5" />
                                                                </Button>

                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="size-7 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                                                                    title="Reset Quiz / eKYC Data"
                                                                    onClick={() => {
                                                                        setResettingSubscriber(u);
                                                                        setSubscriberResetType('quiz');
                                                                    }}
                                                                >
                                                                    <RotateCcw className="size-3.5" />
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-7 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                                                                title="Edit Staff Account"
                                                                onClick={() => {
                                                                    setEditingUser(u);
                                                                    setData({
                                                                        name: u.name,
                                                                        email: u.email,
                                                                        password: '',
                                                                        role: u.roles[0]?.name || 'shelter_staff',
                                                                    });
                                                                }}
                                                            >
                                                                <UserCog className="size-3.5" />
                                                            </Button>
                                                        )}

                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-7 rounded-lg text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                                                            title="Reset Password"
                                                            onClick={() => openResetPassword(u)}
                                                        >
                                                            <KeyRound className="size-3.5" />
                                                        </Button>

                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            disabled={isCurrent}
                                                            className={`size-7 rounded-lg ${
                                                                isCurrent
                                                                    ? 'text-gray-300 cursor-not-allowed'
                                                                    : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                                                            }`}
                                                            title={isCurrent ? 'Cannot delete your own account' : 'Delete user account'}
                                                            onClick={() => handleDeactivate(u.id, u.name)}
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Inspect Subscriber Dossier Modal */}
                <Dialog open={inspectingSubscriber !== null} onOpenChange={open => !open && setInspectingSubscriber(null)}>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold flex items-center gap-2">
                                <Users className="size-5 text-amber-600" />
                                <span>Subscriber Dossier: {inspectingSubscriber?.name}</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Complete personal information, verification files, and quiz preferences.
                            </DialogDescription>
                        </DialogHeader>

                        {inspectingSubscriber && (
                            <div className="space-y-4 text-xs">
                                {/* Account & Contact info */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div className="min-w-0">
                                        <span className="text-gray-400 font-medium block text-[10px] uppercase">Account ID</span>
                                        <span className="font-bold text-gray-800">#{inspectingSubscriber.id}</span>
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-gray-400 font-medium block text-[10px] uppercase">Email</span>
                                        <span className="font-medium text-gray-800 break-all block">{inspectingSubscriber.email}</span>
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-gray-400 font-medium block text-[10px] uppercase">Phone</span>
                                        <span className="font-medium text-gray-800 break-words block">{inspectingSubscriber.adopter_profile?.contact_number || inspectingSubscriber.phone || 'N/A'}</span>
                                    </div>
                                    <div className="min-w-0 sm:col-span-3 pt-2 border-t border-gray-100">
                                        <span className="text-gray-400 font-medium block text-[10px] uppercase">Home Address</span>
                                        <span className="font-medium text-gray-800 break-words block">{inspectingSubscriber.adopter_profile?.home_address || 'N/A'}</span>
                                    </div>
                                </div>

                                {/* eKYC Verification & Valid ID */}
                                <div className="border border-gray-200 rounded-lg p-3 space-y-2.5">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-gray-900">Identity &amp; ID Document Status</span>
                                        {inspectingSubscriber.adopter_profile?.is_identity_verified ? (
                                            <span className="text-emerald-800 bg-emerald-50 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-200 flex items-center gap-1">
                                                <CheckCircle2 className="size-3 text-emerald-600" /> Verified
                                            </span>
                                        ) : (
                                            <span className="text-amber-800 bg-amber-50 text-[10px] px-2 py-0.5 rounded font-bold border border-amber-200 flex items-center gap-1">
                                                <AlertTriangle className="size-3 text-amber-600" /> Unverified
                                            </span>
                                        )}
                                    </div>

                                    {inspectingSubscriber.adopter_profile ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                                            <div className="min-w-0 bg-white/80 p-2 rounded border border-stone-200/60">
                                                <span className="text-[10px] text-gray-400 font-semibold block uppercase">ID Type</span>
                                                <span className="font-semibold text-gray-800 break-words block capitalize">{inspectingSubscriber.adopter_profile.valid_id_type?.replace(/_/g, ' ') || 'N/A'}</span>
                                            </div>
                                            <div className="min-w-0 bg-white/80 p-2 rounded border border-stone-200/60">
                                                <span className="text-[10px] text-gray-400 font-semibold block uppercase">ID Number</span>
                                                <span className="font-semibold text-gray-800 break-words block">{inspectingSubscriber.adopter_profile.valid_id_number || 'N/A'}</span>
                                            </div>
                                            <div className="min-w-0 bg-white/80 p-2 rounded border border-stone-200/60">
                                                <span className="text-[10px] text-gray-400 font-semibold block uppercase">Front ID Document</span>
                                                <span className="font-medium text-gray-800 break-words block">
                                                    {inspectingSubscriber.adopter_profile.id_document_path ? '✓ Uploaded' : 'None'}
                                                </span>
                                            </div>
                                            <div className="min-w-0 bg-white/80 p-2 rounded border border-stone-200/60">
                                                <span className="text-[10px] text-gray-400 font-semibold block uppercase">Back ID Document</span>
                                                <span className="font-medium text-gray-800 break-words block">
                                                    {inspectingSubscriber.adopter_profile.id_document_back_path ? '✓ Uploaded' : 'None'}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 italic text-[11px]">No adopter profile record found.</p>
                                    )}
                                </div>

                                {/* Lifestyle Quiz Summary */}
                                <div className="border border-gray-200 rounded-lg p-3 space-y-2.5">
                                    <div className="font-bold text-gray-900">Lifestyle Profile &amp; Questionnaire</div>
                                    {inspectingSubscriber.lifestyle_profile ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px] bg-purple-50/50 p-2.5 rounded-lg border border-purple-100">
                                            <div className="min-w-0 bg-white/80 p-2 rounded border border-purple-100/80">
                                                <span className="text-[10px] text-purple-600 font-semibold block uppercase">Housing Type</span>
                                                <span className="font-semibold text-gray-800 break-words block capitalize">{inspectingSubscriber.lifestyle_profile.housing_type?.replace(/_/g, ' ') || 'N/A'}</span>
                                            </div>
                                            <div className="min-w-0 bg-white/80 p-2 rounded border border-purple-100/80">
                                                <span className="text-[10px] text-purple-600 font-semibold block uppercase">Activity Level</span>
                                                <span className="font-semibold text-gray-800 break-words block capitalize">{inspectingSubscriber.lifestyle_profile.activity_level?.replace(/_/g, ' ') || 'N/A'}</span>
                                            </div>
                                            <div className="min-w-0 bg-white/80 p-2 rounded border border-purple-100/80">
                                                <span className="text-[10px] text-purple-600 font-semibold block uppercase">Work Schedule</span>
                                                <span className="font-semibold text-gray-800 break-words block capitalize">{inspectingSubscriber.lifestyle_profile.work_schedule?.replace(/_/g, ' ') || 'N/A'}</span>
                                            </div>
                                            <div className="min-w-0 bg-white/80 p-2 rounded border border-purple-100/80">
                                                <span className="text-[10px] text-purple-600 font-semibold block uppercase">Household Size</span>
                                                <span className="font-semibold text-gray-800 break-words block">{inspectingSubscriber.lifestyle_profile.household_size ?? 'N/A'}</span>
                                            </div>
                                            <div className="min-w-0 bg-white/80 p-2 rounded border border-purple-100/80">
                                                <span className="text-[10px] text-purple-600 font-semibold block uppercase">Has Children</span>
                                                <span className="font-semibold text-gray-800 break-words block capitalize">{inspectingSubscriber.lifestyle_profile.has_children ? 'Yes' : 'No'}</span>
                                            </div>
                                            <div className="min-w-0 bg-white/80 p-2 rounded border border-purple-100/80">
                                                <span className="text-[10px] text-purple-600 font-semibold block uppercase">Submitted Date</span>
                                                <span className="font-semibold text-gray-800 break-words block">
                                                    {inspectingSubscriber.lifestyle_profile.submitted_at 
                                                        ? new Date(inspectingSubscriber.lifestyle_profile.submitted_at).toLocaleDateString() 
                                                        : 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 italic text-[11px]">Lifestyle quiz not yet completed.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <DialogFooter className="gap-2 sm:gap-0">
                            {inspectingSubscriber && (
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        handleToggleVerification(inspectingSubscriber);
                                        setInspectingSubscriber(null);
                                    }}
                                    className="bg-[#FFBF00] hover:bg-[#E5A910] text-[#283F24] font-bold text-xs"
                                >
                                    {inspectingSubscriber.adopter_profile?.is_identity_verified ? 'Revoke Verification' : 'Manually Verify Now'}
                                </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={() => setInspectingSubscriber(null)}>
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Subscriber Reset Modal */}
                <Dialog open={resettingSubscriber !== null} onOpenChange={open => !open && setResettingSubscriber(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold flex items-center gap-2 text-amber-700">
                                <RotateCcw className="size-5" />
                                <span>Reset Subscriber Profile Data</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Select which part of data to reset for <strong>{resettingSubscriber?.name}</strong>.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-2 text-xs">
                            <label className="font-semibold text-gray-800 block">Select Reset Target:</label>

                            <div className="space-y-2">
                                <label className="flex items-start gap-2.5 p-2.5 border rounded-lg hover:bg-amber-50/40 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="sub_reset_type" 
                                        value="quiz" 
                                        checked={subscriberResetType === 'quiz'} 
                                        onChange={() => setSubscriberResetType('quiz')}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <div className="font-semibold text-gray-900">Reset Lifestyle Quiz (Allow Retake)</div>
                                        <div className="text-gray-500 text-[11px]">Wipes quiz answers and computed DSS match scores so adopter can retake the quiz.</div>
                                    </div>
                                </label>

                                <label className="flex items-start gap-2.5 p-2.5 border rounded-lg hover:bg-amber-50/40 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="sub_reset_type" 
                                        value="ekyc" 
                                        checked={subscriberResetType === 'ekyc'} 
                                        onChange={() => setSubscriberResetType('ekyc')}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <div className="font-semibold text-gray-900">Reset eKYC & Identity Verification</div>
                                        <div className="text-gray-500 text-[11px]">Reverts status to unverified and deletes uploaded ID document files.</div>
                                    </div>
                                </label>

                                <label className="flex items-start gap-2.5 p-2.5 border rounded-lg hover:bg-amber-50/40 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="sub_reset_type" 
                                        value="applications" 
                                        checked={subscriberResetType === 'applications'} 
                                        onChange={() => setSubscriberResetType('applications')}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <div className="font-semibold text-gray-900">Clear Applications & Saved Pets</div>
                                        <div className="text-gray-500 text-[11px]">Clears all submitted adoption applications and favorite pet bookmarks.</div>
                                    </div>
                                </label>

                                <label className="flex items-start gap-2.5 p-2.5 border border-red-200 bg-red-50/30 rounded-lg hover:bg-red-50/60 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="sub_reset_type" 
                                        value="full" 
                                        checked={subscriberResetType === 'full'} 
                                        onChange={() => setSubscriberResetType('full')}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <div className="font-semibold text-red-900">Full Reset (Keep Login Only)</div>
                                        <div className="text-red-700 text-[11px]">Wipes all quiz, eKYC, and application records while preserving login credentials.</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" size="sm" onClick={() => setResettingSubscriber(null)}>
                                Cancel
                            </Button>
                            <Button 
                                size="sm"
                                onClick={handleResetSubscriber}
                                className="bg-[#FFBF00] hover:bg-[#E5A910] text-[#283F24] font-bold text-xs"
                            >
                                Confirm Reset
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit User Dialog */}
                <Dialog open={editingUser !== null} onOpenChange={open => !open && setEditingUser(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Staff Account</DialogTitle>
                            <DialogDescription className="text-xs">Modify name, email, or role permissions.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleEditUser} className="space-y-4 text-xs">
                            <div className="space-y-1">
                                <Label htmlFor="edit-name">Full Name</Label>
                                <Input id="edit-name" value={data.name} onChange={e => setData('name', e.target.value)} required leftIcon={<UserIcon className="size-4 text-gray-500" />} />
                                {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="edit-email">Email</Label>
                                <Input id="edit-email" type="email" value={data.email} onChange={e => setData('email', e.target.value)} required leftIcon={<Mail className="size-4 text-gray-500" />} />
                                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="edit-role">Role</Label>
                                <Select value={data.role} onValueChange={val => setData('role', val)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {roles.filter(r => r !== 'adopter').map(r => (
                                            <SelectItem key={r} value={r} className="capitalize">{r.replace('_', ' ')}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" disabled={processing} className="w-full bg-[#FFBF00] hover:bg-[#E5A910] text-[#283F24] font-bold">
                                Save Changes
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Reset Password Dialog */}
                <Dialog 
                    open={resettingUser !== null} 
                    onOpenChange={open => {
                        if (!open) {
                            setResettingUser(null);
                            passwordForm.reset();
                            passwordForm.clearErrors();
                        }
                    }}
                >
                    <DialogContent className="sm:max-w-[440px]">
                        <DialogHeader>
                            <div className="flex items-center gap-2">
                                <div className="flex size-9 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                                    <KeyRound className="size-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-base font-bold text-gray-900">Reset Password</DialogTitle>
                                    <DialogDescription className="text-xs text-gray-500">
                                        Set a new password for this account.
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        {resettingUser && (
                            <div className="my-1 rounded-lg border border-gray-100 bg-gray-50/80 p-3 text-xs space-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">User:</span>
                                    <span className="font-semibold text-gray-800">{resettingUser.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">Email:</span>
                                    <span className="text-gray-700">{resettingUser.email}</span>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={generateSecurePassword}
                                    className="text-xs h-7 px-2.5 text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:text-amber-800 flex items-center gap-1.5"
                                >
                                    <Sparkles className="size-3.5" />
                                    Generate Strong Password
                                </Button>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="reset-password">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="reset-password"
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={passwordForm.data.password}
                                        onChange={e => passwordForm.setData('password', e.target.value)}
                                        required
                                        placeholder="At least 8 characters"
                                        leftIcon={<Lock className="size-4 text-gray-500" />}
                                        className="pr-20"
                                    />
                                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                        {passwordForm.data.password && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-7 text-gray-500 hover:text-gray-700"
                                                onClick={copyGeneratedPassword}
                                                title={copiedPassword ? "Copied!" : "Copy password"}
                                            >
                                                {copiedPassword ? <Check className="size-3.5 text-green-600" /> : <Copy className="size-3.5" />}
                                            </Button>
                                        )}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-7 text-gray-500 hover:text-gray-700"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            title={showNewPassword ? "Hide password" : "Show password"}
                                        >
                                            {showNewPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                        </Button>
                                    </div>
                                </div>
                                {passwordForm.errors.password && (
                                    <p className="text-red-500 text-xs mt-1">{passwordForm.errors.password}</p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="reset-password-confirm">Confirm Password</Label>
                                <Input
                                    id="reset-password-confirm"
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={passwordForm.data.password_confirmation}
                                    onChange={e => passwordForm.setData('password_confirmation', e.target.value)}
                                    required
                                    placeholder="Repeat new password"
                                    leftIcon={<Lock className="size-4 text-gray-500" />}
                                />
                                {passwordForm.errors.password_confirmation && (
                                    <p className="text-red-500 text-xs mt-1">{passwordForm.errors.password_confirmation}</p>
                                )}
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setResettingUser(null)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={passwordForm.processing}
                                    className="flex-1 bg-[#FFBF00] hover:bg-[#E5A910] text-[#283F24] font-bold flex items-center justify-center gap-1.5"
                                >
                                    <KeyRound className="size-4" />
                                    {passwordForm.processing ? 'Resetting...' : 'Reset Password'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

            </div>
        </AppLayout>
    );
}
