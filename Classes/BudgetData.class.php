<?php
    class BudgetData extends MongoData {
        public static $fields = array(
            'year',
            'fund1',
            'fund2'
        );

        public static $name = 'budget';

        function __construct($id = null, $field = null) {
            $this->database = 'pa_budget_data';
            $this->tableName = self::$name;
            parent::__construct($id, $field);
        }
    }
?>
