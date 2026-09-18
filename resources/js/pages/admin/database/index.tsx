import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    CheckCircle2
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

interface PageProps {
    stats: Record<string, number>;
    users: {
        data: UserRecord[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        search?: string;
    };
    logs: string;
}

export default function Level2SuperAdmin({ stats, users, filters, logs }: PageProps) {
    const { auth } = usePage().props as any;
    const currentUserId = auth?.user?.id;

    const [activeTab, setActiveTab] = useState<'database' | 'logs'>('database');
    const [search, setSearch] = useState(filters.search || '');

    // Modals
    const [inspectingUser, setInspectingUser] = useState<any | null>(null);
    const [inspectLoading, setInspectLoading] = useState(false);
    
    const [userToDelete, setUserToDelete] = useState<UserRecord | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [resetScope, setResetScope] = useState<'all' | 'adopted_data' | 'verification_data' | null>(null);
    const [isResetting, setIsResetting] = useState(false);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('admin.database.index'),
            { search: search || undefined },
            { preserveState: true }
        );
    };

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

    return (
        <AppLayout breadcrumbs={[{ title: 'Level 2 Super Admin', href: '#' }]}>
            <Head title="Level 2 Super Admin Access" />

            <div className="flex h-full flex-1 flex-col gap-5 p-4 sm:p-6 max-w-6xl mx-auto w-full">
                
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-neutral-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                            <ShieldAlert className="size-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold text-white tracking-tight">Super Admin Level 2 UI</h1>
                                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded border border-amber-400/30">
                                    kerbie only
                                </span>
                            </div>
                            <p className="text-xs text-neutral-400 mt-0.5">
                                Direct database inspection, user cascade deletion, reset tools, and system logs.
                            </p>
                        </div>
                    </div>

                    {/* Simple Tab Switcher */}
                    <div className="flex items-center bg-neutral-800 p-1 rounded-xl border border-neutral-700">
                        <button
                            type="button"
                            onClick={() => setActiveTab('database')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                activeTab === 'database' 
                                    ? 'bg-amber-400 text-neutral-950 shadow-xs' 
                                    : 'text-neutral-400 hover:text-white'
                            }`}
                        >
                            <Database className="size-3.5" />
                            Database & Users
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('logs')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                activeTab === 'logs' 
                                    ? 'bg-amber-400 text-neutral-950 shadow-xs' 
                                    : 'text-neutral-400 hover:text-white'
                            }`}
                        >
                            <Terminal className="size-3.5" />
                            System Logs
                        </button>
                    </div>
                </div>

                {/* Master Reset Tools Bar */}
                <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 border border-amber-200 p-3.5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="flex items-center gap-2.5">
                        <RotateCcw className="size-5 text-amber-700 shrink-0" />
                        <div>
                            <div className="text-xs font-bold text-amber-950">Quick Reset Tools</div>
                            <div className="text-[11px] text-amber-800">
                                Reset adopted status back to available, wipe test applications, or reset Didit eKYC verifications.
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
                            Reset Didit Verifications
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setResetScope('all')}
                            className="text-xs h-8 bg-[#FFBF00] hover:bg-[#e6ac00] text-[#283F24] font-bold shadow-2xs"
                        >
                            ⚡ Reset All Test Data
                        </Button>
                    </div>
                </div>

                {/* Table Quick Counts Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs">
                    <div className="bg-white border border-neutral-200 p-2.5 rounded-xl text-center">
                        <span className="text-neutral-400 text-[10px] uppercase font-bold block">Users</span>
                        <span className="font-bold text-base text-neutral-900">{stats.users ?? 0}</span>
                    </div>
                    <div className="bg-white border border-neutral-200 p-2.5 rounded-xl text-center">
                        <span className="text-neutral-400 text-[10px] uppercase font-bold block">Adopters</span>
                        <span className="font-bold text-base text-neutral-900">{stats.adopter_profiles ?? 0}</span>
                    </div>
                    <div className="bg-white border border-neutral-200 p-2.5 rounded-xl text-center">
                        <span className="text-neutral-400 text-[10px] uppercase font-bold block">Applications</span>
                        <span className="font-bold text-base text-neutral-900">{stats.applications ?? 0}</span>
                    </div>
                    <div className="bg-white border border-neutral-200 p-2.5 rounded-xl text-center">
                        <span className="text-neutral-400 text-[10px] uppercase font-bold block">Pets Listed</span>
                        <span className="font-bold text-base text-neutral-900">{stats.pets ?? 0}</span>
                    </div>
                    <div className="bg-white border border-neutral-200 p-2.5 rounded-xl text-center">
                        <span className="text-neutral-400 text-[10px] uppercase font-bold block">Shelters</span>
                        <span className="font-bold text-base text-neutral-900">{stats.shelters ?? 0}</span>
                    </div>
                    <div className="bg-white border border-neutral-200 p-2.5 rounded-xl text-center">
                        <span className="text-neutral-400 text-[10px] uppercase font-bold block">Didit Records</span>
                        <span className="font-bold text-base text-neutral-900">{stats.didit_verifications ?? 0}</span>
                    </div>
                </div>

                {/* TAB 1: Database & Users */}
                {activeTab === 'database' && (
                    <Card className="border-neutral-200 shadow-2xs">
                        <CardHeader className="pb-3 pt-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div>
                                    <CardTitle className="text-sm font-bold text-neutral-900">
                                        Database Users & Subscribers ({users.total})
                                    </CardTitle>
                                    <CardDescription className="text-xs text-neutral-500">
                                        Inspect relational records or cascade-delete user with all related data.
                                    </CardDescription>
                                </div>

                                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
                                    <Input
                                        placeholder="Search name, email, id..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        leftIcon={<Search className="size-3.5 text-neutral-400" />}
                                        className="h-8 text-xs w-full sm:w-60"
                                    />
                                    <Button type="submit" size="sm" className="h-8 text-xs bg-neutral-900 hover:bg-neutral-800 text-white">
                                        Search
                                    </Button>
                                </form>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0 border-t border-neutral-100 overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-100">
                                    <tr>
                                        <th className="p-3">User</th>
                                        <th className="p-3">Role</th>
                                        <th className="p-3">Didit / eKYC</th>
                                        <th className="p-3">Related Data</th>
                                        <th className="p-3">Registered</th>
                                        <th className="p-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                                    {users.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-6 text-center text-neutral-400 text-xs">
                                                No users found.
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
                                                            <span className="font-mono text-[10px] text-neutral-400 font-semibold">
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
                                                            {u.roles[0]?.name?.replace('_', ' ') || 'User'}
                                                        </span>
                                                    </td>

                                                    <td className="p-3">
                                                        {u.adopter_profile ? (
                                                            isVerified ? (
                                                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">
                                                                    <CheckCircle2 className="size-3 text-emerald-600" />
                                                                    Verified
                                                                </span>
                                                            ) : (
                                                                <span className="text-amber-700 bg-amber-50 text-[10px] px-1.5 py-0.5 rounded border border-amber-200">
                                                                    Unverified
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span className="text-neutral-400 text-[10px] italic">—</span>
                                                        )}
                                                    </td>

                                                    <td className="p-3 text-[11px]">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            {u.applications_count > 0 && (
                                                                <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px]">
                                                                    {u.applications_count} app(s)
                                                                </span>
                                                            )}
                                                            {u.saved_pets_count > 0 && (
                                                                <span className="px-1.5 py-0.2 rounded bg-pink-50 text-pink-700 border border-pink-200 text-[10px]">
                                                                    {u.saved_pets_count} saved
                                                                </span>
                                                            )}
                                                            {u.didit_verifications_count > 0 && (
                                                                <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[10px]">
                                                                    {u.didit_verifications_count} Didit
                                                                </span>
                                                            )}
                                                            {!u.adopter_profile && u.applications_count === 0 && u.saved_pets_count === 0 && (
                                                                <span className="text-neutral-400 text-[10px] italic">No activity</span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="p-3 text-neutral-500 text-[11px]">
                                                        {new Date(u.created_at).toLocaleDateString()}
                                                    </td>

                                                    <td className="p-3 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-7 text-neutral-600 hover:text-neutral-900 rounded-lg"
                                                                title="Inspect user relationships"
                                                                onClick={() => openInspect(u)}
                                                            >
                                                                <Eye className="size-3.5" />
                                                            </Button>

                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                disabled={isCurrent}
                                                                className={`size-7 rounded-lg ${
                                                                    isCurrent
                                                                        ? 'text-neutral-300 cursor-not-allowed'
                                                                        : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                                                                }`}
                                                                title={isCurrent ? 'Cannot delete self' : 'Delete user and related data'}
                                                                onClick={() => setUserToDelete(u)}
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
                )}

                {/* TAB 2: System Logs */}
                {activeTab === 'logs' && (
                    <Card className="border-neutral-200 shadow-2xs">
                        <CardHeader className="pb-3 pt-4 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                                    <Terminal className="size-4 text-amber-600" />
                                    <span>Recent System Logs (laravel.log)</span>
                                </CardTitle>
                                <CardDescription className="text-xs text-neutral-500">
                                    Last 150 log entries from storage/logs/laravel.log.
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
                                {logs ? logs : <span className="text-neutral-500 italic">No logs recorded yet in storage/logs/laravel.log.</span>}
                            </div>
                        </CardContent>
                    </Card>
                )}

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
                                </span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-neutral-600">
                                {resetScope === 'all' && 'This will reset all adopted pets back to available, delete all adoption applications & timeline audit trails, delete all Didit verification records, and reset all identity profiles.'}
                                {resetScope === 'adopted_data' && 'This will change all adopted/pending pets back to available and clear all adoption applications.'}
                                {resetScope === 'verification_data' && 'This will clear all Didit verification records and reset all adopter identity verification statuses.'}
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
