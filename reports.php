<?php
require_once('lock.php');
require_once('report_view.php');

$today = date('Y-m-d');
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>expense tracker | reports</title>
    <link rel="stylesheet" href="css/style.css" type="text/css" media="screen"/>
    <link rel="stylesheet" href="css/report.css" type="text/css" media="screen"/>
    <link type="text/css" href="scripts/jquery/css/smoothness/jquery-ui-1.10.3.custom.css" rel="stylesheet"/>
    <script type="text/javascript" src="scripts/jquery/js/jquery-1.9.1.js"></script>
    <script type="text/javascript" src="scripts/jquery/js/jquery-ui-1.10.3.custom.js"></script>
    <script type="text/javascript" src="scripts/chartjs/chart.umd.min.js"></script>
    <script type="text/javascript" src="scripts/report.js"></script>
    <script type="text/javascript">
        $(function () {
            $('#tabs').tabs();
            $("#cust-month-select-reports").button();
        });
    </script>
</head>

<body>
<div id="container">
    <?php include("header.php"); ?>
    <?php include("menu.php"); ?>

    <div id="content">
        <div id="main_content">
            <h2>Expenses Reports</h2>

            <div id="tabs">
                <ul>
                    <li><a href="#tabs-1">Daily</a></li>
                    <li><a href="#tabs-2">Monthly</a></li>
                    <li><a href="#tabs-3">Yearly</a></li>
                    <li><a href="#tabs-4">Custom</a></li>
                </ul>
                <div id="tabs-1">
                    <?php render_category_report($db, $login_id,
                        "Daily Expenses Report ( " . date('d-m-Y') . " )", $today, $today, 'chart-daily'); ?>
                </div>
                <div id="tabs-2">
                    <?php render_category_report($db, $login_id,
                        "Monthly Expenses Report ( " . date('m-Y') . " )", date('Y-m-01'), date('Y-m-t'), 'chart-monthly'); ?>
                </div>
                <div id="tabs-3">
                    <?php render_category_report($db, $login_id,
                        "Yearly Expenses Report ( " . date('Y') . " )", date('Y-01-01'), date('Y-12-31'), 'chart-yearly'); ?>
                </div>
                <div id="tabs-4">
                    <h3>Custom Reporting</h3>

                    <form action="custom_reports.php" method="get">
                        <select name="month" style="padding: 3px;">
                            <?php for ($m = 1; $m <= 12; $m++) { ?>
                                <option value="<?php echo $m; ?>" <?php echo $m == date('n') ? 'selected' : ''; ?>>
                                    <?php echo date('F', mktime(0, 0, 0, $m, 1)); ?>
                                </option>
                            <?php } ?>
                        </select>
                        <input type="number" name="year" value="<?php echo date('Y'); ?>" min="1970" max="9999"
                               style="width: 70px; padding: 3px;"/>
                        <button id="cust-month-select-reports">Generate Report</button>
                    </form>
                </div>
            </div>
        </div>
        <div id="summary_content">
            <?php include("stats.php"); ?>
        </div>
        <div id="clearfix"></div>
    </div>
    <?php include("footer.php"); ?>
</div>
</body>

</html>
