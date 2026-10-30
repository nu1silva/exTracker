<?php
// Each setting can be overridden with an environment variable.
$mysql_hostname = getenv('DB_HOST') ?: 'localhost';
$mysql_user = getenv('DB_USER') ?: 'root';
$mysql_password = getenv('DB_PASSWORD') ?: 'root';
$mysql_database = getenv('DB_NAME') ?: 'xtracker';

$log_dir = getenv('EXTRACKER_LOG_DIR') ?: '/var/www/exTracker/logs/';

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$db = mysqli_connect($mysql_hostname, $mysql_user, $mysql_password, $mysql_database);
mysqli_set_charset($db, 'utf8mb4');


$version = "0.2";
