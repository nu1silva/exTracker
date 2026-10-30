<?php require_once(__DIR__ . '/lock.php'); ?>
<div id="header">
    <div id="header-logo"><h1>Expense Tracker <?php echo h($version) ?></h1></div>
    <div id="header-options"><b><?php echo h($login_user . " [" . $userType . "]"); ?></b></div>
</div>
