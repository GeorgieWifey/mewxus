# Mewxus on Railway — PHP 8.4 + Node asset build + artisan serve
FROM node:22-alpine AS assets
WORKDIR /app
COPY package.json package-lock.json vite.config.js uno.config.js ./
RUN npm ci
COPY resources ./resources
COPY public ./public
RUN npm run build

FROM php:8.4-cli-alpine
RUN apk add --no-cache sqlite-dev \
    && docker-php-ext-install pdo_sqlite bcmath opcache \
    && apk del sqlite-dev
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

COPY . .
COPY --from=assets /app/public/build ./public/build

ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=${PORT}"]
