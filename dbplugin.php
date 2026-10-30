<?php
// All database access goes through here, using prepared statements only.

// Run a prepared statement. $types is the mysqli bind string ("isd"...).
// Returns a mysqli_result for SELECTs, otherwise the affected row count.
function db_exec($db, $sql, $types = '', ...$params)
{
    $stmt = mysqli_prepare($db, $sql);
    if ($types !== '') {
        mysqli_stmt_bind_param($stmt, $types, ...$params);
    }
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    return $result !== false ? $result : mysqli_stmt_affected_rows($stmt);
}

function db_fetch_all($db, $sql, $types = '', ...$params)
{
    return mysqli_fetch_all(db_exec($db, $sql, $types, ...$params), MYSQLI_ASSOC);
}

function db_fetch_one($db, $sql, $types = '', ...$params)
{
    return mysqli_fetch_assoc(db_exec($db, $sql, $types, ...$params));
}

// users

function getUserByUsername($db, $username)
{
    return db_fetch_one($db,
        "SELECT id, username, password, fname, lname, user_type, status FROM user_accounts WHERE username = ?",
        's', $username);
}

function getUserById($db, $userId)
{
    return db_fetch_one($db,
        "SELECT id, username, fname, lname, user_type, status FROM user_accounts WHERE id = ?",
        'i', $userId);
}

function updatePasswordHash($db, $userId, $hash)
{
    db_exec($db, "UPDATE user_accounts SET password = ? WHERE id = ?", 'si', $hash, $userId);
}

// categories

function countActiveCategories($db, $userId)
{
    return (int)db_fetch_one($db,
        "SELECT COUNT(*) AS n FROM category WHERE userId = ? AND status = 'ACTIVE'",
        'i', $userId)['n'];
}

// $limit/$offset are optional; omit them to get every active category.
function getActiveCategories($db, $userId, $limit = PHP_INT_MAX, $offset = 0)
{
    return db_fetch_all($db,
        "SELECT id, category FROM category WHERE userId = ? AND status = 'ACTIVE' ORDER BY category LIMIT ? OFFSET ?",
        'iii', $userId, $limit, $offset);
}

function findCategoryByName($db, $userId, $name)
{
    return db_fetch_one($db,
        "SELECT id, status FROM category WHERE userId = ? AND category = ?",
        'is', $userId, $name);
}

function addCategory($db, $userId, $name)
{
    db_exec($db, "INSERT INTO category (category, userId, status) VALUES (?, ?, 'ACTIVE')", 'si', $name, $userId);
}

function setCategoryStatus($db, $userId, $categoryId, $status)
{
    return db_exec($db, "UPDATE category SET status = ? WHERE id = ? AND userId = ?",
        'sii', $status, $categoryId, $userId);
}

// expenses

function addExpense($db, $userId, $date, $description, $categoryId, $amount)
{
    db_exec($db,
        "INSERT INTO expenses (date, description, categoryId, amount, userId) VALUES (?, ?, ?, ?, ?)",
        'ssisi', $date, $description, $categoryId, $amount, $userId);
}

function deleteExpense($db, $userId, $expenseId)
{
    return db_exec($db, "DELETE FROM expenses WHERE id = ? AND userId = ?", 'ii', $expenseId, $userId);
}

function countExpensesOn($db, $userId, $date)
{
    return (int)db_fetch_one($db,
        "SELECT COUNT(*) AS n FROM expenses WHERE userId = ? AND date = ?",
        'is', $userId, $date)['n'];
}

function getExpensesOn($db, $userId, $date, $limit, $offset)
{
    return db_fetch_all($db,
        "SELECT e.id, e.description, e.amount, c.category
         FROM expenses e JOIN category c ON c.id = e.categoryId
         WHERE e.userId = ? AND e.date = ?
         ORDER BY e.id LIMIT ? OFFSET ?",
        'isii', $userId, $date, $limit, $offset);
}

// reporting -- date ranges are inclusive, 'Y-m-d'

function getTotalBetween($db, $userId, $from, $to)
{
    return (float)db_fetch_one($db,
        "SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE userId = ? AND date BETWEEN ? AND ?",
        'iss', $userId, $from, $to)['total'];
}

// Rows of [category, total], largest first.
function getCategoryTotalsBetween($db, $userId, $from, $to)
{
    return db_fetch_all($db,
        "SELECT c.category, SUM(e.amount) AS total
         FROM expenses e JOIN category c ON c.id = e.categoryId
         WHERE e.userId = ? AND e.date BETWEEN ? AND ?
         GROUP BY c.id, c.category
         ORDER BY total DESC",
        'iss', $userId, $from, $to);
}
