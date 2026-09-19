<?php

use App\Models\Announcement;
use App\Models\LandingPageConfig;
use App\Models\PetPhoto;
use App\Models\User;
use App\Services\CloudinaryService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;

test('cloudinary service resolves root folder organization properly', function () {
    Config::set('cloudinary.folder', 'furfect');
    $service = new CloudinaryService;

    expect($service->resolveFolder('avatars'))->toBe('furfect/avatars');
    expect($service->resolveFolder('pets'))->toBe('furfect/pets');
    expect($service->resolveFolder('announcements'))->toBe('furfect/announcements');
    expect($service->resolveFolder('landing'))->toBe('furfect/landing');
    expect($service->resolveFolder('id_documents'))->toBe('furfect/id_documents');
    expect($service->resolveFolder(''))->toBe('furfect');
});

test('cloudinary service extracts public id from full URLs correctly', function () {
    $service = new CloudinaryService;

    $url1 = 'https://res.cloudinary.com/furfect/image/upload/v1726712345/furfect/pets/pet_123.jpg';
    expect($service->extractPublicId($url1))->toBe('furfect/pets/pet_123');

    $url2 = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
    expect($service->extractPublicId($url2))->toBe('sample');

    $relativePath = 'furfect/avatars/user_456';
    expect($service->extractPublicId($relativePath))->toBe('furfect/avatars/user_456');
});

test('announcement image_path accessor resolves http and local paths properly', function () {
    $announcement = new Announcement([
        'title' => 'Vaccination Drive',
        'category' => 'Events',
        'content' => 'Details here',
        'image_path' => 'https://res.cloudinary.com/furfect/image/upload/v1/furfect/announcements/event1.jpg',
    ]);

    expect($announcement->image_path)->toBe('https://res.cloudinary.com/furfect/image/upload/v1/furfect/announcements/event1.jpg');

    $localAnnouncement = new Announcement([
        'title' => 'Local Update',
        'category' => 'Updates',
        'content' => 'Local details',
        'image_path' => 'announcements/local_img.jpg',
    ]);

    expect($localAnnouncement->image_path)->toContain('announcements/local_img.jpg');
});

test('pet photo photo_path accessor resolves http and local paths properly', function () {
    $photo = new PetPhoto([
        'photo_path' => 'https://res.cloudinary.com/furfect/image/upload/v1/furfect/pets/dog_1.png',
    ]);

    expect($photo->photo_path)->toBe('https://res.cloudinary.com/furfect/image/upload/v1/furfect/pets/dog_1.png');

    $localPhoto = new PetPhoto([
        'photo_path' => '/storage/pets/dog_local.png',
    ]);

    expect($localPhoto->photo_path)->toBe('/storage/pets/dog_local.png');
});

test('landing page hero_image_path accessor resolves http and local paths properly', function () {
    $config = new LandingPageConfig([
        'hero_image_path' => 'https://res.cloudinary.com/furfect/image/upload/v1/furfect/landing/hero.webp',
    ]);

    expect($config->hero_image_path)->toBe('https://res.cloudinary.com/furfect/image/upload/v1/furfect/landing/hero.webp');
});

test('user avatar accessor resolves http and local paths properly', function () {
    $user = new User([
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'avatar' => 'https://res.cloudinary.com/furfect/image/upload/v1/furfect/avatars/john.jpg',
    ]);

    expect($user->avatar)->toBe('https://res.cloudinary.com/furfect/image/upload/v1/furfect/avatars/john.jpg');
});

test('migration command dry run executes without errors', function () {
    Config::set('cloudinary.cloud_name', 'demo');
    Config::set('cloudinary.api_key', '123456');
    Config::set('cloudinary.api_secret', '0l9-9vNuuAa5HSqQIvkUTJubwpg');

    $exitCode = Artisan::call('storage:migrate-cloudinary', [
        '--dry-run' => true,
        '--force' => true,
    ]);

    expect($exitCode)->toBe(0);
});
