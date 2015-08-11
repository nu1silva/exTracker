<?php

include_once('lock.php');
include_once('config.db.php');
include_once('date_handler.php');
include_once('plugins/KLogger.php');

$crntYear = getYear();
$crntMonth = getMonth();
$crntDay = getDay();

$log = new KLogger ("/var/www/extracker/logs/", KLogger::DEBUG);

function deleteRecord($db, $recId)
{
    $log = new KLogger ("/var/www/extracker/logs/", KLogger::DEBUG);
    $log->logDebug("Delete expense record id [" . $recId . "]");
    $delquery = "DELETE FROM expences WHERE id='$recId'";
    mysqli_query($db, $delquery);
}

function updateDayaccount($db, $amount, $year, $month, $day)
{
    $log = new KLogger ("/var/www/extracker/logs/", KLogger::DEBUG);
    $log->logDebug("Updating Daily summary tables");
    $selectDay = "SELECT total FROM summary_day WHERE year='$year' AND month='$month' AND day='$day'";
    $dayTot = mysqli_query($db, $selectDay);
    $row = mysqli_fetch_array($dayTot);
    $day_total = $row["total"] + $amount;


    if (mysqli_num_rows($dayTot) == 0) {
        //$fulld = $year . '-' . $month . '-' . $day;
        $insertDay = "INSERT INTO summary_day VALUES ($year, $month, $day, 0)";
        mysqli_query($db, $insertDay);
    }

    $updateDay = "UPDATE summary_day SET total='$day_total' WHERE year='$year' AND month='$month' AND day='$day'";
    mysqli_query($db, $updateDay);
}

function updateMonthaccount($db, $amount, $year, $month)
{
    $log = new KLogger ("/var/www/extracker/logs/", KLogger::DEBUG);
    $log->logDebug("updating monthly summary tables");
    $selectMonth = "SELECT total FROM summary_month WHERE year='$year' AND month='$month'";
    $monthTot = mysqli_query($db, $selectMonth);
    $row = mysqli_fetch_array($monthTot);
    $month_total = $row["total"] + $amount;

    if (mysqli_num_rows($monthTot) == 0) {
        $insertMonth = "INSERT INTO summary_month VALUES ($year, $month, 0)";
        mysqli_query($db, $insertMonth);
    }

    $updateMonth = "UPDATE summary_month SET total='$month_total' WHERE year='$year' AND month='$month'";
    mysqli_query($db, $updateMonth);
}

function updateYearaccount($db, $amount, $year)
{
    $log = new KLogger ("/var/www/extracker/logs/", KLogger::DEBUG);
    $log->logDebug("updating yearly summary tables");
    $selectYear = "SELECT total FROM summary_year WHERE year='$year'";
    $yearTot = mysqli_query($db, $selectYear);
    $row = mysqli_fetch_array($yearTot);
    $year_total = $row["total"] + $amount;

    if (mysqli_num_rows($yearTot) == 0) {
        $insertYear = "INSERT INTO summary_year VALUES ($year, 0)";
        mysqli_query($db, $insertYear);
    }

    $updateYear = "UPDATE summary_year SET total='$year_total' WHERE year='$year'";
    mysqli_query($db, $updateYear);
}


if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $date = $_REQUEST['datepicker_send'];
    // break day down
    $eday = substr($date, 3, 2);
    $emonth = substr($date, 0, 2);
    $eyear = substr($date, 6, 4);
    $desc = addslashes($_POST['desc']);
    $catgry = addslashes($_POST['cat']);
    $amnt = addslashes($_POST['aamount']);

    // record delete
    $delRec = addslashes($_POST['recId']);
    $delAmnt = addslashes($_POST['amount']);

    if ($date == "" || $desc == "" || $catgry == "" || $amnt == "") {
        if ($delRec == "") {
            $error = "please enter all the details";
            header("Location: expenses.php?error=" . $error);
        } elseif ($delRec != "" && $delAmnt != "") {
            $delRec = addslashes($_POST['recId']);
            $delAmnt = str_replace(",", "", addslashes($_POST['amount']));
            deleteRecord($db, $delRec);
            updateDayaccount($db, -$delAmnt, $crntYear, $crntMonth, $crntDay);
            updateMonthaccount($db, -$delAmnt, $crntYear, $crntMonth);
            updateYearaccount($db, -$delAmnt, $crntYear);
            $success = "Record deleted successfully";
            header("Location: expenses.php?success=" . $success);
        }
    } else {
        $insertq = "INSERT INTO expences(`id`, `year`, `month`, `day`, `category_id`, `amount`, `userid`, `description`) VALUES (NULL, '$eyear', '$emonth', '$eday', '$catgry', '$amnt', '$login_id', '$desc')";
        mysqli_query($db, $insertq);
        updateDayaccount($db, $amnt, $eyear, $emonth, $eday);
        updateMonthaccount($db, $amnt, $eyear, $emonth);
        updateYearaccount($db, $amnt, $eyear);
        $success = "Record added successfully";
        header("Location: expenses.php?success=" . $success);
    }
}