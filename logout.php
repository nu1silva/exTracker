<?php
include_once('lock.php');

$log->logAlert("user [" . $login_session . "] logout initiated.");

$_SESSION = array();
session_destroy();
redirect("login.php");
