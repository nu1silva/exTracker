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
                <button id="step5_back" onclick="location.href = 'step4.php';" type="submit"
                        style="width: 100px; height: 30px">Back
                </button>
                <button id="step6" onclick="location.href = 'step6.php';" type="submit"
                        style="width: 100px; height: 30px">Next
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
