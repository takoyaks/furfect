<?php

namespace App\Http\Controllers;

use App\Models\SystemSetting;
use App\Services\CloudinaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Throwable;

class CertificateSignatoryController extends Controller
{
    /**
     * Update the certificate signatories configuration.
     */
    public function update(Request $request, CloudinaryService $cloudinary): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'signatories' => ['required', 'array', 'min:1', 'max:4'],
            'signatories.*.id' => ['required', 'string'],
            'signatories.*.name' => ['required', 'string', 'max:255'],
            'signatories.*.position' => ['nullable', 'string', 'max:255'],
            'signatories.*.title' => ['nullable', 'string', 'max:255'],
            'signatories.*.signature_url' => ['nullable', 'string', 'max:1000'],
            'signatories.*.enabled' => ['required', 'boolean'],
        ]);

        // Clean up any removed or replaced signatures from Cloudinary / storage
        $previousSignatories = SystemSetting::get('certificate_signatories', []);
        if (is_array($previousSignatories)) {
            $newUrls = collect($validated['signatories'])->pluck('signature_url')->filter()->all();
            foreach ($previousSignatories as $oldSig) {
                $oldUrl = $oldSig['signature_url'] ?? null;
                if ($oldUrl && ! in_array($oldUrl, $newUrls, true)) {
                    $this->deleteFileByUrl($oldUrl, $cloudinary);
                }
            }
        }

        SystemSetting::set('certificate_signatories', $validated['signatories']);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => __('Certificate signatories updated successfully.'),
                'signatories' => $validated['signatories'],
            ]);
        }

        return back()->with('toast', [
            'type' => 'success',
            'message' => __('Certificate signatories updated successfully.'),
        ]);
    }

    /**
     * Upload an official signature image to Cloudinary (or local storage fallback).
     */
    public function uploadSignature(Request $request, CloudinaryService $cloudinary): JsonResponse
    {
        $request->validate([
            'signature' => ['required', 'image', 'mimes:png,jpg,jpeg,webp,svg', 'max:5120'],
            'old_signature_url' => ['nullable', 'string'],
        ]);

        // If replacing an existing signature image, delete old file to free Cloudinary storage
        if ($oldUrl = $request->input('old_signature_url')) {
            $this->deleteFileByUrl($oldUrl, $cloudinary);
        }

        $file = $request->file('signature');

        try {
            if ($cloudinary->isConfigured()) {
                $result = $cloudinary->upload($file, 'signatures');

                return response()->json([
                    'success' => true,
                    'url' => $result['secure_url'],
                ]);
            }

            // Local fallback if Cloudinary credentials are not configured
            $path = $file->store('signatures', 'public');

            return response()->json([
                'success' => true,
                'url' => Storage::disk('public')->url($path),
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => __('Failed to upload signature image: ').$e->getMessage(),
            ], 422);
        }
    }

    /**
     * Delete an existing signature image from Cloudinary or local storage.
     */
    public function deleteSignature(Request $request, CloudinaryService $cloudinary): JsonResponse
    {
        $request->validate([
            'signature_url' => ['required', 'string'],
        ]);

        $this->deleteFileByUrl($request->input('signature_url'), $cloudinary);

        return response()->json([
            'success' => true,
            'message' => __('Signature image removed successfully.'),
        ]);
    }

    /**
     * Delete a file from Cloudinary or local storage by URL.
     */
    protected function deleteFileByUrl(?string $url, CloudinaryService $cloudinary): void
    {
        if (empty($url)) {
            return;
        }

        if (str_starts_with($url, 'http://') || str_starts_with($url, 'https://')) {
            if (str_contains($url, 'res.cloudinary.com')) {
                $cloudinary->delete($url);
            }
        } else {
            $relativePath = str_replace(Storage::disk('public')->url(''), '', $url);
            if (Storage::disk('public')->exists($relativePath)) {
                Storage::disk('public')->delete($relativePath);
            }
        }
    }
}
