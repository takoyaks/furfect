<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Display a list of all registered accounts.
     */
    public function index(Request $request): Response
    {
        $query = User::with('roles')->latest();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role') && ! in_array($request->input('role'), ['all', 'All roles'], true)) {
            $query->role($request->input('role'));
        }

        $users = $query->paginate(10)->withQueryString();
        $roles = Role::pluck('name');

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'roles' => $roles,
            'filters' => $request->only(['search', 'role']),
        ]);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'string', 'exists:roles,name'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(), // Auto-verify accounts created by admin
        ]);

        $user->assignRole($validated['role']);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('User account created successfully!'),
        ]);

        return back();
    }

    /**
     * Update the specified user's profile and role.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role' => ['required', 'string', 'exists:roles,name'],
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        $user->syncRoles([$validated['role']]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('User account updated successfully.'),
        ]);

        return back();
    }

    /**
     * Reset the specified user's password.
     */
    public function resetPassword(Request $request, int $id): RedirectResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Password for :name has been successfully reset.', ['name' => $user->name]),
        ]);

        return back();
    }

    /**
     * Deactivate/Delete user account.
     */
    public function destroy(int $id): RedirectResponse
    {
        $user = User::findOrFail($id);

        if ($user->id === auth()->id()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('You cannot delete your own admin account.'),
            ]);

            return back();
        }

        $user->delete();

        Inertia::flash('toast', [
            'type' => 'info',
            'message' => __('User account deactivated successfully.'),
        ]);

        return back();
    }
}
