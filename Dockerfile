FROM node:26-bookworm-slim AS node

FROM php:8.5-cli-bookworm

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    curl \
    ca-certificates \
    libcurl4-openssl-dev \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        bcmath \
        curl \
        dom \
        exif \
        gd \
        mbstring \
        pcntl \
        pdo_mysql \
        zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy Node.js and npm from the official Node image
COPY --from=node /usr/local/ /usr/local/

# Copy the Laravel project
COPY . .

# Install Laravel dependencies first because Wayfinder needs Artisan
RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader

# Install frontend dependencies and build Vite assets
RUN npm install --legacy-peer-deps \
    && npm run build \
    && rm -rf node_modules

# Prepare writable Laravel directories
RUN mkdir -p \
        storage/framework/cache \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

COPY docker/start.sh /usr/local/bin/start

RUN sed -i 's/\r$//' /usr/local/bin/start \
    && chmod +x /usr/local/bin/start

EXPOSE 10000

CMD ["/usr/local/bin/start"]