<?php
require_once(__DIR__ . '/lock.php');

$today = date('Y-m-d');
$daily = number_format(getTotalBetween($db, $login_id, $today, $today), 2);
$monthly = number_format(getTotalBetween($db, $login_id, date('Y-m-01'), date('Y-m-t')), 2);
$yearly = number_format(getTotalBetween($db, $login_id, date('Y-01-01'), date('Y-12-31')), 2);
?>
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
