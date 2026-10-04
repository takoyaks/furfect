<?php

namespace App\Console\Commands;

use App\Models\Application;
use App\Models\User;
use App\Notifications\ApplicationStatusUpdatedNotification;
use Illuminate\Console\Command;

class CheckExpiredPickupsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'applications:check-expired-pickups';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check approved applications for expired pick-up deadlines, return pets to available status, and notify adopters of forfeiture.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $expiredApplications = Application::where('status', 'approved')
            ->whereNotNull('pickup_deadline_at')
            ->where('pickup_deadline_at', '<', now())
            ->with(['pet.shelter', 'adopter'])
            ->get();

        if ($expiredApplications->isEmpty()) {
            $this->info('No expired pickup deadlines found.');

            return self::SUCCESS;
        }

        $count = 0;

        foreach ($expiredApplications as $application) {
            $deadline = $application->pickup_deadline_at?->format('M d, Y h:i A');

            // 1. Mark application unclaimed & auto-forfeited
            $application->update([
                'status' => 'unclaimed',
                'close_reason' => 'unclaimed_forfeited',
                'close_notes' => "Automatic system forfeiture: Pick-up window expired on {$deadline} without turnover.",
                'closed_at' => now(),
                'releasing_notes' => "Automatic system forfeiture: Pick-up window expired on {$deadline} without turnover.",
            ]);

            // 2. Return pet to available status
            if ($application->pet) {
                $application->pet->update(['status' => 'available']);
            }

            // 3. Log timeline event
            $application->logTimeline(
                stage: 'closed',
                action: 'adoption_unclaimed',
                title: 'Adoption Forfeited — Pick-up Window Expired',
                description: "Adopter failed to pick up {$application->pet?->name} within the scheduled pickup duration (expired {$deadline}). Pet has been automatically returned to the available catalog.",
                actor: null,
                metadata: [
                    'reason' => 'Automatic pickup window expiration',
                    'expired_at' => now()->toIso8601String(),
                    'pickup_deadline_at' => $application->pickup_deadline_at?->toIso8601String(),
                ]
            );

            // 4. Notify adopter of failure to pickup
            if ($application->adopter) {
                $application->adopter->notify(
                    new ApplicationStatusUpdatedNotification($application, 'unclaimed_adopter')
                );
            }

            // 5. Notify shelter staff
            $shelterStaff = User::role('shelter_staff')->get();
            foreach ($shelterStaff as $staff) {
                $staff->notify(
                    new ApplicationStatusUpdatedNotification($application, 'unclaimed_staff')
                );
            }

            $count++;
            $this->line("Application #{$application->reference_number} ({$application->pet?->name}) marked unclaimed and returned to catalog.");
        }

        $this->info("Successfully processed {$count} expired pickup application(s).");

        return self::SUCCESS;
    }
}
