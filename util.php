<?php


function getMonthString($value)
{
    $result = "ERROR";

    if ($value == 1) {
        $result = "January";
    } elseif ($value == 2) {
        $result = "February";
    } elseif ($value == 3) {
        $result = "March";
    } elseif ($value == 4) {
        $result = "April";
    } elseif ($value == 5) {
        $result = "May";
    } elseif ($value == 6) {
        $result = "June";
    } elseif ($value == 7) {
        $result = "July";
    } elseif ($value == 8) {
        $result = "August";
    } elseif ($value == 9) {
        $result = "September";
    } elseif ($value == 10) {
        $result = "October";
    } elseif ($value == 11) {
        $result = "November";
    } elseif ($value == 12) {
        $result = "December";
    }

    return $result;
}