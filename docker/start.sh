#!/usr/bin/env bash

set -e

echo "Preparing Laravel directories..."

mkdir -p \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache

chmod -R 775 storage bootstrap/cache

echo "Clearing old Laravel caches..."

php artisan optimize:clear

echo "Creating storage link..."

php artisan storage:link || true

echo "Running database migrations..."

php artisan migrate --force

echo "Checking Vite production assets..."

if [ ! -f public/build/manifest.json ]; then
    echo "ERROR: public/build/manifest.json was not found."
    exit 1
fi

echo "Vite production assets found."

echo "Optimizing Laravel..."

php artisan optimize

echo "Starting Laravel on port ${PORT:-10000}..."

export PHP_CLI_SERVER_WORKERS=4

exec php artisan serve \
    --host=0.0.0.0 \
    --port="${PORT:-10000}"