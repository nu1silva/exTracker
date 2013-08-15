<?php

include('lock.php');
include_once('plugins/html_table.class.php');
include_once('configs.php');
include_once('dbplugin.php');
include_once('plugins/KLogger.php');

$error = $_GET['error'];
$success = $_GET['success'];

// number of rows per page
$page_rows = 10;

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
<body>
<div id="container">
    <?php include("header.php"); ?>
    <?php include("menu.php"); ?>

    <div id="content">
        <div id="main_content">
            <h2>Category Management</h2><br>

            <div id="form_content">
                <form id="addCat" action='category_handler.php' method='post'>
                    <div id="form_left">
                        <label>Category Name : </label>
                    </div>
                    <div id="form_right">
                        <input id="category" name="category" type=="text">
                        <br><br>
                        <button id="add-cat-btn">Add Category</button>
                    </div>
                    <br><br>
                    <br><br>
                </form>
                <br><br>

                <div style="padding-left:50px; font-size:15px; color:#FF0000;"><?php echo $error; ?></div>
                <div style="padding-left:50px; font-size:15px; color:#19aa2f;"><?php echo $success; ?></div>

                <br>
                <?php

                // pagination
                $pagenum = $_GET['pagenum'];

                // populate table
                $getcatsql = "SELECT id,category from category WHERE status='ACTIVE'";
                $cat_result = mysqli_query($db, $getcatsql);
                $rowcount = mysqli_num_rows($cat_result);

                if ($rowcount >= 1) {

                    $log = new KLogger ("/var/www/extracker/logs/", KLogger::DEBUG);

                    // arguments: id, class, border,
                    // can include associative array of optional additional attributes
                    $tbl = new HTML_Table('', 'demoTbl', 0);

                    $tbl->addCaption('Categories', 'cap', array('id' => 'tblCap'));

                    $tbl->addColgroup();
                    // span, class
                    $tbl->addCol(0, 'category');
                    $tbl->addCol(1, 'actions');

                    // thead
                    $tbl->addTSection('thead');
                    $tbl->addRow();
                    // arguments: cell content, class, type (default is 'data' for td, pass 'header' for th)
                    // can include associative array of optional additional attributes
                    $tbl->addCell('Category', 'first', 'header');
                    $tbl->addCell('Actions', 'first', 'header');

                    // tfoot
                    $tbl->addTSection('tfoot');
                    $tbl->addRow();
                    // span all 3 columns
                    $tbl->addCell('', 'foot', 'data', array('colspan' => 4));

                    // tbody
                    $tbl->addTSection('tbody');


                    if (!(isset($pagenum))) {
                        $pagenum = 1;
                    }

                    //This tells us the page number of our last page
                    $last = ceil($rowcount / $page_rows);

                    //this makes sure the page number isn't below one, or more than our maximum pages
                    if ($pagenum < 1) {
                        $pagenum = 1;
                    } elseif ($pagenum > $last) {
                        $pagenum = $last;
                    }

                    //This sets the range to display in our query
                    $max = 'limit ' . ($pagenum - 1) * $page_rows . ',' . $page_rows;

                    //This is your query again, the same one... the only difference is we add $max into it
                    $data_p = mysqli_query($db, $getcatsql . $max) or die(mysql_error());

                    while ($row = mysqli_fetch_array($data_p)) {
                        $id = $row['id'];
                        $ctgry = $row['category'];
                        $actions = "<a href='category_handler.php?delid=" . $id . "' method='post'><button class=\"ui-state-default ui-corner-all\" title=\"delete record\" onclick=\"deleteRecord($recId)\"><span class=\"ui-icon ui-icon-trash\"></span></button></a>";


                        $tbl->addRow();
                        $tbl->addCell($ctgry, 'cat');
                        $tbl->addCell($actions, 'actions');
                    }

                    echo $tbl->display();
                    echo "<br>";

                    $html = '';
                    $current_page = $pagenum;

                    if ($current_page != 1) {
                        $html .= '<a class="first" title="First" href="category.php?pagenum=1">&laquo;</a>';
                        $previousPageNumber = $current_page - 1;
                        $previousPage = "category.php?pagenum=" . $previousPageNumber;
                        $html .= '<a class="first" title="Previous" href=' . $previousPage . '>Previous</a>';
                    } else {
                        $html .= '<span class="disabled first" title="First">&laquo;</span>';
                        $html .= '<span class="disabled first" title="Previous">Previous</span>';
                    }
                    for ($i = 1; $i <= $last; $i++) {
                        if ($i != $current_page) {
                            $pageNumber = "category.php?pagenum=" . $i;
                            $html .= '<a title="' . $i . '" href=' . $pageNumber . '>' . $i . '</a>';
                        } else {
                            $html .= '<span class="current">' . $i . '</span>';
                        }
                    }
                    if ($current_page != $last) {
                        $nextPageNumber = $current_page + 1;
                        $nextPage = "category.php?pagenum=" . $nextPageNumber;
                        $html .= '<a class="next" title="Next" href=' . $nextPage . '>Next</a>';
                        $lastPage = "category.php?pagenum=" . $last;
                        $html .= '<a class="last" title="Last" href=' . $lastPage . '>&raquo;</a>';
                    } else {
                        $html .= '<span class="disabled next" title="Next">Next</span>';
                        $html .= '<span class="disabled last" title="Last">&raquo;</span>';
                    }
                    echo '<div class="pagination">' . $html . '</div>';
                } else {
                    $tbl = new HTML_Table('', 'demoTbl', 0);

                    $tbl->addCaption('Categories', 'cap', array('id' => 'tblCap'));

                    $tbl->addColgroup();
                    // span, class
                    $tbl->addCol(0, 'category');
                    $tbl->addCol(1, 'actions');

                    // thead
                    $tbl->addTSection('thead');
                    $tbl->addRow();
                    // arguments: cell content, class, type (default is 'data' for td, pass 'header' for th)
                    // can include associative array of optional additional attributes
                    $tbl->addCell('Category', 'first', 'header');
                    $tbl->addCell('Actions', 'first', 'header');

                    $tbl->addTSection('tbody');
                    $tbl->addRow();
                    // span all 3 columns
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
