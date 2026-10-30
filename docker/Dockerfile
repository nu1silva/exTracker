FROM php:8.3-apache

RUN docker-php-ext-install mysqli \
 && mkdir -p /var/www/exTracker/logs \
 && chown -R www-data:www-data /var/www/exTracker

COPY php.ini /usr/local/etc/php/conf.d/extracker.ini
