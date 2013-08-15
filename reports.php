<?php

include('lock.php');

require('plugins/gChart.php');
require('dbplugin.php');
require('date_handler.php');

$crntYear = getYear();
$crntMonth = getMonth();
$crntDay = getDay();

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    $report_type = addslashes($_POST['report_type']);

    $report_data = addslashes($_POST['month']);


    // Set Report Heading
    if ($report_type == "monthly_breakdown") {
        $report_header = "Monthly Expenses Report";
        $report_month = $report_data;
        header("Location: custom_reports.php?report_type=" . $report_type . "&report_month=" . $report_month);
    } else {
        $report_header = "Secret Report";
    }
}

$report_error = $_GET['report_error'];

?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>expence tracker | reports</title>
    <link rel="stylesheet" href="css/style.css" type="text/css" media="screen"/>

    <link type="text/css" href="scripts/jquery/css/smoothness/jquery-ui-1.10.3.custom.css" rel="stylesheet"/>
    <script type="text/javascript" src="scripts/jquery/js/jquery-1.9.1.js"></script>
    <script type="text/javascript" src="scripts/jquery/js/jquery-ui-1.10.3.custom.js"></script>
    <script type="text/javascript">
        $(function () {
            $('#tabs').tabs();
        });
        $(function () {
            $("#cust-month-reports").button();
            $("#cust-year-reports").button();
            $("#cust-month-select-reports").button();
        });
        $("#datepicker").datepicker({
            showOn: "button",
            buttonImage: "images/calendar.gif",
            buttonImageOnly: true
        });
    </script>
</head>

<body>
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
                    <li><a href="#tabs-4">General</a></li>
                    <li><a href="#tabs-5">Custom</a></li>
                </ul>
                <div id="tabs-1">
                    <? include_once('daily_report.php'); ?>
                </div>
                <div id="tabs-2">
                    <? include_once('monthly_report.php'); ?>
                </div>
                <div id="tabs-3">
                    <? include_once('yearly_report.php'); ?>
                </div>
                <div id="tabs-4">
                    <h3>General Expense Reports</h3>

                    <form id="year_breakdown" action="" method="post">
                        <button id="cust-year-reports" style="width: 300px">Generate 2013 Report</button>
                    </form>
                    <p>Generates detailed report for the year of 2013</p>
                    <hr>
                    <form id="month_breakdown" action="" method="post">
                        <button id="cust-month-reports" style="width: 300px">Generate August Report</button>
                    </form>
                    <p>Generates detailed report for the month of August</p>
                    <hr>
                </div>
                <div id="tabs-5">
                    <h3>Custom Reporting</h3>

                    <form id="month_breakdown" action="" method="post">
                        <select id="month" name="month" class="required" style="padding: 3px;">
                            <option value="1">January</option>
                            <option value="2">February</option>
                            <option value="3">March</option>
                            <option value="4">April</option>
                            <option value="5">May</option>
                            <option value="6">June</option>
                            <option value="7">July</option>
                            <option value="8">August</option>
                            <option value="9">September</option>
                            <option value="10">October</option>
                            <option value="11">November</option>
                            <option value="12">December</option>
                        </select>
                        <input type="hidden" name="report_type" value="monthly_breakdown"/>
                        <button id="cust-month-select-reports">Generate Report</button>
                        <?php echo $report_error ?>
                    </form>
                    <form action="">
                        <p>Date: <input type="text" id="datepicker"></p>
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
