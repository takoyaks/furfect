<?php

namespace App\Http\Controllers;

use App\Models\LifestyleProfile;
use App\Models\SystemSetting;
use App\Services\DssMatchingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LifestyleProfileController extends Controller
{
    /**
     * Show the onboarding step 2 (lifestyle quiz) form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $lifestyle = $user->lifestyleProfile;

        return Inertia::render('onboarding/lifestyle-quiz', [
            'lifestyle' => $lifestyle,
            'isLocked' => $lifestyle ? $lifestyle->isLocked() : false,
            'lockedUntil' => $lifestyle && $lifestyle->locked_until ? $lifestyle->locked_until->toIso8601String() : null,
        ]);
    }

    /**
     * Store or update the lifestyle quiz answers and calculate DSS matches.
     */
    public function store(Request $request, DssMatchingService $dssService): RedirectResponse
    {
        $user = $request->user();
        $lifestyle = $user->lifestyleProfile;

        // Check if locked
        if ($lifestyle && $lifestyle->isLocked()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('Your lifestyle profile is locked for 3 months to ensure matching integrity.')
            ]);
            return to_route('onboarding.lifestyle.edit');
        }

        $validated = $request->validate([
            // Section 1: Living Situation
            'housing_type' => ['required', 'string', 'in:house_with_yard,apartment,condo,house_no_yard,rented_room,rural'],
            'has_aircon' => ['required', 'string', 'in:stable,sometimes,none_electric,none_natural'],
            'outdoor_access' => ['required', 'string', 'in:fully_fenced,not_fenced,none'],

            // Section 2: Daily Lifestyle
            'activity_level' => ['required', 'string', 'in:very_light,light,moderate,very_active'],
            'work_schedule' => ['required', 'string', 'in:wfh,office,shifting,student'],

            // Section 3: Household
            'household_size' => ['required', 'integer', 'min:1'],
            'household_agrees' => ['required', 'boolean'],
            'has_children' => ['required', 'string', 'in:none,young,older,teenagers'],
            'other_pets' => ['required', 'string', 'in:none,dogs,cats,both,mixed'],

            // Section 4: Financial Capacity
            'occupation' => ['nullable', 'string', 'max:255'],
            'monthly_income' => ['required', 'string', 'in:below_10000,10000_20000,20001_40000,40001_60000,60001_100000,above_100000'],
            'pet_experience' => ['required', 'string', 'in:first_time,had_before,currently_have,experienced_multiple'],

            // Section 5: Health Considerations
            'health_conditions' => ['nullable', 'array'],
            'health_conditions.*' => ['string', 'in:asthma,skin_allergy,fur_allergy,immunocompromised,anxiety,noise_sensitive'],

            // Section 6: Pet Preferences
            'preferred_type' => ['required', 'string', 'in:dog,cat,none'],
            'preferred_size' => ['nullable', 'array'],
            'preferred_size.*' => ['string', 'in:small,medium,large'],
            'preferred_gender' => ['required', 'string', 'in:male,female,none'],
            'preferred_coat' => ['nullable', 'array'],
            'preferred_coat.*' => ['string'],
        ]);

        $lockMonths = SystemSetting::get('lifestyle_lock_months', 3);

        $lifestyle = LifestyleProfile::updateOrCreate(
            ['user_id' => $user->id],
            array_merge($validated, [
                'submitted_at' => now(),
                'locked_until' => now()->addMonths($lockMonths),
            ])
        );

        // Compute/recompute DSS matches instantly
        $dssService->computeAllMatches($user);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Lifestyle Profile saved successfully! Your pet matches have been calculated.')
        ]);

        return to_route('matches.index');
    }
}
