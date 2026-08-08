<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Shelter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShelterController extends Controller
{
    /**
     * Display a list of shelters.
     */
    public function index(Request $request): Response
    {
        $query = Shelter::latest();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%");
        }

        $shelters = $query->paginate(10)->withQueryString();

        return Inertia::render('admin/shelters/index', [
            'shelters' => $shelters,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Store a newly created shelter.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'max:255'],
            'location' => ['required', 'string', 'max:255'],
            'contact' => ['required', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        Shelter::create($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Shelter registered successfully!')
        ]);

        return back();
    }

    /**
     * Update the specified shelter.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $shelter = Shelter::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'max:255'],
            'location' => ['required', 'string', 'max:255'],
            'contact' => ['required', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        $shelter->update($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Shelter details updated successfully.')
        ]);

        return back();
    }

    /**
     * Delete the specified shelter.
     */
    public function destroy(int $id): RedirectResponse
    {
        $shelter = Shelter::findOrFail($id);
        $shelter->delete();

        Inertia::flash('toast', [
            'type' => 'info',
            'message' => __('Shelter deleted successfully.')
        ]);

        return back();
    }
}
