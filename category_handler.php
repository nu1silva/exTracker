<?php

require_once('lock.php');
require_post_with_csrf();

// delete (soft -- existing expenses keep pointing at it)
if (isset($_POST['delid'])) {
    if (setCategoryStatus($db, $login_id, (int)$_POST['delid'], 'DELETED') === 0) {
        redirect_with("category.php", "error", "category not found");
    }
    redirect_with("category.php", "success", "record deleted successfully");
}

// add
$category_name = trim((string)($_POST['category'] ?? ''));

if ($category_name === '') {
    redirect_with("category.php", "error", "Please enter category name");
}
if (mb_strlen($category_name) > 50) {
    redirect_with("category.php", "error", "Category name must be 50 characters or fewer");
}

$existing = findCategoryByName($db, $login_id, $category_name);

if ($existing && $existing['status'] === 'ACTIVE') {
    redirect_with("category.php", "error", "category already in the system");
}

if ($existing) {
    setCategoryStatus($db, $login_id, $existing['id'], 'ACTIVE');
} else {
    addCategory($db, $login_id, $category_name);
}
redirect_with("category.php", "success", "category was added successfully.");
