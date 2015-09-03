<?php
include_once('config.db.php');
include_once('lock.php');
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
    <div id="header-logo"><h1>Expense Tracker <?php echo $version ?></h1></div>
    <div id="header-options"><b><?php echo $login_user . " [" . $userType . "]"; ?></b></div>
</div>
</body>

</html>