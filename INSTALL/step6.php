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
                    Summary of the installation<br/><br/>
                </p>
                <b>Needs to be configurable</b>
            </div>
            <div id="content_install_buttons">
                <button id="step6_back" onclick="location.href = 'step5.php';" type="submit"
                        style="width: 100px; height: 30px">Back
                </button>
                <button id="step7" onclick="location.href = 'complete.php';" type="submit"
                        style="width: 200px; height: 30px">Install
                </button>
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
