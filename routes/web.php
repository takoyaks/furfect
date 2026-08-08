<?php

use App\Http\Controllers\Admin\ApplicationController as AdminApplicationController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\PetController as AdminPetController;
use App\Http\Controllers\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\ShelterController as AdminShelterController;
use App\Http\Controllers\AdopterProfileController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\DssMatchController;
use App\Http\Controllers\LifestyleProfileController;
use App\Http\Controllers\Mao\ApplicationController as MaoApplicationController;
use App\Http\Controllers\Mao\ReportController as MaoReportController;
use App\Http\Controllers\PetController;
use App\Http\Controllers\SavedPetController;
use App\Http\Controllers\Shelter\ApplicationController as ShelterApplicationController;
use App\Http\Controllers\Shelter\PetController as ShelterPetController;
use App\Http\Controllers\Shelter\ReportController as ShelterReportController;
use Illuminate\Support\Facades\Route;

// Public / Guest Routes
Route::inertia('/', 'welcome')->name('home');
Route::get('/pets', [PetController::class, 'index'])->name('pets.index');
Route::get('/pets/{id}', [PetController::class, 'show'])->name('pets.show');

// Authenticated Routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    // Onboarding (Adopter Role)
    Route::get('/onboarding/personal', [AdopterProfileController::class, 'edit'])->name('onboarding.personal.edit');
    Route::post('/onboarding/personal', [AdopterProfileController::class, 'store'])->name('onboarding.personal.store');
    Route::get('/onboarding/lifestyle', [LifestyleProfileController::class, 'edit'])->name('onboarding.lifestyle.edit');
    Route::post('/onboarding/lifestyle', [LifestyleProfileController::class, 'store'])->name('onboarding.lifestyle.store');

    // Adopter Portal Functions
    Route::get('/matches', [DssMatchController::class, 'index'])->name('matches.index');
    Route::post('/saved-pets/toggle', [SavedPetController::class, 'toggle'])->name('saved-pets.toggle');
    Route::get('/application', [ApplicationController::class, 'show'])->name('application.show');
    Route::post('/application', [ApplicationController::class, 'store'])->name('application.store');

    // Shelter Staff Portal Group
    Route::middleware(['role:shelter_staff|admin'])->prefix('shelter')->name('shelter.')->group(function () {
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
    });

    // MAO Officer Portal Group
    Route::middleware(['role:mao_officer|admin'])->prefix('mao')->name('mao.')->group(function () {
        Route::get('/applications', [MaoApplicationController::class, 'index'])->name('applications.index');
        Route::get('/applications/{id}', [MaoApplicationController::class, 'show'])->name('applications.show');
        Route::patch('/applications/{id}', [MaoApplicationController::class, 'update'])->name('applications.update');

        Route::get('/reports', [MaoReportController::class, 'index'])->name('reports.index');
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
    });
});

require __DIR__.'/settings.php';
