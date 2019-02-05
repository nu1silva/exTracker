<?php
//include_once('lock.php');
include_once('plugins/KLogger.php');
$configs = include('config.php');
//if (file_exists(INSTALL)) {
//    //header("Location: INSTALL/install.php");
//}


$logger = new KLogger ($configs->log_dir, KLogger::DEBUG);
$logger->logNotice("[page load] dashboard is loading")
?>

<html>
<head>
    <title>expense tracker | Home</title>
    <link rel="stylesheet" href="css/style.css" type="text/css" media="screen"/>
    <link type="text/css" href="scripts/jquery/css/smoothness/jquery-ui-1.10.3.custom.css" rel="stylesheet"/>
    <script type="text/javascript" src="scripts/jquery/js/jquery-1.9.1.js"></script>
    <script type="text/javascript" src="scripts/jquery/js/jquery-ui-1.10.3.custom.js"></script>
</head>

<body>
<div id="container">
    <?php include("header.php"); ?>

    <div id="content">
        <div id="header-h2">Dashboard</div>
        <div class="col-sm-12">
            <div class="col-sm-9"></div>
            <div class="col-sm-3">
                <?php include("stats.php"); ?>
            </div>
        </div>
    </div>
    <?php include("footer.php"); ?>

</div>
</body>

</html>
