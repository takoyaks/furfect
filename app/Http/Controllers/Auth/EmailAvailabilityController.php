<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EmailAvailabilityController extends Controller
{
    /**
     * Check if an email address is available for registration or account update.
     */
    public function check(Request $request): JsonResponse
    {
        $email = strtolower(trim((string) $request->query('email', '')));
        $ignoreId = $request->query('ignore_id');

        if ($email === '') {
            return response()->json([
                'available' => false,
                'message' => 'Email address is required.',
            ], 422);
        }

        $validator = Validator::make(['email' => $email], [
            'email' => ['required', 'string', 'email', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'available' => false,
                'message' => 'Please provide a valid email address.',
            ], 422);
        }

        $query = User::whereRaw('LOWER(email) = ?', [$email]);

        if ($ignoreId !== null && is_numeric($ignoreId)) {
            $query->where('id', '!=', (int) $ignoreId);
        }

        $exists = $query->exists();

        if ($exists) {
            return response()->json([
                'available' => false,
                'message' => 'This email address is already registered. Please log in or use a different email.',
            ]);
        }

        return response()->json([
            'available' => true,
            'message' => 'Email address is available.',
        ]);
    }
}
