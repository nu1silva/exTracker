<?php
if ($_POST) {
    $_SESSION["lang"] = $_POST["lang"];
}
?>
<html>
<head>
    <title>exTracker Installer | Environment Verification</title>
    <link rel="stylesheet" href="style.css" type="text/css" media="screen"/>
</head>

<body>
<div id="container">
    <?php include("header.php"); ?>
    <?php include("menu.php"); ?>

    <div id="content">
        <div id="main_content">
            <h4>Environment Verification</h4>
            <?php echo $_SESSION["lang"]; ?>

            <div id="content_install_instructions">
                <p>
                    Verifying the current server environment<br/><br/>
                </p>
                <b>NO Verification done in this version</b>

                <p>
                    System Requirements are as follows (please make sure these are met);<br>
                    TODO
                </p>
            </div>
            <div id="content_install_buttons">
                <form action="step4.php" method="post">
                    <input type="hidden" value="<?php echo $_SESSION['lang']; ?>" name="lang"/>
                    <button id="step3_back" onclick="location.href = 'step2.php';" type="button"
                            style="width: 100px; height: 30px">Back
                    </button>
                    <button id="step4" onclick="location.href = 'step4.php';" type="submit"
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
                    Database Settings<br> <br>
                    Other Settings<br> <br>
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
