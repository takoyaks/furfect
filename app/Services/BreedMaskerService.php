<?php

namespace App\Services;

/**
 * Masks breed names in pet description text so unbiased adopters
 * cannot identify the breed from description content.
 *
 * Each breed keyword is replaced with asterisks matching the character
 * count of the breed name (e.g. "Birman" → "******", "Maine Coon" → "***** ****").
 */
class BreedMaskerService
{
    /**
     * All breed keywords, sorted by length descending to prevent partial matches.
     */
    private static array $breeds = [];

    /**
     * Initialize and cache breed list from config.
     */
    private static function getBreeds(): array
    {
        if (! empty(static::$breeds)) {
            return static::$breeds;
        }

        $all = array_merge(
            config('breeds.dogs', []),
            config('breeds.cats', [])
        );

        // Sort longest first to prevent "Shepherd" matching before "German Shepherd"
        usort($all, fn ($a, $b) => strlen($b) - strlen($a));

        return static::$breeds = $all;
    }

    /**
     * Mask all breed names in a description string.
     * Each word of a breed is individually masked with asterisks.
     *
     * Example: "The Birman cat is large" → "The ****** cat is large"
     * Example: "Maine Coon are gentle" → "***** **** are gentle"
     */
    public static function mask(string $description): string
    {
        $breeds = static::getBreeds();

        foreach ($breeds as $breed) {
            $masked = implode(' ', array_map(
                fn ($word) => str_repeat('*', mb_strlen($word)),
                explode(' ', $breed)
            ));

            $description = preg_replace(
                '/\b'.preg_quote($breed, '/').'\b/iu',
                $masked,
                $description
            );
        }

        return $description;
    }
}
