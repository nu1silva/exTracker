<?php
include_once('configs.php');
?>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <link rel="stylesheet" href="css/style.css" type="text/css" media="screen"/>
</head>

<body>
<div id="header">
    <br>

    <div style="padding-left: 20px;"><h1>Expense Tracker <?php echo $version ?></h1></div>
    <div id="header-options">
        <div id="header-options-content">
            Welcome <b><?php echo $login_user; ?></b>
        </div>
        <a href="logout.php">
            <div id="header-options-logout">
                <div id="header-options-logout-text">sign out</div>
            </div>
        </a>
    </div>
</body>

</html>