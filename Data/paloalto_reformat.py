import csv

budget_file = csv.reader(open("budgets.csv","r"))
budget = csv.writer(open("budgetNew.csv","wb"))

titles = ['year', 'fund1', 'fund2', 'fund3', 'fund4', 'fund5', 
          'dept1', 'dept2', 'dept3', 'dept4', 'dept5', 'ledger1', 
          'ledger2', 'ledger3', 'ledger4', 'ledger5', 'amount']

#----------------------
#Given the title, will return the column index:
title_to_index = {}

for index, title in enumerate(titles):
    title_to_index[title] = index
#-----------------------    


#-----------------------
#skip first line in budget.csv

budget_file.next()
#-----------------------
s = 'Motor Vehicle In-Lieu Tax'
#for each line in budget.csv, place data it it's new columns
for line in budget_file:
    #fill into new column format
    new_line = [line[0],line[1],line[2],'','','',line[3],line[4],line[5],line[6],line[7],line[8],line[9],line[10],'','',line[11]]
    #grab ledger1 value, adjust for possible formatting discrepancies
    ledger1_val = new_line[title_to_index['ledger1']].lower().strip()
    ledger2_val = new_line[title_to_index['ledger2']]
    ledger3_val = new_line[title_to_index['ledger3']]

    if(ledger1_val == 'transfers in'):
        ledger1_val = 'revenue'

        new_line[title_to_index['ledger2']] = 'Transfers In'
        new_line[title_to_index['ledger3']] = ledger2_val
        new_line[title_to_index['ledger4']] = ledger3_val

    if(ledger1_val == 'transfers out'):
        ledger1_val = 'expense'

        new_line[title_to_index['ledger2']] = 'Transfers Out'
        new_line[title_to_index['ledger3']] = ledger2_val
        new_line[title_to_index['ledger4']] = ledger3_val



    if(ledger1_val == 'expense'):
        new_line[title_to_index['ledger1']] = 'Expenses'
    elif(ledger1_val == 'revenue'):
        new_line[title_to_index['ledger1']] = 'Revenues'
        new_line[title_to_index['ledger4']] = new_line[title_to_index['ledger3']];
        new_line[title_to_index['ledger3']] = new_line[title_to_index['ledger2']]

        #Tax/Non Tax Section
        ledger2_val = new_line[title_to_index['ledger2']].lower().strip()
        if(ledger2_val == 'documentary transfer tax' or ledger2_val == 'property taxes' or
           ledger2_val == 'sales taxes' or ledger2_val == 'transient occupancy tax' or ledger2_val == 'utility users tax'):
            new_line[title_to_index['ledger2']] = 'Taxes'
        else:
            new_line[title_to_index['ledger2']] = 'Non-Taxes'

        #Check Edge Case
        ledger2_val = new_line[title_to_index['ledger2']].lower().strip()
        ledger3_val = new_line[title_to_index['ledger3']].lower().strip()
        ledger4_val = new_line[title_to_index['ledger4']].lower().strip()
        if(ledger2_val == 'non-taxes' and ledger3_val == 'other taxes and fines' and ledger4_val == 'motor vehicle in-lieu tax'):
            new_line[title_to_index['ledger2']] = 'Taxes'
    budget.writerow(new_line)
