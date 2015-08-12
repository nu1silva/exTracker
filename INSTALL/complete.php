<html>
<head>
    <title>exTracker Installer | Installation Complete</title>
    <link rel="stylesheet" href="style.css" type="text/css" media="screen"/>
</head>

<body>
<div id="container">
    <?php include("header.php"); ?>
    <?php include("menu.php"); ?>

    <div id="content">
        <div id="main_content">
            <h4>Installation Complete</h4>

            <div id="content_install_instructions">
                <p>
                    Installation is complete.<br/><br/>
                    <b>NOTE:</b> Please remove the INSTALL directory and click on Complete.
                </p>
            </div>
            <div id="content_install_buttons">
                <button id="complete" type="submit" onclick="location.href = '../index.php';"
                        style="width: 250px; height: 30px">
                    Complete Installation
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
                    <b>Completed Installation</b><br> <br>
                </p>
            </div>
        </div>
    </div>
    <?php include("footer.php"); ?>

</div>
</body>

</html>