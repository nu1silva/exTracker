exTracker
=========

PHP expense tracking and reporting software

Running locally (Docker)
------------------------

Requires Docker. Runs PHP 8.3 + Apache and MariaDB 10.6.

    docker/run.sh up      # http://localhost:8080/login.php  (admin / admin)
    docker/run.sh logs    # follow the PHP/Apache log
    docker/run.sh down    # stop; data is kept in the extracker-data volume
    docker/run.sh reset   # stop and delete the database

Set `EXTRACKER_PORT` to use a port other than 8080.

Running without Docker
----------------------

Requires PHP 8.1+ with mysqli, and MySQL 5.7+ or MariaDB 10.3+.

1. Load `dbscripts/exTracker_mysql.sql` (creates the `xtracker` database and an `admin` / `admin` login).
2. Set `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` and optionally `EXTRACKER_LOG_DIR`
   in the web server's environment, or edit the defaults in `config.db.php`.
3. Make sure the log directory (default `/var/www/exTracker/logs/`) is writable by the web server.
