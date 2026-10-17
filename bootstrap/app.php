<?php

use App\Http\Middleware\EnsureOnboardingCompleted;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Trust Render's reverse proxy and forwarded HTTPS headers.
        $middleware->trustProxies(at: '*');

        $middleware->encryptCookies(except: [
            'appearance',
            'sidebar_state',
        ]);

        $middleware->preventRequestsDuringMaintenance(except: [
            'admin/database*',
            'login',
            'logout',
            'up',
            'webhooks/*',
        ]);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            EnsureOnboardingCompleted::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'webhooks/*',
            'webhooks/didit',
        ]);

        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
            if ($response->getStatusCode() === 404 && ! $request->is('api/*') && ! $request->expectsJson()) {
                return Inertia::render('errors/404', [
                    'status' => 404,
                    'auth' => [
                        'user' => $request->user() ? array_merge($request->user()->toArray(), [
                            'roles' => $request->user()->getRoleNames(),
                        ]) : null,
                    ],
                    'name' => config('app.name', 'FurFect Match'),
                ])->toResponse($request)->setStatusCode(404);
            }

            return $response;
        });
    })
    ->create();
