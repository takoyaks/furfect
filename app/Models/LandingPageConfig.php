<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property string $template_name
 * @property string $hero_title
 * @property string|null $hero_subtitle
 * @property string $hero_cta_text
 * @property string $hero_cta_link
 * @property string|null $hero_image_path
 * @property array<string, bool>|null $section_settings
 * @property string $theme_color
 * @property string|null $about_title
 * @property string|null $about_mission
 * @property string|null $about_phone
 * @property string|null $about_email
 * @property string|null $about_location
 * @property string|null $about_hours
 * @property array|null $how_it_works_steps
 */
class LandingPageConfig extends Model
{
    protected $fillable = [
        'template_name',
        'hero_title',
        'hero_subtitle',
        'hero_cta_text',
        'hero_cta_link',
        'hero_image_path',
        'section_settings',
        'theme_color',
        'about_title',
        'about_mission',
        'about_phone',
        'about_email',
        'about_location',
        'about_hours',
        'how_it_works_steps',
    ];

    protected function casts(): array
    {
        return [
            'section_settings' => 'array',
            'how_it_works_steps' => 'array',
        ];
    }

    /**
     * Get the hero image full URL.
     *
     * @return Attribute<string|null, string|null>
     */
    protected function heroImagePath(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => $value ? (str_starts_with($value, 'http://') || str_starts_with($value, 'https://') ? $value : (str_starts_with($value, '/storage/') ? $value : Storage::url($value))) : null,
        );
    }

    /**
     * Get the active single configuration record.
     */
    public static function active(): self
    {
        return static::firstOrCreate(
            ['id' => 1],
            [
                'template_name' => 'honey_warm',
                'hero_title' => 'Find Your Perfect Companion in Virac',
                'hero_subtitle' => 'FurFect Match pairs you with rescued pets using our Decision Support System (DSS) compatibility matching engine.',
                'hero_cta_text' => 'Browse Pets Available for Adoption',
                'hero_cta_link' => '/pets',
                'hero_image_path' => null,
                'section_settings' => [
                    'show_hero' => true,
                    'show_featured_pets' => true,
                    'show_announcements' => true,
                    'show_stats' => true,
                    'show_how_it_works' => true,
                    'show_shelter_info' => true,
                ],
                'theme_color' => '#D4A017',
                'about_title' => 'Virac Municipal Animal Adoption System',
                'about_mission' => 'To eliminate animal homelessness in Virac, Catanduanes through responsible pet adoption, community education, spay/neuter programs, and transparent municipal oversight.',
                'about_phone' => '(052) 811-2345 / +63 950-321-7654',
                'about_email' => 'virac.shelter@gmail.com / mao@virac.gov.ph',
                'about_location' => 'Virac Municipal Compound, Barangay Concepcion, Virac, Catanduanes 4800',
                'about_hours' => 'Monday – Friday: 8:00 AM – 5:00 PM | Saturday: 9:00 AM – 12:00 PM',
                'how_it_works_steps' => [
                    [
                        'step' => '01',
                        'title' => 'Register & Complete Profile',
                        'description' => 'Create your account and complete our 2-step adopter & lifestyle profile detailing your home environment, activity level, and pet preferences.',
                    ],
                    [
                        'step' => '02',
                        'title' => 'DSS Compatibility Matching',
                        'description' => 'Our Decision Support System automatically evaluates your lifestyle profile against available shelter animals to generate a personalized compatibility match score.',
                    ],
                    [
                        'step' => '03',
                        'title' => 'Submit Adoption Application',
                        'description' => 'Select your matched pet and submit your formal adoption application. Your profile details are automatically attached so you fill it out once.',
                    ],
                    [
                        'step' => '04',
                        'title' => 'Shelter Review & MAO Audit',
                        'description' => 'Virac Animal Shelter staff review your home suitability, followed by final compliance audit and approval by the Municipal Animal Office (MAO).',
                    ],
                ],
            ]
        );
    }
}
