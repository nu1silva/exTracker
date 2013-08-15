<?php

class Pagination
{

//    private $num_pages = 1;
//    private $start = 0;
//    private $display;
//    private $start_display;
//
//    function __construct($query, $display = 10)
//    {
//        if (!empty($query)) {
//            $this->display = $display;
//            if (isset($_GET['display']) && is_numeric($_GET['display'])) $this->display = (int)$_GET['display'];
//            if (isset($_GET['np']) && is_numeric($_GET['np']) && $_GET['np'] > 0) {
//                $this->num_pages = (int)$_GET['np'];
//            } else {
//                if (is_numeric($query)) {
//                    $num_records = $query;
//                } else {
//                    $result = db_query($query);
//                    if ($result->num_rows > 1 || strstr($query, 'COUNT') === false) {
//                        $num_records = $result->num_rows;
//                    } else {
//                        $row = $result->fetch_row();
//                        $num_records = $row[0];
//                    }
//                }
//                if ($num_records > $this->display) $this->num_pages = ceil($num_records / $this->display);
//            }
//            if (isset($_GET['s']) && is_numeric($_GET['s']) && $_GET['s'] > 0) $this->start = (int)$_GET['s'];
//            $this->start_display = " LIMIT {$this->start}, {$this->display}";
//        }
//    }
//
//    public function display($split = 5)
//    {
//        global $page;
//        $html = '';
//        if ($this->num_pages <= 1) return $html;
//        // $page->link('pagination.css');
//        $url = $page->url('add', '', 'np', $this->num_pages);
//        $current_page = ($this->start / $this->display) + 1;
//        $begin = $current_page - $split;
//        $end = $current_page + $split;
//        if ($begin < 1) {
//            $begin = 1;
//            $end = $split * 2;
//        }
//        if ($end > $this->num_pages) {
//            $end = $this->num_pages;
//            $begin = $end - ($split * 2);
//            $begin++; // add one so that we get double the split at the end
//            if ($begin < 1) $begin = 1;
//        }
//        if ($current_page != 1) {
//            $html .= '<a class="first" title="First" href="' . $page->url('add', $url, 's', 0) . '">&laquo;</a>';
//            $html .= '<a class="prev" title="Previous" href="' . $page->url('add', $url, 's', $this->start - $this->display) . '">Previous</a>';
//        } else {
//            $html .= '<span class="disabled first" title="First">&laquo;</span>';
//            $html .= '<span class="disabled prev" title="Previous">Previous</span>';
//        }
//        for ($i = $begin; $i <= $end; $i++) {
//            if ($i != $current_page) {
//                $html .= '<a title="' . $i . '" href="' . $page->url('add', $url, 's', ($this->display * ($i - 1))) . '">' . $i . '</a>';
//            } else {
//                $html .= '<span class="current">' . $i . '</span>';
//            }
//        }
//        if ($current_page != $this->num_pages) {
//            $html .= '<a class="next" title="Next" href="' . $page->url('add', $url, 's', $this->start + $this->display) . '">Next</a>';
//            $last = ($this->num_pages * $this->display) - $this->display;
//            $html .= '<a class="last" title="Last" href="' . $page->url('add', $url, 's', $last) . '">&raquo;</a>';
//        } else {
//            $html .= '<span class="disabled next" title="Next">Next</span>';
//            $html .= '<span class="disabled last" title="Last">&raquo;</span>';
//        }
//        return '<div class="pagination">' . $html . '</div>';
//    }
//
//    public function limit()
//    {
//        return $this->start_display;
//    }

    public function diaplayPagination($pagenum, $last)
    {

        $html = '';
        $current_page = $pagenum;

        if ($current_page != 1) {
            $html .= '<a class="first" title="First" href="expenses.php?pagenum=1">&laquo;</a>';
            $previous = $current_page - 1;
            $html .= '<a class="first" title="Previous" href="expenses.php?pagenum=$previous">Previous</a>';
        } else {
            $html .= '<span class="disabled first" title="First">&laquo;</span>';
            $html .= '<span class="disabled first" title="Previous">Previous</span>';
        }
        for ($i = 1; $i <= $last; $i++) {
            if ($i != $current_page) {
                $html .= '<a title="' . $i . '" href="expenses.php?pagenum=$i">' . $i . '</a>';
            } else {
                $html .= '<span class="current">' . $i . '</span>';
            }
        }
        if ($current_page != $last) {
            $next = $current_page + 1;
            $html .= '<a class="next" title="Next" href="expenses.php?pagenum=$next">Next</a>';
            $html .= '<a class="last" title="Last" href="expenses.php?pagenum=$last">&raquo;</a>';
        } else {
            $html .= '<span class="disabled next" title="Next">Next</span>';
            $html .= '<span class="disabled last" title="Last">&raquo;</span>';
        }

        return '<div class="pagination">' . $html . '</div>';
    }

}

?>