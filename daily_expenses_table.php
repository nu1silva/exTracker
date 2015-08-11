<!DOCTYPE html>
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>expense tracker | Expenses</title>
    <link rel="stylesheet" href="css/style.css" type="text/css" media="screen"/>
    <!-- calender -->
    <link type="text/css" href="scripts/jquery/css/smoothness/jquery-ui-1.10.3.custom.css" rel="stylesheet"/>
    <script type="text/javascript" src="scripts/jquery/js/jquery-1.9.1.js"></script>
    <script type="text/javascript" src="scripts/jquery/js/jquery-ui-1.10.3.custom.js"></script>
    <link rel="stylesheet" href="css/" type="text/css"/>
    <style type="text/css">
        table.demoTbl {
            border-collapse: collapse;
            border-spacing: 0;
        }

        #tblCap {
            font-weight: bold;
            font-size: 15px;
            margin: 1em auto .4em;
        }

        table.demoTbl .desc {
            width: 250px;
        }

        table.demoTbl .category {
            width: 100px;
        }

        table.demoTbl .amount {
            width: 100px;
        }

        table.demoTbl .actions {
            width: 100px;
        }

        table.demoTbl td, table.demoTbl th {
            padding: 1px;
        }

        table.demoTbl th.first {
            text-align: center;
            padding: 3px;
            background-color: #CCCCCC;
        }

        table.demoTbl td.num {
            text-align: right;
        }

        table.demoTbl td.cat {
            text-align: center;
        }

        table.demoTbl td.foot {
            text-align: center;
        }

    </style>
</head>
<body>
<?php
include_once('plugins/html_table.class.php');
include_once('config.db.php');
include_once('dbplugin.php');
include_once('date_handler.php');
include_once('plugins/KLogger.php');

$log = new KLogger ("/var/www/extracker/logs/", KLogger::DEBUG);

$crntYear = getYear();
$crntMonth = getMonth();
$crntDay = getDay();

// arguments: id, class, border,
// can include associative array of optional additional attributes
$tbl = new HTML_Table('', 'demoTbl', 0);

$tbl->addCaption('Today\'s Expenses', 'cap', array('id' => 'tblCap'));

$tbl->addColgroup();
// span, class
$tbl->addCol(0, 'desc');
$tbl->addCol(1, 'category');
$tbl->addCol(2, 'amount');
$tbl->addCol(3, 'actions');

// thead
$tbl->addTSection('thead');
$tbl->addRow();
// arguments: cell content, class, type (default is 'data' for td, pass 'header' for th)
// can include associative array of optional additional attributes
$tbl->addCell('Description', 'first', 'header');
$tbl->addCell('Category', 'first', 'header');
$tbl->addCell('Amount (Rs)', 'first', 'header');
$tbl->addCell('Actions', 'first', 'header');

// tfoot
$tbl->addTSection('tfoot');
$tbl->addRow();
// span all 3 columns
$tbl->addCell('', 'foot', 'data', array('colspan' => 4));

// tbody
$tbl->addTSection('tbody');

// populate table
$fill = "SELECT id,description,category_id,amount FROM expences WHERE year='$crntYear' AND month='$crntMonth' AND day='$crntDay'";

$result = mysqli_query($db, $fill);
$rowcount = mysqli_num_rows($result);

while ($row = mysqli_fetch_array($result)) {
    $desc = $row['description'];
    $cats = getCategoryName($db, $row['category_id']);
    $amount = number_format($row['amount'], 2);
    $recId = $row['id'];
    $actions = "<a href=\"javascript:void(null);\" onclick=\"document.getElementById('myform" . $recId . "').submit();\"><button class=\"ui-state-default ui-corner-all\" title=\"delete record\" onclick=\"deleteRecord($recId)\"><span class=\"ui-icon ui-icon-trash\"></span></button></a>";
    echo "<form id=\"myform" . $recId . "\" action=\"expense_handler.php\" method=\"post\"><input type=\"hidden\" name=\"recId\" value=\"" . $recId . "\" /><input type=\"hidden\" name=\"amount\" value=\"" . $amount . "\" /></form>";

    $tbl->addRow();
    $tbl->addCell($desc);
    $tbl->addCell($cats, 'cat');
    $tbl->addCell($amount, 'num');
    $tbl->addCell($actions, 'cat');
}

echo $tbl->display();

?>
</body>
</html>