<?php

use Inertia\Testing\AssertableInertia as Assert;

test('non existent web route renders inertia 404 page', function () {
    $response = $this->get('/non-existent-page-test-404');

    $response->assertStatus(404);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('errors/404')
        ->where('status', 404)
    );
});

test('inertia visit to non existent web route returns 404 json inertia payload', function () {
    $response = $this->get('/non-existent-page-test-404', [
        'X-Inertia' => 'true',
    ]);

    $response->assertStatus(404);
    $response->assertHeader('X-Inertia', 'true');
    $response->assertJson([
        'component' => 'errors/404',
        'props' => [
            'status' => 404,
        ],
    ]);
});

test('api or json request to non existent route returns json 404', function () {
    $response = $this->getJson('/api/non-existent-api-endpoint');

    $response->assertStatus(404);
});
