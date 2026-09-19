<?php

namespace App\Notifications;

use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ApplicationStatusUpdatedNotification extends Notification
{
    use Queueable;

    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        public Application $application,
        public string $event,
        public array $payload = []
    ) {}

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
        $pet = $this->application->pet;
        $petName = $pet?->name ?? 'a pet';
        $adopter = $this->application->adopter;
        $adopterName = $adopter?->name ?? 'An adopter';
        $refNumber = $this->application->reference_number ?? '';
        $dssScore = round((float) $this->application->dss_score);
        $certNumber = $this->application->certificate_number;

        $data = match ($this->event) {
            // ── Adopter-targeted events ────────────────────────────────────
            'submitted_adopter' => [
                'title' => "Application Submitted for {$petName}",
                'message' => "Your adoption application ({$refNumber}) has been submitted and is now under review by shelter staff.",
                'icon' => 'file-check',
                'color' => 'blue',
                'action_url' => route('application.show'),
            ],
            'shelter_endorsed_adopter' => [
                'title' => 'Shelter Screening Passed!',
                'message' => "Great news! Your application for {$petName} has been endorsed by shelter staff and forwarded to MAO for compliance audit.",
                'icon' => 'shield-check',
                'color' => 'green',
                'action_url' => route('application.show'),
            ],
            'shelter_rejected_adopter' => [
                'title' => 'Application Update — Feedback Available',
                'message' => "Your application for {$petName} has been reviewed. Please check your application status for detailed feedback.",
                'icon' => 'alert-circle',
                'color' => 'orange',
                'action_url' => route('application.show'),
            ],
            'mao_approved_adopter' => [
                'title' => "Adoption Approved! Certificate #{$certNumber}",
                'message' => "Congratulations! Your adoption of {$petName} has been officially approved. Your 7-day pickup pass is ready.",
                'icon' => 'award',
                'color' => 'green',
                'action_url' => route('application.show'),
            ],
            'mao_rejected_adopter' => [
                'title' => 'Application Decision — MAO Compliance',
                'message' => "Your application for {$petName} has received a compliance decision. Please review the details and feedback.",
                'icon' => 'alert-circle',
                'color' => 'red',
                'action_url' => route('application.show'),
            ],
            'pet_waitlisted_adopter' => [
                'title' => "Application Update — Priority Standby for {$petName}",
                'message' => "Another application for {$petName} is currently in MAO audit. You are on the priority waitlist and will be evaluated if the primary candidate does not proceed.",
                'icon' => 'clock',
                'color' => 'amber',
                'action_url' => route('application.show'),
            ],
            'pet_adopted_recommendations_adopter' => [
                'title' => "{$petName} Has Been Adopted — Alternative Matches Ready",
                'message' => "{$petName} has found a home with another adopter. Based on your lifestyle profile, we found 3 compatible pet recommendations for you!",
                'icon' => 'heart-handshake',
                'color' => 'blue',
                'action_url' => route('application.show'),
            ],
            'waitlist_promoted_adopter' => [
                'title' => "Application Active! Screening for {$petName}",
                'message' => "Good news! The primary application was resolved and your application for {$petName} is now active for shelter screening.",
                'icon' => 'zap',
                'color' => 'green',
                'action_url' => route('application.show'),
            ],

            // ── Shelter Staff-targeted events ──────────────────────────────
            'submitted_staff' => [
                'title' => "New Application: {$adopterName} → {$petName}",
                'message' => "{$adopterName} applied for {$petName} with a DSS score of {$dssScore}%. Review required.",
                'icon' => 'clipboard-list',
                'color' => 'blue',
                'action_url' => route('shelter.applications.show', $this->application->id),
            ],
            'mao_approved_staff' => [
                'title' => "{$petName} — Adoption Approved!",
                'message' => "{$petName} has been officially adopted by {$adopterName}. Prepare pet turnover within 7 days.",
                'icon' => 'check-circle',
                'color' => 'green',
                'action_url' => route('shelter.applications.show', $this->application->id),
            ],
            'mao_rejected_staff' => [
                'title' => "{$petName} — Application Disapproved",
                'message' => "Application for {$petName} by {$adopterName} was disapproved by MAO. Pet has been returned to catalog.",
                'icon' => 'alert-circle',
                'color' => 'orange',
                'action_url' => route('shelter.applications.show', $this->application->id),
            ],

            // ── MAO Officer-targeted events ────────────────────────────────
            'mao_audit_pending' => [
                'title' => "New MAO Audit: {$adopterName} → {$petName}",
                'message' => "Shelter endorsed application ({$refNumber}) with DSS {$dssScore}%. Statutory compliance review required within 48h.",
                'icon' => 'shield-check',
                'color' => 'amber',
                'action_url' => route('mao.applications.show', $this->application->id),
            ],

            // ── Fallback ───────────────────────────────────────────────────
            default => [
                'title' => 'Application Update',
                'message' => "Application {$refNumber} has been updated.",
                'icon' => 'bell',
                'color' => 'gray',
                'action_url' => route('application.show'),
            ],
        };

        return array_merge($data, [
            'event' => $this->event,
            'application_id' => $this->application->id,
            'reference_number' => $refNumber,
            'pet_name' => $petName,
        ], $this->payload);
    }
}
