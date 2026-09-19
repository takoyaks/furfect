<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class EncryptedFileStorageService
{
    /**
     * Encrypt an uploaded file and store it in private disk storage.
     *
     * @return array{path: string, original_name: string, mime: string}
     */
    public function storeEncrypted(UploadedFile $file, string $directory = 'id_documents'): array
    {
        $rawBinary = (string) file_get_contents($file->getRealPath());
        $encryptedPayload = Crypt::encryptString($rawBinary);

        $extension = $file->getClientOriginalExtension();
        $randomName = Str::random(40).($extension ? '.'.$extension : '').'.enc';
        $fullPath = trim($directory, '/').'/'.$randomName;

        Storage::disk('local')->put($fullPath, $encryptedPayload);

        return [
            'path' => $fullPath,
            'original_name' => $file->getClientOriginalName(),
            'mime' => $file->getMimeType() ?: 'application/octet-stream',
        ];
    }

    /**
     * Encrypt raw binary data and store it in private disk storage.
     *
     * @return array{path: string, original_name: string, mime: string}
     */
    public function storeRawEncrypted(string $binaryData, string $filename = 'id_document.jpg', string $mime = 'image/jpeg', string $directory = 'id_documents'): array
    {
        $encryptedPayload = Crypt::encryptString($binaryData);

        $extension = pathinfo($filename, PATHINFO_EXTENSION) ?: 'jpg';
        $randomName = Str::random(40).'.'.$extension.'.enc';
        $fullPath = trim($directory, '/').'/'.$randomName;

        Storage::disk('local')->put($fullPath, $encryptedPayload);

        return [
            'path' => $fullPath,
            'original_name' => $filename,
            'mime' => $mime,
        ];
    }

    /**
     * Decrypt and return raw binary content.
     */
    public function decryptContent(string $path): ?string
    {
        if (! Storage::disk('local')->exists($path)) {
            return null;
        }

        $payload = Storage::disk('local')->get($path);

        try {
            return Crypt::decryptString($payload);
        } catch (\Throwable) {
            // Fallback: If the stored file was uploaded unencrypted (e.g. legacy/direct binary)
            // or cannot be decrypted with Crypt, check if it's already a valid file stream
            if (! empty($payload)) {
                return $payload;
            }

            return null;
        }
    }

    /**
     * Stream a decrypted file as an HTTP response.
     */
    public function streamDecrypted(string $path, ?string $filename = null, ?string $mime = null): Response
    {
        $content = $this->decryptContent($path);

        if ($content === null) {
            abort(404, 'Protected document not found or corrupted.');
        }

        $filename = $filename ?: basename($path);
        $mime = $mime ?: 'image/jpeg';

        return response($content, 200, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="'.addslashes($filename).'"',
            'Content-Length' => strlen($content),
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
            'Pragma' => 'no-cache',
        ]);
    }

    /**
     * Delete an encrypted file from storage.
     */
    public function deleteFile(?string $path): bool
    {
        if ($path && Storage::disk('local')->exists($path)) {
            return Storage::disk('local')->delete($path);
        }

        return false;
    }
}
