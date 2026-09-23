<?php

namespace App\Http\Controllers;

use App\Models\Application;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdopterHistoryController extends Controller
{
    /**
     * Display the adopter's comprehensive pet adoption history,
     * official certificates, and application logs.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // 1. All officially adopted pets with certificates and shelter relations
        $adoptedPets = Application::where('user_id', $user->id)
            ->whereIn('status', ['approved', 'completed'])
            ->with([
                'user.adopterProfile',
                'pet.photos',
                'pet.shelter',
                'staff',
                'maoOfficer',
                'releasingOfficer',
                'timelines.actor',
            ])
            ->latest('resolved_at')
            ->get();

        // 2. Complete chronological archive of all applications
        $allApplications = Application::where('user_id', $user->id)
            ->with([
                'user.adopterProfile',
                'pet.photos',
                'pet.shelter',
                'staff',
                'maoOfficer',
                'releasingOfficer',
                'timelines.actor',
            ])
            ->latest('submitted_at')
            ->get();

        // 3. User's declared pet ownership and lifestyle profile
        $adopterProfile = $user->adopterProfile;
        $lifestyleProfile = $user->lifestyleProfile;

        return Inertia::render('adopter/history', [
            'adoptedPets' => $adoptedPets,
            'allApplications' => $allApplications,
            'adopterProfile' => $adopterProfile,
            'lifestyleProfile' => $lifestyleProfile,
        ]);
    }
}
