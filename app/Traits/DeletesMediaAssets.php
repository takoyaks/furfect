<?php

namespace App\Traits;

use App\Services\CloudinaryService;
use App\Services\EncryptedFileStorageService;
use Illuminate\Support\Facades\Storage;

trait DeletesMediaAssets
{
    /**
     * Delete an asset from Cloudinary, public storage, or encrypted storage.
     *
     * @param  array<string, mixed>  $options
     */
    protected static function deleteStoredMedia(?string $pathOrUrl, array $options = []): void
    {
        if (empty($pathOrUrl)) {
            return;
        }

        // 1. Cloudinary asset URL
        if (str_starts_with($pathOrUrl, 'http://') || str_starts_with($pathOrUrl, 'https://')) {
            if (str_contains($pathOrUrl, 'res.cloudinary.com') || str_contains($pathOrUrl, '/upload/')) {
                if (! isset($options['resource_type']) && str_contains($pathOrUrl, '/video/upload/')) {
                    $options['resource_type'] = 'video';
                }
                app(CloudinaryService::class)->delete($pathOrUrl, $options);
            }

            return;
        }

        // 2. Encrypted local storage file (.enc or id_documents directory)
        if (str_ends_with($pathOrUrl, '.enc') || str_starts_with($pathOrUrl, 'id_documents/')) {
            app(EncryptedFileStorageService::class)->deleteFile($pathOrUrl);
        }

        // 3. Local public storage file
        $relativePath = ltrim(str_replace('/storage/', '', $pathOrUrl), '/');
        if (Storage::disk('public')->exists($relativePath)) {
            Storage::disk('public')->delete($relativePath);
        } elseif (Storage::disk('public')->exists($pathOrUrl)) {
            Storage::disk('public')->delete($pathOrUrl);
        }
    }
}
