<?php
include_once('lock.php');
include_once('util.php');

$report_type = addslashes($_GET['report_type']);
$report_month = addslashes($_GET['report_month']);


// Set Report Heading
if ($report_type == "monthly_breakdown" && $report_month != "") {
    $report_header = "Monthly Expenses Report";
    $monthName = getMonthString($report_month);
} else {
    $report_error = "Secret Report";
}
?>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>expense tracker | Reporting</title>
    <link rel="stylesheet" href="css/style.css" type="text/css" media="screen"/>
</head>

<body>
<div id="container">
    <?php include("header.php"); ?>
    <?php include("menu.php"); ?>

    <div id="content">
        <div style="text-align: left; padding: 20px">
            <h2><?php echo $report_header; ?></h2>

            <h3><?php echo "Generating " . $report_type . " for the month of [" . $monthName . "]" ?></h3>

            <h3>Custom Reporting display content is still to be decided please give us your suggestions</h3>
        </div>
    </div>
    <?php include("footer.php"); ?>

</div>
</body>

</html>