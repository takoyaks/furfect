<?php

namespace App\Services;

use App\Models\Application;
use App\Models\User;
use App\Notifications\ApplicationStatusUpdatedNotification;
use Spatie\Permission\Models\Role;

class AdoptionNotificationService
{
    /**
     * Notify adopter and all shelter staff when a new application is submitted.
     */
    public function notifyApplicationSubmitted(Application $application): void
    {
        $application->loadMissing(['adopter', 'pet']);

        // Notify the adopter
        $application->adopter?->notify(
            new ApplicationStatusUpdatedNotification($application, 'submitted_adopter')
        );

        // Notify all shelter staff
        $this->notifyRole('shelter_staff', $application, 'submitted_staff');
    }

    /**
     * Notify appropriate parties when shelter staff makes a decision.
     */
    public function notifyShelterDecision(Application $application, string $decision): void
    {
        $application->loadMissing(['adopter', 'pet']);

        if ($decision === 'suitable') {
            // Notify adopter that screening passed
            $application->adopter?->notify(
                new ApplicationStatusUpdatedNotification($application, 'shelter_endorsed_adopter')
            );

            // Notify all MAO officers that audit is needed
            $this->notifyRole('mao_officer', $application, 'mao_audit_pending');
        } else {
            // Notify adopter about rejection feedback
            $application->adopter?->notify(
                new ApplicationStatusUpdatedNotification($application, 'shelter_rejected_adopter')
            );
        }
    }

    /**
     * Notify appropriate parties when MAO officer makes a compliance decision.
     */
    public function notifyMaoDecision(Application $application, string $decision): void
    {
        $application->loadMissing(['adopter', 'pet']);

        if ($decision === 'approved') {
            // Notify adopter with certificate details
            $application->adopter?->notify(
                new ApplicationStatusUpdatedNotification($application, 'mao_approved_adopter')
            );

            // Notify shelter staff to prepare turnover
            $this->notifyRole('shelter_staff', $application, 'mao_approved_staff');
        } else {
            // Notify adopter about MAO rejection
            $application->adopter?->notify(
                new ApplicationStatusUpdatedNotification($application, 'mao_rejected_adopter')
            );

            // Notify shelter staff that pet is released back
            $this->notifyRole('shelter_staff', $application, 'mao_rejected_staff');
        }
    }

    /**
     * Send a notification to all users with a specific role.
     */
    private function notifyRole(string $roleName, Application $application, string $event): void
    {
        $role = Role::where('name', $roleName)->first();

        if (! $role) {
            return;
        }

        $users = User::role($roleName)->get();

        foreach ($users as $user) {
            $user->notify(
                new ApplicationStatusUpdatedNotification($application, $event)
            );
        }
    }
}
