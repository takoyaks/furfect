# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated for this application. These guidelines should be followed closely to ensure the best experience when building Laravel applications.

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
* the task depends on a version-specific behavior;
* existing information conflicts with these versions.

## Skills Activation

This project has domain-specific skills available in `**/skills/**`. You MUST activate the relevant skill whenever you work in that domain—don't wait until you're stuck.

When switching AI models or continuing work from another model, use the existing project context and handoff information first. Do not restart discovery unless necessary.

## Conventions

* You must follow all existing code conventions used in this application.
* When creating or editing a file, inspect relevant sibling files when necessary to determine the correct structure, approach, and naming.
* Do not repeatedly inspect files that have already been inspected and documented in the AI Handoff Context.
* Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
* Check for existing components, services, hooks, actions, routes, and utilities to reuse before writing new ones.
* Prefer modifying existing implementations over creating duplicates.
* Follow existing project conventions when they differ from generic framework conventions.

## AI Context Reuse

Treat documented project knowledge as already known.

Do NOT unnecessarily:

* rediscover the application architecture;
* re-check package versions;
* re-read files already inspected by the previous AI model;
* repeat previously completed analysis;
* inspect unrelated files or directories;
* repeat tests that already passed when the related code has not changed;
* search for an implementation that has already been identified;
* explain decisions that are already documented.

Only verify existing context when:

* the current task could have changed it;
* the actual code conflicts with the documented information;
* the user explicitly requests verification;
* the existing context does not contain information required for the task.

### AI Handoff Context

When continuing work from another AI model, treat the following information as the current working state:

```text
Current Task:
[Current task]

Files Already Inspected:
- [file] — [purpose/finding]
- [file] — [purpose/finding]

Findings:
- [established finding]
- [established finding]

Changes Already Made:
- [change]
- [change]

Tests Already Run:
- [test] — PASS

Current Blocker:
- [blocker or None]

Next Action:
- [next action]
```

The next AI model should continue from this context instead of restarting the investigation.

After meaningful changes, update the handoff context with only reusable information.

Keep the handoff concise.

## Existing Code First

Before creating new code:

1. Determine whether an existing implementation can be reused.
2. Inspect only the relevant files.
3. Reuse existing components, hooks, services, actions, routes, models, and tests.
4. Make the smallest change necessary.
5. Avoid unnecessary abstractions.
6. Do not duplicate existing functionality.

## Verification Scripts

* Do not create verification scripts when existing tests cover the functionality.
* Do not use Tinker when tests adequately prove the behavior.
* Unit and feature tests are more important than temporary verification scripts.
* Run the minimum relevant tests needed to verify the change.

## Application Structure & Architecture

* Stick to the existing directory structure.
* Do not create new base folders without approval.
* Do not change the application's dependencies without approval.
* Follow the existing application architecture.
* Do not introduce a new architecture or framework pattern when an existing project pattern already solves the problem.

## Frontend Bundling

* If the user doesn't see a frontend change reflected in the UI, it could mean they need to run `npm run build`, `npm run dev`, or `composer run dev`. Ask them.
* Do not unnecessarily run frontend builds for unrelated changes.

## Documentation Files

* You must only create documentation files if explicitly requested by the user.
* Do not create documentation merely to explain a code change.
* Only update the AI context/handoff information when it provides reusable project knowledge.

## Dependency Changes

* Do not install, remove, or upgrade dependencies without approval.
* Check existing dependencies before suggesting a new dependency.
* Prefer built-in Laravel functionality when practical.

## Replies

* Be concise in your explanations.
* Focus on what was fixed or implemented.
* Do not waste tokens explaining obvious implementation details.
* Do not repeat the user's request.
* Do not provide lengthy background explanations unless requested.
* Do not explain every file or command unless relevant.
* Make the required changes first.
* Report only important results.
* Mention test results briefly.
* State blockers directly and briefly.

For a straightforward fix, prefer:

```text
Fixed [issue].

Tested: [test] — PASS.
```

For a larger change, prefer:

```text
Fixed:
- [change]
- [change]

Test:
- [test] — PASS

Next:
- [only if something remains]
```

Do not spend tokens explaining implementation details unless the user asks.

=== boost rules ===

# Laravel Boost

## Artisan

* Run Artisan commands directly via the command line (e.g., `php artisan route:list`). Use `php artisan list` to discover available commands and `php artisan [command] --help` to check parameters.
* Inspect routes with `php artisan route:list`. Filter with: `--method=GET`, `--name=users`, `--path=api`, `--except-vendor`, `--only-vendor`.
* Read configuration values using dot notation: `php artisan config:show app.name`, `php artisan config:show database.default`. Or read config files directly from the `config/` directory.
* Do not repeat Artisan discovery commands when the required information has already been established and documented.

## Tinker

* Execute PHP in app context for debugging and testing code.
* Do not create models without user approval.
* Prefer tests with factories instead of manual Tinker verification when tests can prove the behavior.
* Prefer existing Artisan commands over custom Tinker code.
* Always use single quotes to prevent shell expansion:

```bash
php artisan tinker --execute 'Your::code();'
```

* Double quotes may be used for PHP strings inside:

```bash
php artisan tinker --execute 'User::where("active", true)->count();'
```

=== php rules ===

# PHP

* Always use curly braces for control structures, even for single-line bodies.
* Use PHP 8 constructor property promotion:

```php
public function __construct(public GitHub $github) { }
```

* Do not leave empty zero-parameter `__construct()` methods unless the constructor is private.
* Use explicit return type declarations and type hints for all method parameters:

```php
function isAccessible(User $user, ?string $path = null): bool
```

* Use TitleCase for Enum keys: `FavoritePerson`, `BestLake`, `Monthly`.
* Prefer PHPDoc blocks over inline comments.
* Only add inline comments for exceptionally complex logic.
* Use array shape type definitions in PHPDoc blocks.

=== deployments rules ===

# Deployment

* Laravel can be deployed using Laravel Cloud, which is the preferred Laravel deployment platform when applicable.
* Follow the existing deployment configuration before introducing changes.

=== tests rules ===

# Test Enforcement

* Every change must be programmatically tested.
* Write a new test or update an existing test when the behavior is not already covered.
* Run the affected tests to make sure they pass.
* Run the minimum number of tests needed for code quality and speed.
* Prefer:

```bash
php artisan test --compact tests/Feature/ExampleTest.php
```

or:

```bash
php artisan test --compact --filter=testName
```

* Do not automatically run the full test suite unless justified.
* Do not repeat a test that already passed if the related code has not changed.

=== inertia-laravel/core rules ===

# Inertia

* Inertia creates fully client-side rendered SPAs without modern SPA complexity.
* Components live in `resources/js/pages` unless specified in `vite.config.js`.
* Use `Inertia::render()` for server-side routing instead of Blade views.
* ALWAYS use `search-docs` for version-specific Inertia documentation and updated code examples when documentation lookup is required.
* IMPORTANT: Activate `inertia-react-development` when working with Inertia client-side patterns.
* Do not repeatedly search documentation for behavior already established in the project context.

# Inertia v3

* Use Inertia v3 features and patterns.
* Check version-specific documentation before implementing unfamiliar or version-sensitive functionality.
* New v3 features include standalone HTTP requests with `useHttp`, optimistic updates with automatic rollback, layout props with `useLayoutProps`, instant visits, simplified SSR through `@inertiajs/vite`, and custom exception handling for error pages.
* Carried over from v2: deferred props, infinite scroll, merging props, polling, prefetching, once props, and flash data.
* When using deferred props, add an empty state with a pulsing or animated skeleton.
* Axios has been removed. Use the built-in XHR client with interceptors, or install Axios separately only when explicitly required.
* `Inertia::lazy()` / `LazyProp` has been removed. Use `Inertia::optional()` instead.
* Prop types such as `Inertia::optional()`, `Inertia::defer()`, and `Inertia::merge()` work inside nested arrays with dot-notation paths.
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
* Pass `--no-interaction` to Artisan commands.
* Use the appropriate Artisan options when generating files.
* Follow existing application conventions before introducing new patterns.

### Model Creation

* When creating new models, create useful factories and seeders too when appropriate.
* Ask the user if they need other model-related files only when necessary.
* Check existing factories and states before manually creating test data.

## APIs & Eloquent Resources

* For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not follow this approach.
* If existing API conventions differ, follow the application's established convention.

## URL Generation

* When generating links to other pages, prefer named routes and the `route()` function.
* Use Wayfinder for TypeScript route/controller functions.

## Testing

* When creating models for tests, use factories.
* Check factories for existing custom states before manually setting attributes.
* Faker: use methods such as `$this->faker->word()` or `fake()->randomDigit()`.
* Follow existing project conventions for Faker usage.
* When creating tests, use:

```bash
php artisan make:test --pest SomeFeatureTest --no-interaction
```

* Most tests should be feature tests.
* Use `--unit` for genuine unit-level tests.
* Do not delete tests without approval.

## Vite Error

* If you receive:

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

Do not rebuild unnecessarily when the issue is unrelated to Vite.

=== wayfinder/core rules ===

# Laravel Wayfinder

* Use Wayfinder to generate TypeScript functions for Laravel routes.
* Import controller actions from `@/actions/`.
* Import named routes from `@/routes/`.
* Follow the existing Wayfinder usage patterns in the project.

=== pint/core rules ===

# Laravel Pint Code Formatter

* If you have modified any PHP files, you must run:

```bash
vendor/bin/pint --dirty --format agent
```

* Do not run:

```bash
vendor/bin/pint --test --format agent
```

* Run Pint to fix formatting before finalizing PHP changes.

=== pest/core rules ===

## Pest

* This project uses Pest for testing.
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
* Do NOT delete tests without approval.

=== inertia-react/core rules ===

# Inertia + React

* IMPORTANT: Activate `inertia-react-development` when working with Inertia React client-side patterns.
* Reuse existing React components before creating new ones.
* Follow existing React component structure and naming.
* Use Inertia v3 patterns.
* Avoid unnecessary dependencies.
* Do not introduce Axios unless required by the existing application.

=== ai-context rules ===

# AI Context Continuity

The AI Handoff Context is the shared working memory between AI models.

When beginning a task:

1. Read the current AI Handoff Context.
2. Read only the project files necessary for the current task.
3. Trust previously documented findings unless they conflict with the actual code.
4. Continue from the documented next action.
5. Do not restart project discovery.

When finishing meaningful work:

1. Record important findings.
2. Record files changed.
3. Record tests and their results.
4. Record blockers.
5. Record the next action if work remains.

Keep the handoff state short.

The purpose of this context is to prevent the next AI model from repeating work already completed by the previous model.

### Context Priority

Use this priority when resolving information:

```text
Current source code
        ↓
Current task requirements
        ↓
AI Handoff Context
        ↓
Persistent project conventions
        ↓
Generic framework assumptions
```

If the current source code conflicts with the handoff context, trust the current source code and update the handoff context.

### Minimal Inspection

Only inspect what is necessary to complete the current task.

Do not:

* scan the entire repository without a reason;
* inspect unrelated files;
* repeatedly inspect the same files;
* repeat dependency discovery;
* repeat architecture discovery;
* repeat successful verification.

### Model Switching

When changing AI models, the new model should assume that the previous model has already performed the documented investigation.

Continue from the handoff state.

Only perform additional checks when the task requires them.

=== response-efficiency rules ===

# Response Efficiency

Optimize tokens for implementation rather than explanation.

For coding tasks:

* Fix the issue first.
* Keep explanations short.
* Do not explain obvious code.
* Do not repeat context already known.
* Do not provide unnecessary tutorials.
* Do not summarize unchanged code.
* Do not list every command executed.
* Mention only relevant verification.
* Report failures or blockers clearly.
* Do not provide long reasoning unless explicitly requested.

Preferred:

```text
Fixed:
- [change]

Tested:
- [test] — PASS
```

For a simple fix:

```text
Fixed [issue].
Tested: [test] — PASS.
```

Only provide detailed explanations when the user asks for them.

=== workflow rules ===

# Efficient Development Workflow

For every coding task:

```text
Read Handoff Context
        ↓
Understand Current Task
        ↓
Inspect Only Necessary Files
        ↓
Reuse Existing Code
        ↓
Implement Smallest Change
        ↓
Run Relevant Test
        ↓
Run Pint if PHP Changed
        ↓
Re-test if Necessary
        ↓
Update Handoff Context
        ↓
Give Short Response
```

Do not restart the workflow unless the existing context is missing, outdated, or contradicted by the code.
