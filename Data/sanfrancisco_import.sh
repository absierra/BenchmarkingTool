#!/bin/sh
mongoimport -d sanfranciscobudgets -c budget -f "year,superfund,fund,superfund_fund,department,division,department_division,ledger_type,ledger_description,ledger_type_ledger_description,amount" --type csv sanfrancisco_budgets.csv
mongoimport -d sanfranciscobudgets -c employees -f "year,superfund,fund,department,division,title,fte,salary" --type csv sanfrancisco_ftebudget.csv