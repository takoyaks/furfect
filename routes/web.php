<?php

use App\Http\Controllers\Admin\AnnouncementController;
use App\Http\Controllers\Admin\ApplicationController as AdminApplicationController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\LandingPageBuilderController;
use App\Http\Controllers\Admin\PetController as AdminPetController;
use App\Http\Controllers\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Admin\ShelterController as AdminShelterController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\AdopterHistoryController;
use App\Http\Controllers\AdopterProfileController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\Auth\EmailAvailabilityController;
use App\Http\Controllers\DssMatchController;
use App\Http\Controllers\LifestyleProfileController;
use App\Http\Controllers\Mao\ApplicationController as MaoApplicationController;
use App\Http\Controllers\Mao\DashboardController;
use App\Http\Controllers\Mao\ReportController as MaoReportController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\PetController;
use App\Http\Controllers\SavedPetController;
use App\Http\Controllers\Shelter\AnnouncementController as ShelterAnnouncementController;
use App\Http\Controllers\Shelter\ApplicationController as ShelterApplicationController;
use App\Http\Controllers\Shelter\DashboardController as ShelterDashboardController;
use App\Http\Controllers\Shelter\PetController as ShelterPetController;
use App\Http\Controllers\Shelter\ReportController as ShelterReportController;
use Illuminate\Support\Facades\Route;

// Public / Guest Routes
Route::get('/', [PageController::class, 'home'])->name('home');
Route::get('/pets', [PetController::class, 'index'])->name('pets.index');
Route::get('/pets/{id}', [PetController::class, 'show'])->name('pets.show');
Route::get('/how-it-works', [PageController::class, 'howItWorks'])->name('how-it-works');
Route::get('/about', [PageController::class, 'about'])->name('about');
Route::get('/api/check-email', [EmailAvailabilityController::class, 'check'])->name('email.check');

// Authenticated Routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [PageController::class, 'home'])->name('dashboard');

    // Onboarding (Adopter Role)
    Route::get('/onboarding/personal', [AdopterProfileController::class, 'edit'])->name('onboarding.personal.edit');
    Route::post('/onboarding/personal', [AdopterProfileController::class, 'store'])->name('onboarding.personal.store');
    Route::get('/adopter/{profile}/id-document', [AdopterProfileController::class, 'viewIdDocument'])->name('adopter.id-document.show');
    Route::get('/onboarding/lifestyle', [LifestyleProfileController::class, 'edit'])->name('onboarding.lifestyle.edit');
    Route::post('/onboarding/lifestyle', [LifestyleProfileController::class, 'store'])->name('onboarding.lifestyle.store');

    // Adopter Portal Functions
    Route::get('/matches', [DssMatchController::class, 'index'])->name('matches.index');
    Route::get('/history', [AdopterHistoryController::class, 'index'])->name('history.index');
    Route::post('/saved-pets/toggle', [SavedPetController::class, 'toggle'])->name('saved-pets.toggle');
    Route::get('/application', [ApplicationController::class, 'show'])->name('application.show');
    Route::post('/application', [ApplicationController::class, 'store'])->name('application.store');
    Route::post('/application/transfer', [ApplicationController::class, 'transfer'])->name('application.transfer');
    Route::post('/application/withdraw', [ApplicationController::class, 'withdraw'])->name('application.withdraw');

    // Notification Center API
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');

    // Shelter Staff Portal Group
    Route::middleware(['role:shelter_staff|admin'])->prefix('shelter')->name('shelter.')->group(function () {
        Route::get('/dashboard', [ShelterDashboardController::class, 'index'])->name('dashboard');

        Route::get('/applications', [ShelterApplicationController::class, 'index'])->name('applications.index');
        Route::get('/applications/{id}', [ShelterApplicationController::class, 'show'])->name('applications.show');
        Route::patch('/applications/{id}', [ShelterApplicationController::class, 'update'])->name('applications.update');

        Route::get('/pets', [ShelterPetController::class, 'index'])->name('pets.index');
        Route::get('/pets/create', [ShelterPetController::class, 'create'])->name('pets.create');
        Route::post('/pets', [ShelterPetController::class, 'store'])->name('pets.store');
        Route::get('/pets/{id}/edit', [ShelterPetController::class, 'edit'])->name('pets.edit');
        Route::post('/pets/{id}', [ShelterPetController::class, 'update'])->name('pets.update'); // POST due to multipart/form-data with photos
        Route::delete('/pets/{id}', [ShelterPetController::class, 'destroy'])->name('pets.destroy');

        Route::get('/reports', [ShelterReportController::class, 'index'])->name('reports.index');
        Route::get('/reports/pdf', [ShelterReportController::class, 'downloadPdf'])->name('reports.pdf');
        Route::get('/reports/excel', [ShelterReportController::class, 'downloadExcel'])->name('reports.excel');

        // Content & Pages - Announcements
        Route::get('/cms/announcements', [ShelterAnnouncementController::class, 'index'])->name('cms.announcements.index');
        Route::post('/cms/announcements', [ShelterAnnouncementController::class, 'store'])->name('cms.announcements.store');
        Route::post('/cms/announcements/{id}', [ShelterAnnouncementController::class, 'update'])->name('cms.announcements.update');
        Route::delete('/cms/announcements/{id}', [ShelterAnnouncementController::class, 'destroy'])->name('cms.announcements.destroy');
    });

    // MAO Officer Portal Group
    Route::middleware(['role:mao_officer|admin'])->prefix('mao')->name('mao.')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('/applications', [MaoApplicationController::class, 'index'])->name('applications.index');
        Route::get('/applications/{id}', [MaoApplicationController::class, 'show'])->name('applications.show');
        Route::patch('/applications/{id}', [MaoApplicationController::class, 'update'])->name('applications.update');

        Route::get('/reports', [MaoReportController::class, 'index'])->name('reports.index');
        Route::get('/reports/pdf', [MaoReportController::class, 'downloadPdf'])->name('reports.pdf');
        Route::get('/reports/excel', [MaoReportController::class, 'downloadExcel'])->name('reports.excel');
    });

    // Admin Panel Group
    Route::middleware(['role:admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

        Route::get('/applications', [AdminApplicationController::class, 'index'])->name('applications.index');
        Route::get('/applications/{id}', [AdminApplicationController::class, 'show'])->name('applications.show');
        Route::delete('/applications/{id}', [AdminApplicationController::class, 'destroy'])->name('applications.destroy');

        Route::get('/pets', [AdminPetController::class, 'index'])->name('pets.index');
        Route::delete('/pets/{id}', [AdminPetController::class, 'destroy'])->name('pets.destroy');

        Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
        Route::post('/users', [AdminUserController::class, 'store'])->name('users.store');
        Route::patch('/users/{id}', [AdminUserController::class, 'update'])->name('users.update');
        Route::post('/users/{id}/reset-password', [AdminUserController::class, 'resetPassword'])->name('users.reset-password');
        Route::delete('/users/{id}', [AdminUserController::class, 'destroy'])->name('users.destroy');

        Route::get('/shelters', [AdminShelterController::class, 'index'])->name('shelters.index');
        Route::post('/shelters', [AdminShelterController::class, 'store'])->name('shelters.store');
        Route::patch('/shelters/{id}', [AdminShelterController::class, 'update'])->name('shelters.update');
        Route::delete('/shelters/{id}', [AdminShelterController::class, 'destroy'])->name('shelters.destroy');

        Route::get('/reports', [AdminReportController::class, 'index'])->name('reports.index');
        Route::get('/reports/pdf', [AdminReportController::class, 'downloadPdf'])->name('reports.pdf');
        Route::get('/reports/excel', [AdminReportController::class, 'downloadExcel'])->name('reports.excel');

        Route::get('/settings', [AdminSettingController::class, 'index'])->name('settings.index');
        Route::patch('/settings', [AdminSettingController::class, 'update'])->name('settings.update');

        // CMS & Landing Page Builder
        Route::get('/cms/builder', [LandingPageBuilderController::class, 'index'])->name('cms.builder.index');
        Route::post('/cms/builder', [LandingPageBuilderController::class, 'update'])->name('cms.builder.update');

        Route::get('/cms/announcements', [AnnouncementController::class, 'index'])->name('cms.announcements.index');
        Route::post('/cms/announcements', [AnnouncementController::class, 'store'])->name('cms.announcements.store');
        Route::post('/cms/announcements/{id}', [AnnouncementController::class, 'update'])->name('cms.announcements.update');
        Route::delete('/cms/announcements/{id}', [AnnouncementController::class, 'destroy'])->name('cms.announcements.destroy');
    });
});

require __DIR__.'/settings.php';
