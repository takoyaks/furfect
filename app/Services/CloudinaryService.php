<?php

namespace App\Services;

use Cloudinary\Api\Upload\UploadApi;
use Cloudinary\Configuration\Configuration;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Throwable;

class CloudinaryService
{
    protected ?Configuration $config = null;

    protected string $rootFolder;

    public function __construct()
    {
        $this->rootFolder = (string) config('cloudinary.folder', 'furfect');
        $this->initializeConfig();
    }

    /**
     * Initialize Cloudinary configuration from config or environment.
     */
    protected function initializeConfig(): void
    {
        $cloudUrl = config('cloudinary.cloud_url');
        $cloudName = config('cloudinary.cloud_name');
        $apiKey = config('cloudinary.api_key');
        $apiSecret = config('cloudinary.api_secret');

        if (! empty($cloudUrl)) {
            $this->config = Configuration::instance($cloudUrl);
        } elseif (! empty($cloudName) && ! empty($apiKey) && ! empty($apiSecret)) {
            $this->config = Configuration::instance([
                'cloud' => [
                    'cloud_name' => $cloudName,
                    'api_key' => $apiKey,
                    'api_secret' => $apiSecret,
                ],
                'url' => [
                    'secure' => (bool) config('cloudinary.secure', true),
                ],
            ]);
        }
    }

    /**
     * Check if Cloudinary credentials are fully configured.
     */
    public function isConfigured(): bool
    {
        return $this->config !== null;
    }

    /**
     * Build the destination folder with root namespace prefix.
     */
    public function resolveFolder(string $subfolder = ''): string
    {
        $cleanedSubfolder = trim($subfolder, '/');

        if (empty($this->rootFolder)) {
            return $cleanedSubfolder;
        }

        if (empty($cleanedSubfolder)) {
            return $this->rootFolder;
        }

        return $this->rootFolder.'/'.$cleanedSubfolder;
    }

    /**
     * Upload an UploadedFile or local file path to Cloudinary.
     *
     * @param  string  $subfolder  (e.g., 'avatars', 'pets', 'announcements', 'landing')
     * @param  array<string, mixed>  $options
     * @return array{secure_url: string, public_id: string, format: ?string, bytes: ?int, resource_type: string}
     */
    public function upload(UploadedFile|string $file, string $subfolder = '', array $options = []): array
    {
        $folder = $this->resolveFolder($subfolder);
        $source = $file instanceof UploadedFile ? $file->getRealPath() : $file;

        $defaultOptions = [
            'folder' => $folder,
            'resource_type' => 'auto',
            'use_filename' => true,
            'unique_filename' => true,
            'overwrite' => false,
        ];

        $mergedOptions = array_merge($defaultOptions, $options);

        $uploadApi = new UploadApi($this->config);
        $response = $uploadApi->upload($source, $mergedOptions);

        return [
            'secure_url' => (string) ($response['secure_url'] ?? $response['url'] ?? ''),
            'public_id' => (string) ($response['public_id'] ?? ''),
            'format' => isset($response['format']) ? (string) $response['format'] : null,
            'bytes' => isset($response['bytes']) ? (int) $response['bytes'] : null,
            'resource_type' => (string) ($response['resource_type'] ?? 'image'),
        ];
    }

    /**
     * Upload raw binary content to Cloudinary.
     *
     * @param  array<string, mixed>  $options
     * @return array{secure_url: string, public_id: string, format: ?string, bytes: ?int, resource_type: string}
     */
    public function uploadRaw(string $binaryData, string $subfolder = '', string $mime = 'image/jpeg', array $options = []): array
    {
        $dataUri = 'data:'.$mime.';base64,'.base64_encode($binaryData);

        return $this->upload($dataUri, $subfolder, $options);
    }

    /**
     * Upload a video file to Cloudinary with compression and eager transcoding.
     *
     * @param  string  $subfolder  (e.g., 'pets/videos', 'announcements/videos')
     * @param  array<string, mixed>  $options
     * @return array{secure_url: string, public_id: string, format: ?string, bytes: ?int, resource_type: string}
     */
    public function uploadVideo(UploadedFile|string $file, string $subfolder = 'pets/videos', array $options = []): array
    {
        $defaultVideoOptions = [
            'resource_type' => 'video',
            'eager' => [
                [
                    'width' => 1280,
                    'crop' => 'limit',
                    'quality' => 'auto:good',
                    'video_codec' => 'auto',
                ],
            ],
            'eager_async' => true,
        ];

        $merged = array_merge($defaultVideoOptions, $options);

        return $this->upload($file, $subfolder, $merged);
    }

    /**
     * Generate an optimized delivery URL for a Cloudinary video.
     */
    public function getOptimizedVideoUrl(?string $url): ?string
    {
        if (empty($url)) {
            return null;
        }

        if (! str_contains($url, 'res.cloudinary.com') || ! str_contains($url, '/video/upload/')) {
            return $url;
        }

        // Avoid adding transformations multiple times
        if (str_contains($url, '/video/upload/q_auto')) {
            return $url;
        }

        return str_replace('/video/upload/', '/video/upload/q_auto,vc_auto,w_1280,c_limit/', $url);
    }

    /**
     * Derive an optimized poster image thumbnail URL from a Cloudinary video URL.
     */
    public function getVideoPosterUrl(?string $videoUrl): ?string
    {
        if (empty($videoUrl) || ! str_contains($videoUrl, 'res.cloudinary.com') || ! str_contains($videoUrl, '/video/upload/')) {
            return null;
        }

        // Change extension to .jpg
        $posterUrl = preg_replace('/\.[a-zA-Z0-9]+$/', '.jpg', $videoUrl) ?? $videoUrl;

        // Strip existing video transformations if any
        if (str_contains($posterUrl, '/video/upload/q_auto,vc_auto,w_1280,c_limit/')) {
            return str_replace('/video/upload/q_auto,vc_auto,w_1280,c_limit/', '/video/upload/so_1,w_800,c_limit,q_auto/', $posterUrl);
        }

        return str_replace('/video/upload/', '/video/upload/so_1,w_800,c_limit,q_auto/', $posterUrl);
    }

    /**
     * Delete an asset from Cloudinary by its public ID or full URL.
     *
     * @param  array<string, mixed>  $options
     */
    public function delete(?string $publicIdOrUrl, array $options = []): bool
    {
        if (empty($publicIdOrUrl)) {
            return false;
        }

        $publicId = $this->extractPublicId($publicIdOrUrl);

        if (empty($publicId)) {
            return false;
        }

        if (! isset($options['resource_type']) && str_contains($publicIdOrUrl, '/video/upload/')) {
            $options['resource_type'] = 'video';
        }

        try {
            $uploadApi = new UploadApi($this->config);
            $response = $uploadApi->destroy($publicId, $options);

            return ($response['result'] ?? '') === 'ok' || ($response['result'] ?? '') === 'not found';
        } catch (Throwable $e) {
            Log::warning('Cloudinary delete failed: '.$e->getMessage(), ['public_id' => $publicId]);

            return false;
        }
    }

    /**
     * Extract Cloudinary public ID from a full Cloudinary asset URL.
     */
    public function extractPublicId(string $pathOrUrl): ?string
    {
        if (! str_starts_with($pathOrUrl, 'http://') && ! str_starts_with($pathOrUrl, 'https://')) {
            // Already a public_id or relative path
            return ltrim($pathOrUrl, '/');
        }

        // URL format: https://res.cloudinary.com/<cloud>/(image|video)/upload/(v<version>/)?<public_id>.<ext>
        if (preg_match('~/upload/(?:v\d+/)?(?:[^/]+,)?([^?#]+?)(?:\.[a-zA-Z0-9]+)?$~i', $pathOrUrl, $matches)) {
            return $matches[1];
        }

        return null;
    }
}
