# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to ensure the best experience when building Laravel applications.

## Foundational Context

This application is a Laravel application and its main Laravel ecosystem packages and versions are below. You are an expert with them all. Ensure you abide by these specific packages and versions.

* php - 8.5
* inertiajs/inertia-laravel (INERTIA_LARAVEL) - v3
* laravel/fortify (FORTIFY) - v1
* laravel/framework (LARAVEL) - v13
* laravel/prompts (PROMPTS) - v0
* laravel/wayfinder (WAYFINDER) - v0
* larastan/larastan (LARASTAN) - v3
* laravel/boost (BOOST) - v2
* laravel/mcp (MCP) - v0
* laravel/pail (PAIL) - v1
* laravel/pint (PINT) - v1
* laravel/sail (SAIL) - v1
* pestphp/pest (PEST) - v5
* phpunit/phpunit (PHPUNIT) - v13
* @inertiajs/react (INERTIA_REACT) - v3
* react (REACT) - v19
* tailwindcss (TAILWINDCSS) - v4
* @laravel/vite-plugin-wayfinder (WAYFINDER_VITE) - v0
* eslint (ESLINT) - v9
* prettier (PRETTIER) - v3

Treat these versions as authoritative.

Do not re-check package versions unless:

* the user asks about dependencies;
* dependencies are being changed;
* the task requires version-specific behavior;
* the current project conflicts with this information.

## Skills Activation

This project has domain-specific skills available in `**/skills/**`. You MUST activate the relevant skill whenever you work in that domain—don't wait until you're stuck.

When changing domains, activate only the skill relevant to the current task.

When continuing work from another AI model, read the existing project context and handoff information before performing discovery.

Do not restart project discovery when the required information is already available.

## Conventions

* You must follow all existing code conventions used in this application.
* When creating or editing a file, inspect relevant sibling files when necessary to determine the correct structure, approach, and naming.
* Do not repeatedly inspect files that have already been inspected and documented by a previous AI model.
* Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
* Check for existing components to reuse before writing new ones.
* Reuse existing services, hooks, actions, routes, utilities, models, and tests when applicable.
* Prefer modifying existing implementations over creating duplicate functionality.
* Follow established project conventions over generic framework patterns when they differ.

## AI Context Continuity

The AI Handoff Context acts as shared working memory between AI models.

Before starting a task:

1. Read the current handoff/context.
2. Read only the files necessary for the current task.
3. Trust previously documented findings unless they conflict with the current code.
4. Continue from the documented next action.
5. Do not restart project discovery.

### Do Not Rediscover

Do not unnecessarily:

* re-check package versions;
* rediscover the project architecture;
* re-read already inspected files;
* inspect unrelated directories;
* repeat previous analysis;
* repeat successful tests when related code has not changed;
* search for implementations already identified;
* explain decisions already documented.

Only verify existing information when:

* the current task could have changed it;
* the actual code conflicts with the documented information;
* the user explicitly requests verification;
* required information is missing.

### Handoff Context

When meaningful work is completed, maintain a concise handoff state containing:

```text
Current Task:
[task]

Files Inspected:
- [file] — [important finding]

Changes Made:
- [change]

Tests:
- [test] — PASS/FAIL

Blocker:
[none or blocker]

Next Action:
[next action]
```

The next AI model should continue from this state instead of repeating the previous investigation.

Keep handoff information concise and only record information that will be useful later.

## Verification Scripts

* Do not create verification scripts when existing tests cover the functionality.
* Do not use Tinker when tests adequately prove the behavior.
* Unit and feature tests are more important than temporary verification scripts.
* Run the minimum relevant tests required to prove the change.
* Do not repeat successful verification unless the related code has changed.

## Application Structure & Architecture

* Stick to the existing directory structure.
* Do not create new base folders without approval.
* Do not change the application's dependencies without approval.
* Do not introduce a new architecture when an existing project pattern solves the problem.
* Prefer the smallest implementation that satisfies the requirement.
* Avoid unnecessary abstractions and refactoring.
* Do not modify unrelated code.

## Existing Code First

Before creating new code:

1. Determine whether existing code already solves the problem.
2. Inspect only the relevant implementation.
3. Reuse existing components and utilities.
4. Modify existing functionality when appropriate.
5. Create new code only when necessary.

Avoid duplicate implementations.

## Frontend Bundling

* If the user doesn't see a frontend change reflected in the UI, it could mean they need to run `npm run build`, `npm run dev`, or `composer run dev`. Ask them.
* Do not unnecessarily run frontend builds for backend-only changes.
* Do not rebuild the frontend unless the task requires it or a Vite-related issue occurs.

## Documentation Files

* You must only create documentation files if explicitly requested by the user.
* Do not create documentation merely to explain implementation.
* Do not generate additional project documentation unless requested.

## Dependency Changes

* Do not install, remove, or upgrade dependencies without approval.
* Check existing dependencies before proposing a new package.
* Prefer existing packages and Laravel functionality.
* Avoid adding dependencies for functionality that can reasonably be implemented with the current stack.

## Replies

* Be concise in your explanations.
* Focus on what was fixed or implemented.
* Do not waste tokens explaining obvious details.
* Do not repeat the user's request.
* Do not provide unnecessary tutorials or background information.
* Do not explain every file changed unless relevant.
* Do not list every command executed.
* Mention important test results briefly.
* State blockers directly.
* Make the changes first and explain them briefly afterward.

For a simple fix, use:

```text
Fixed [issue].

Tested: [test] — PASS.
```

For multiple changes, use:

```text
Fixed:
- [change]
- [change]

Tested:
- [test] — PASS
```

Only provide detailed explanations when the user explicitly asks.

=== boost rules ===

# Laravel Boost

## Artisan

* Run Artisan commands directly via the command line (e.g., `php artisan route:list`).
* Use `php artisan list` to discover available commands.
* Use `php artisan [command] --help` to check parameters.
* Inspect routes with `php artisan route:list`.
* Filter routes with:

  * `--method=GET`
  * `--name=users`
  * `--path=api`
  * `--except-vendor`
  * `--only-vendor`
* Read configuration using dot notation:

  * `php artisan config:show app.name`
  * `php artisan config:show database.default`
* Or read configuration files directly from `config/`.
* Do not repeat discovery commands when the required information is already known.

## Tinker

* Execute PHP in app context for debugging and testing code.
* Do not create models without user approval.
* Prefer tests with factories instead.
* Prefer existing Artisan commands over custom Tinker code.
* Always use single quotes to prevent shell expansion:

```bash
php artisan tinker --execute 'Your::code();'
```

* Use double quotes for PHP strings inside the expression:

```bash
php artisan tinker --execute 'User::where("active", true)->count();'
```

* Do not use Tinker when an existing test can prove the behavior.

=== php rules ===

# PHP

* Always use curly braces for control structures, even for single-line bodies.
* Use PHP 8 constructor property promotion:

```php
public function __construct(public GitHub $github) { }
```

* Do not leave empty zero-parameter `__construct()` methods unless the constructor is private.
* Use explicit return type declarations.
* Use type hints for all method parameters:

```php
function isAccessible(User $user, ?string $path = null): bool
```

* Use TitleCase for Enum keys: `FavoritePerson`, `BestLake`, `Monthly`.
* Prefer PHPDoc blocks over inline comments.
* Only add inline comments for exceptionally complex logic.
* Use array shape type definitions in PHPDoc blocks.
* Follow existing project-specific PHP conventions when they differ.

=== deployments rules ===

# Deployment

* Laravel can be deployed using Laravel Cloud when appropriate.
* Do not modify deployment configuration unless the task requires it.
* Follow the existing deployment configuration and project conventions.
* Do not introduce deployment dependencies without approval.

=== tests rules ===

# Test Enforcement

* Every change must be programmatically tested.
* Write a new test or update an existing test when the behavior is not already covered.
* Run the affected tests to make sure they pass.
* Run the minimum number of tests needed for quality and speed.
* Prefer targeted tests:

```bash
php artisan test --compact tests/Feature/ExampleTest.php
```

or:

```bash
php artisan test --compact --filter=testName
```

* Do not automatically run the entire test suite.
* Run broader tests only when the change affects multiple areas or targeted tests are insufficient.
* Do not repeat tests that already passed unless related code has changed.

=== inertia-laravel/core rules ===

# Inertia

* Inertia creates fully client-side rendered SPAs without modern SPA complexity, leveraging existing server-side patterns.
* Components live in `resources/js/pages` unless specified in `vite.config.js`.
* Use `Inertia::render()` for server-side routing instead of Blade views.
* ALWAYS use `search-docs` for version-specific Inertia documentation and updated code examples when documentation lookup is required.
* IMPORTANT: Activate `inertia-react-development` when working with Inertia client-side patterns.
* Do not repeatedly search documentation for functionality already established in the project context.

# Inertia v3

* Use Inertia v3 APIs and patterns.
* Check documentation only when the task requires unfamiliar or version-sensitive functionality.
* New v3 features include:

  * standalone HTTP requests with `useHttp`;
  * optimistic updates with automatic rollback;
  * layout props with `useLayoutProps`;
  * instant visits;
  * simplified SSR via `@inertiajs/vite`;
  * custom exception handling for error pages.
* Carried over from v2:

  * deferred props;
  * infinite scroll;
  * merging props;
  * polling;
  * prefetching;
  * once props;
  * flash data.
* When using deferred props, add an empty state with a pulsing or animated skeleton.
* Axios has been removed. Use the built-in XHR client with interceptors, or install Axios separately only when required.
* `Inertia::lazy()` / `LazyProp` has been removed. Use `Inertia::optional()` instead.
* `Inertia::optional()`, `Inertia::defer()`, and `Inertia::merge()` work inside nested arrays with dot-notation paths.
* SSR works automatically in Vite dev mode with `@inertiajs/vite`.
* Event renames:

  * `invalid` → `httpException`
  * `exception` → `networkError`
* `router.cancel()` has been replaced by `router.cancelAll()`.
* The `future` configuration namespace has been removed.

=== laravel/core rules ===

# Do Things the Laravel Way

* Use `php artisan make:` commands to create new files such as migrations, controllers, models, and tests.
* Use `php artisan make:class` for generic PHP classes.
* Pass `--no-interaction` to all Artisan commands.
* Use the correct command options for the required file type.
* Follow existing project conventions before introducing new patterns.

### Model Creation

* When creating new models, create useful factories and seeders too when appropriate.
* Check existing factories and custom states before manually creating test data.
* Ask the user about additional model-related files only when necessary.

## APIs & Eloquent Resources

* For APIs, default to Eloquent API Resources and API versioning unless existing API routes do not follow this approach.
* If existing API conventions differ, follow the established application convention.

## URL Generation

* When generating links to other pages, prefer named routes and the `route()` function.
* Use Wayfinder for TypeScript route/controller functions.

## Testing

* When creating models for tests, use factories.
* Check for existing factory states before manually setting attributes.
* Faker:

  * `$this->faker->word()`
  * `fake()->randomDigit()`
* Follow existing project conventions for Faker usage.
* When creating tests, use:

```bash
php artisan make:test --pest SomeFeatureTest --no-interaction
```

* Use `--unit` only for genuine unit-level tests.
* Most application behavior should be covered by feature tests.
* Do NOT delete tests without approval.

## Vite Error

If you receive:

```text
Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest
```

run:

```bash
npm run build
```

or ask the user to run:

```bash
npm run dev
```

or:

```bash
composer run dev
```

Do not rebuild unnecessarily for unrelated issues.

=== wayfinder/core rules ===

# Laravel Wayfinder

* Use Wayfinder to generate TypeScript functions for Laravel routes.
* Import controller functions from `@/actions/`.
* Import named routes from `@/routes/`.
* Follow existing Wayfinder usage patterns.
* Do not manually duplicate generated route logic.

=== pint/core rules ===

# Laravel Pint Code Formatter

* If you have modified any PHP files, you must run:

```bash
vendor/bin/pint --dirty --format agent
```

before finalizing changes.

* Do not run:

```bash
vendor/bin/pint --test --format agent
```

* Pint should fix formatting rather than only check it.
* Run Pint only when PHP files have been modified.

=== pest/core rules ===

## Pest

* This project uses Pest.
* Create tests with:

```bash
php artisan make:test --pest SomeFeatureTest --no-interaction
```

* The test name should not include the test suite directory.
* Run tests with:

```bash
php artisan test --compact
```

or:

```bash
php artisan test --compact --filter=testName
```

* Prefer the smallest relevant test scope.
* Use feature tests for most application behavior.
* Use unit tests for isolated logic.
* Do NOT delete tests without approval.

=== inertia-react/core rules ===

# Inertia + React

* IMPORTANT: Activate `inertia-react-development` when working with Inertia React client-side patterns.
* Reuse existing React components before creating new ones.
* Follow existing React component structure and naming.
* Use Inertia v3 patterns.
* Avoid unnecessary dependencies.
* Do not introduce Axios unless required by the existing application.
* Inspect only the relevant frontend files needed for the task.

=== ai-context/core rules ===

# AI Context Continuity

The AI Handoff Context is the shared working memory between AI models.

## Before Starting Work

1. Read the existing handoff context.
2. Identify the current task.
3. Identify what the previous AI already inspected.
4. Identify what has already been changed.
5. Identify tests already completed.
6. Continue from the documented next action.
7. Inspect only what is still necessary.

Do not restart repository discovery unless the existing context is missing or contradicted.

## Context Priority

When information conflicts, use:

```text
Current source code
        ↓
Current user request
        ↓
AI Handoff Context
        ↓
Established project conventions
        ↓
Generic framework assumptions
```

The current source code takes precedence over stale handoff information.

## Handoff Information

Maintain a concise working state containing:

```text
Current Task:
[task]

Files Inspected:
- [file] — [important finding]

Changes Made:
- [change]

Tests:
- [test] — PASS/FAIL

Blocker:
[none/blocker]

Next Action:
[next action]
```

Only record information that will help a future AI model continue the work.

Do not record temporary debugging details.

## Model Switching

When switching AI models:

* Assume documented findings are already known.
* Do not repeat completed investigation.
* Do not repeat successful tests unless code has changed.
* Continue from the documented next action.
* Verify only information necessary for the current task.
* Update the handoff after meaningful changes.

The goal is continuity, not rediscovery.

=== response-efficiency/core rules ===

# Response Efficiency

Optimize tokens for implementation rather than explanation.

For coding tasks:

* Fix the problem first.
* Keep explanations short.
* Do not explain obvious code.
* Do not repeat known context.
* Do not provide unnecessary tutorials.
* Do not summarize unchanged code.
* Do not list every command executed.
* Mention only relevant verification.
* Report failures and blockers clearly.
* Do not provide long reasoning unless explicitly requested.

### Simple Fix

Use:

```text
Fixed [issue].

Tested: [test] — PASS.
```

### Multiple Changes

Use:

```text
Fixed:
- [change]
- [change]

Tested:
- [test] — PASS
```

### When Something Fails

Use:

```text
Fixed [issue].

Test:
- [test] — FAIL: [short reason]

Remaining:
- [blocker]
```

Do not expose internal reasoning or unnecessary implementation analysis.

=== workflow/core rules ===

# Efficient Development Workflow

For coding tasks:

```text
Read Handoff
    ↓
Understand Task
    ↓
Inspect Only Necessary Files
    ↓
Reuse Existing Code
    ↓
Implement Smallest Change
    ↓
Run Targeted Test
    ↓
Run Pint if PHP Changed
    ↓
Re-test if Needed
    ↓
Update Handoff
    ↓
Short Response
```

Avoid unnecessary repository-wide searches, builds, tests, documentation lookups, and explanations.

The objective is to maximize useful implementation while minimizing redundant context, verification, and response tokens.
