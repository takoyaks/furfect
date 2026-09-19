<?php

namespace App\Http\Controllers\Shelter;

use App\Http\Controllers\Controller;
use App\Models\Pet;
use App\Models\PetPhoto;
use App\Models\Shelter;
use App\Services\CloudinaryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PetController extends Controller
{
    /**
     * Display a listing of pets for shelter management.
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

        return Inertia::render('shelter/pets/index', [
            'pets' => $pets,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    /**
     * Show the form for creating a new pet.
     */
    public function create(): Response
    {
        $shelters = Shelter::where('status', 'active')->get();

        return Inertia::render('shelter/pets/create', [
            'shelters' => $shelters,
        ]);
    }

    /**
     * Store a newly created pet in storage.
     */
    public function store(Request $request, CloudinaryService $cloudinary): RedirectResponse
    {
        $validated = $request->validate([
            'shelter_id' => ['required', 'exists:shelters,id'],
            'name' => ['required', 'string', 'max:255'],
            'species' => ['required', 'string', 'in:dog,cat'],
            'breed' => ['nullable', 'string', 'max:255'],
            'tag_number' => ['nullable', 'string', 'max:100'],
            'microchip_number' => ['nullable', 'string', 'max:100'],
            'age_years' => ['required', 'integer', 'min:0', 'max:30'],
            'gender' => ['required', 'string', 'in:male,female'],
            'size' => ['required', 'string', 'in:small,medium,large'],
            'coat_color' => ['nullable', 'string', 'in:black,white,brown,mixed,golden,other'],
            'health_status' => ['nullable', 'string', 'max:255'],
            'temperament' => ['nullable', 'array'],
            'temperament.*' => ['string'],
            'energy_level' => ['required', 'string', 'in:low,moderate,high,very_active'],
            'maintenance_level' => ['nullable', 'string', 'in:low,medium,high'],
            'requires_experience' => ['required', 'boolean'],
            'requires_yard' => ['required', 'boolean'],
            'requires_no_children' => ['required', 'boolean'],
            'requires_no_other_pets' => ['required', 'boolean'],
            'housing_compatible' => ['required', 'array'],
            'housing_compatible.*' => ['string', 'in:house_with_yard,apartment,condo,house_no_yard,rented_room,rural'],
            'housing_area' => ['nullable', 'string', 'max:255'],
            'housing_notes' => ['nullable', 'string', 'max:1000'],
            'intake_date' => ['nullable', 'date'],
            'adoption_fee' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'photos' => ['nullable', 'array'],
            'photos.*' => ['image', 'max:4096'], // max 4MB
        ]);

        $pet = Pet::create(array_merge($validated, [
            'status' => 'available',
            'listed_at' => now(),
        ]));

        // Process photos
        if ($request->hasFile('photos')) {
            $isPrimary = true;
            $sortOrder = 0;

            foreach ($request->file('photos') as $file) {
                if ($cloudinary->isConfigured()) {
                    $upload = $cloudinary->upload($file, 'pets');
                    $photoPath = $upload['secure_url'];
                } else {
                    $path = $file->store('pets', 'public');
                    $photoPath = Storage::url($path);
                }

                PetPhoto::create([
                    'pet_id' => $pet->id,
                    'photo_path' => $photoPath,
                    'is_primary' => $isPrimary,
                    'sort_order' => $sortOrder++,
                ]);

                $isPrimary = false; // only the first photo is primary
            }
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Pet listing created successfully!'),
        ]);

        return to_route('shelter.pets.index');
    }

    /**
     * Show the form for editing the specified pet.
     */
    public function edit(int $id): Response
    {
        $pet = Pet::with('photos')->findOrFail($id);
        $shelters = Shelter::where('status', 'active')->get();

        return Inertia::render('shelter/pets/edit', [
            'pet' => $pet,
            'shelters' => $shelters,
        ]);
    }

    /**
     * Update the specified pet in storage.
     */
    public function update(Request $request, int $id, CloudinaryService $cloudinary): RedirectResponse
    {
        $pet = Pet::findOrFail($id);

        $validated = $request->validate([
            'shelter_id' => ['required', 'exists:shelters,id'],
            'name' => ['required', 'string', 'max:255'],
            'species' => ['required', 'string', 'in:dog,cat'],
            'breed' => ['nullable', 'string', 'max:255'],
            'tag_number' => ['nullable', 'string', 'max:100'],
            'microchip_number' => ['nullable', 'string', 'max:100'],
            'age_years' => ['required', 'integer', 'min:0', 'max:30'],
            'gender' => ['required', 'string', 'in:male,female'],
            'size' => ['required', 'string', 'in:small,medium,large'],
            'coat_color' => ['nullable', 'string', 'in:black,white,brown,mixed,golden,other'],
            'health_status' => ['nullable', 'string', 'max:255'],
            'temperament' => ['nullable', 'array'],
            'temperament.*' => ['string'],
            'energy_level' => ['required', 'string', 'in:low,moderate,high,very_active'],
            'maintenance_level' => ['nullable', 'string', 'in:low,medium,high'],
            'requires_experience' => ['required', 'boolean'],
            'requires_yard' => ['required', 'boolean'],
            'requires_no_children' => ['required', 'boolean'],
            'requires_no_other_pets' => ['required', 'boolean'],
            'housing_compatible' => ['required', 'array'],
            'housing_compatible.*' => ['string', 'in:house_with_yard,apartment,condo,house_no_yard,rented_room,rural'],
            'housing_area' => ['nullable', 'string', 'max:255'],
            'housing_notes' => ['nullable', 'string', 'max:1000'],
            'intake_date' => ['nullable', 'date'],
            'adoption_fee' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'string', 'in:available,adopted,archived'],
            'photos' => ['nullable', 'array'],
            'photos.*' => ['image', 'max:4096'],
        ]);

        $pet->update($validated);

        // Process new photos
        if ($request->hasFile('photos')) {
            $sortOrder = $pet->photos()->max('sort_order') + 1;
            $hasPrimary = $pet->photos()->where('is_primary', true)->exists();

            foreach ($request->file('photos') as $file) {
                if ($cloudinary->isConfigured()) {
                    $upload = $cloudinary->upload($file, 'pets');
                    $photoPath = $upload['secure_url'];
                } else {
                    $path = $file->store('pets', 'public');
                    $photoPath = Storage::url($path);
                }

                PetPhoto::create([
                    'pet_id' => $pet->id,
                    'photo_path' => $photoPath,
                    'is_primary' => ! $hasPrimary,
                    'sort_order' => $sortOrder++,
                ]);

                $hasPrimary = true;
            }
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Pet listing updated successfully!'),
        ]);

        return to_route('shelter.pets.index');
    }

    /**
     * Archive the specified pet (marks as archived rather than hard deletion).
     */
    public function destroy(int $id): RedirectResponse
    {
        $pet = Pet::findOrFail($id);
        $pet->update(['status' => 'archived']);

        Inertia::flash('toast', [
            'type' => 'info',
            'message' => __('Pet listing archived successfully.'),
        ]);

        return to_route('shelter.pets.index');
    }
}
