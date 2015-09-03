<?php
session_start();

include_once('lock.php');
include_once("plugins/KLogger.php");

$log = new KLogger ("/var/www/exTracker/logs/", KLogger::DEBUG);
$log->logAlert("user [" . $login_session . "] logout initiated.");

if (session_destroy()) {
    header("Location: login.php");
}
?>