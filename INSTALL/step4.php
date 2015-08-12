<?php
if ($_POST) {
    $_SESSION["lang"] = $_POST["lang"];
}
?>
<html>
<head>
    <title>exTracker Installer | Database Settings</title>
    <link rel="stylesheet" href="style.css" type="text/css" media="screen"/>
</head>

<body>
<div id="container">
    <?php include("header.php"); ?>
    <?php include("menu.php"); ?>

    <div id="content">
        <div id="main_content">
            <h4>Database Settings</h4>

            <div id="content_install_instructions">
                <p>
                    Configure your database settings here. Database should be created prior to running exTacker. You
                    can configure these details here.<br/><br/>
                </p>
                <br/>

                <form action="step5.php" method="post">
                    <input type="hidden" value="<?php echo $_SESSION['lang']; ?>" name="lang"/>
                    <table
                        style="width:100%;font-family: lucida grande, tahoma, verdana, arial, sans-serif; font-size: 12px;">
                        <tr>
                            <td style="width:30%">Database hostname</td>
                            <td style="width:70%"><input style="width: 300px; height: 25px" type="text" name="hostname"
                                                         required>
                            </td>
                        </tr>
                        <tr>
                            <td style="width:30%">Database username</td>
                            <td style="width:70%"><input style="width: 300px; height: 25px" type="text" name="username"
                                                         required>
                            </td>
                        </tr>
                        <tr>
                            <td style="width:30%">Database password</td>
                            <td style="width:70%"><input style="width: 300px; height: 25px" type="text" name="password"
                                                         required>
                            </td>
                        </tr>
                        <tr>
                            <td style="width:30%">Database name</td>
                            <td style="width:70%"><input style="width: 300px; height: 25px" type="text" name="database"
                                                         required>
                            </td>
                        </tr>
                    </table>
                    <br>

                    <p>
                        * No validation is done hence please add the correct details.<br>
                        NOTE: ONLY supports MySQL
                    </p>
            </div>
            <div id="content_install_buttons">
                <button id="step4_back" onclick="location.href = 'step3.php';" type="button"
                        style="width: 100px; height: 30px">Back
                </button>
                <button id="step5" type="submit"
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
