<?php
// Shared setup for every page: config, DB connection, helpers, logger and session.
require_once(__DIR__ . '/config.db.php');
require_once(__DIR__ . '/util.php');
require_once(__DIR__ . '/dbplugin.php');
require_once(__DIR__ . '/plugins/KLogger.php');

$log = new KLogger($log_dir, KLogger::DEBUG);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_set_cookie_params(array(
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => !empty($_SERVER['HTTPS']),
    ));
    session_start();
}
