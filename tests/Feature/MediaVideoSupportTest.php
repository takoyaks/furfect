<?php

use App\Models\Announcement;
use App\Models\Pet;
use App\Models\PetPhoto;
use App\Models\Shelter;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Config::set('cloudinary.cloud_url', null);
    Config::set('cloudinary.cloud_name', null);
    Config::set('cloudinary.api_key', null);
    Config::set('cloudinary.api_secret', null);

    Role::firstOrCreate(['name' => 'admin']);
    Role::firstOrCreate(['name' => 'shelter_staff']);
    Role::firstOrCreate(['name' => 'adopter']);
});

test('shelter staff can create pet listing with video and thumbnail', function () {
    Storage::fake('public');

    $staff = User::factory()->create();
    $staff->assignRole('shelter_staff');

    $shelter = Shelter::factory()->create(['status' => 'active']);

    $photo = UploadedFile::fake()->image('dog.jpg', 600, 600);
    $video = UploadedFile::fake()->create('playful_dog.mp4', 5000, 'video/mp4');
    $thumbnail = UploadedFile::fake()->image('video_poster.jpg', 600, 600);

    $response = $this->actingAs($staff)->post(route('shelter.pets.store'), [
        'shelter_id' => $shelter->id,
        'name' => 'Milo',
        'species' => 'dog',
        'breed' => 'Beagle',
        'age_years' => 1,
        'gender' => 'male',
        'size' => 'medium',
        'temperament' => ['Friendly', 'Playful'],
        'energy_level' => 'high',
        'requires_experience' => false,
        'requires_yard' => true,
        'requires_no_children' => false,
        'requires_no_other_pets' => false,
        'housing_compatible' => ['house_with_yard'],
        'adoption_fee' => 1000,
        'description' => 'Milo is an active beagle with lots of playful energy.',
        'photos' => [$photo],
        'video' => $video,
        'video_thumbnail' => $thumbnail,
        'video_duration' => 28,
    ]);

    $response->assertRedirect(route('shelter.pets.index'));

    $pet = Pet::where('name', 'Milo')->first();
    expect($pet)->not->toBeNull();

    $media = PetPhoto::where('pet_id', $pet->id)->get();
    expect($media)->toHaveCount(2);

    $imageItem = $media->firstWhere('media_type', 'image');
    expect($imageItem)->not->toBeNull();
    expect($imageItem->is_primary)->toBeTrue();

    $videoItem = $media->firstWhere('media_type', 'video');
    expect($videoItem)->not->toBeNull();
    expect($videoItem->is_primary)->toBeFalse();
    expect($videoItem->video_path)->not->toBeNull();
    expect($videoItem->thumbnail_path)->not->toBeNull();
    expect($videoItem->duration_seconds)->toBe(28);
    expect($videoItem->isVideo())->toBeTrue();
});

test('shelter staff can update pet and delete existing video', function () {
    Storage::fake('public');

    $staff = User::factory()->create();
    $staff->assignRole('shelter_staff');

    $shelter = Shelter::factory()->create(['status' => 'active']);
    $pet = Pet::factory()->create([
        'shelter_id' => $shelter->id,
        'name' => 'Bella',
    ]);

    $videoItem = PetPhoto::create([
        'pet_id' => $pet->id,
        'photo_path' => 'pets/thumbnails/thumb.jpg',
        'media_type' => 'video',
        'video_path' => 'pets/videos/video.mp4',
        'thumbnail_path' => 'pets/thumbnails/thumb.jpg',
        'duration_seconds' => 45,
        'is_primary' => false,
        'sort_order' => 1,
    ]);

    $response = $this->actingAs($staff)->post(route('shelter.pets.update', $pet->id), [
        'shelter_id' => $shelter->id,
        'name' => 'Bella Updated',
        'species' => 'cat',
        'age_years' => 3,
        'gender' => 'female',
        'size' => 'small',
        'energy_level' => 'low',
        'requires_experience' => false,
        'requires_yard' => false,
        'requires_no_children' => false,
        'requires_no_other_pets' => false,
        'housing_compatible' => ['apartment'],
        'status' => 'available',
        'delete_video' => true,
    ]);

    $response->assertRedirect(route('shelter.pets.index'));

    expect(PetPhoto::where('pet_id', $pet->id)->where('media_type', 'video')->exists())->toBeFalse();
});

test('admin can create announcement with video and poster thumbnail', function () {
    Storage::fake('public');

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $video = UploadedFile::fake()->create('event_recap.mp4', 8000, 'video/mp4');
    $thumbnail = UploadedFile::fake()->image('event_poster.jpg', 800, 600);

    $response = $this->actingAs($admin)->post(route('admin.cms.announcements.store'), [
        'title' => 'Adoption Weekend Video Recap',
        'category' => 'Adoption Event',
        'content' => 'Watch highlights from our weekend adoption drive!',
        'is_published' => true,
        'video' => $video,
        'video_thumbnail' => $thumbnail,
        'video_duration' => 95,
    ]);

    $response->assertSessionHasNoErrors();

    $announcement = Announcement::where('title', 'Adoption Weekend Video Recap')->first();
    expect($announcement)->not->toBeNull();
    expect($announcement->video_path)->not->toBeNull();
    expect($announcement->video_thumbnail_path)->not->toBeNull();
    expect($announcement->video_duration)->toBe(95);
});

test('shelter staff can update and remove announcement video', function () {
    Storage::fake('public');

    $staff = User::factory()->create();
    $staff->assignRole('shelter_staff');

    $announcement = Announcement::create([
        'title' => 'Vaccination Drive Video',
        'slug' => 'vaccination-drive-video',
        'category' => 'Medical',
        'content' => 'Full video coverage of vaccination day.',
        'video_path' => 'announcements/videos/vac.mp4',
        'video_thumbnail_path' => 'announcements/thumbnails/vac.jpg',
        'video_duration' => 60,
        'is_published' => true,
    ]);

    $response = $this->actingAs($staff)->put(route('shelter.cms.announcements.update', $announcement->id), [
        'title' => 'Vaccination Drive (Updated Notes)',
        'category' => 'Medical',
        'content' => 'Text updated and video removed.',
        'is_published' => true,
        'delete_video' => true,
    ]);

    $response->assertSessionHasNoErrors();

    $announcement->refresh();
    expect($announcement->video_path)->toBeNull();
    expect($announcement->video_thumbnail_path)->toBeNull();
    expect($announcement->video_duration)->toBeNull();
});

test('rejects video upload exceeding maximum file size', function () {
    Storage::fake('public');

    $staff = User::factory()->create();
    $staff->assignRole('shelter_staff');
    $shelter = Shelter::factory()->create(['status' => 'active']);

    // Fake video larger than 50MB (52MB = 53248 KB)
    $oversizedVideo = UploadedFile::fake()->create('giant_video.mp4', 55000, 'video/mp4');

    $response = $this->actingAs($staff)->post(route('shelter.pets.store'), [
        'shelter_id' => $shelter->id,
        'name' => 'Oversized Pet',
        'species' => 'dog',
        'age_years' => 1,
        'gender' => 'male',
        'size' => 'medium',
        'energy_level' => 'low',
        'requires_experience' => false,
        'requires_yard' => false,
        'requires_no_children' => false,
        'requires_no_other_pets' => false,
        'housing_compatible' => ['apartment'],
        'video' => $oversizedVideo,
    ]);

    $response->assertSessionHasErrors(['video']);
});
