<?php
include_once('lock.php');
include_once('plugins/gChart.php');

$piChartd = new gBarChart(550, 100, 'g', 'v');
$piChartd->addDataSet(array(12, 34, 22, 43));
//$piChartd->setLabels(array('test1', 'test2', 'test3', 'test4',));
$piChartd->setColors(array("363636", "11ff11", "22aacc", "3333aa", "C0C0C0"));
?>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>expense tracker | Home</title>
    <link rel="stylesheet" href="css/style.css" type="text/css" media="screen"/>
    <link type="text/css" href="scripts/jquery/css/smoothness/jquery-ui-1.10.3.custom.css" rel="stylesheet"/>
    <script type="text/javascript" src="scripts/jquery/js/jquery-1.9.1.js"></script>
    <script type="text/javascript" src="scripts/jquery/js/jquery-ui-1.10.3.custom.js"></script>
</head>

<body>
<div id="container">
    <?php include("header.php"); ?>
    <?php include("menu.php"); ?>

    <div id="content">
        <div id="main_content">
            <div style="text-align: center">
                <h2>exTracker Dashboard</h2>

                <!--<div style="width: 580px; margin-top: 70px" class="ui-widget-content ui-corner-all">
                    <h3 style="padding: 5px; margin-top: 0; text-align: left; padding-left: 30px;"
                        class="ui-widget-header ui-corner-all">Expense Trends - August</h3>
                    <img src="<?php print $piChartd->getUrl(); ?>"/>
                    </p>
                </div>
                <div style="width: 580px; margin-top: 20px" class="ui-widget-content ui-corner-all">
                    <h3 style="padding: 5px; margin-top: 0; text-align: left; padding-left: 30px;"
                        class="ui-widget-header ui-corner-all">Expense Trends - 2013</h3>
                    <img src="<?php print $piChartd->getUrl(); ?>"/>
                    </p>
                </div>-->
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
