<?php

namespace App\Notifications;

use App\Models\Pet;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewMatchedPetAvailableNotification extends Notification
{
    use Queueable;

    public function __construct(public Pet $pet) {}

    /**
     * @return string[]
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $this->pet->loadMissing('shelter');
        $petName = $this->pet->name;
        $species = ucfirst((string) $this->pet->species);
        $size = ucfirst((string) $this->pet->size);
        $shelterName = $this->pet->shelter->name ?? 'Virac Animal Shelter';

        return [
            'title' => "New Pet Match Available: {$petName}!",
            'message' => "{$petName} ({$species}, {$size}) at {$shelterName} is now available for adoption and matches your lifestyle profile. View details to apply!",
            'icon' => 'sparkles',
            'color' => 'amber',
            'action_url' => route('pets.show', $this->pet->id),
            'event' => 'new_pet_match',
            'pet_id' => $this->pet->id,
            'pet_name' => $petName,
        ];
    }
}
