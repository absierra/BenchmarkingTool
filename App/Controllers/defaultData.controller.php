<?php

require 'mongoWrapper.php';

$db = 'SCOData';
$collection = 'SCOBudgets';
$mon = new Mongo();

$dw = new DatabaseWrapper($mon, $db, $collection);
//$renderer->assign( 'cities',json_encode( $dw->getCity("Adelanto") ) );
$renderer->assign( 'cities',json_encode($dw->getCityNames()) );
//$renderer->assign( 'defaultDepartments',json_encode($dw->getCity("Adelanto")) );
$renderer->assign( 'SCOBudgets',json_encode($dw->getCollection()) );

$collection = 'Metrics';
$dw = new DatabaseWrapper($mon, $db, $collection);
$renderer->assign( 'SCOMetrics',json_encode($dw->getCollection()) );

$collection = 'benchmarkDataOrganized';
$dw = new DatabaseWrapper($mon, $db, $collection);
$renderer->assign('SCOBenchmarks',json_encode($dw->getCollection()) );

?>
