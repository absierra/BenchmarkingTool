(function (B, window, document) {
    "use strict";
    var lastTooltip = false;
    B.Title = new window.Class({
        initialize: function (container) {
            this.container = container;
            this.attachEvents();
        },

        update: function (enabledBreakdown, selectedNodes, selected) {
            var html = getTitle(enabledBreakdown, selectedNodes, selected);
            this.container.set('html', html);
        },

        attachEvents: function () {
            this.tooltip = document.getElement('tooltip');

            var tooltip;
            this.container.addEvent('mouseover:relay(.has_tooltip)', function () {
                tooltip = showTooltip(
                    tooltip,
                    this.getAttribute('alt'),
                    this.getPosition().x,
                    this.getPosition().y,
                    this.getWidth()
                );
            });

            this.container.addEvent('mouseleave:relay(.has_tooltip)', function () {
                hideTooltip(tooltip);
            });
        }
    });

    // takes an array of strings and makes a nice human-readable list,
    // according to English grammatical standards
    function readableList(array) {
        var list = '',
            lastItem;
        switch (array.length) {
            case 0:
                return '';

            case 1:
                return array[0];
            case 2:
                return array[0] + ' and ' + array[1];

            default:
                lastItem = array.pop();
                array.each(function (item) {
                    list += item + ', ';
                });
                list += 'and ' + lastItem;
                array.push(lastItem);
                return list;
        }
    }

    function titleItemList(originalTree, rootName, useParens, numToShow)
    {
        switch (rootName)
        {
            case 'All Departments':
                var collapseSuffix = 'Departments';
                break;
            case 'All Funds':
                var collapseSuffix = 'Funds';
                break;
            case 'Expenses':
                var collapseSuffix = 'Expense Types';
                break;
            case 'Revenues':
                var collapseSuffix = 'Revenue Types';
                break;
            case 'JobTypes':
                var collapseSuffix = 'Job Types';
                break;
        }
        
        // this snippet is required to filter out Revenues when we're in Expenses and vice versa
        var tree = _.filter(originalTree, function(treeItem){
        	if(rootName == 'Revenues' || rootName == 'Expenses'){
            	return (treeItem[(treeItem.length - 1)][1] === rootName);
            }else{
            	return true;
            }
        });
                
        var itemListText = '';
        // if the thing that's checked isn't just the absolute root (and let's make sure that there's something in the tree in the first place)
        if (tree.length > 0 && tree[0][0][1] !== rootName && tree[0][0][1] !== 'Internal Services Funds')
        {
            var itemList = new Array();
            var i = 0;
            for (i = 0; i < (numToShow > 0 ? (numToShow + 1 < tree.length ? numToShow + 1 : tree.length) : tree.length); i++)
            {
                if (numToShow > 0 && i == numToShow && tree.length > numToShow + 1)
                {
                    var ancestry = '';
                    var j = 0;
                    for (j = 1; j < tree.length; j++)
                    {
                        var k = 0;
                        ancestry += '<li>';
                        for (k = tree[j].length - 2; k >= 1; k--)
                        {
                            ancestry += (tree[0][1][1] == 'Internal Services Funds' ? 'Internal Services Funds > ' : '') + tree[j][k][1] + ' > ';
                        }
                        ancestry += (tree[0][1][1] == 'Internal Services Funds' ? 'Internal Services Funds > ' : '') + tree[j][0][1] + '</li>';
                    }
                    
                    itemList.push('<span id=\'title_' + collapseSuffix.replace(' ', '') + '_more\' class=\'title_item has_tooltip\' alt=\'' + ancestry.replace("'", "&#39;") + '\'>' + (tree.length - numToShow) + ' others</span>');
                }
                else
                {
                    var item = tree[i];
                    var ancestry = '';
                    var j = 0;
                    for (j = item.length - 2; j >= 1; j--)
                    {
                        ancestry += item[j][1] + ' > ';
                    }
                    if (item[1][1] !== rootName)
                    {
                        ancestry += item[0][1];
                    }
                    itemList.push('<span id=\'title_' + item[0][0] + '\' class=\'title_item' + (ancestry.length > 0 ? ' has_tooltip' : '') + '\'' + (ancestry.length > 0 ? ' alt=\'' + (tree[0][1][1] == 'Internal Services Funds' ? 'Internal Services Funds > ' : '') + ancestry.replace("'", "&#39;") + '\'' : '') + '>' + item[0][1] + '</span>');
                }
            }
                        
            itemListText += readableList(itemList);
            if (useParens)
            {
                itemListText = '(' + itemListText + ')';
            }
        }
        else if (tree.length > 0 && tree[0][0][1] === 'Internal Services Funds')
        {
        	if(useParens){
        		itemListText = '(Internal Services Funds)';
        	}else{
        		itemListText = 'Internal Services Funds';
        	}
        }
        else if (!useParens)
        {	
        	
            itemListText = rootName;
        }
        
        return itemListText;
    }
    
    function ledgerType(selected)
    {
        return selected.Ledger[0][(selected.Ledger[0].length - 1)][1];
    }

    function getTitle(focusedTree, selectedNodes, selected) {
        var breakdown = focusedTree;
        
        if (_.isEmpty(selected.Funds) || _.isEmpty(selected.Departments) || _.isEmpty(selected.Ledger))
            return;
            
        var title = '' + breakdown;
        switch (breakdown) {
            case 'fundBreakdown':
                title = ledgerType(selected) + ' ' + titleItemList(selected.Ledger, ledgerType(selected), true, 1) + ' for<br> ';
                
                title += titleItemList(selected.Departments, 'All Departments', false, 1) + ',<br> ';
                
                title += 'broken down by Fund ' + titleItemList(selected.Funds, 'All Funds', true, 1);
                
                break;
            case 'departmentBreakdown':
                title = ledgerType(selected) + ' ' + titleItemList(selected.Ledger, ledgerType(selected), true, 1) + (ledgerType(selected) == 'Revenues' ? ' to ' : ' out of ') + '<br> ';
                
                title += titleItemList(selected.Funds, 'All Funds', false, 1) + ',<br> ';
                
                title += 'broken down by Department ' + titleItemList(selected.Departments, 'All Departments', true, 1);
                
                break;
            case 'expenseBreakdown':
                title = titleItemList(selected.Departments, 'All Departments', false, 1) + ' spending<br> ';
                
                title += 'out of ' + titleItemList(selected.Funds, 'All Funds', false, 1) + ',<br> ';
                
                title += 'broken down by Expense Type ' + titleItemList(selected.Ledger, 'Expenses', true, 1);
                break;
            case 'revenueBreakdown':
                title = 'Revenues flowing to ' + titleItemList(selected.Departments, 'All Departments', false, 1) + '<br> ';
                
                title += 'through ' + titleItemList(selected.Funds, 'All Funds', false, 1) + ',<br> ';
                
                title += 'broken down by Revenue Type ' + titleItemList(selected.Ledger, 'Revenues', true, 1);
                break;
            case 'expVsRevBreakdown':
                title = 'Expenses ' + titleItemList(selected.Ledger, 'Expenses', true, 1) + ' vs. Revenues ' + titleItemList(selected.Ledger, 'Revenues', true, 1) + '<br> ';
                
                title += 'for ' + titleItemList(selected.Departments, 'All Departments', false, 1) + ',<br> ';
                
                title += 'through ' + titleItemList(selected.Funds, 'All Funds', false, 1);
                break;
            case 'fteDepartment':
                title = 'Full-Time Equivalents<br> ';

                title += 'by Department ' + titleItemList(selected.Departments, 'All Departments', true, 1) + '<br>';
                title += '&nbsp;';
                break;
            case 'fteJob':
                title = 'Full-Time Equivalents<br> ';
                
                title += 'by Job Type<br>';
                
                title += 'for ' + titleItemList(selected.Departments, 'All Departments', false, 1);
                break;
            case 'salaryJobAverage':
                title = 'Average Salary<br> ';
                
                title += 'by Job Type<br> ';
                
                title += 'for ' + titleItemList(selected.Departments, 'All Departments', false, 1);
                break;
            case 'salaryJob':
                title = 'Total Salary<br> ';
                
                title += 'by Job Type<br> ';
                
                title += 'for ' + titleItemList(selected.Departments, 'All Departments', false, 1);
                
                break;
        }
        hideTooltip(lastTooltip);
        return title;
    }

    function showTooltip(tooltip, text, itemX, itemY, itemWidth) //style, WTF?!?!
    {
        if (tooltip == null)
        {
            // create the tooltip element
            tooltip = new Element('ul', {id: 'titleTooltip'}).inject(document.getElement('body'), 'top');
        }

        // if we have more than X items, we need to do a "and (total-X) more", even in the tooltip! This is to prevent breaking. At that point, the user can just freaking look at their selected filters.
        var maxTooltipItems = 17;
        var tooltipItems = text.split('</li><li>');
        if (tooltipItems.length > maxTooltipItems)
        {
            var andXmore = tooltipItems.length - maxTooltipItems + 1;
            tooltipItems[0].replace('<li>', '');
            tooltipItems[(tooltipItems.length - 1)].replace('</li>', '');
            while (tooltipItems.length > maxTooltipItems - 1)
            {
                tooltipItems.pop();
            }
            tooltipItems.push('...and ' + andXmore + ' more');
            var text = '<li>' + tooltipItems.join('</li><li>') + '</li>';
        }

        tooltip.set('html', text);
        tooltip.setStyles({
            display: 'block'
        });

        var tooltipAdjust = tooltip.getWidth() / 2 - itemWidth / 2;

        tooltip.setStyles({
            top: itemY + 25,
            left: itemX - tooltipAdjust 
        });

      var tooltipArrow = new Element('div', {'class': 'tooltipArrow'});
      tooltipArrow.inject((tooltip), 'top');

      lastTooltip = tooltip;

      return tooltip;
    }

    function hideTooltip(tooltip) {
      tooltip && tooltip.set('style', 'display: none');
    }

}(DelphiBudget, window, document));
