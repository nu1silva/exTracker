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
    <title>exTracker Installer | Install</title>
    <link rel="stylesheet" href="style.css" type="text/css" media="screen"/>
</head>

<body>
<div id="container">
    <?php include("header.php"); ?>
    <?php include("menu.php"); ?>

    <div id="content">
        <div id="main_content">
            <h4>Review Installation Details</h4>

            <div id="content_install_instructions">
                <p>
                    <?php
                    echo "Selected Language     : " . $_SESSION["lang"] . "<br/>";
                    echo "Database Hostname     : " . $_SESSION["hostname"] . "<br/>";
                    echo "Database Username     : " . $_SESSION["username"] . "<br/>";
                    echo "Database Password     : " . $_SESSION["password"] . "<br/>";
                    echo "Database Database     : " . $_SESSION["database"] . "<br/>";
                    ?>
                    <br><br>
                    Please add the following in between <\?php and ?> after creating a file named config.db.php<br><br>
                    <?php
                    echo "\$mysql_hostname = \"" . $_SESSION["hostname"] . "\";<br/>";
                    echo "\$mysql_username = \"" . $_SESSION["username"] . "\";<br/>";
                    echo "\$mysql_password = \"" . $_SESSION["password"] . "\";<br/>";
                    echo "\$mysql_database = \"" . $_SESSION["database"] . "\";<br/>";
                    ?>
                </p>
            </div>
            <div id="content_install_buttons">
                <form action="complete.php" method="post">
                    <input type="hidden" value="<?php echo $_SESSION['hostname']; ?>" name="hostname"/>
                    <input type="hidden" value="<?php echo $_SESSION['username']; ?>" name="username"/>
                    <input type="hidden" value="<?php echo $_SESSION['password']; ?>" name="password"/>
                    <input type="hidden" value="<?php echo $_SESSION['database']; ?>" name="database"/>
                    <button id="step6_back" onclick="location.href = 'step5.php';" type="button"
                            style="width: 100px; height: 30px">Back
                    </button>
                    <button id="step7" onclick="location.href = 'complete.php';" type="submit"
                            style="width: 200px; height: 30px">Install
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
                    <b>Ready to Install</b><br> <br>
                    Completed Installation<br> <br>
                </p>
            </div>
        </div>
    </div>
    <?php include("footer.php"); ?>

</div>
</body>

</html>
