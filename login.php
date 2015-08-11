<?php

include_once('config.db.php');
$error = $_GET['error'];

?>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <link rel="stylesheet" href="css/style.css" type="text/css" media="screen"/>
    <title>Dashboard | Login</title>
</head>

<body>
<div id="clearfix" style="padding-top:150px;"></div>
<div style="font-size:13px; color:#cc0000; margin-top:10px; text-align:center"><?php echo $error; ?></div>
<div id="login-panel">
    <div id="login-panel-top">
        <div id="login-panel-top-font"><b>exTracker <?php echo $version ?></b></div>
    </div>
    <form id="login" action='login_handler.php' method='POST'>
        <fieldset id="inputs">
            <input id="username" name="username" type="text" placeholder="Username" required>
            <input id="password" name="password" type="password" placeholder="Password" required>
        </fieldset>
        <fieldset id="actions">
            <input type="submit" id="login-button" value="Sign In">
        </fieldset>
    </form>
    <div id="login-panel-other-options">
        <a href="login.php">Can not remember password?</a>
    </div>
</div>
<div id="login-copyrights">
    <p>copyrights &copy; 2012-2013. nu1silva.com, All Rights Reserved.</p>
</div>
</body>

</html>
