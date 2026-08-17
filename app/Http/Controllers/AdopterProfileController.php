<?php

namespace App\Http\Controllers;

use App\Models\AdopterProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdopterProfileController extends Controller
{
    /**
     * Show the onboarding step 1 (personal info) form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $profile = $user->adopterProfile;

        return Inertia::render('onboarding/personal-info', [
            'profile' => $profile,
            'userName' => $user->name,
        ]);
    }

    /**
     * Store or update the adopter's personal info.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'contact_number' => ['required', 'string', 'max:50'],
            'date_of_birth' => ['required', 'date', 'before:today'],
            'home_address' => ['required', 'string', 'max:1000'],
            'valid_id_type' => ['required', 'string', 'max:100'],
            'valid_id_number' => ['required', 'string', 'max:100'],
            'had_pets_before' => ['required', 'string', 'in:currently_have,had_before,never'],
            'previous_pet_notes' => ['nullable', 'string', 'max:2000'],
            'surrendered_pet' => ['required', 'boolean'],
            'adoption_reason' => ['required', 'string', 'max:100'],
            'adoption_reason_text' => ['required', 'string', 'max:2000'],
            'pet_stay' => ['required', 'string', 'in:inside,outdoors,both'],
            'terms_read' => ['required', 'accepted'],
            'info_confirmed' => ['required', 'accepted'],
        ], [
            'terms_read.accepted' => 'You must confirm that you have read the adoption terms and conditions.',
            'info_confirmed.accepted' => 'You must confirm that all information provided is accurate and correct.',
        ]);

        unset($validated['terms_read'], $validated['info_confirmed']);

        $profile = AdopterProfile::updateOrCreate(
            ['user_id' => $user->id],
            array_merge($validated, [
                'profile_completed_at' => now(),
            ])
        );

        // Flash message
        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Step 1 Personal Information saved successfully.'),
        ]);

        return to_route('onboarding.lifestyle.edit');
    }
}
