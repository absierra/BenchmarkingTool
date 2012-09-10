#!/bin/sh
mongoimport -d walnutcreekbudgets -c budget -f "year,superfund,fund,superfund_fund,department,division,department_division,ledger_type,ledger_description,ledger_type_ledger_description,amount" --type csv walnutcreek_budgets.csv
mongoimport -d walnutcreekbudgets -c employees -f "year,superfund,fund,department,division,title,fte,salary" --type csv walnutcreek_ftebudget.csv
