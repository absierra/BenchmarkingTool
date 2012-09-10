<?php

function isFee($description){
    switch ($description) {
        case 'Charges for Services':
        case 'Net Sales':
        case 'Permits and Licenses':
        case 'Rental Income':
        case 'From Other Agencies':
        case 'Charges to Other Funds':
            return true;
    }
    return false;
}

$year = WebApplication::get('year') ? WebApplication::get('year') : 2009;

$filename = 'Cache/budget/sankey'.md5('all', true).'.json';


$years       = array();
$div_years   = array();

//$query = 'year:\''.$year.'\'';
$query = "";
$results = Data::search('BudgetData', $query);

function line(&$years, $year, $source, $target, $amount, $connection, $added=false, $depth) {
    if (!$target) {
        $target = "nil";
    }
    if (!isset($years[$year][$source])) {
        $years[$year][$source] = array('value'=>0, 'out'=>array());
    }
    if (!isset($years[$year][$target])) {
        $years[$year][$target] = array('value'=>0, 'out'=>array());
    }

    if (!isset($years[$year][$source]['out'][$target])) {
        $years[$year][$source]['out'][$target] = 0;
    }

    $years[$year][$source]['out'][$target] += $amount;
    if ($added == false) {
        $years[$year][$source]['value'] += $amount;
        $years[$year][$source]['depth'] = $depth;
        $years[$year][$source]['connection'] = $connection;
    }
}

foreach($results as $item){
    $year         = $item->get('year');
    $amount       = (float)$item->get('amount');
    $ledger_type  = (float)$item->get('ledger_type');
    $superfund    = $item->get('superfund');
    $fund         = $item->get('superfund_fund');
    $department   = $item->get('department');
    $division     = $item->get('department_division');
    $expense_type = $item->get('ledger_type_ledger_description');

    if ($item->get('ledger_type') === 'Revenue') {
        line($years, $year, $expense_type, $superfund, $amount, 'revenue', false, 0);
        line($years, $year, $expense_type, $fund, $amount, 'revenue', true, 0);
    }

    if ($item->get('ledger_type') === 'Expense') {

        line($years, $year, $superfund, $department, $amount, 'superfund', false, 1);
        line($years, $year, $superfund, $division, $amount, 'superfund', true, 1);
        line($years, $year, $superfund, $fund, $amount, 'superfund', true, 1);

        line($years, $year, $fund, $department, $amount, 'fund', false, 1);
        line($years, $year, $fund, $division, $amount, 'fund', true, 1);

        line($years, $year, $department, $expense_type, $amount, 'department', false, 2);
        line($years, $year, $department, $division, $amount, 'department', true, 2);

        line($years, $year, $division, $expense_type, $amount, 'division', false, 2);

        //$years[$year][$department]['value'] += $amount;
        $years[$year][$expense_type]['value'] += $amount;
        $years[$year][$expense_type]['connection'] = 'expense';
        $years[$year][$expense_type]['depth'] = '3';

        //line($div_years, $year, $superfund, $fund, $amount);
        //line($div_years, $year, $fund, $division, $amount,'');
        //node($div_years, $year, $department, $ledger_description, $amount);
    }

}


$renderer->assign('data', json_encode($years));
