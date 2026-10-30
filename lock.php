<?php
// Include at the top of every page that needs a logged-in user.
require_once(__DIR__ . '/bootstrap.php');

$user = isset($_SESSION['user_id']) ? getUserById($db, $_SESSION['user_id']) : null;

if (!$user || $user['status'] !== 'ACTIVE') {
    $_SESSION = array();
    redirect("login.php");
}

$login_id = (int)$user['id'];
$login_session = $user['username'];
$login_user = $user['fname'] . " " . $user['lname'];
$userType = $user['user_type'];
