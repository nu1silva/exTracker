<?php
include_once('config.db.php');
session_start();

$user_check = $_SESSION['login_user'];

$ses_sql = mysqli_query($db, "select id,username,fname,lname,user_type from user_accounts where username='$user_check'");

$row = mysqli_fetch_array($ses_sql);
$fname = $row['fname'];
$lname = $row['lname'];
$userType = $row['user_type'];

$login_user = $fname . " " . $lname;
$login_session = $row['username'];
$login_id = $row['id'];

//if (!isset($login_session)) {
//    header("Location: login.php");
//}
