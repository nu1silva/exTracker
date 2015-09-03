<?php
include_once('lock.php');
if (file_exists(INSTALL)) {
    //header("Location: INSTALL/install.php");
}
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
    <?php include("menu.php"); ?>

    <div id="content">
        <div id="main_content">
            <div style="text-align: center">
                <h2>exTracker Dashboard</h2>
            </div>
        </div>
        <div id="summary_content">
            <!--            --><?php //include("stats.php"); ?>
        </div>
        <div id="clearfix"></div>
    </div>
    <?php include("footer.php"); ?>

</div>
</body>

</html>
