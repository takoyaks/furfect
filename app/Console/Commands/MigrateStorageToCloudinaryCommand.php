<?php

namespace App\Console\Commands;

use App\Models\AdopterProfile;
use App\Models\Announcement;
use App\Models\LandingPageConfig;
use App\Models\PetPhoto;
use App\Models\User;
use App\Services\CloudinaryService;
use App\Services\EncryptedFileStorageService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Throwable;

class MigrateStorageToCloudinaryCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'storage:migrate-cloudinary {--dry-run : Preview actions without uploading or changing DB} {--force : Run without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate local file storage (avatars, pets, announcements, landing, id_documents) to Cloudinary under folder organization';

    public function handle(CloudinaryService $cloudinary, EncryptedFileStorageService $encryptedStorage): int
    {
        $isDryRun = (bool) $this->option('dry-run');

        $this->info('=====================================================');
        $this->info('  FurFect Local Storage -> Cloudinary Migration');
        $this->info('=====================================================');

        if ($isDryRun) {
            $this->warn('[DRY-RUN MODE] No files will be uploaded and no DB records will be altered.');
        }

        if (! $cloudinary->isConfigured()) {
            $this->error('Cloudinary is not configured. Please set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.');

            return self::FAILURE;
        }

        if (! $isDryRun && ! $this->option('force')) {
            if (! $this->confirm('Are you ready to migrate local media files to Cloudinary?', true)) {
                $this->info('Migration cancelled.');

                return self::SUCCESS;
            }
        }

        $stats = [
            'avatars' => 0,
            'pet_photos' => 0,
            'announcements' => 0,
            'landing_images' => 0,
            'id_documents' => 0,
            'failed' => 0,
        ];

        // 1. Migrate User Avatars
        $this->info("\n--- 1. Migrating User Avatars ---");
        $users = User::whereNotNull('avatar')->get();
        foreach ($users as $user) {
            $rawAvatar = $user->getRawOriginal('avatar');
            if (! $rawAvatar || str_starts_with($rawAvatar, 'http://') || str_starts_with($rawAvatar, 'https://')) {
                continue;
            }

            $localRelativePath = ltrim(str_replace('/storage/', '', $rawAvatar), '/');
            if (Storage::disk('public')->exists($localRelativePath)) {
                $fullLocalPath = Storage::disk('public')->path($localRelativePath);
                $this->line("Processing user #{$user->id} avatar: {$localRelativePath}");

                if (! $isDryRun) {
                    try {
                        $result = $cloudinary->upload($fullLocalPath, 'avatars');
                        $user->avatar = $result['secure_url'];
                        $user->saveQuietly();
                        $stats['avatars']++;
                        $this->info(" -> Uploaded to: {$result['secure_url']}");
                    } catch (Throwable $e) {
                        $stats['failed']++;
                        $this->error(" -> Failed: {$e->getMessage()}");
                    }
                } else {
                    $stats['avatars']++;
                    $this->comment(" -> [Dry-Run] Would upload {$localRelativePath} to furfect/avatars");
                }
            }
        }

        // 2. Migrate Pet Photos
        $this->info("\n--- 2. Migrating Pet Photos ---");
        $petPhotos = PetPhoto::all();
        foreach ($petPhotos as $photo) {
            $rawPath = $photo->photo_path;
            if (! $rawPath || str_starts_with($rawPath, 'http://') || str_starts_with($rawPath, 'https://')) {
                continue;
            }

            $localRelativePath = ltrim(str_replace('/storage/', '', $rawPath), '/');
            if (Storage::disk('public')->exists($localRelativePath)) {
                $fullLocalPath = Storage::disk('public')->path($localRelativePath);
                $this->line("Processing pet photo #{$photo->id} (Pet #{$photo->pet_id}): {$localRelativePath}");

                if (! $isDryRun) {
                    try {
                        $result = $cloudinary->upload($fullLocalPath, 'pets');
                        $photo->photo_path = $result['secure_url'];
                        $photo->saveQuietly();
                        $stats['pet_photos']++;
                        $this->info(" -> Uploaded to: {$result['secure_url']}");
                    } catch (Throwable $e) {
                        $stats['failed']++;
                        $this->error(" -> Failed: {$e->getMessage()}");
                    }
                } else {
                    $stats['pet_photos']++;
                    $this->comment(" -> [Dry-Run] Would upload {$localRelativePath} to furfect/pets");
                }
            }
        }

        // 3. Migrate Announcements
        $this->info("\n--- 3. Migrating Announcement Images ---");
        $announcements = Announcement::whereNotNull('image_path')->get();
        foreach ($announcements as $announcement) {
            $rawPath = $announcement->getRawOriginal('image_path');
            if (! $rawPath || str_starts_with($rawPath, 'http://') || str_starts_with($rawPath, 'https://')) {
                continue;
            }

            $localRelativePath = ltrim(str_replace('/storage/', '', $rawPath), '/');
            if (Storage::disk('public')->exists($localRelativePath)) {
                $fullLocalPath = Storage::disk('public')->path($localRelativePath);
                $this->line("Processing announcement #{$announcement->id}: {$localRelativePath}");

                if (! $isDryRun) {
                    try {
                        $result = $cloudinary->upload($fullLocalPath, 'announcements');
                        $announcement->image_path = $result['secure_url'];
                        $announcement->saveQuietly();
                        $stats['announcements']++;
                        $this->info(" -> Uploaded to: {$result['secure_url']}");
                    } catch (Throwable $e) {
                        $stats['failed']++;
                        $this->error(" -> Failed: {$e->getMessage()}");
                    }
                } else {
                    $stats['announcements']++;
                    $this->comment(" -> [Dry-Run] Would upload {$localRelativePath} to furfect/announcements");
                }
            }
        }

        // 4. Migrate Landing Page Hero Image
        $this->info("\n--- 4. Migrating Landing Page Hero Images ---");
        $configs = LandingPageConfig::whereNotNull('hero_image_path')->get();
        foreach ($configs as $config) {
            $rawPath = $config->getRawOriginal('hero_image_path');
            if (! $rawPath || str_starts_with($rawPath, 'http://') || str_starts_with($rawPath, 'https://')) {
                continue;
            }

            $localRelativePath = ltrim(str_replace('/storage/', '', $rawPath), '/');
            if (Storage::disk('public')->exists($localRelativePath)) {
                $fullLocalPath = Storage::disk('public')->path($localRelativePath);
                $this->line("Processing landing page config #{$config->id}: {$localRelativePath}");

                if (! $isDryRun) {
                    try {
                        $result = $cloudinary->upload($fullLocalPath, 'landing');
                        $config->hero_image_path = $result['secure_url'];
                        $config->saveQuietly();
                        $stats['landing_images']++;
                        $this->info(" -> Uploaded to: {$result['secure_url']}");
                    } catch (Throwable $e) {
                        $stats['failed']++;
                        $this->error(" -> Failed: {$e->getMessage()}");
                    }
                } else {
                    $stats['landing_images']++;
                    $this->comment(" -> [Dry-Run] Would upload {$localRelativePath} to furfect/landing");
                }
            }
        }

        // 5. Migrate Adopter ID Documents
        $this->info("\n--- 5. Migrating Adopter ID Documents ---");
        $profiles = AdopterProfile::where(function ($q) {
            $q->whereNotNull('id_document_path')
                ->orWhereNotNull('id_document_back_path');
        })->get();

        foreach ($profiles as $profile) {
            // Front ID document
            if ($profile->id_document_path && ! str_starts_with($profile->id_document_path, 'http')) {
                $frontContent = $encryptedStorage->decryptContent($profile->id_document_path);
                if ($frontContent) {
                    $this->line("Processing profile #{$profile->id} Front ID document");
                    if (! $isDryRun) {
                        try {
                            $mime = $profile->id_document_mime ?: 'image/jpeg';
                            $result = $cloudinary->uploadRaw($frontContent, 'id_documents', $mime);
                            $profile->id_document_path = $result['secure_url'];
                            $profile->saveQuietly();
                            $stats['id_documents']++;
                            $this->info(" -> Uploaded Front ID to: {$result['secure_url']}");
                        } catch (Throwable $e) {
                            $stats['failed']++;
                            $this->error(" -> Front ID Failed: {$e->getMessage()}");
                        }
                    } else {
                        $stats['id_documents']++;
                        $this->comment(' -> [Dry-Run] Would decrypt and upload Front ID to furfect/id_documents');
                    }
                }
            }

            // Back ID document
            if ($profile->id_document_back_path && ! str_starts_with($profile->id_document_back_path, 'http')) {
                $backContent = $encryptedStorage->decryptContent($profile->id_document_back_path);
                if ($backContent) {
                    $this->line("Processing profile #{$profile->id} Back ID document");
                    if (! $isDryRun) {
                        try {
                            $mime = $profile->id_document_back_mime ?: 'image/jpeg';
                            $result = $cloudinary->uploadRaw($backContent, 'id_documents', $mime);
                            $profile->id_document_back_path = $result['secure_url'];
                            $profile->saveQuietly();
                            $stats['id_documents']++;
                            $this->info(" -> Uploaded Back ID to: {$result['secure_url']}");
                        } catch (Throwable $e) {
                            $stats['failed']++;
                            $this->error(" -> Back ID Failed: {$e->getMessage()}");
                        }
                    } else {
                        $stats['id_documents']++;
                        $this->comment(' -> [Dry-Run] Would decrypt and upload Back ID to furfect/id_documents');
                    }
                }
            }
        }

        // Summary
        $this->info("\n=====================================================");
        $this->info('  Migration Summary');
        $this->info('=====================================================');
        $this->info("Avatars Migrated:        {$stats['avatars']}");
        $this->info("Pet Photos Migrated:     {$stats['pet_photos']}");
        $this->info("Announcements Migrated:  {$stats['announcements']}");
        $this->info("Landing Images Migrated: {$stats['landing_images']}");
        $this->info("ID Documents Migrated:   {$stats['id_documents']}");
        if ($stats['failed'] > 0) {
            $this->error("Failed Transfers:        {$stats['failed']}");
        }
        $this->info("Done!\n");

        return self::SUCCESS;
    }
}
