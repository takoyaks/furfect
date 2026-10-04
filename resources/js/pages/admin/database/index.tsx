import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
    Database, 
    Search, 
    Trash2, 
    Eye, 
    Terminal, 
    RefreshCw, 
    AlertTriangle, 
    ShieldAlert,
    RotateCcw,
    Trash,
    ShieldCheck,
    CheckCircle2,
    Users,
    Dog,
    FileText,
    Pencil,
    KeyRound,
    ArrowLeftRight,
    SlidersHorizontal,
    XCircle,
    Clock
} from 'lucide-react';

interface UserRecord {
    id: number;
    name: string;
    email: string;
    created_at: string;
    roles: { name: string }[];
    adopter_profile?: {
        id: number;
        full_name: string;
        is_identity_verified: boolean;
    } | null;
    applications_count: number;
    saved_pets_count: number;
    match_scores_count: number;
    didit_verifications_count: number;
}

interface PetRecord {
    id: number;
    name: string;
    species: string;
    breed: string | null;
    status: 'available' | 'adopted' | 'archived';
    shelter?: {
        id: number;
        name: string;
    } | null;
    created_at: string;
}

interface ApplicationRecord {
    id: number;
    reference_number: string;
    status: string;
    submitted_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
    } | null;
    pet?: {
        id: number;
        name: string;
        status: string;
        species: string;
    } | null;
    timelines?: {
        id: number;
        title: string;
        description: string;
        action: string;
        created_at: string;
    }[];
}

interface PaginatedData<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
}

interface PageProps {
    stats: Record<string, number>;
    users: PaginatedData<UserRecord>;
    pets: PaginatedData<PetRecord>;
    applications: PaginatedData<ApplicationRecord>;
    roles: string[];
    filters: {
        search?: string;
        role?: string;
        pet_search?: string;
        pet_status?: string;
        app_search?: string;
        app_status?: string;
        tab?: string;
    };
    logs: string;
}

export default function Level2SuperAdmin({ stats, users, pets, applications, roles, filters, logs }: PageProps) {
    const { auth } = usePage().props as any;
    const currentUserId = auth?.user?.id;

    const [activeTab, setActiveTab] = useState<'users' | 'pets' | 'applications' | 'logs'>(
        (filters.tab as any) || 'users'
    );

    // Search & Filter state
    const [userSearch, setUserSearch] = useState(filters.search || '');
    const [userRole, setUserRole] = useState(filters.role || 'all');

    const [petSearch, setPetSearch] = useState(filters.pet_search || '');
    const [petStatus, setPetStatus] = useState(filters.pet_status || 'all');

    const [appSearch, setAppSearch] = useState(filters.app_search || '');
    const [appStatus, setAppStatus] = useState(filters.app_status || 'all');

    // Modals: User
    const [userToEdit, setUserToEdit] = useState<UserRecord | null>(null);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [isUpdatingUser, setIsUpdatingUser] = useState(false);

    const [userToResetPassword, setUserToResetPassword] = useState<UserRecord | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [isResettingPassword, setIsResettingPassword] = useState(false);

    const [inspectingUser, setInspectingUser] = useState<any | null>(null);
    const [inspectLoading, setInspectLoading] = useState(false);

    const [userToDelete, setUserToDelete] = useState<UserRecord | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Modals: Pet
    const [petToEdit, setPetToEdit] = useState<PetRecord | null>(null);
    const [editPetName, setEditPetName] = useState('');
    const [editPetStatus, setEditPetStatus] = useState<'available' | 'adopted' | 'archived'>('available');
    const [isUpdatingPet, setIsUpdatingPet] = useState(false);

    // Modals: Application Override / Rollback
    const [appToOverride, setAppToOverride] = useState<ApplicationRecord | null>(null);
    const [overrideStatus, setOverrideStatus] = useState<string>('pending');
    const [overrideReason, setOverrideReason] = useState<string>('');
    const [syncPetStatus, setSyncPetStatus] = useState<boolean>(true);
    const [isOverridingApp, setIsOverridingApp] = useState(false);

    // Modals: Master Reset
    const [resetScope, setResetScope] = useState<'all' | 'adopted_data' | 'verification_data' | 'quiz_data' | null>(null);
    const [isResetting, setIsResetting] = useState(false);

    // Filter submit handlers
    const handleUserSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('admin.database.index'),
            {
                tab: 'users',
                search: userSearch || undefined,
                role: userRole !== 'all' ? userRole : undefined,
            },
            { preserveState: true }
        );
    };

    const handlePetSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('admin.database.index'),
            {
                tab: 'pets',
                pet_search: petSearch || undefined,
                pet_status: petStatus !== 'all' ? petStatus : undefined,
            },
            { preserveState: true }
        );
    };

    const handleAppSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('admin.database.index'),
            {
                tab: 'applications',
                app_search: appSearch || undefined,
                app_status: appStatus !== 'all' ? appStatus : undefined,
            },
            { preserveState: true }
        );
    };

    // User Edit Handlers
    const openEditUser = (user: UserRecord) => {
        setUserToEdit(user);
        setEditName(user.name);
        setEditEmail(user.email);
    };

    const handleSaveUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userToEdit) return;
        setIsUpdatingUser(true);
        router.patch(
            route('admin.database.users.update', userToEdit.id),
            { name: editName, email: editEmail },
            {
                onFinish: () => {
                    setIsUpdatingUser(false);
                    setUserToEdit(null);
                },
            }
        );
    };

    // Reset Password Handlers
    const openResetPassword = (user: UserRecord) => {
        setUserToResetPassword(user);
        setNewPassword('');
    };

    const generateRandomPassword = () => {
        const randomStr = 'Pass' + Math.random().toString(36).substring(2, 8) + '!';
        setNewPassword(randomStr);
    };

    const handleSavePassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userToResetPassword) return;
        setIsResettingPassword(true);
        router.post(
            route('admin.database.users.reset-password', userToResetPassword.id),
            { password: newPassword },
            {
                onFinish: () => {
                    setIsResettingPassword(false);
                    setUserToResetPassword(null);
                },
            }
        );
    };

    // User Inspect
    const openInspect = async (user: UserRecord) => {
        setInspectLoading(true);
        try {
            const res = await fetch(`/admin/database/users/${user.id}`, {
                headers: { credentials: 'same-origin', Accept: 'application/json' },
            });
            const data = await res.json();
            setInspectingUser(data.user);
        } catch (err) {
            console.error('Failed to load user tree', err);
        } finally {
            setInspectLoading(false);
        }
    };

    // Cascade Delete
    const handleCascadeDelete = () => {
        if (!userToDelete) return;
        setIsDeleting(true);
        router.delete(`/admin/database/users/${userToDelete.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setUserToDelete(null);
            },
        });
    };

    // Pet Edit Handlers
    const openEditPet = (pet: PetRecord) => {
        setPetToEdit(pet);
        setEditPetName(pet.name);
        setEditPetStatus(pet.status);
    };

    const handleSavePet = (e: React.FormEvent) => {
        e.preventDefault();
        if (!petToEdit) return;
        setIsUpdatingPet(true);
        router.patch(
            route('admin.database.pets.update', petToEdit.id),
            { name: editPetName, status: editPetStatus },
            {
                onFinish: () => {
                    setIsUpdatingPet(false);
                    setPetToEdit(null);
                },
            }
        );
    };

    // Application Override Handlers
    const openOverrideApp = (app: ApplicationRecord) => {
        setAppToOverride(app);
        setOverrideStatus(app.status);
        setOverrideReason('');
        setSyncPetStatus(true);
    };

    const handleSaveOverrideApp = (e: React.FormEvent) => {
        e.preventDefault();
        if (!appToOverride) return;
        setIsOverridingApp(true);
        router.post(
            route('admin.database.applications.override-status', appToOverride.id),
            {
                status: overrideStatus,
                reason: overrideReason,
                sync_pet_status: syncPetStatus,
            },
            {
                onFinish: () => {
                    setIsOverridingApp(false);
                    setAppToOverride(null);
                },
            }
        );
    };

    // Master Reset Handler
    const handleMasterReset = () => {
        if (!resetScope) return;
        setIsResetting(true);
        router.post('/admin/database/reset-all', { scope: resetScope }, {
            onFinish: () => {
                setIsResetting(false);
                setResetScope(null);
            },
        });
    };

    const handleClearLogs = () => {
        if (confirm('Are you sure you want to clear system logs?')) {
            router.post('/admin/database/logs/clear');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'available':
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">Available</span>;
            case 'adopted':
            case 'released':
            case 'completed':
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800 border border-blue-200">{status}</span>;
            case 'approved':
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-100 text-green-800 border border-green-200">Approved</span>;
            case 'under_review':
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">Under Review</span>;
            case 'mao_audit':
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-800 border border-purple-200">MAO Audit</span>;
            case 'pending':
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-neutral-100 text-neutral-800 border border-neutral-200">Pending</span>;
            case 'rejected':
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-800 border border-red-200">Rejected</span>;
            case 'archived':
            case 'closed':
            case 'unclaimed':
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-neutral-200 text-neutral-700 border border-neutral-300">{status}</span>;
            default:
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-neutral-100 text-neutral-600 border border-neutral-200">{status}</span>;
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Level 2 Console', href: '#' }]}>
            <Head title="Level 2 Super Admin" />

            <div className="flex h-full flex-1 flex-col gap-5 p-4 sm:p-6 max-w-7xl mx-auto w-full">
                
                {/* Header Banner - Hidden / Discrete Super Admin styling */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-neutral-950 text-white p-4 sm:p-5 rounded-2xl shadow-sm border border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                            <ShieldAlert className="size-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-base font-bold text-white tracking-tight">Super Administrator (Level 2)</h1>
                                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded border border-amber-400/30">
                                    kerbie exclusive
                                </span>
                            </div>
                            <p className="text-xs text-neutral-400 mt-0.5">
                                Direct data manipulation, instant password resets, and application status override & rollback tools.
                            </p>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center bg-neutral-900 p-1 rounded-xl border border-neutral-800 overflow-x-auto w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => setActiveTab('users')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                                activeTab === 'users' 
                                    ? 'bg-amber-400 text-neutral-950 shadow-xs' 
                                    : 'text-neutral-400 hover:text-white'
                            }`}
                        >
                            <Users className="size-3.5" />
                            Users ({stats.users ?? 0})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('pets')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                                activeTab === 'pets' 
                                    ? 'bg-amber-400 text-neutral-950 shadow-xs' 
                                    : 'text-neutral-400 hover:text-white'
                            }`}
                        >
                            <Dog className="size-3.5" />
                            Pet Profiles ({stats.pets ?? 0})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('applications')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                                activeTab === 'applications' 
                                    ? 'bg-amber-400 text-neutral-950 shadow-xs' 
                                    : 'text-neutral-400 hover:text-white'
                            }`}
                        >
                            <FileText className="size-3.5" />
                            Applications ({stats.applications ?? 0})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('logs')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                                activeTab === 'logs' 
                                    ? 'bg-amber-400 text-neutral-950 shadow-xs' 
                                    : 'text-neutral-400 hover:text-white'
                            }`}
                        >
                            <Terminal className="size-3.5" />
                            Maintenance & Logs
                        </button>
                    </div>
                </div>

                {/* TAB 1: USERS */}
                {activeTab === 'users' && (
                    <Card className="border-neutral-200 shadow-2xs">
                        <CardHeader className="pb-3 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <CardTitle className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                                    <Users className="size-4 text-amber-600" />
                                    <span>User Accounts Fixer ({users.total})</span>
                                </CardTitle>
                                <CardDescription className="text-xs text-neutral-500">
                                    Rename user, reset password directly, inspect relationships, or cascade delete.
                                </CardDescription>
                            </div>

                            <form onSubmit={handleUserSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
                                <Input
                                    placeholder="Search user name, email, ID..."
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    leftIcon={<Search className="size-3.5 text-neutral-400" />}
                                    className="h-8 text-xs w-full sm:w-64"
                                />
                                <Button type="submit" size="sm" className="h-8 text-xs bg-neutral-900 hover:bg-neutral-800 text-white shrink-0">
                                    Search
                                </Button>
                            </form>
                        </CardHeader>

                        <CardContent className="p-0 border-t border-neutral-100 overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-100">
                                    <tr>
                                        <th className="p-3">User ID & Name</th>
                                        <th className="p-3">Role</th>
                                        <th className="p-3">eKYC Verified</th>
                                        <th className="p-3">Linked Records</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                                    {users.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-6 text-center text-neutral-400 text-xs">
                                                No users matching query.
                                            </td>
                                        </tr>
                                    ) : (
                                        users.data.map((u) => {
                                            const isCurrent = u.id === currentUserId;
                                            const isVerified = u.adopter_profile?.is_identity_verified;

                                            return (
                                                <tr key={u.id} className="hover:bg-neutral-50/60">
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-[10px] text-neutral-400 font-bold">
                                                                #{u.id}
                                                            </span>
                                                            <div>
                                                                <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                                                                    {u.name}
                                                                    {isCurrent && (
                                                                        <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-bold">
                                                                            YOU
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-[11px] text-neutral-500">{u.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="p-3">
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-neutral-100 text-neutral-700 border border-neutral-200">
                                                            {u.roles?.[0]?.name ?? 'None'}
                                                        </span>
                                                    </td>

                                                    <td className="p-3">
                                                        {isVerified ? (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                                                                <CheckCircle2 className="size-3 text-emerald-600" />
                                                                Verified
                                                            </span>
                                                        ) : (
                                                            <span className="text-[11px] text-neutral-400">Unverified</span>
                                                        )}
                                                    </td>

                                                    <td className="p-3 font-mono text-[11px] text-neutral-600">
                                                        {u.applications_count} apps · {u.saved_pets_count} saved
                                                    </td>

                                                    <td className="p-3 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openEditUser(u)}
                                                                title="Edit Name & Email"
                                                                className="h-7 px-2 text-[11px] border-neutral-300 hover:bg-neutral-100"
                                                            >
                                                                <Pencil className="size-3 mr-1 text-neutral-600" />
                                                                Edit
                                                            </Button>

                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openResetPassword(u)}
                                                                title="Direct Password Reset"
                                                                className="h-7 px-2 text-[11px] border-amber-300 text-amber-800 hover:bg-amber-50"
                                                            >
                                                                <KeyRound className="size-3 mr-1 text-amber-600" />
                                                                Reset Pass
                                                            </Button>

                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => openInspect(u)}
                                                                title="Inspect User Relations"
                                                                className="h-7 w-7 p-0 text-neutral-500 hover:text-neutral-900"
                                                            >
                                                                <Eye className="size-3.5" />
                                                            </Button>

                                                            {!isCurrent && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setUserToDelete(u)}
                                                                    title="Cascade Delete"
                                                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                </Button>
                                                            )}
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
                )}

                {/* TAB 2: PET PROFILES */}
                {activeTab === 'pets' && (
                    <Card className="border-neutral-200 shadow-2xs">
                        <CardHeader className="pb-3 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <CardTitle className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                                    <Dog className="size-4 text-amber-600" />
                                    <span>Pet Profiles Fixer ({pets.total})</span>
                                </CardTitle>
                                <CardDescription className="text-xs text-neutral-500">
                                    Rename pet profile, fix status desync (available / adopted / archived).
                                </CardDescription>
                            </div>

                            <form onSubmit={handlePetSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
                                <select
                                    value={petStatus}
                                    onChange={(e) => setPetStatus(e.target.value)}
                                    className="h-8 text-xs rounded-md border border-neutral-300 bg-white px-2 py-1 text-neutral-800"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="available">Available</option>
                                    <option value="adopted">Adopted</option>
                                    <option value="archived">Archived</option>
                                </select>
                                <Input
                                    placeholder="Search pet name, breed, ID..."
                                    value={petSearch}
                                    onChange={(e) => setPetSearch(e.target.value)}
                                    leftIcon={<Search className="size-3.5 text-neutral-400" />}
                                    className="h-8 text-xs w-full sm:w-60"
                                />
                                <Button type="submit" size="sm" className="h-8 text-xs bg-neutral-900 hover:bg-neutral-800 text-white shrink-0">
                                    Search
                                </Button>
                            </form>
                        </CardHeader>

                        <CardContent className="p-0 border-t border-neutral-100 overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-100">
                                    <tr>
                                        <th className="p-3">Pet ID & Name</th>
                                        <th className="p-3">Species & Breed</th>
                                        <th className="p-3">Shelter</th>
                                        <th className="p-3">Current Status</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                                    {pets.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-6 text-center text-neutral-400 text-xs">
                                                No pets found matching criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        pets.data.map((pet) => (
                                            <tr key={pet.id} className="hover:bg-neutral-50/60">
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-[10px] text-neutral-400 font-bold">
                                                            #{pet.id}
                                                        </span>
                                                        <span className="font-semibold text-neutral-900">
                                                            {pet.name}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="p-3">
                                                    <span className="capitalize">{pet.species}</span>
                                                    {pet.breed && <span className="text-neutral-500"> ({pet.breed})</span>}
                                                </td>

                                                <td className="p-3 text-neutral-600">
                                                    {pet.shelter?.name ?? 'Unassigned'}
                                                </td>

                                                <td className="p-3">
                                                    {getStatusBadge(pet.status)}
                                                </td>

                                                <td className="p-3 text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openEditPet(pet)}
                                                        className="h-7 px-2 text-[11px] border-neutral-300 hover:bg-neutral-100"
                                                    >
                                                        <Pencil className="size-3 mr-1 text-neutral-600" />
                                                        Rename / Status
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}

                {/* TAB 3: APPLICATIONS OVERRIDE & ROLLBACK */}
                {activeTab === 'applications' && (
                    <Card className="border-neutral-200 shadow-2xs">
                        <CardHeader className="pb-3 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <CardTitle className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                                    <SlidersHorizontal className="size-4 text-amber-600" />
                                    <span>Application Status Override & Rollback ({applications.total})</span>
                                </CardTitle>
                                <CardDescription className="text-xs text-neutral-500">
                                    Override stuck stages, rollback erroneous rejections/approvals, and auto-sync pet availability.
                                </CardDescription>
                            </div>

                            <form onSubmit={handleAppSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
                                <select
                                    value={appStatus}
                                    onChange={(e) => setAppStatus(e.target.value)}
                                    className="h-8 text-xs rounded-md border border-neutral-300 bg-white px-2 py-1 text-neutral-800"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="under_review">Under Review</option>
                                    <option value="mao_audit">MAO Audit</option>
                                    <option value="approved">Approved</option>
                                    <option value="released">Released</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="unclaimed">Unclaimed</option>
                                    <option value="closed">Closed</option>
                                </select>
                                <Input
                                    placeholder="Search Ref #, Adopter, Pet..."
                                    value={appSearch}
                                    onChange={(e) => setAppSearch(e.target.value)}
                                    leftIcon={<Search className="size-3.5 text-neutral-400" />}
                                    className="h-8 text-xs w-full sm:w-60"
                                />
                                <Button type="submit" size="sm" className="h-8 text-xs bg-neutral-900 hover:bg-neutral-800 text-white shrink-0">
                                    Search
                                </Button>
                            </form>
                        </CardHeader>

                        <CardContent className="p-0 border-t border-neutral-100 overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-100">
                                    <tr>
                                        <th className="p-3">Reference #</th>
                                        <th className="p-3">Adopter User</th>
                                        <th className="p-3">Target Pet</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Latest Activity</th>
                                        <th className="p-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                                    {applications.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-6 text-center text-neutral-400 text-xs">
                                                No applications found.
                                            </td>
                                        </tr>
                                    ) : (
                                        applications.data.map((app) => (
                                            <tr key={app.id} className="hover:bg-neutral-50/60">
                                                <td className="p-3 font-mono font-semibold text-neutral-900">
                                                    {app.reference_number}
                                                </td>

                                                <td className="p-3">
                                                    <div className="font-semibold text-neutral-900">{app.user?.name ?? 'Unknown'}</div>
                                                    <div className="text-[11px] text-neutral-500">{app.user?.email}</div>
                                                </td>

                                                <td className="p-3">
                                                    <div className="font-semibold text-neutral-900">{app.pet?.name ?? 'Unknown Pet'}</div>
                                                    <div className="text-[11px] text-neutral-500">Pet Status: {app.pet?.status ?? 'N/A'}</div>
                                                </td>

                                                <td className="p-3">
                                                    {getStatusBadge(app.status)}
                                                </td>

                                                <td className="p-3 text-[11px] text-neutral-500">
                                                    {app.timelines && app.timelines.length > 0 ? (
                                                        <div className="max-w-xs truncate" title={app.timelines[0].title}>
                                                            {app.timelines[0].title}
                                                        </div>
                                                    ) : (
                                                        <span>Submitted: {new Date(app.submitted_at).toLocaleDateString()}</span>
                                                    )}
                                                </td>

                                                <td className="p-3 text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openOverrideApp(app)}
                                                        className="h-7 px-2.5 text-[11px] border-amber-300 text-amber-900 hover:bg-amber-50"
                                                    >
                                                        <ArrowLeftRight className="size-3 mr-1 text-amber-700" />
                                                        Override / Rollback
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}

                {/* TAB 4: MAINTENANCE & LOGS */}
                {activeTab === 'logs' && (
                    <div className="space-y-4">
                        {/* Quick Reset Tools Bar */}
                        <div className="bg-amber-500/10 border border-amber-200 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                            <div className="flex items-center gap-2.5">
                                <RotateCcw className="size-5 text-amber-700 shrink-0" />
                                <div>
                                    <div className="text-xs font-bold text-amber-950">Master Reset Tools</div>
                                    <div className="text-[11px] text-amber-800">
                                        Wipe test applications, reset pet adopted status to available, or purge Didit biometric verification uploads.
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setResetScope('adopted_data')}
                                    className="text-xs h-8 bg-white border-amber-300 text-amber-900 hover:bg-amber-100"
                                >
                                    Reset Adopted Pets & Apps
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setResetScope('verification_data')}
                                    className="text-xs h-8 bg-white border-amber-300 text-amber-900 hover:bg-amber-100"
                                >
                                    Reset Didit eKYC Records
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => setResetScope('all')}
                                    className="text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white font-bold"
                                >
                                    Master Reset All
                                </Button>
                            </div>
                        </div>

                        {/* System Log Console */}
                        <Card className="border-neutral-200 shadow-2xs">
                            <CardHeader className="pb-3 pt-4 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                                        <Terminal className="size-4 text-amber-600" />
                                        <span>System Log Viewer (laravel.log)</span>
                                    </CardTitle>
                                    <CardDescription className="text-xs text-neutral-500">
                                        Last 150 entries from storage/logs/laravel.log.
                                    </CardDescription>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => router.reload()}
                                        className="h-8 text-xs flex items-center gap-1"
                                    >
                                        <RefreshCw className="size-3 text-neutral-500" />
                                        Refresh
                                    </Button>
                                    <Button 
                                        variant="destructive" 
                                        size="sm" 
                                        onClick={handleClearLogs}
                                        className="h-8 text-xs flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        <Trash className="size-3" />
                                        Clear Logs
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="p-0 border-t border-neutral-100">
                                <div className="bg-neutral-950 text-neutral-200 p-4 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[550px] overflow-y-auto whitespace-pre-wrap select-text rounded-b-xl">
                                    {logs ? logs : <span className="text-neutral-500 italic">No logs recorded in storage/logs/laravel.log.</span>}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* MODAL: Edit User Name & Email */}
                <Dialog open={userToEdit !== null} onOpenChange={(open) => !open && setUserToEdit(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-bold flex items-center gap-2">
                                <Pencil className="size-4 text-amber-600" />
                                <span>Edit User #{userToEdit?.id}</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-neutral-500">
                                Fix user full name or email address directly.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSaveUser} className="space-y-3 py-2">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-neutral-700">Full Name</label>
                                <Input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Enter full name"
                                    required
                                    className="text-xs h-9"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-neutral-700">Email Address</label>
                                <Input
                                    type="email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    required
                                    className="text-xs h-9"
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setUserToEdit(null)}>
                                    Cancel
                                </Button>
                                <Button type="submit" size="sm" disabled={isUpdatingUser} className="bg-neutral-900 text-white hover:bg-neutral-800">
                                    {isUpdatingUser ? 'Saving...' : 'Update User'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL: Direct Password Reset */}
                <Dialog open={userToResetPassword !== null} onOpenChange={(open) => !open && setUserToResetPassword(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-bold flex items-center gap-2">
                                <KeyRound className="size-4 text-amber-600" />
                                <span>Reset Password: {userToResetPassword?.name}</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-neutral-500">
                                Emergency super admin password override (no current password or email token needed).
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSavePassword} className="space-y-3 py-2">
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-neutral-700">New Password</label>
                                    <button
                                        type="button"
                                        onClick={generateRandomPassword}
                                        className="text-[11px] text-amber-600 hover:text-amber-700 font-medium underline"
                                    >
                                        Generate Random
                                    </button>
                                </div>
                                <Input
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter minimum 8 characters"
                                    minLength={8}
                                    required
                                    className="text-xs h-9 font-mono"
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setUserToResetPassword(null)}>
                                    Cancel
                                </Button>
                                <Button type="submit" size="sm" disabled={isResettingPassword} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                                    {isResettingPassword ? 'Resetting...' : 'Save New Password'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL: Edit Pet Profile */}
                <Dialog open={petToEdit !== null} onOpenChange={(open) => !open && setPetToEdit(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-bold flex items-center gap-2">
                                <Dog className="size-4 text-amber-600" />
                                <span>Edit Pet #{petToEdit?.id} ({petToEdit?.name})</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-neutral-500">
                                Rename pet or override status listing.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSavePet} className="space-y-3 py-2">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-neutral-700">Pet Name</label>
                                <Input
                                    value={editPetName}
                                    onChange={(e) => setEditPetName(e.target.value)}
                                    placeholder="e.g. Max"
                                    required
                                    className="text-xs h-9"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-neutral-700">Listing Status</label>
                                <select
                                    value={editPetStatus}
                                    onChange={(e) => setEditPetStatus(e.target.value as any)}
                                    className="w-full h-9 text-xs rounded-md border border-neutral-300 bg-white px-3 text-neutral-800"
                                >
                                    <option value="available">Available (Publicly adoptable)</option>
                                    <option value="adopted">Adopted (Closed)</option>
                                    <option value="archived">Archived (Hidden)</option>
                                </select>
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setPetToEdit(null)}>
                                    Cancel
                                </Button>
                                <Button type="submit" size="sm" disabled={isUpdatingPet} className="bg-neutral-900 text-white hover:bg-neutral-800">
                                    {isUpdatingPet ? 'Saving...' : 'Update Pet'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL: Application Override / Rollback */}
                <Dialog open={appToOverride !== null} onOpenChange={(open) => !open && setAppToOverride(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-bold flex items-center gap-2">
                                <SlidersHorizontal className="size-4 text-amber-600" />
                                <span>Override Status: {appToOverride?.reference_number}</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-neutral-500">
                                Manually override or rollback this application to any lifecycle stage.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSaveOverrideApp} className="space-y-3 py-2">
                            <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 text-xs flex justify-between items-center">
                                <div>
                                    <span className="text-neutral-500">Adopter:</span>{' '}
                                    <strong className="text-neutral-900">{appToOverride?.user?.name}</strong>
                                </div>
                                <div>
                                    <span className="text-neutral-500 mr-1.5">Current:</span>
                                    {appToOverride && getStatusBadge(appToOverride.status)}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-neutral-700">Target Override / Rollback Status</label>
                                <select
                                    value={overrideStatus}
                                    onChange={(e) => setOverrideStatus(e.target.value)}
                                    className="w-full h-9 text-xs rounded-md border border-neutral-300 bg-white px-3 text-neutral-800"
                                >
                                    <option value="pending">pending (Rollback to initial submission)</option>
                                    <option value="under_review">under_review (Rollback to shelter screening)</option>
                                    <option value="mao_audit">mao_audit (Rollback/Advance to MAO approval)</option>
                                    <option value="approved">approved (Force approve for pickup)</option>
                                    <option value="released">released (Mark pet picked up & adopted)</option>
                                    <option value="rejected">rejected (Force reject)</option>
                                    <option value="unclaimed">unclaimed (Adopter did not claim pet)</option>
                                    <option value="closed">closed (Administrative closure)</option>
                                </select>
                            </div>

                            <div className="flex items-center space-x-2 pt-1">
                                <Checkbox
                                    id="sync-pet"
                                    checked={syncPetStatus}
                                    onCheckedChange={(checked) => setSyncPetStatus(!!checked)}
                                />
                                <label htmlFor="sync-pet" className="text-xs text-neutral-700 cursor-pointer">
                                    Auto-sync Pet status (e.g. set to 'adopted' if released, or 'available' if rolled back)
                                </label>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-neutral-700">Reason / Audit Log Note</label>
                                <Textarea
                                    value={overrideReason}
                                    onChange={(e) => setOverrideReason(e.target.value)}
                                    placeholder="Explain why this status is being overridden or rolled back..."
                                    required
                                    rows={2}
                                    className="text-xs"
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setAppToOverride(null)}>
                                    Cancel
                                </Button>
                                <Button type="submit" size="sm" disabled={isOverridingApp} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                                    {isOverridingApp ? 'Applying...' : 'Apply Status Change'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Inspect Modal */}
                <Dialog open={inspectingUser !== null || inspectLoading} onOpenChange={(open) => !open && setInspectingUser(null)}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-bold flex items-center gap-2">
                                <Database className="size-4 text-amber-600" />
                                <span>Database Tree: {inspectingUser?.name} (#{inspectingUser?.id})</span>
                            </DialogTitle>
                        </DialogHeader>

                        {inspectLoading ? (
                            <div className="py-8 text-center text-xs text-neutral-500">Loading data...</div>
                        ) : inspectingUser ? (
                            <div className="space-y-3 text-xs">
                                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 space-y-1">
                                    <div><strong>Email:</strong> {inspectingUser.email}</div>
                                    <div><strong>Role:</strong> {inspectingUser.roles?.[0]?.name}</div>
                                    <div><strong>Adopter Profile:</strong> {inspectingUser.adopter_profile ? `Yes (eKYC Verified: ${inspectingUser.adopter_profile.is_identity_verified ? 'Yes' : 'No'})` : 'None'}</div>
                                    <div><strong>Lifestyle Quiz:</strong> {inspectingUser.lifestyle_profile ? 'Submitted' : 'None'}</div>
                                    <div><strong>Applications:</strong> {inspectingUser.applications?.length ?? 0} submitted</div>
                                    <div><strong>Saved Pets:</strong> {inspectingUser.saved_pets?.length ?? 0} pets</div>
                                </div>
                            </div>
                        ) : null}

                        <DialogFooter>
                            <Button variant="outline" size="sm" onClick={() => setInspectingUser(null)}>
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Reset Confirmation Modal */}
                <Dialog open={resetScope !== null} onOpenChange={(open) => !open && setResetScope(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-amber-700 flex items-center gap-2">
                                <RotateCcw className="size-5" />
                                <span>
                                    {resetScope === 'all' && 'Master Reset: All Test Data'}
                                    {resetScope === 'adopted_data' && 'Reset Adopted Pets & Applications'}
                                    {resetScope === 'verification_data' && 'Reset Didit eKYC Verifications'}
                                    {resetScope === 'quiz_data' && 'Reset Quiz & Match Scores'}
                                </span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-neutral-600">
                                {resetScope === 'all' && 'This will reset all adopted pets back to available, delete all adoption applications & timeline audit trails, delete all Didit verification records, and reset all identity profiles.'}
                                {resetScope === 'adopted_data' && 'This will change all adopted/pending pets back to available and clear all adoption applications.'}
                                {resetScope === 'verification_data' && 'This will clear all Didit verification records and reset all adopter identity verification statuses.'}
                                {resetScope === 'quiz_data' && 'This will clear all lifestyle profiles and calculated DSS match scores.'}
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter>
                            <Button variant="outline" size="sm" onClick={() => setResetScope(null)}>
                                Cancel
                            </Button>
                            <Button 
                                size="sm"
                                disabled={isResetting}
                                onClick={handleMasterReset}
                                className="bg-[#FFBF00] hover:bg-[#e6ac00] text-[#283F24] font-bold"
                            >
                                {isResetting ? 'Resetting...' : 'Confirm Reset'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}
                <Dialog open={userToDelete !== null} onOpenChange={(open) => !open && setUserToDelete(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-2">
                                <AlertTriangle className="size-5" />
                                <span>Delete User & Related Data?</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-neutral-600">
                                This will permanently delete <strong>{userToDelete?.name}</strong> (#{userToDelete?.id}) and purge all their profiles, applications, files, and timeline records from the database.
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter>
                            <Button variant="outline" size="sm" onClick={() => setUserToDelete(null)}>
                                Cancel
                            </Button>
                            <Button 
                                variant="destructive" 
                                size="sm"
                                disabled={isDeleting}
                                onClick={handleCascadeDelete}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold"
                            >
                                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </AppLayout>
    );
}
