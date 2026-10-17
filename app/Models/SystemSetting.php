<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $key
 * @property string|null $value
 * @property string $type
 * @property string $label
 * @property string|null $description
 */
class SystemSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'type',
        'label',
        'description',
    ];

    /**
     * Get a typed value for this setting.
     */
    public function typedValue(): mixed
    {
        if ($this->type === 'json' || $this->type === 'array') {
            return json_decode((string) $this->value, true) ?: [];
        }

        if ($this->type === 'integer') {
            return (int) $this->value;
        }

        if ($this->type === 'boolean' || str_ends_with($this->key, '_enabled')) {
            return filter_var($this->value, FILTER_VALIDATE_BOOLEAN);
        }

        if ($this->key === 'certificate_signatories' && is_string($this->value)) {
            $decoded = json_decode($this->value, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $decoded;
            }
        }

        return $this->value;
    }

    /**
     * Get a setting value by key with an optional default.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();

        return $setting ? $setting->typedValue() : $default;
    }

    /**
     * Set a setting value by key.
     */
    public static function set(string $key, mixed $value, ?string $type = null, ?string $label = null, ?string $description = null): void
    {
        $setting = static::firstOrNew(['key' => $key]);

        $setting->value = (is_array($value) || is_object($value))
            ? json_encode($value)
            : (is_bool($value) ? ($value ? '1' : '0') : (string) $value);

        if ($type !== null) {
            $setting->type = $type;
        } elseif (! $setting->exists) {
            if (is_array($value) || is_object($value)) {
                $setting->type = 'json';
            } elseif (is_bool($value) || str_ends_with($key, '_enabled')) {
                $setting->type = 'boolean';
            } else {
                $setting->type = 'string';
            }
        }

        if (! $setting->exists) {
            $setting->label = $label ?? ucwords(str_replace('_', ' ', $key));
            if ($description !== null) {
                $setting->description = $description;
            }
        } elseif ($label !== null) {
            $setting->label = $label;
        }

        $setting->save();
    }
}
