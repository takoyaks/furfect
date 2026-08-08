<?php

namespace App\Http\Controllers;

use App\Models\SavedPet;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SavedPetController extends Controller
{
    /**
     * Toggle saving/unsaving a pet for the authenticated adopter.
     */
    public function toggle(Request $request): RedirectResponse
    {
        $request->validate([
            'pet_id' => ['required', 'exists:pets,id'],
        ]);

        $user = $request->user();
        $petId = $request->input('pet_id');

        $saved = SavedPet::where('user_id', $user->id)
            ->where('pet_id', $petId)
            ->first();

        if ($saved) {
            $saved->delete();
            $message = __('Pet removed from saved list.');
            $type = 'info';
        } else {
            SavedPet::create([
                'user_id' => $user->id,
                'pet_id' => $petId,
            ]);
            $message = __('Pet saved successfully!');
            $type = 'success';
        }

        Inertia::flash('toast', [
            'type' => $type,
            'message' => $message,
        ]);

        return back();
    }
}
