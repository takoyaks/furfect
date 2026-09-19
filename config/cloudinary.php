<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cloudinary Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your Cloudinary credentials and default settings.
    | You can provide the full CLOUDINARY_URL or individual credentials.
    |
    */

    'cloud_url' => env('CLOUDINARY_URL'),

    'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),

    'api_key' => env('CLOUDINARY_API_KEY'),

    'api_secret' => env('CLOUDINARY_API_SECRET', '0l9-9vNuuAa5HSqQIvkUTJubwpg'),

    /*
    |--------------------------------------------------------------------------
    | Default Upload Folder
    |--------------------------------------------------------------------------
    |
    | Root folder prefix applied to all uploads to organize assets within
    | Cloudinary (e.g., 'furfect/avatars', 'furfect/pets', etc.).
    |
    */

    'folder' => env('CLOUDINARY_FOLDER', 'furfect'),

    /*
    |--------------------------------------------------------------------------
    | Secure URLs
    |--------------------------------------------------------------------------
    |
    | Force HTTPS for all generated Cloudinary URLs.
    |
    */

    'secure' => env('CLOUDINARY_SECURE', true),

];
