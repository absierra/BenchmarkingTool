<?php
include 'mongoWrapper.php';

header( 'Content-Type', 'application/json' );

try {
  $collection = null;
  $db = null;
  $city = null;
  
  /*Replace with a set of valid cities*/
  if ( in_array($_POST['City'],array("Adelanto","Salinas")) )
    $city = $_POST['City'];
  else
    throw new Exception( 'Invalid city name' );
  if ( $_POST['db'] == 'SCOData')
    $db = $_POST['db'];
  else
    throw new Exception( 'Invalid db name' );
  if ( in_array($_POST['collection'],array("SCOBudgets","metrics")) )
    $collection = $_POST['collection'];
  else
    throw new Exception( 'Invalid collection name' );

  $dw = new DatabaseWrapper(new Mongo(), $db, $collection);

  $additional = array();
  foreach( array_keys( $_POST ) as $k ) {
    if ( $k != 'collection' && $k != 'method' && $k != 'id' ) {
      $additional[$k] = $_POST[$k];
    }
  }

  switch( $_POST['method'] ) {
    case 'getCity':
      echo json_encode( $dw->getCity( $city ) );
      break;
    case 'getMetrics':
      print json_encode( $dw->getCityMetrics( $city ) );
      break;
    case 'getAll':
      //print json_encode( $dw->getAll( $additional ) );
      echo json_encode( $dw->getAll(array()) );
      break;
    case 'insert':
      print json_encode( $dw->insert( $additional ) );
      break;
    case 'update':
      $dw->update( $newid, $additional );
      print json_encode( true );
      break;
    case 'delete':
      $dw->delete( $_POST['id'] );
      print json_encode( true );
      break;
    default:
      throw new Exception( 'Unknown method' );
      break;
  }

} catch ( Exception $e ) {
  print json_encode( array( 'error' => $e->getMessage() ) );
}
?>
