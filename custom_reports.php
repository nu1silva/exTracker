<?php
require_once('lock.php');
require_once('report_view.php');

$month = (int)($_GET['month'] ?? 0);
$year = (int)($_GET['year'] ?? 0);

if (!checkdate($month, 1, $year)) {
    redirect("reports.php");
}

$first = DateTimeImmutable::createFromFormat('!Y-n-j', "$year-$month-1");
?>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>expense tracker | Reporting</title>
    <link rel="stylesheet" href="css/style.css" type="text/css" media="screen"/>
    <link rel="stylesheet" href="css/report.css" type="text/css" media="screen"/>
    <script type="text/javascript" src="scripts/chartjs/chart.umd.min.js"></script>
    <script type="text/javascript" src="scripts/report.js"></script>
</head>

<body>
<div id="container">
    <?php include("header.php"); ?>
    <?php include("menu.php"); ?>

    <div id="content">
        <div style="text-align: left; padding: 20px">
            <h2>Monthly Expenses Report</h2>
            <?php render_category_report($db, $login_id, $first->format('F Y'),
                $first->format('Y-m-d'), $first->format('Y-m-t'), 'chart-custom'); ?>
            <br>
            <a href="reports.php">&laquo; Back to reports</a>
        </div>
    </div>
    <?php include("footer.php"); ?>

</div>
</body>

</html>
