<?php

include_once("configs.php");
include_once("plugins/KLogger.php");

$log = new KLogger ("/public_html/extracker/logs/", KLogger::DEBUG);

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // username and password sent from form
    $myusername = addslashes($_POST['username']);
    $mypassword = addslashes($_POST['password']);

    $encrypt_password1 = md5($mypassword);
    $encrypt_password = stripslashes($encrypt_password1);

    $sql = "SELECT id,status FROM user_accounts WHERE username='$myusername' and password='$encrypt_password'";
    $result = mysqli_query($db, $sql);
    $row = mysqli_fetch_array($result);
    $status = $row['status'];

    $count = mysqli_num_rows($result);

    // If result matched $myusername and $mypassword, table row must be 1 row
    if ($count == 1) {
        if ($status == 'ACTIVE') {
            session_start("myusername");
            $_SESSION['login_user'] = $myusername;
            $log->logAlert("user [" . $myusername . "] login successful");

            header("location: index.php");
        } else if ($status == 'SUSPENDED') {
            $error = "The user is Suspended, Please contact the administrator";
            $log->logAlert("user [" . $myusername . "] login failed with reason [" . $error . "]");
            header("location: login.php?error=" . $error);
        }
    } else {
        $error = "Invalid Username or Password";
        $log->logAlert("user [" . $myusername . "] login failed with reason [" . $error . "]");
        header("location: login.php?error=" . $error);
    }
}