<?php

require_once('lock.php');
require_once('plugins/html_table.class.php');

// number of rows per page
$page_rows = 10;

$rowcount = countActiveCategories($db, $login_id);
$last = (int)ceil($rowcount / $page_rows);
$pagenum = current_page($last);
$categories = getActiveCategories($db, $login_id, $page_rows, ($pagenum - 1) * $page_rows);

function categoryTable()
{
    $tbl = new HTML_Table('', 'demoTbl', 0);
    $tbl->addCaption('Categories', 'cap', array('id' => 'tblCap'));
    $tbl->addColgroup();
    // span, class
    $tbl->addCol(0, 'category');
    $tbl->addCol(1, 'actions');

    $tbl->addTSection('thead');
    $tbl->addRow();
    $tbl->addCell('Category', 'first', 'header');
    $tbl->addCell('Actions', 'first', 'header');
    return $tbl;
}

?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>expense tracker | Category Management</title>
    <link rel="stylesheet" href="css/style.css" type="text/css" media="screen"/>
    <link rel="stylesheet" href="css/pagination.css" type="text/css" media="screen"/>

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

        table.demoTbl .category {
            width: 400px;
        }

        table.demoTbl .actions {
            width: 150px;
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

        table.demoTbl td.cat {
            text-align: left;
            padding-left: 150px;
        }

        table.demoTbl td.actions {
            text-align: center;
        }

        table.demoTbl td.foot {
            text-align: center;
        }

    </style>
    <script type="text/javascript">
        $(function () {
            $("#add-cat-btn").button();
        });
    </script>
</head>

<body>
<div id="container">
    <?php include("header.php"); ?>
    <?php include("menu.php"); ?>

    <div id="content">
        <div id="main_content">
            <h2>Category Management</h2><br>

            <div id="form_content">
                <form id="addCat" action='category_handler.php' method='post'>
                    <?php echo csrf_field(); ?>
                    <div id="form_left">
                        <label>Category Name : </label>
                    </div>
                    <div id="form_right">
                        <input id="category" name="category" type="text" maxlength="50" required>
                        <br><br>
                        <button id="add-cat-btn">Add Category</button>
                    </div>
                    <br><br>
                    <br><br>
                </form>
                <br><br>

                <?php show_messages(); ?>

                <br>
                <?php
                $tbl = categoryTable();

                if ($rowcount >= 1) {
                    // tfoot
                    $tbl->addTSection('tfoot');
                    $tbl->addRow();
                    $tbl->addCell('', 'foot', 'data', array('colspan' => 2));

                    $tbl->addTSection('tbody');
                    foreach ($categories as $row) {
                        $actions = '<form action="category_handler.php" method="post" style="margin:0">'
                            . csrf_field()
                            . '<input type="hidden" name="delid" value="' . (int)$row['id'] . '"/>'
                            . '<button type="submit" class="ui-state-default ui-corner-all" title="delete record">'
                            . '<span class="ui-icon ui-icon-trash"></span></button></form>';

                        $tbl->addRow();
                        $tbl->addCell(h($row['category']), 'cat');
                        $tbl->addCell($actions, 'actions');
                    }

                    echo $tbl->display();
                    echo "<br>";
                    echo render_pagination('category.php', $pagenum, $last);
                } else {
                    $tbl->addTSection('tbody');
                    $tbl->addRow();
                    $tbl->addCell('<br><br><b>No Data to Display</b>', 'foot', 'data', array('colspan' => 2));
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
