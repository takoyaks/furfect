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

echo "Clearing old configuration..."
php artisan config:clear

echo "Creating storage link..."
php artisan storage:link || true

echo "Running database migrations..."
php artisan migrate --force

echo "Optimizing Laravel..."
php artisan optimize

echo "Starting Laravel on port ${PORT:-10000}..."

exec php artisan serve \
    --host=0.0.0.0 \
    --port="${PORT:-10000}"