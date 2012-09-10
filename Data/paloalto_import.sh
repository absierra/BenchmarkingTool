#!/bin/sh
mongo pabudgets --eval "db.dropDatabase()"

mongoimport -d pabudgets -c budget -f "year,fund1,fund2,fund3,fund4,fund5,dept1,dept2,dept3,dept4,dept5,ledger1,ledger2,ledger3,ledger4,ledger5,amount" --type csv paloalto_budgets.csv
mongoimport -d pabudgets -c employees -f "year,fund1,fund2,dept1,dept2,dept3,dept4,dept5,title,fte,salary" --type csv paloalto_ftebudget.csv
