
<?php
class DatabaseWrapper {
  private $connect;
  private $db;
  
  public function __construct( $connect, $db, $collection ) {
    $this->connect = $connect;
    $this->db = $this->connect->{$db};
    $this->collection = $this->db->{$collection};
  }
  
  public function getCollection() {
    $coll = $this->collection->find();
    $dataArr = array();
    foreach ($coll as $data) {
      $dataArr[$data["CityName"]] = $data;
    }
    return $dataArr;
  }

  public function getCityMetrics($cityName) {
    $metrics = $this->collection->findOne(array( $cityName => array( '$exists' => true ) ) );
    return $metrics;
  }

  public function getCityNames() {
    $names = $this->collection->find(array(),array("CityName" => 1));
    //$nameArr = "{ \"Cities\": [";
    $nameArr = array();
    foreach ($names as $elem) {
      //$nameArr .= json_encode($elem);
      $nameArr[] = $elem;
    }
    return $nameArr;
    //return $nameArr."}";
  }

  public function getCity($cityName) {
    $elem = $this->collection->findOne(array( "CityName" => $cityName ));
    return $elem;
  }

  public function get( $id ) {
    $mID = new MongoId($id);
    $elem = $this->collection->findOne(array( "_id" => $mID ));
    return $elem;
  }

  public function getAll( $options = array() ) {
    $elems = $this->collection->find();
    foreach ($elems as $elem) {
      return $elem;
    }
  }

  public function delete( $id ) {
    $sql = 'DELETE FROM '.$this->table.' WHERE id = :id';
    $sth = $this->db->prepare($sql);
    $sth->execute(array(':id' => $id));
  }

  public function update( $id, $values ) {
    $binds = array( ':id' => $id );
    $bindnames = array();

    foreach(array_keys($values) as $k) {
      $k = $this->clean( $k );
      $binds[ ":$k" ] = $values[ $k ];
      $bindnames []= "$k=:$k";
    }

    $bindnames = join( $bindnames, ',' );

    $sql = 'UPDATE '.$this->table." SET $bindnames WHERE id=:id";

    $sth = $this->db->prepare($sql);

    $sth->execute( $binds );
  }

  public function insert( $values ) {
    $keys = array();
    $binds = array();
    $bindnames = array();

    foreach(array_keys($values) as $k) {
      $k = $this->clean( $k );
      $keys []= $k;
      $binds[ ":$k" ] = $values[ $k ];
      $bindnames []= ":$k";
    }

    $keys = join( $keys, ',' );
    $bindnames = join( $bindnames, ',' );

    $sql = 'INSERT INTO '.$this->table." ( $keys ) VALUES ( $bindnames )";

    $sth = $this->db->prepare($sql);

    $sth->execute( $binds );

    return $this->db->lastInsertId();
  }

  private function clean( $k ) {
    return preg_replace( '[^A-Za-z0-9_]', '', $k );
  }
}
?>
