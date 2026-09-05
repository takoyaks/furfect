<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;
use Spatie\Permission\Models\Role;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        if (isset($input['email'])) {
            $input['email'] = strtolower(trim((string) $input['email']));
        }

        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
            'terms_agreed' => ['required', 'accepted'],
            'captcha_verified' => ['required', 'accepted'],
        ], [
            'email.unique' => 'This email address is already registered. Please log in or use a different email.',
            'terms_agreed.accepted' => 'You must agree to the terms and conditions and adoption policies.',
            'captcha_verified.accepted' => 'Please complete the "I\'m not a robot" security check.',
        ])->validate();

        $user = User::create([
            'name' => trim((string) $input['name']),
            'email' => $input['email'],
            'password' => $input['password'],
        ]);

        Role::firstOrCreate(['name' => 'adopter']);
        $user->assignRole('adopter');

        return $user;
    }
}
