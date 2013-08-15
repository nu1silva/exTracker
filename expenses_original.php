<?php

include_once('lock.php');
include_once('configs.php');
include_once('date_handler.php');
include_once('dbplugin.php');
include_once('plugins/html_table.class.php');
include_once('plugins/KLogger.php');
include_once('plugins/Pagination.php');

$deleteB = "<button class=\"ui-state-default ui-corner-all\" title=\"edit record\"><span class=\"ui-icon ui-icon-trash\"></span></button>";
$editB = "<button class=\"ui-state-default ui-corner-all\" title=\"delete record\"><span class=\"ui-icon ui-icon-pencil\"></span></button>";

$error = $_GET['error'];
$success = $_GET['success'];
?>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>expense tracker | Expenses Management</title>
    <link rel="stylesheet" href="css/style.css" type="text/css" media="screen"/>

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
            // Datepicker
            $('#datepickerd').datepicker({
                inline: true,
                altField: '#datepicker_send'
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
            <h2>Expenses Management</h2><br>

            <div id="form_content">
                <form id="addexpense" action='expense_handler.php' method='post'>
                    <div id="form_left">
                        <div name="datepickerd" id="datepickerd"></div>
                        <input type="hidden" id="datepicker_send" name="datepicker_send">
                    </div>
                    <table width='300px' border='0' cellpadding='5' cellspacing='0'>
                        <tr>
                            <td style="text-align:right;"><label>Description :</label></td>
                            <td style="text-align:left;"><input id="desc" name="desc" type="text"></td>
                        </tr>
                        <tr>
                            <td style="text-align:right;"><label>Category :</label></td>
                            <td style="text-align:left;">
                                <?php
                                $getcatsql = "SELECT id,category from category WHERE status='ACTIVE'";
                                $cat_result = mysqli_query($db, $getcatsql);

                                echo "<select name=\"cat\" style=\"width: 175px; height: 25px\">";

                                while ($row = mysqli_fetch_array($cat_result)) {
                                    $id = $row['id'];
                                    $ctgry = $row['category'];

                                    echo "<option value='" . $id . "'>" . $ctgry . "</option>";
                                }
                                echo "</select>";
                                ?>
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align:right;"><label>Amount :</label></td>
                            <td style="text-align:left;"><input id="aamount" name="aamount" type="text"></td>
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

                <div style="padding-left:50px; font-size:15px; color:#FF0000;"><?php echo $error; ?></div>
                <div style="padding-left:50px; font-size:15px; color:#19aa2f;"><?php echo $success; ?></div>

                <br><br>
                <?php

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

                $resultC = mysqli_query($db, $fill);
                $rowcount = mysqli_num_rows($resultC);

                // pagination
                $links = new Pagination($rowcount, 10);
                $result = mysqli_query($db, $fill . $links->limit());

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
                echo $links->display();

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