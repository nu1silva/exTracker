<?php
/* Pagination Class - http://coursesweb.net/php-mysql/ */
class Pagination
{
    /* EDIT data in this array if you want to paginate content stored in a MySQL table
     Add your data for connecting to MySQL database (MySQL server, user, password, database name) */
    protected $mysql = array(
        'host' => 'localhost',
        'user' => 'root',
        'pass' => 'password',
        'dbname' => 'database_name'
    );
    public $table = 'pgtest'; // HERE add the mysql table name

    // properties
    public $rowsperpage = 10; // number of articles displayed in the page
    public $txtchr = 800; // maximum numbers of characters for article (if paginate text-content)
    public $txtpieces = 0; // number of pieces to divide text (if paginate text-content)
    public $range = 3; // range number of links around the current
    protected $conn = false; // will store the mysql connection
    protected $idpage = 0; // the index of the current page
    protected $totalpages = 0; // number of total pages
    protected $pag; // to store the name of the file ($_SERVER['PHP_SELF'])


    // Constructor
    public function __construct()
    {
        // sets the properties: $pag, and $idpage (integer, positive)
        $this->pag = $_SERVER['PHP_SELF'];
        $this->idpage = isset($_GET['pg']) ? intval(abs($_GET['pg'] - 1)) : 0;
    }

    // method to set the mysql connection
    public function setConn()
    {
        // if it connects successfully to MySQL database, store the connection in the $conn property
        if ($conn = new mysqli($this->mysql['host'], $this->mysql['user'], $this->mysql['pass'], $this->mysql['dbname'])) {
            $sql = "SET NAMES 'utf8'";
            if ($conn->query($sql)) $this->conn = $conn;
        }
        return $this->conn;
    }

    // Select the rows for the current page from the mysql table. Returns a string with HTML code
    public function getMysqlRows()
    {
        $this->setConn(); // calls the setConn() method to set the MySQL connection
        $startrow = $this->idpage * $this->rowsperpage; // the row from which start to select the content
        $re_cnt = ''; // the variable that will be returned

        // if there is a connection to MySQL
        if ($this - conn !== false) {
            // SELECT to set the total number of pages ($totalpages)
            $sql = "SELECT COUNT(*) FROM `$this->table`";

            // perform the query, then Selects the rows
            if ($resql = $this->conn->query($sql)) {
                // if the $resql contains at least one row, takes and sets $totalpages
                if ($resql->num_rows > 0) {
                    $row = $resql->fetch_row();
                    $this->totalpages = ceil($row[0] / $this->rowsperpage);

                    // Define the SELECT to get the rows for the current page
                    $sql = "SELECT * FROM `$this->table` LIMIT $startrow, $this->rowsperpage";
                    if ($resql = $this->conn->query($sql)) {
                        // if the $resql contains at least one row
                        if ($resql->num_rows > 0) {
                            // EDIT THE NAME OF COLUMNS AND FORMAT THE DATA WITH HTML TAGS AS YOU WHISH
                            while ($row = $resql->fetch_assoc()) {
                                $re_cnt .= '<h3>' . $row['title'] . '</h3>' . $row['id'] . '<div class="content">' . $row['content'] . '</div>';
                            }
                        } else $re_cnt .= '0 results';
                    } else $re_cnt .= '0 results in the table';
                }
            } else $re_cnt .= 'Error: ' . $this->conn->error;

            $this->conn->close();
        } else $re_cnt .= 'No connection to MySQL table' . mysqli_connect_error();

        return $re_cnt;
    }

    // receives an Arry with the content for all pages. Returns the content for the current page
    public function getArrRows($arr)
    {
        $startrow = $this->idpage * $this->rowsperpage; // the element from which start to select
        $ar_page = array_slice($arr, $startrow, $this->rowsperpage); // gets the elements for current page
        $nre = count($ar_page);
        $this->totalpages = ceil(count($arr) / $this->rowsperpage); // sets the total number of pages
        $re_cnt = ''; // the variable that will be returned

        // HERE ADDS HTML TAGS TO FORMAT THE ZONE THAT CONTAINS EACH ELEMENT
        for ($i = 0; $i < $nre; $i++) {
            $re_cnt .= '<div class="content">' . $ar_page[$i] . '</div>';
        }

        return $re_cnt;
    }

    // method to split the text into number of characters (specified in the $txtchr property) without breaking words
    public function getText($text)
    {
        // if the $txtpieces higher than 0, divide the $text into a number of pieces specified in $txtpieces
        // otherwise, split the text according to the number of characters specified in $txtchr property
        if ($this->txtpieces > 0) {
            $this->txtchr = ceil(strlen($text) / $this->txtpieces); // set $txtchr (length of text piece) according to number of pieces
        }

        // split the text and create an Array with string pieces. Returns the content for the current page
        $newtext = wordwrap($text, $this->txtchr, '#|#');
        $ar_text = explode('#|#', $newtext);
        $nr_pieces = count($ar_text);

        // if paginate by number of pieces, and too many pieces - merge the last two pieces
        if ($this->txtpieces > 0 && $nr_pieces > $this->txtpieces) {
            $ar_text[$nr_pieces - 2] .= ' ' . $ar_text[$nr_pieces - 1];
            unset($ar_text[$nr_pieces - 1]);
        }

        $this->totalpages = count($ar_text); // sets the number of total pages
        if ($this->idpage > $this->totalpages) $this->idpage = $this->totalpages;

        // sets a string to be added at the end of the text content, if not the last page.
        $end = ($this->idpage + 1) < $this->totalpages ? ' ...[<i> Continue to next page</i>].' : '';

        return $ar_text[$this->idpage] . $end;
    }

    // method that sets the links
    public function getLinks()
    {
        $re_links = ''; // the variable that will contein the links and will be returned
        $currentpage = $this->idpage + 1; // because the page index starts from 0, adds 1 to set the current page
        $pag_get = '?pg='; // the name for the GET value added in URL

        // if $totalpages>0 and totalpages higher or equal to $currentpage
        if ($this->totalpages > 0 && $this->totalpages >= $currentpage) {
            // linksto first and previous page, if it isn't the first page
            if ($currentpage > 1) {
                // show << for link to 1st page
                $re_links .= ' <a href="' . $this->pag . '" title="Link 1">First &lt;&lt;</a> &nbsp; ';

                $prevpage = $currentpage - 1; // the number of the previous page
                // show < for link to previous page, if higher then 1
                if ($prevpage > 1) $re_links .= ' <a href="' . $this->pag . $pag_get . $prevpage . '" title="Link ' . $prevpage . '">Previous &lt;</a> &nbsp;';
            }

            // sets the links in the range of the current page
            for ($x = ($currentpage - $this->range); $x <= ($currentpage + $this->range); $x++) {
                // if it's a number between 0 and last page
                if (($x > 0) && ($x <= $this->totalpages)) {
                    // if it's the number of current page, show the number without link, otherwise add link
                    if ($x == $currentpage) $re_links .= ' [<b>' . $x . '</b>] ';
                    else $re_links .= ' <a href="' . $this->pag . $pag_get . $x . '" title="Link ' . $x . '">' . $x . '</a> ';
                }
            }

            // If the current page is not final, adds link to next and last page
            if ($currentpage != $this->totalpages) {
                $nextpage = $currentpage + 1;
                // show > for next page (if higher then $this->range and less then totalpages)
                if ($nextpage > $this->range && $nextpage < $this->totalpages) $re_links .= '&nbsp; <a href="' . $this->pag . $pag_get . $nextpage . '" title="Link ' . $nextpage . '">&gt; Next</a> ';
                //  show >> for last page, if higher than $this->range
                if ($this->totalpages > $this->range) $re_links .= ' &nbsp; <a href="' . $this->pag . $pag_get . $this->totalpages . '" title="Link ' . $this->totalpages . '">&gt;&gt; Last (' . $this->totalpages . ')</a> ';
            }
        }

        // adds all links into a DIV and return it
        if (strlen($re_links) > 1) $re_links = '<div class="linkspg">' . $re_links . '</div>';
        return $re_links;
    }
}

?>