<?php

require_once('bootstrap.php');
require_post_with_csrf();

$myusername = (string)($_POST['username'] ?? '');
$mypassword = (string)($_POST['password'] ?? '');

$user = getUserByUsername($db, $myusername);

if (!$user || !password_verify($mypassword, $user['password'])) {
    $error = "Invalid Username or Password";
    $log->logAlert("user [" . $myusername . "] login failed with reason [" . $error . "]");
    redirect_with("login.php", "error", $error);
}

if ($user['status'] !== 'ACTIVE') {
    $error = "The user is Suspended, Please contact the administrator";
    $log->logAlert("user [" . $myusername . "] login failed with reason [" . $error . "]");
    redirect_with("login.php", "error", $error);
}

if (password_needs_rehash($user['password'], PASSWORD_DEFAULT)) {
    updatePasswordHash($db, $user['id'], password_hash($mypassword, PASSWORD_DEFAULT));
}

session_regenerate_id(true);
$_SESSION['user_id'] = (int)$user['id'];
$log->logAlert("user [" . $myusername . "] login successful");

redirect("index.php");
