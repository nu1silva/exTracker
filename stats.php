<?php

include_once('lock.php');
include_once('config.db.php');
include_once('dbplugin.php');
include_once('date_handler.php');

$crntYear = getYear();
$crntMonth = getMonth();
$crntDay = getDay();

// Timezone related setting - TODO
//if (isset($_GET['offset'])) {
//    $minutes = $_GET['offset'];
//
//    $local = gmmktime(gmdate("H"),gmdate("i")-$minutes); // adjust GMT by client's offset
//
//    $crntYear=gmdate("Y",$local);
//    $crntMonth=gmdate("m",$local);
//    $crntDay=gmdate("d",$local);
//} else {
//    echo "<script language='javascript'>\n";
//    echo "var d = new Date();\n";
//    echo "location.href=\"${_SERVER['SCRIPT_NAME']}?offset=\" + d.getTimezoneOffset();\n";
//    echo "</script>\n";
//    exit();
//}

$dayTotal = "SELECT total FROM summary_day WHERE year='$crntYear' AND month='$crntMonth' AND day='$crntDay'";
$dayTot = mysqli_query($db, $dayTotal);
$drow = mysqli_fetch_array($dayTot);
$daily = number_format($drow["total"], 2);

$monthTotal = "SELECT total FROM summary_month WHERE year='$crntYear' AND month='$crntMonth'";
$monthTot = mysqli_query($db, $monthTotal);
$mrow = mysqli_fetch_array($monthTot);
$monthly = number_format($mrow["total"], 2);

$yearTotal = "SELECT total FROM summary_year WHERE year='$crntYear'";
$yearTot = mysqli_query($db, $yearTotal);
$yrow = mysqli_fetch_array($yearTot);
$yearly = number_format($yrow["total"], 2);
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>nu1silva | web template</title>
    <link rel="stylesheet" href="css/style.css" type="text/css" media="screen"/>
</head>

<body>
<div id="data_summary">
    <h3>Today's Expenses</h3>
    <hr>
    <br>

    <h3>Rs. <?php echo $daily; ?></h3> <br>

    <h3>Breakdown</h3>
    <hr>
    <br>

    <div style="float: left;">
        <b>This Month :</b>
    </div>
    <div style="float: right;">
        <b>Rs. <?php echo $monthly; ?></b>
    </div>
    <br><br>

    <div style="float: left;">
        <b>This year :</b>
    </div>
    <div style="float: right;">
        <b>Rs. <?php echo $yearly; ?></b>
    </div>
</div>
<div id="clearfix"></div>
</body>

</html>