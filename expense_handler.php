<?php

require_once('lock.php');
require_post_with_csrf();

// delete
if (isset($_POST['recId'])) {
    $recId = (int)$_POST['recId'];
    $log->logDebug("Delete expense record id [" . $recId . "]");
    if (deleteExpense($db, $login_id, $recId) === 0) {
        redirect_with("expenses.php", "error", "Record not found");
    }
    redirect_with("expenses.php", "success", "Record deleted successfully");
}

// add
$date = DateTime::createFromFormat('!Y-m-d', (string)($_POST['datepicker_send'] ?? ''));
$desc = trim((string)($_POST['desc'] ?? ''));
$catgry = (int)($_POST['cat'] ?? 0);
$amnt = str_replace(',', '', trim((string)($_POST['aamount'] ?? '')));

if (!$date || $desc === '' || $catgry <= 0 || $amnt === '') {
    redirect_with("expenses.php", "error", "please enter all the details");
}
if (!is_numeric($amnt) || $amnt <= 0) {
    redirect_with("expenses.php", "error", "Amount must be a positive number");
}
if (!in_array($catgry, array_column(getActiveCategories($db, $login_id), 'id'))) {
    redirect_with("expenses.php", "error", "Unknown category");
}

addExpense($db, $login_id, $date->format('Y-m-d'), mb_substr($desc, 0, 240), $catgry, $amnt);
redirect_with("expenses.php", "success", "Record added successfully");
