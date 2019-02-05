<?php
include_once('lock.php');
if (file_exists(INSTALL)) {
    //header("Location: INSTALL/install.php");
}
?>


<html>
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

    <div id="content">
        <div id="header-h2">Expense Management</div>
        <div class="col-sm-12">
            <div class="row" style="padding-left: 20px">
                <div class="col-sm-5">
                    <form action="#">
                        <div class="form-group">
                            <input type="date" class="form-control" id="date" placeholder="Date">
                        </div>
                        <div class="form-group">
                            <input type="text" class="form-control" id="desc" placeholder="Description">
                        </div>
                        <div class="form-group">
                            <select class="form-control" id="category">
                                <option>1</option>
                                <option>2</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <input type="text" class="form-control" id="amount" placeholder="Amount">
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn btn-primary">Submit</button>
                            <button type="submit" class="btn btn-secondary">Cancel</button>
                        </div>
                    </form>
                </div>
                <div class="col-sm-7">data</div>
            </div>
        </div>
    </div>
    <?php include("footer.php"); ?>
</div>
</body>

</html>