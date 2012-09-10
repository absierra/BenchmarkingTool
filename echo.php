<?php
    header('Content-Type: application/force-download');
    header('Content-disposition: attachment; filename=transparency_export.csv');

    echo urldecode($_REQUEST['csvdata']);
