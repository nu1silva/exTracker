<html>
<head>
    <title>expense tracker | Home</title>
    <link rel="stylesheet" href="style.css" type="text/css" media="screen"/>
</head>

<body>
<div id="container">
    <?php include "header.php"; ?>
    <?php include "menu.php"; ?>

    <div id="content">
        <div id="main_content">
            <h4>Welcome to the exTracker Installer</h4>

            <div id="content_install_instructions">
                <p>
                    This Installer will guide you step by step to install exTracker in your server.<br/><br/><br/>
                    Please follow the below steps to successfully install exTracker
                </p>
            </div>
            <div id="content_install_buttons">
                <button id="step1" onclick="location.href = 'step1.php';" type="submit"
                        style="width: 200px; height: 30px">Install exTracker
                </button>
            </div>
        </div>
        <div id="summary_content">
            <div id="data_summary">
                <p>
                    <b>Introduction</b><br> <br>
                    Select Language<br> <br>
                    Licence Agreement<br> <br>
                    Environment Verification<br> <br>
                    Database Settings<br> <br>
                    Other Settings<br> <br>
                    Ready to Install<br> <br>
                    Completed Installation<br> <br>
                </p>
            </div>
        </div>
    </div>
    <?php include "footer.php"; ?>

</div>
</body>

</html>
