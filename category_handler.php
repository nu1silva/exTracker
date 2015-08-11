<?php

include('config.db.php');
include('dbplugin.php');

if (isset($_GET['delid'])) {
    $delRec = addslashes($_GET['delid']);
    $catdelquery = "UPDATE category SET status='DELETED' WHERE id='$delRec'";
    mysqli_query($db, $catdelquery);
    $errorMsg = "record deleted successfully";
    header("Location: category.php?success=" . $errorMsg);
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $category_name = addslashes($_POST['category']);

    if ($category_name == "") {
        $errorMsg = "Please enter category name";
        header("Location: category.php?error=" . $errorMsg);
    } else {
        $check = "SELECT category,status FROM category WHERE category='$category_name'";
        $result = mysqli_query($db, $check);

        $row = mysqli_fetch_array($result);
        $fcats = $row['category'];
        $fcstatus = $row['status'];

        $check_count = mysqli_num_rows($result);

        if ($check_count > 0 && $fcstatus == 'ACTIVE') {
            $errorMsg = "category already in the system";
            header("Location: category.php?error=" . $errorMsg);
        }

        if ($check_count > 0 && $fcstatus == 'DELETED') {
            $updatecat = "UPDATE category SET status='ACTIVE' WHERE category='$fcats'";
            mysqli_query($db, $updatecat);
            $successMsg = "category was added successfully.";
            header("Location: category.php?success=" . $successMsg);
        }

        if ($check_count == 0) {
            $insertCat = "INSERT INTO category (`id`, `category`, `status`) VALUES (NULL, '$category_name', 'ACTIVE')";
            mysqli_query($db, $insertCat);
            $successMsg = "category was added successfully.";
            header("Location: category.php?success=" . $successMsg);
        }
    }
}