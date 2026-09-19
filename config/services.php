<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'didit' => [
        'api_key' => env('DIDIT_API_KEY'),
        'client_id' => env('DIDIT_CLIENT_ID'),
        'client_secret' => env('DIDIT_CLIENT_SECRET'),
        'webhook_secret' => env('DIDIT_WEBHOOK_SECRET'),
        'workflow_id' => env('DIDIT_WORKFLOW_ID', '1b25598a-4af1-416a-8dc4-a95c03159b98'),
        'base_url' => env('DIDIT_API_URL', 'https://verification.didit.me'),
    ],

];
