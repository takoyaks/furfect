<?php

namespace App\Http\Controllers;

use App\Models\LifestyleProfile;
use App\Models\SystemSetting;
use App\Services\DssMatchingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LifestyleProfileController extends Controller
{
    /**
     * Show the onboarding step 3 (lifestyle quiz) form.
     */
    public function edit(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        $ekycEnabled = (bool) SystemSetting::get('ekyc_enabled', true);

        if ($ekycEnabled && ! $user->isIdentityVerified()) {
            return to_route('onboarding.ekyc.show');
        }

        if (! $user->adopterProfile?->profile_completed_at) {
            return to_route('onboarding.personal.edit');
        }

        $lifestyle = $user->lifestyleProfile;

        return Inertia::render('onboarding/lifestyle-quiz', [
            'lifestyle' => $lifestyle,
            'isLocked' => $lifestyle ? $lifestyle->isLocked() : false,
            'lockedUntil' => $lifestyle && $lifestyle->locked_until ? $lifestyle->locked_until->toIso8601String() : null,
            'ekycEnabled' => $ekycEnabled,
        ]);
    }

    /**
     * Save progressive draft updates for the lifestyle quiz without locking or finalizing it.
     */
    public function saveDraft(Request $request): JsonResponse
    {
        $user = $request->user();
        $ekycEnabled = (bool) SystemSetting::get('ekyc_enabled', true);

        if ($ekycEnabled && ! $user->isIdentityVerified()) {
            return response()->json([
                'saved' => false,
                'message' => __('eKYC identity verification is required.'),
            ], 403);
        }

        if (! $user->adopterProfile?->profile_completed_at) {
            return response()->json([
                'saved' => false,
                'message' => __('Please complete personal information first.'),
            ], 403);
        }

        $lifestyle = $user->lifestyleProfile;

        if ($lifestyle && $lifestyle->isLocked()) {
            return response()->json([
                'saved' => false,
                'message' => __('Your lifestyle profile is locked for 3 months to ensure matching integrity.'),
            ], 423);
        }

        $validated = $request->validate([
            'draft_step' => ['sometimes', 'integer', 'min:1', 'max:6'],
            'housing_type' => ['sometimes', 'nullable', 'string', 'in:house_with_yard,apartment,condo,house_no_yard,rented_room,rural'],
            'has_aircon' => ['sometimes', 'nullable', 'string', 'in:stable,sometimes,none_electric,none_natural'],
            'outdoor_access' => ['sometimes', 'nullable', 'string', 'in:fully_fenced,not_fenced,none'],
            'activity_level' => ['sometimes', 'nullable', 'string', 'in:very_light,light,moderate,very_active'],
            'work_schedule' => ['sometimes', 'nullable', 'string', 'in:always_at_home,frequently_at_home,travel_sometimes,travel_a_lot,others,wfh,office,shifting,student'],
            'work_schedule_other' => ['sometimes', 'nullable', 'string', 'max:255'],
            'household_size' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'household_agrees' => ['sometimes', 'nullable'],
            'has_children' => ['sometimes', 'nullable', 'string', 'in:none,young,older,teenagers'],
            'other_pets' => ['sometimes', 'nullable', 'string', 'in:none,dogs,cats,both,mixed'],
            'occupation' => ['sometimes', 'nullable', 'string', 'max:255'],
            'monthly_income' => ['sometimes', 'nullable', 'string', 'in:below_10000,10000_20000,20001_40000,40001_60000,60001_100000,above_100000'],
            'pet_experience' => ['sometimes', 'nullable', 'string', 'in:first_time,had_before,currently_have,experienced_multiple'],
            'health_conditions' => ['sometimes', 'nullable', 'array'],
            'health_conditions.*' => ['string', 'in:asthma,skin_allergy,fur_allergy,immunocompromised,anxiety,noise_sensitive'],
            'preferred_type' => ['sometimes', 'nullable', 'string', 'in:dog,cat,none'],
            'preferred_size' => ['sometimes', 'nullable', 'array'],
            'preferred_size.*' => ['string', 'in:small,medium,large'],
            'preferred_gender' => ['sometimes', 'nullable', 'string', 'in:male,female,none'],
            'preferred_coat' => ['sometimes', 'nullable', 'array'],
            'preferred_coat.*' => ['string'],
        ]);

        if (array_key_exists('household_agrees', $validated)) {
            $validated['household_agrees'] = filter_var($validated['household_agrees'], FILTER_VALIDATE_BOOLEAN);
        }

        foreach ([
            'draft_step',
            'has_aircon',
            'outdoor_access',
            'activity_level',
            'work_schedule',
            'household_size',
            'has_children',
            'other_pets',
            'pet_experience',
            'preferred_type',
            'preferred_gender',
        ] as $nonNullableKey) {
            if (array_key_exists($nonNullableKey, $validated) && $validated[$nonNullableKey] === null) {
                unset($validated[$nonNullableKey]);
            }
        }

        if (array_key_exists('work_schedule', $validated) && $validated['work_schedule'] !== 'others') {
            $validated['work_schedule_other'] = null;
        }

        $profile = LifestyleProfile::updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        return response()->json([
            'saved' => true,
            'draft_step' => $profile->draft_step ?? 1,
        ]);
    }

    /**
     * Store or update the lifestyle quiz answers and calculate DSS matches.
     */
    public function store(Request $request, DssMatchingService $dssService): RedirectResponse
    {
        $user = $request->user();
        $ekycEnabled = (bool) SystemSetting::get('ekyc_enabled', true);

        if ($ekycEnabled && ! $user->isIdentityVerified()) {
            return to_route('onboarding.ekyc.show');
        }

        if (! $user->adopterProfile?->profile_completed_at) {
            return to_route('onboarding.personal.edit');
        }

        $lifestyle = $user->lifestyleProfile;

        // Check if locked
        if ($lifestyle && $lifestyle->isLocked()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('Your lifestyle profile is locked for 3 months to ensure matching integrity.'),
            ]);

            return to_route('onboarding.lifestyle.edit');
        }

        $validated = $request->validate([
            // Section 1: Living Situation
            'housing_type' => ['required', 'string', 'in:house_with_yard,apartment,condo,house_no_yard,rented_room,rural'],
            'has_aircon' => ['required', 'string', 'in:stable,sometimes,none_electric,none_natural'],
            'outdoor_access' => ['required', 'string', 'in:fully_fenced,not_fenced,none'],

            // Section 2: Daily Lifestyle
            'occupation' => ['required', 'string', 'max:255'],
            'activity_level' => ['required', 'string', 'in:very_light,light,moderate,very_active'],
            'work_schedule' => ['required', 'string', 'in:always_at_home,frequently_at_home,travel_sometimes,travel_a_lot,others'],
            'work_schedule_other' => ['nullable', 'required_if:work_schedule,others', 'string', 'max:255'],

            // Section 3: Household
            'household_size' => ['required', 'integer', 'min:1'],
            'household_agrees' => ['required', 'boolean'],
            'has_children' => ['required', 'string', 'in:none,young,older,teenagers'],
            'other_pets' => ['required', 'string', 'in:none,dogs,cats,both,mixed'],

            // Section 4: Financial Capacity
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
        ], [
            'work_schedule_other.required_if' => __('Please specify your daily schedule when selecting Others.'),
        ]);

        if ($validated['work_schedule'] !== 'others') {
            $validated['work_schedule_other'] = null;
        }

        $lockMonths = SystemSetting::get('lifestyle_lock_months', 3);

        $lifestyle = LifestyleProfile::updateOrCreate(
            ['user_id' => $user->id],
            array_merge($validated, [
                'draft_step' => 1,
                'submitted_at' => now(),
                'locked_until' => now()->addMonths($lockMonths),
            ])
        );

        // Compute/recompute DSS matches instantly
        $dssService->computeAllMatches($user);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Lifestyle Profile saved successfully! Your pet matches have been calculated.'),
        ]);

        return to_route('matches.index');
    }
}
