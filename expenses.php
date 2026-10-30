<?php

require_once('lock.php');
require_once('plugins/html_table.class.php');

// number of rows per page
$page_rows = 10;

$today = date('Y-m-d');
$categories = getActiveCategories($db, $login_id);
$rowcount = countExpensesOn($db, $login_id, $today);
$last = (int)ceil($rowcount / $page_rows);
$pagenum = current_page($last);
$expenses = getExpensesOn($db, $login_id, $today, $page_rows, ($pagenum - 1) * $page_rows);

function expenseTable()
{
    $tbl = new HTML_Table('', 'demoTbl', 0);
    $tbl->addCaption('Today\'s Expenses', 'cap', array('id' => 'tblCap'));
    $tbl->addColgroup();
    // span, class
    $tbl->addCol(0, 'desc');
    $tbl->addCol(1, 'category');
    $tbl->addCol(2, 'amount');
    $tbl->addCol(3, 'actions');

    $tbl->addTSection('thead');
    $tbl->addRow();
    $tbl->addCell('Description', 'first', 'header');
    $tbl->addCell('Category', 'first', 'header');
    $tbl->addCell('Amount (Rs)', 'first', 'header');
    $tbl->addCell('Actions', 'first', 'header');
    return $tbl;
}
?>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>expense tracker | Expense Management</title>
    <link rel="stylesheet" href="css/style.css" type="text/css" media="screen"/>
    <link rel="stylesheet" href="css/pagination.css" type="text/css" media="screen"/>

    <!-- calender -->
    <link type="text/css" href="scripts/jquery/css/smoothness/jquery-ui-1.10.3.custom.css" rel="stylesheet"/>
    <script type="text/javascript" src="scripts/jquery/js/jquery-1.9.1.js"></script>
    <script type="text/javascript" src="scripts/jquery/js/jquery-ui-1.10.3.custom.js"></script>
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
            width: 150px;
        }

        table.demoTbl .amount {
            width: 100px;
        }

        table.demoTbl .actions {
            width: 50px;
        }

        table.demoTbl td, table.demoTbl th {
            padding: 1px;
        }

        table.demoTbl th.first {
            text-align: center;
            padding: 3px;
            background-color: #CCCCCC;
            border: 2px solid #FFFFFF;
        }

        table.demoTbl td.num {
            text-align: right;
            padding-right: 5px;
        }

        table.demoTbl td.cat {
            text-align: center;
        }

        table.demoTbl td.foot {
            text-align: center;
        }
    </style>
    <script type="text/javascript">
        $(function () {
            // Datepicker -- the hidden field is sent to the server as yyyy-mm-dd
            $('#datepickerd').datepicker({
                inline: true,
                altField: '#datepicker_send',
                altFormat: 'yy-mm-dd'
            });
            // Button
            $("#button").button();
        });
    </script>
</head>

<body>
<div id="container">
    <?php include("header.php"); ?>
    <?php include("menu.php"); ?>

    <div id="content">
        <div id="main_content">
            <h2>Expense Management</h2><br>

            <div id="form_content">
                <form id="addexpense" action='expense_handler.php' method='post'>
                    <?php echo csrf_field(); ?>
                    <div id="form_left">
                        <div name="datepickerd" id="datepickerd"></div>
                        <input type="hidden" id="datepicker_send" name="datepicker_send" value="<?php echo h($today); ?>">
                    </div>
                    <table width='300px' border='0' cellpadding='5' cellspacing='0'>
                        <tr>
                            <td style="text-align:right;"><label>Description :</label></td>
                            <td style="text-align:left;"><input id="desc" name="desc" type="text" maxlength="240"
                                                                style="width: 175px; height: 20px" required></td>
                        </tr>
                        <tr>
                            <td style="text-align:right;"><label>Category :</label></td>
                            <td style="text-align:left;">
                                <select name="cat" style="width: 175px; height: 25px">
                                    <?php foreach ($categories as $cat) { ?>
                                        <option value="<?php echo (int)$cat['id']; ?>"><?php echo h($cat['category']); ?></option>
                                    <?php } ?>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align:right;"><label>Amount :</label></td>
                            <td style="text-align:left;"><input id="aamount" name="aamount" type="number" step="0.01" min="0.01"
                                                                style="width: 175px; height: 20px" required></td>
                        </tr>
                        <tr>
                            <td></td>
                            <td style="text-align:left;">
                                <button id="button" type="submit">Add Expense</button>
                            </td>
                        </tr>
                    </table>
                </form>
                <br><br>

                <?php show_messages(); ?>

                <br><br>
                <?php
                $tbl = expenseTable();

                if ($rowcount >= 1) {
                    // tfoot
                    $tbl->addTSection('tfoot');
                    $tbl->addRow();
                    $tbl->addCell('', 'foot', 'data', array('colspan' => 4));

                    $tbl->addTSection('tbody');
                    foreach ($expenses as $row) {
                        $actions = '<form action="expense_handler.php" method="post" style="margin:0">'
                            . csrf_field()
                            . '<input type="hidden" name="recId" value="' . (int)$row['id'] . '"/>'
                            . '<button type="submit" class="ui-state-default ui-corner-all" title="delete record">'
                            . '<span class="ui-icon ui-icon-trash"></span></button></form>';

                        $tbl->addRow();
                        $tbl->addCell(h($row['description']));
                        $tbl->addCell(h($row['category']), 'cat');
                        $tbl->addCell(number_format($row['amount'], 2), 'num');
                        $tbl->addCell($actions, 'cat');
                    }

                    echo $tbl->display();
                    echo "<br>";
                    echo render_pagination('expenses.php', $pagenum, $last);
                } else {
                    $tbl->addTSection('tbody');
                    $tbl->addRow();
                    $tbl->addCell('<br><br><b>No Data to Display</b>', 'foot', 'data', array('colspan' => 4));
                    echo $tbl->display();
                }
                ?>
            </div>
        </div>
        <div id="summary_content">
            <?php include("stats.php"); ?>
        </div>
        <div id="clearfix"></div>
    </div>
    <?php include("footer.php"); ?>
</div>
</body>

</html>
