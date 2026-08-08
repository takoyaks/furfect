<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

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
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
            'terms_agreed' => ['required', 'accepted'],
            'captcha_verified' => ['required', 'accepted'],
        ], [
            'terms_agreed.accepted' => 'You must agree to the terms and conditions and adoption policies.',
            'captcha_verified.accepted' => 'Please complete the "I\'m not a robot" security check.',
        ])->validate();

        $user = User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => $input['password'],
        ]);

        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'adopter']);
        $user->assignRole('adopter');

        return $user;
    }
}
