# Stage 1: Build frontend assets
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: PHP Application
FROM php:8.3-cli-alpine
WORKDIR /app

# Install system dependencies & PHP extensions
RUN apk add --no-cache sqlite sqlite-dev sqlite-libs bash git \
    && docker-php-ext-install pdo pdo_sqlite pcntl opcache

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy application code
COPY . .
COPY --from=frontend /app/public/build ./public/build

# Install production dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Ensure database directory and permissions
RUN mkdir -p /data database storage/framework/sessions storage/framework/views storage/framework/cache storage/logs \
    && touch /data/database.sqlite \
    && chmod -R 777 storage bootstrap/cache /data

ENV PORT=8080
ENV DB_CONNECTION=sqlite
ENV DB_DATABASE=/data/database.sqlite
ENV SESSION_DRIVER=cookie

EXPOSE 8080

CMD ["sh", "-c", "php artisan migrate --force && php artisan db:seed --force && php artisan serve --host=0.0.0.0 --port=${PORT:-8080}"]
