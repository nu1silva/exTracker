<?php session_start();
if ($_POST) {
    $_SESSION["lang"] = $_POST["lang"];
    $_SESSION["hostname"] = $_POST["hostname"];
    $_SESSION["username"] = $_POST["username"];
    $_SESSION["password"] = $_POST["password"];
    $_SESSION["database"] = $_POST["database"];
}
?>
<html>
<head>
    <title>exTracker Installer | Other Settings</title>
    <link rel="stylesheet" href="style.css" type="text/css" media="screen"/>
</head>

<body>
<div id="container">
    <?php include("header.php"); ?>
    <?php include("menu.php"); ?>

    <div id="content">
        <div id="main_content">
            <h4>Other Settings</h4>

            <div id="content_install_instructions">
                <p>
                    Other settings such as logging etc.<br/><br/>
                </p>
                <b>Needs to be configurable</b>
            </div>
            <div id="content_install_buttons">
                <form action="step6.php" method="post">
                    <input type="hidden" value="<?php echo $_SESSION['lang']; ?>" name="lang"/>
                    <input type="hidden" value="<?php echo $_SESSION['hostname']; ?>" name="hostname"/>
                    <input type="hidden" value="<?php echo $_SESSION['username']; ?>" name="username"/>
                    <input type="hidden" value="<?php echo $_SESSION['password']; ?>" name="password"/>
                    <input type="hidden" value="<?php echo $_SESSION['database']; ?>" name="database"/>
                    <button id="step5_back" onclick="location.href = 'step4.php';" type="button"
                            style="width: 100px; height: 30px">Back
                    </button>
                    <button id="step6" onclick="location.href = 'step6.php';" type="submit"
                            style="width: 100px; height: 30px">Next
                    </button>
                </form>
            </div>
        </div>
        <div id="summary_content">
            <div id="data_summary">
                <p>
                    <b>Introduction</b><br> <br>
                    <b>Select Language</b><br> <br>
                    <b>Licence Agreement</b><br> <br>
                    <b>Environment Verification</b><br> <br>
                    <b>Database Settings</b><br> <br>
                    <b>Other Settings</b><br> <br>
                    Ready to Install<br> <br>
                    Completed Installation<br> <br>
                </p>
            </div>
        </div>
    </div>
    <?php include("footer.php"); ?>

</div>
</body>

</html>
