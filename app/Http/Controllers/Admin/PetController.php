<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pet;
use App\Models\Shelter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PetController extends Controller
{
    /**
     * Display a listing of all pets.
     */
    public function index(Request $request): Response
    {
        $query = Pet::with(['photos', 'shelter'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('breed', 'like', "%{$search}%")
                    ->orWhere('tag_number', 'like', "%{$search}%")
                    ->orWhere('microchip_number', 'like', "%{$search}%")
                    ->orWhere('housing_area', 'like', "%{$search}%");
            });
        }

        $pets = $query->paginate(10)->withQueryString();
        $shelters = Shelter::where('status', 'active')->get();

        return Inertia::render('admin/pets/index', [
            'pets' => $pets,
            'shelters' => $shelters,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    /**
     * Archive or permanently delete a pet listing.
     */
    public function destroy(Request $request, int $id): RedirectResponse
    {
        $pet = Pet::findOrFail($id);

        if ($request->input('action') === 'delete' || $request->boolean('force_delete')) {
            $pet->delete();

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => __('Pet listing permanently deleted.'),
            ]);
        } else {
            $pet->update(['status' => 'archived']);

            Inertia::flash('toast', [
                'type' => 'info',
                'message' => __('Pet listing archived successfully.'),
            ]);
        }

        return back();
    }
}
