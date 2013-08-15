<?php
include_once('configs.php');

function getCategoryName($db, $catid)
{
    $getcat = "SELECT category FROM category WHERE id='$catid'";
    $result = mysqli_query($db, $getcat);
    $row = mysqli_fetch_array($result);
    $cat = $row["category"];
    return $cat;
}

// reporting
function generateDailyReportData($db, $year, $month, $day)
{
    $getReportData = "select category_id,sum(amount) from expences where year = $year and month = $month and day = $day group by category_id;";
    $result = mysqli_query($db, $getReportData);

    while ($row = mysqli_fetch_array($result)) {
        $category = getCategoryName($db, $row['category_id']);
        $amount = $row[1];
        $record = $category . "|" . $amount;
        $reportArray[] = $record;
    }
    return $reportArray;;
}

function generateMonthlyReportData($db, $year, $month)
{
    $getReportData = "select category_id,sum(amount) from expences where year = $year and month = $month group by category_id;";
    $result = mysqli_query($db, $getReportData);

    while ($row = mysqli_fetch_array($result)) {
        $category = getCategoryName($db, $row['category_id']);
        $amount = $row[1];
        $record = $category . "|" . $amount;
        $reportArray[] = $record;
    }
    return $reportArray;;
}

function generateYearlyReportData($db, $year)
{
    $getReportData = "select category_id,sum(amount) from expences where year = $year group by category_id;";
    $result = mysqli_query($db, $getReportData);

    while ($row = mysqli_fetch_array($result)) {
        $category = getCategoryName($db, $row['category_id']);
        $amount = $row[1];
        $record = $category . "|" . $amount;
        $reportArray[] = $record;
    }
    return $reportArray;;
}

?>
