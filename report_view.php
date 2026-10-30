<?php
// Category breakdown (pie chart + table) for one date range.
// Pages using this must load scripts/chartjs/chart.umd.min.js and css/report.css.
require_once(__DIR__ . '/lock.php');
require_once(__DIR__ . '/plugins/html_table.class.php');

function render_category_report($db, $userId, $title, $from, $to, $chartId)
{
    $rows = getCategoryTotalsBetween($db, $userId, $from, $to);

    echo '<h3>' . h($title) . '</h3>';

    if (!$rows) {
        echo "<b>No Data to Display</b>";
        return;
    }

    $total = array_sum(array_column($rows, 'total'));
    $chart = array(
        'labels' => array_column($rows, 'category'),
        'values' => array_map('floatval', array_column($rows, 'total')),
    );

    echo '<div style="position: relative; width: 420px; height: 240px;"><canvas id="' . h($chartId) . '"></canvas></div>';
    echo '<script type="text/javascript">renderPieChart('
        . json_encode($chartId) . ', '
        . json_encode($chart, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT)
        . ');</script>';
    echo '<br>';

    $tbl = new HTML_Table('', 'demoTbl', 0);
    $tbl->addCaption('Category Breakdown', 'cap', array('id' => 'tblCap'));
    $tbl->addColgroup();
    // span, class
    $tbl->addCol(0, 'percentage');
    $tbl->addCol(1, 'category');
    $tbl->addCol(2, 'amount');

    $tbl->addTSection('thead');
    $tbl->addRow();
    $tbl->addCell('Percentage', 'first', 'header');
    $tbl->addCell('Category', 'first', 'header');
    $tbl->addCell('Expenses (Rs)', 'first', 'header');

    $tbl->addTSection('tfoot');
    $tbl->addRow();
    $tbl->addCell('Total', 'per');
    $tbl->addCell('', 'cat');
    $tbl->addCell(number_format($total, 2), 'amt');

    $tbl->addTSection('tbody');
    foreach ($rows as $row) {
        $tbl->addRow();
        $tbl->addCell(number_format($row['total'] / $total * 100, 2) . '%', 'per');
        $tbl->addCell(h($row['category']), 'cat');
        $tbl->addCell(number_format($row['total'], 2), 'amt');
    }
    echo $tbl->display();
}
