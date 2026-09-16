<?php

use App\Models\Announcement;

test('guests can view public announcements index', function () {
    Announcement::create([
        'title' => 'Vaccination Drive 2026',
        'category' => 'Medical',
        'content' => 'Free rabies vaccines for all dogs and cats.',
        'is_published' => true,
        'published_at' => now(),
    ]);

    $response = $this->get(route('announcements.index'));
    $response->assertOk();
    $response->assertSee('Vaccination Drive 2026');
});

test('guests can search and filter announcements by category', function () {
    Announcement::create([
        'title' => 'Vaccination Drive 2026',
        'category' => 'Medical',
        'content' => 'Free rabies vaccines.',
        'is_published' => true,
        'published_at' => now(),
    ]);

    Announcement::create([
        'title' => 'Adoption Day Weekend',
        'category' => 'Adoption',
        'content' => 'Meet our rescue animals this weekend.',
        'is_published' => true,
        'published_at' => now(),
    ]);

    $response = $this->get(route('announcements.index', ['category' => 'Medical']));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('announcements/index')
        ->has('announcements.data', 1)
        ->where('announcements.data.0.title', 'Vaccination Drive 2026')
    );

    $responseSearch = $this->get(route('announcements.index', ['search' => 'Weekend']));
    $responseSearch->assertOk();
    $responseSearch->assertInertia(fn ($page) => $page
        ->component('announcements/index')
        ->has('announcements.data', 1)
        ->where('announcements.data.0.title', 'Adoption Day Weekend')
    );
});

test('guests can view announcement detail page', function () {
    $announcement = Announcement::create([
        'title' => 'Shelter Renovation Notice',
        'category' => 'Facility',
        'content' => 'The shelter kennel area is undergoing maintenance.',
        'is_published' => true,
        'published_at' => now(),
    ]);

    $response = $this->get(route('announcements.show', $announcement->id));
    $response->assertOk();
    $response->assertSee('Shelter Renovation Notice');
    $response->assertSee('The shelter kennel area is undergoing maintenance.');
});

test('guests cannot view unpublished announcements', function () {
    $draft = Announcement::create([
        'title' => 'Draft Secret Drive',
        'category' => 'Medical',
        'content' => 'Not yet announced to the public.',
        'is_published' => false,
    ]);

    $response = $this->get(route('announcements.show', $draft->id));
    $response->assertNotFound();
});
