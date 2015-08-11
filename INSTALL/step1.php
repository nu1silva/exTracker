<html xmlns="http://www.w3.org/1999/html">
<head>
    <title>exTracker Installer | Select Language</title>
    <link rel="stylesheet" href="style.css" type="text/css" media="screen"/>
</head>

<body>
<div id="container">
    <?php include("header.php"); ?>
    <?php include("menu.php"); ?>

    <div id="content">
        <div id="main_content">
            <h4>Select Language</h4>

            <div id="content_install_instructions">
                <p>
                    Please Select the language of your choice and click "Next".<br/><br/>
                </p>

                <form action="step2.php" method="post">
                    Language :
                    <select name="lang">
                        <option value="en">English</option>
                    </select>
            </div>
            <div id="content_install_buttons">
                <button id="step1_back" onclick="location.href = 'install.php';" type="button"
                        style="width: 100px; height: 30px">Back
                </button>
                <button id="step2" type="submit"
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
    <?php include("footer.php"); ?>

</div>
</body>

</html>
