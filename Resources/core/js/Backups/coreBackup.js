(function (window, document) {
    'use strict';

    // Our application namespace
    var B = window.DelphiBudget = window.DelphiBudget || {};

    // Localize any globals we're using. This helps lint tools, minifiers,
    // optimizers, and my brain
    var Element = window.Element,
        _       = window._,
        pythia  = window.pythia;

    // The *main* entry point on page load
    B.main = function () {
        route();
        var thisPage = new URI(window.location);
        var onIndexPage
            = thisPage.parsed.directory
                === "/" && thisPage.parsed.file === "";
        if (!onIndexPage)
            return;
        var loadChain = new Chain;
        loadChain.chain(
            function () {B.budget = JSON.parse(B.budget)},
            createElements,
            attachEvents,
            function () {
                if (window.location.hash || window.location.href.split('?')[1]) {
                    processHash();
                } else {
                    removeTransfers();
                    special.fundBreakdown.implicitCheck();
                    B.checkEmpty(true);
                }
            },
            function () {
                _.invoke(nodes, 'updateDomCheckState');
                _.invoke(nodes, 'updateDomEnableState');
            }
        );

        (function callLoadChain() {
            if (false !== loadChain.callChain()) {
                callLoadChain.delay(1);
            }
        }());
    };

    function route() {
        if ((window.location.pathname != '/incompatible_browser')
            && (Browser.ie6 || Browser.ie7)
            || ((window.location.pathname == '/') 
                && (!Browser.ie8 && (!pythia && !pythia.svgSupported())))) {
                window.location = '/incompatible_browser';
        }
    }
    var Overlay = new window.Class({
        Implements : [Options, Events],
        closeItems : [],
        selected : false,
        initialize : function(element, options){
            this.overlay = document.id(element);
            this.overlay.addEvent('click', function(){
                this.hide();
                this.closeItems.each(function(item){
                    item.close();
                    item.setDeselected();
                });
            }.bind(this));
            this.hide();
        },
        hide : function(callback){
            this.overlay.setStyle('z-index', -1);
        },
        show : function(callback){
            this.overlay.setStyle('z-index', 10);
        },
        setSelected : function(item){
            if(this.selected && this.selected != item){
                this.selected.close();
                this.selected.setDeselected();
            }
            item.open();
            this.selected = item;
        },
        addCloseItem : function(item){
            this.closeItems.push(item);
        }
    });
    document.addEvent('domready', function(){
        B.Overlay = new Overlay(document.id('overlay'), {});
    });

    // Create the dropdowns from the budget data and grab important DOM
    // elements we will use frequently
    function createElements() {
        buttonContainer = document.id('graphButtons');
        tableContainer  = document.id('table');
        graphAndLegend = document.id('graphAndLegend');

        info   = B.info   = new B.Info();
        notes  = B.notes  = new B.Notes();
        title  = B.title  = new B.Title(document.id('graphTitle'));
        legend = B.legend = new B.Legend();
        graph  = B.graph  = new B.Graph();

        msd = B.msd = new B.MultiSelectDropdown(document.id('dropdowns'), {
            singleDrop:1, text:'Filter'
        });

        // Create the dropdowns
        createBreakdownDropdown();

        var i = 0;
        // Dropdowns built from line data
        _.each(B.budget.hierarchy, function (nodes, id) {
            var text = i++ === 0 ? 'With the following filters...' : '';
            var dropdown = dataDropdowns[id] = msd.Dropdown(id, text);

            fillHierarchy(dropdown, nodes);
        });
        msd.fireEvent('load');

        // is there some reason we don't use new?
        transfersCheckbox = Element('span', {
            'class':'transfersCheckbox emptyCheck transfers'});

        var transfersLi = Element('li', {id: 'transfersLi'}),
            transfersLabel = Element('span', {'html':'Include&nbsp;transfers', "class":"transfersLabel"}),
            transfersHelpIcon = Element('span', {'html':'(?)', "class":"helpIcon"});

        transfersLi.append(
            transfersCheckbox,
            transfersLabel,
            transfersHelpIcon

        );
        transfersLi.inject(msd.dropdowns.Ledger.childContainer, 'top');
        transfersHelpIcon.addEvents({
            mouseenter: function() {
                ToolTip.instance(this, {
                    position: {position: 'bottom', edge: 'bottom', 'offset': {y: -22, x: 0}}
                }, new Element('div').adopt(
                new Element('em[html="Transfers represent dollars moved from one fund to another."]')
                )).show();
            },
            mouseleave: function(){
                 toolTip.options.hideDelay = 0;
                 toolTip.options.autohide = true;
            }
        });
    }

    function createBreakdownDropdown() {
        var options = {
            exclusive: 1,
            uncheck: 1,
            noexpand: 1,
            title: 0
        };

        var dropdown = msd.Dropdown('Breakdowns', 'Show me...', {});

        breakdownNode('fundBreakdown', 'Funds');
        breakdownNode('departmentBreakdown', 'Departments');

        breakdownNode('expenseBreakdown', 'Expenses');
        breakdownNode('revenueBreakdown', 'Revenues');
        breakdownNode('expVsRevBreakdown', 'Expenses vs Revenues');

        breakdownNode('fteDepartment'   , 'Full-Time Equivalents<br>by Department');
        breakdownNode('fteJob'          , 'Full-Time Equivalents<br>by Job Type');
        breakdownNode('salaryJobAverage', 'Average Salaries<br>by Job Type');
        breakdownNode('salaryJob'       , 'Total Salaries<br>by Job Type');

        function breakdownNode(id, text) {
            // Create and add this node to the list of special nodes.
            // This may be completely unecessary now.
            var node = special[id] = nodes[id] = dropdown.Node(id, text, options);

            // Flag this node as a breakdown node
            node.breakdown = id;

            node.enabled = true;
            node.updateDomEnableState();

            return node;
        }
    }

    // Recursively iterate over the budget hieararchy and fill in the dropdowns
    function fillHierarchy(mother, children) {
        _.each(children, function (attr, id) {
            var node,
                children = attr.ch;

            if (attr.id === 'InternalServices') {
                attr.noexpand  = true;
                attr.exclusive = true;
                nodes[id] = node = msd.dropdowns.Funds.Node(id, B.budget.nodes[id], attr);
            } else {
                if (attr.id === 'AllFunds') {
                    attr.exclusive = true;
                }
                nodes[id] = node = mother.Node(id, B.budget.nodes[id], attr);
            }

            node.source = B.budget.sources[B.budget.nodeSource[id]];

            node.links = B.budget.links[id];

            // TODO treat these as always enabled for now
            node.noaggregate = attr.noaggregate;

            if (node.noexpand) {
                node.expand.addClass('disabled');
            }

            if (attr.id) {
                node.element.addClass('special' + attr.id);
                node.name = attr.id;
                special[attr.id] = node;
                node.special = true;

                if (node.noaggregate) {
                    node.uncheck();
                }
            }

            if (transfers[attr.id]) {
                transfers[attr.id] = node;
            }

            if (children && !empty(children)) {
                fillHierarchy(node, children);
            }
        });
    }

    function getAvailableGraphTypes() {
        switch (currentBreakdown) {
            case 'expVsRevBreakdown':
                return ['lineButton', 'tableButton'];

            case 'fteDepartment':
                return ['pieButton', 'tableButton'];

            case 'salaryJob':
            case 'salaryJobAverage':
            case 'fteJob':
                return ['tableButton'];
        }

        return graphTypes;
    }

    B.getAvailableGraphTypes = getAvailableGraphTypes;


    function mouseOutOnEverything() {
        function out(children) {
            _.each(children, function (c) {
                if (c._mousedOver || c._legendOver) {
                    if (c.hasClass('data')) {
                        c.invoke('mouseout');
                        c.invoke('legendOut');
                    }
                }
                out(c._children);
            });
        }
        out(graph.canvas._children);
    }

    // Handle click events on graph elements by expanding the element into its
    // child componenents if possible
    B.drill = function (id) {
        B.deleteToolTip();
        var node = nodes[id];

        // Clear all checked items in this tree
        //_.invoke(node.dropdown.children,'implicitUncheck', true);
        node.explicitTextClick();
    }

    function selectGraph(graphType, data) {
        // Kill the scheduled graph render
        if (selectGraph.frame)
            pythia.cancelFrame.call(window, selectGraph.frame);

        // Schedule a grpah render
        selectGraph.frame = pythia.reqFrame.call(window, function () {
            selectGraphReal(graphType, data);
            selectGraph.frame = false;
        });

    }

    // Select the current graph and feed it our data
    function selectGraphReal(graphType, data) {
        var imgButton = document.id('imgButton');

        B.data = data;

        if (_.size(data) === 0) {
            graph.graph &&
                graph.graph.clear();
            buttonContainer.hide();
            legend.container.hide();
            title.container.hide();
            graph.slider.hide();
            tableContainer.hide();

            return;
        }
        legend.container.show();
        buttonContainer.show();
        title.container.show();


        graph.slider.hide();

        graph.currentGraph = graphType;
        // Render the table
        if (graphType === 'tableButton') {
            imgButton.hide();
            graphAndLegend.hide();
            tableContainer.show();

            renderTable(data);
        } else { // Or Render the graph
            imgButton.show();
            graphAndLegend.show();
            tableContainer.hide();

            graph.update(
                data,
                numberFormat,
                shortNumberFormat,
                yearOrder,
                graphType
            );

            legend.fill(data, nodes);
        }

        // Hilight the current graph icon
        buttonContainer.getElements('.active').removeClass('active');
        document.id(graph.currentGraph).addClass('active');

        var selectedWithParents = {};
        var selectedNodes = {};

        _.each(dataDropdowns, function (dropdown, id) {
            selectedWithParents[id] = [];
            selectedNodes[id] = [];

            var nodes = getRoots(dropdown.allNodes);
            _.each(nodes, function (node) {
                if (!(node.mother && node.mother.checked) &&
                      node.affectsData()) {
                    var subtree  = [];
                    subtree.push([node.id, node.text]);

                    var parent = node;

                    var activeCount = 0;
                    var soleChild;

                    if (!parent.mother.mother){
                       for (var child in node.children){
                          if (node.children[child].enabled){
                             soleChild = [node.children[child].id, node.children[child].text];
                             activeCount++;
                          }
                       }
                       if (activeCount == 1){
                          subtree.push(soleChild);
                       }
                    }

                    while (parent.mother.mother) {
                        parent = parent.mother;
                        subtree.push([parent.id, parent.text]);
                    }

                    selectedWithParents[id].push(subtree);
                    selectedNodes[id].push(node);
                }
            });
        });

        title.update(currentBreakdown, selectedNodes, selectedWithParents);
        notes.update(currentBreakdown, selectedNodes, selectedWithParents);


        updateHash();

        //email fields
        var emailFields = document.id('emailField');
        var emailCityField = document.id('emailCityField');
        emailFields.setProperty('href', 'mailto:?subject=Check out this graph from the City of Palo Alto\'s Budget&body='+document.id('graphTitle').get('text').replace('  ',' ')+':%0D%0A'+encodeURIComponent(window.location.toString()));
        emailCityField.setProperty('href', 'mailto:webfeedback@cityofpaloalto.org?subject=I have a question about the Palo Alto budget&body=To Whom It May Concern:%0D%0A%0D%0AI was looking at '+document.id('graphTitle').get('text').replace('  ',' ')+'( '+encodeURIComponent(window.location.toString())+' )%2C and I wanted to get some clarification.');
        //el.set('st_url', window.location.toString());
        //el.set('st_title', document.id('graphTitle').get('text'));
        resize();
        resize();
    }

    B.selectGraph = selectGraph;

    B.updateData = function () {
        var oldData = {};

        Object.each(B.data, function (d) {
            oldData[d.id] = d;
        });

        yearsUsed = {};
        var data = [];
        legend.expanded = {};

        var nodesToGraph;

        if (dataSource.nodes === special.jobTypes.children) {
            nodesToGraph = dataSource.nodes;
        } else {
            nodesToGraph = shouldGraph(dataSource.nodes);
        }

        _.each(nodesToGraph, function (node) {
            var color = oldData[node.id] && oldData[node.id].color;
            var line = B.buildDataLine(node, color);
            line && data.push(line);
        });

        data         = B.sortDataByAverage(data);
        B.fixYears(data);
        var graphType    = B.chooseGraphType(data);

        selectGraph(graphType, data);
    }

    B.chooseGraphType = function (data) {
        var graphType = graph.currentGraph;

        var negativeData = B.hasNegativeData(data);
        var available = getAvailableGraphTypes();
        _.each(graphTypes, function (g) {
            document.id(g).removeClass('enabled');
        });

        _.each(available, function (g) {
            document.id(g).addClass('enabled');
        });

        if (yearOrder.length === 1) {
            if (multiYearGraphs.contains(graphType)) {
                graphType = 'pieButton';
            }

            _.each(multiYearGraphs, function (g) {
                document.id(g).removeClass('enabled');
            });
        }

        if (negativeData) {
            //graphType = 'lineButton';
            if (positiveGraphs.contains(graphType)) {
                graphType = 'lineButton';
                info.update(null, null, 'negativeData');
            }
            _.each(positiveGraphs, function (g) {
                document.id(g).removeClass('enabled');
            });
        }

        if (negativeData && yearOrder.length === 1) {
            graphType = 'tableButton';
        }

        if (!document.id(graphType).hasClass('enabled')) {
            graphType = available[0];
        }

        return graphType;
    }

    B.hasNegativeData = function (data) {
        return _.any(data, function (d) {
            return _.any(d.years, function (amount, year) {
                return amount < 0;
            });
        });
    }

    B.sortDataByAverage = function (data) {
        data = _.sortBy(data, function (d) {
            var count = 0,
                sum = 0;
            _.each(d.years, function (amount, year) {
                if (!_.isNaN(amount)) {
                    sum += amount;
                }
                count += 1;
            });
            d.average = (sum / count);
            d.sum = sum;
            return -d.average;
        });

        _.each(data, function (d) {
          if (d.color === -1) {
            d.color = colors[(currentColor++ % colors.length)];
          }
        });

        return data;
    }

    B.fixYears = function (data) {
        yearOrder = _.keys(yearsUsed).sort();
        _.each(data, function (line) {
            line.sortedYears = [];
            _.each(yearOrder, function (year) {
                if (!line.years[year]) {
                    line.years[year] = 0;
                }
                line.sortedYears.push(line.years[year]);
            });
        });
    }

    B.buildDataLine = function (node, color) {
        color = color || -1;//colors[((++currentColor) % colors.length)];

        var counted = {},
            dataLine = {
                name:  node.text,
                id:    node.id,
                years: {},
                counts: {},
                fte: {},
                color: color
            };


        readData(node, dataLine);

        // if all values are 0 return null
        if (_.all(dataLine.years, function (y) { return y === 0; })) {
            return null;
        }

        return dataLine;

        function readData(node) {
            //TODO: this won't be able to handle more than three columns
            if (!node.affectsData())
                return;
            _.each(B.budget.links[node.id], function (next, link) {
                if (nodes[link].affectsData()) {
                    _.each(next, function (key, link) {
                        if (!counted[key]) {
                            if (nodes[link].affectsData()) {
                                var years = B.budget.lines[key];

                                _.each(years, function (v, year) {
                                    if (_.isUndefined(dataLine.years[year])) {
                                        dataLine.years[year] = 0;
                                        dataLine.counts[year] = 0;
                                        dataLine.fte[year]    = 0;
                                    }
                                    if (v[dataSource.aggregate]) {
                                        dataLine.years[year] += v[dataSource.aggregate];
                                        dataLine.counts[year]++;
                                        yearsUsed[year] = 1;

                                        if (dataSource.aggregate === 'salary') {
                                            dataLine.fte[year] += v['fte'];
                                        }
                                    }
                                })
                            }
                        }
                        counted[key] = 1;
                    });
                }
            });
            _.each(node.children, function (node) {
                  readData(node, dataLine);
            });
            if (dataSource.average) {
                _.each(dataLine.years, function (amount,y) {
                    dataLine.years[y] = amount / dataLine.fte[y];
                });
            }
        }
    }


    function empty(obj) {
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    }

    var hash = '';
    function updateHash() {
        var newHash = graph.currentGraph + '/';

        newHash += transfersCheckbox.hasClass('fullCheck') ? 1 : 0;
        newHash += '/';

        // Grab the ids of all the root nodes for each dropdown
        var minimalSelection = {};
        _.each(msd.dropdowns, function (dropdown) {
            var roots = getRoots(dropdown.allNodes);
            minimalSelection[dropdown.id] =
                _.pluck(roots, 'id').join(',');
        });

        newHash += _.values(minimalSelection).join(',');

        if (hash !== newHash) {
            window.location.hash = newHash;
            hash = newHash;
        }

        var url = window.location.toString();
        url = url.replace('#', '?')
        $$('.share').each(function (el) {
            el.set('st_url', url);
            el.set('st_title', document.id('graphTitle').get('text'));
        });
    }

    function reloadPage() {
        var newHash = window.location.hash.slice(1);
        if (newHash !== hash) {
            window.location.reload();
        }
    }

    //TODO friendlier hash validation and error message
    //     perhaps leading back to the default selection
    function processHash() {
        B.deleteToolTip();

        if (window.location.hash) {
            var newHash = window.location.hash.slice(1);
        } else {
            newHash = window.location.href.split('?')[1];
        }
        if (!newHash) {
            return;
        }
        var breakdown;
        if (newHash !== hash) {
            hash = newHash;

            var parts = newHash.split('/');

            if (parts.length !== 3)
                return false;

            var graphType = parts[0],
                transfers = parts[1],
                ids       = parts[2].split(',');

            // Uncheck all nodes
            _.each(msd.dropdowns, function (drop) {
                _.invoke(drop.allNodes, 'explicitUncheck');
            });

            if (transfers === '1') {
                addTransfers();
            } else {
                removeTransfers();
            }

            //Check all the nodes in the hash
            _.each(ids, function (id) {
                var node;

                if (id && nodes[id]) {
                    node = nodes[id];
                    if (nodes[id].breakdown) {
                        breakdown = nodes[id];
                    }
                } else if (node = special[id]) {
                    if (node.breakdown) {
                        breakdown = node;
                    }
                }

                if (node)
                    node.explicitCheck();
            });

            breakdown = breakdown || special.fundBreakdown;

            graph.currentGraph = graphType;
            breakdown.fireEvent('checkClick');

            return true;
        }
    }

    //This function is cringeWorthy
    function resize(evt) {
        var headerDim    = document.id('header').getComputedSize();
        var titleDim     = title.container.getComputedSize();
        var controlsDim  = document.id('controls').getComputedSize();
        var visualize = document.id('visualize');
        var fudge = 50;

        var minWidth    = 550;
        var minHeight   = 200;
        var minLogoTop  = 480;
        var minLogoLeft = 640;

        var legendsDim  = legend.container.getComputedSize();
        var winWidth = window.getSize().x;
        var width  = winWidth - (legendsDim.totalWidth + 75);
        var scrollSize = window.getScrollSize();
        width = width < minWidth ? minWidth : width;
        legend.container.setStyle('left', width + 20 + 'px');

        var windowDim    = window.getSize();

        var height =
            windowDim.y             -
            fudge                   -
            headerDim.totalHeight   -
            controlsDim.totalHeight -
            titleDim.totalHeight;

        resize.height = height;

        if (graph.currentGraph === 'pieButton') {
           height -= 50;
        }



        var bottomRight = document.id('bottomRight');
        // Position the logo
        var logoTop  = scrollSize.y - 33 - 15;
        var logoLeft = scrollSize.x - 250;

        if (logoTop < minLogoTop) {
            bottomRight.setStyle('top', minLogoTop);
            bottomRight.setStyle('bottom', 'auto');
        } else {
            bottomRight.setStyle('bottom', 15);
            bottomRight.setStyle('top', 'auto');
        }

        if (logoLeft < minLogoLeft) {
            bottomRight.setStyle('left', minLogoLeft);
            bottomRight.setStyle('right', 'auto');
        } else {
            bottomRight.setStyle('right', 15);
            bottomRight.setStyle('left', 'auto');
        }

        height = height < minHeight ? minHeight : height;

        // Set table styles
        var tableBody    = document.id('tableBody');
        if (graph.currentGraph === 'tableButton' && tableBody) {
            var tableElement = document.id('tableElement');
            var tableHead    = document.id('tableHead');
            var tableFoot    = document.id('tableFoot');
            var tableBodyTd = tableBody.getElements('tr td');

            var headerRow = tableHead.getElements('th');
            var footerRow = tableFoot.getElements('th');
            var firstRow = tableBody.getChildren('tr')[0];

            tableBody.setStyle('padding-right','0'); // reset padding-right

            tableBody.setStyle('width',firstRow.getSize().x);
            var tableBodyWidth = tableBody.getSize().x;

            firstRow.getChildren('td').each(function(cell, index) {
                headerRow[index].setStyle('width', cell.getStyle('width'));
                footerRow[index].setStyle('width', cell.getStyle('width'));
            });

            document.id('table').setStyle('width', tableBodyWidth);

            tableHead.setStyle('width', tableBodyWidth);
            tableFoot.setStyle('width', tableBodyWidth);
            tableBody.setStyle('height', height - 130);

            var tableDisplayHeight = tableBody.getSize().y;
            var tableScrollHeight = tableBody.getScrollSize().y;

            // Browser Adjustments for Scrollbar
            if ((Browser.firefox) && (tableDisplayHeight < tableScrollHeight)) {
                tableBody.setStyle('padding-right','15px');
            } else if (((Browser.ie7 || Browser.ie8) || Browser.ie9) && (tableDisplayHeight < tableScrollHeight)) {
                tableBody.getElements('.tbody-last-child').setStyle('padding-right','45px'); // Sets the last td rather the tbody
            } else {
                tableBody.setStyle('padding-right','9px');
            }

            if (tableDisplayHeight === tableScrollHeight){
                tableFoot.setStyle('margin-top', tableBodyTd[tableBodyTd.length - 1].getPosition(tableBody).y + tableHead.getSize().y*2);
            }else tableFoot.setStyle('margin-top', tableDisplayHeight + tableHead.getSize().y);
        }

        // Set info box width
        var infoBox = document.id('info');
        var infoBoxWidth = infoBox.getSize().x / 2;
        var infoBoxLeft = winWidth / 2 - infoBoxWidth;
        infoBox.setStyle('margin-left', infoBoxLeft);

        // Set title width
        if (graph.currentGraph === 'tableButton') {
            visualize.setStyle('width', '100%');
            visualize.setStyle('margin', '0 auto');
            title.container.setStyle('margin', '0 0 0 0px');
        } else if (graph.currentGraph === 'pieButton') {
            visualize.setStyle('width', width);
            visualize.setStyle('margin', '0 0 0 0');
            title.container.setStyle('margin', '0 0 0 0px');
        } else {
            visualize.setStyle('margin', '0 0 0 0px');
            //title.container.setStyle('margin', '0 0 0 80px');
            visualize.setStyle('width', width);
        }

        B.resizeDropdown();

        if (width && height)
            graph.size([width, height]);
    }

    B.resize = resize;

    B.resizeDropdown = function () {
       var height = resize.height;

       var allHeights = [];
       _.each(msd.dropdowns, function (drop) {
           allHeights.push(drop.childContainer.getScrollSize().y);
       });

       var tallestDropDownHeight = _.max(allHeights) - 15;

       var dropDownHeight = Math.min(height, tallestDropDownHeight) - 5;

        if (!dropDownHeight) dropDownHeight = 0;

       // Don't use negative height values
       dropDownHeight = Math.max(dropDownHeight, 0);

       _.each(msd.dropdowns, function (drop) {
           drop.childContainer.setStyle('height', dropDownHeight);
       });
    }


    function setBreakdown(breakdown) {
        oldBreakdown = currentBreakdown;
        currentBreakdown = breakdown;

        //Most common breakdown settings
        dataSource.aggregate = 'amount';
        dataSource.average   = false;
        numberFormat         = currencyFormat;
        shortNumberFormat    = shortCurrencyFormat;

        if (employeeBreakdowns[currentBreakdown] && !employeeBreakdowns[oldBreakdown]) {
            setEmployeeBreakdown();
            B.inspectMotherFlush();
        } else if (employeeBreakdowns[currentBreakdown]) {
            special.Revenues.implicitUncheck();
            _.invoke(msd.dropdowns.Funds.children, 'implicitCheck');
            special.Expenses.implicitUncheck();
            special.jobTypes.implicitCheck();
            B.inspectMotherFlush();
        }

        // Breakdown specific settings
        switch (breakdown) {
            case 'fundBreakdown':
                setFinancialBreakdown();
                if(oldBreakdown == 'expVsRevBreakdown'){
                	special.Revenues.implicitUncheck();
                	if (!special.Expenses.anyCheck()) {
                	    special.Expenses.implicitCheck();
                	}
                }
                dataSource.nodes = dataDropdowns.Funds.allNodes;
                break;
            case 'departmentBreakdown':
                setFinancialBreakdown();
                if(oldBreakdown == 'expVsRevBreakdown'){
                	special.Revenues.implicitUncheck();
                	if (!special.Expenses.anyCheck()) {
                	    special.Expenses.implicitCheck();
                	}
                }
                dataSource.nodes = dataDropdowns.Departments.allNodes;
                break;

            case 'expenseBreakdown':
                setFinancialBreakdown();

                special.Revenues.implicitUncheck()
                                .hideCompletely();
                // Check all expenses if no expenses are checked
                if (!special.Expenses.anyCheck()) {
                    special.Expenses.implicitCheck();
                }

                dataSource.nodes = dataDropdowns.Ledger.allNodes;
                break;

            case 'revenueBreakdown':
                setFinancialBreakdown();

                special.Expenses.implicitUncheck()
                                .hideCompletely();

                // Check all revenues if no revenues are checked
                if (!special.Revenues.anyCheck())
                    special.Revenues.implicitCheck();

                dataSource.nodes = dataDropdowns.Ledger.allNodes;

                break;

            case 'expVsRevBreakdown':
                setFinancialBreakdown();

                special.Expenses.makeCheckbox();
                special.Revenues.makeCheckbox();

                special.Expenses.implicitCheck();
                special.Taxes.implicitUncheck();
                special['Non-Taxes'].explicitCheck();

                dataSource.nodes = dataDropdowns.Ledger.allNodes;
                break;

            case 'fteDepartment':
                numberFormat      = fteFormat;
                shortNumberFormat = shortFteFormat;
                dataSource.aggregate = 'fte';

                dataSource.nodes = dataDropdowns.Departments.allNodes;
                break;

            case 'fteJob':
                numberFormat      = fteFormat;
                shortNumberFormat = shortFteFormat;
                dataSource.aggregate = 'fte';

                dataSource.nodes = special.jobTypes.children;
                break;

            case 'salaryJob':
                dataSource.aggregate = 'salary';

                dataSource.nodes = special.jobTypes.children;
                break;

            case 'salaryJobAverage':
                dataSource.average = true;
                dataSource.aggregate = 'salary';

                dataSource.nodes = special.jobTypes.children;
                break;
        }

        B.inspectMotherFlush();
    }
    function setFinancialBreakdown() { //the problem is there is no 'from', only 'to'
        special.AllFunds.makeRadioButton();
        special.InternalServices.makeRadioButton();
        var last = special.last;
        special.last = false;

        if (!special.Expenses.anyCheck() && !special.Revenues.anyCheck()) {
            special.Expenses.implicitCheck();
        }

        if(special.expVsRevBreakdown.anyCheck()){
            special.last = 'expVsRevBreakdown';
        }
        if(last == 'expVsRevBreakdown'){
            special.Expenses.implicitCheck();
            special.Revenues.implicitUncheck();
        }
        // Check all funds if neither all funds or internal services is checked
        if (!special.AllFunds.anyCheck()
              && !special.InternalServices.anyCheck()) {

            special.AllFunds.toggleExplicitCheckClick();
        }

        // Check all funds if both all funds and internal services are checked
        if (special.AllFunds.anyCheck()
              && special.InternalServices.anyCheck()) {

            special.AllFunds.toggleExplicitCheckClick();
        }

        // this is a compression of the above
        /*if (special.AllFunds.anyCheck() == special.InternalServices.anyCheck()){
            special.AllFunds.toggleExplicitCheckClick();
        }*/

        // Check all funds if both all funds and internal services are checked
        if (special.AllFunds.anyCheck()) {
            special.AllFunds.showCompletely();
        }
        if (special.InternalServices.anyCheck()) {
            special.InternalServices.showCompletely();
        }

        /*var fundsSlide = msd.drops.Funds.childContainer.set('reveal', {
            mode:'vertical',
            duration:300,
            onComplete: function () {
                B.resizeDropdown();
            }
        });
        var ledgerSlide = msd.dropdowns.Ledger.childContainer.set('reveal',{
            mode:'vertical',
            duration:300,
            onComplete: function () {
                B.resizeDropdown();
            }
        });*/

        msd.dropdowns.Departments.label.set('text', '');
        msd.dropdowns.Funds.childContainer.show();
        msd.dropdowns.Ledger.childContainer.show();

        //fundsSlide.reveal();
        //ledgerSlide.reveal();
        msd.fireEvent('alter');

        msd.dropdowns.Funds.label.set('text', 'With the following filters...');

        special.jobTypes.implicitUncheck();

        special.Expenses.makeRadioButton()
                        .showCompletely();

        special.Revenues.makeRadioButton()
                        .showCompletely();

        // the next two if blocks are a workaround. It has to do with loading
        // from a hash, which doesn't properly set the "exclusive" attribute
        // before we start checking stuff specified in the hash, which means
        // that it doesn't collapse/hide the radios that aren't selected
        if (!special.Revenues.checked && !special.Revenues.partialChecked)
            special.Revenues.hide();

        if (!special.Expenses.checked && !special.Expenses.partialChecked)
            special.Expenses.hide();
    }

    function setEmployeeBreakdown() {
        special.AllFunds.makeCheckbox();
        special.InternalServices.makeCheckbox();
        special.InternalServices.implicitCheck();
        special.AllFunds.implicitCheck();

        special.Revenues.implicitUncheck();
        _.invoke(msd.dropdowns.Funds.children, 'implicitCheck');
        special.Expenses.implicitUncheck();

        special.jobTypes.implicitCheck();

        msd.dropdowns.Funds.label.set('text', '');
        msd.dropdowns.Departments.label.set('text', 'With the following filters...');

        msd.dropdowns.Funds.childContainer.hide();
        msd.dropdowns.Ledger.childContainer.hide();
        msd.fireEvent('alter');
    }

    B.sortOthers = function (dropdown) {
        return;
        var clones = [];
        var movers = [];
        var lastOptions;

        function animateNode(source, target, rel, oldPos) {
            // Forget the animation and just do an inject
            source.inject(target, rel);

            return;
        }

        function aLessThanB(a, b) {
            return a.enabled    && !b.enabled ||
                   a.anyCheck() && !b.anyCheck() ||
                   a.order      < b.order ||
                   a.text       < b.text;
        }
        B.aLessThanB = aLessThanB;

        function orderChildren(children) {
            //children.ordered = _.sortBy(children, sortValue);
            var ordered = children.slice(0);

            ordered.sort(function (a,b) {
                if (aLessThanB(a,b)) {
                    return -1;
                }
                if (aLessThanB(b,a)) {
                    return 1;
                }
                return 0;
            });

            _.each(ordered, function (sibling, i) {
                if (sibling.hidden) {
                    return;
                }

                if (i !== sibling.position && sibling.depth !== 1) {
                    sibling.position = i;

                    if (i === 0) {
                        animateNode(
                            sibling.element,
                            sibling.element.parentNode,
                            'top',
                            0,
                            0
                        );
                    } else {
                        var target = ordered[i-1];
                        animateNode(
                           sibling.element,
                           ordered[i-1].element,
                           'after',
                           target.oldPos
                        );
                    }
                }

                if (sibling.children)
                    orderChildren(sibling.children);
            });
        }

        _.each(dataDropdowns, function (drop) {
            orderChildren(drop.children);
        });
    }

    function makeNoAggregate(n) {
        n.noaggregate = 1;
        _.each(n.children, makeNoAggregate);
    }

    function makeDisabled(n) {
        n.disable();
        _.each(n.children, makeDisabled);
    }

    function makeEnabled(n) {
        if (n.children) {
            _.each(n.children, makeEnabled);
        } else {
            if (n.enablers) {
                n.enable();
            }
        }
    }

    function makeAggregate(n) {
        n.noaggregate = 0;
        _.each(n.children, makeAggregate);
    }

    function addTransfers() {
        transfersCheckbox.removeClass('emptyCheck');
        transfersCheckbox.addClass('fullCheck');

        _.each(transfers, function (t) {
            makeAggregate(t);
            makeEnabled(t);
        });

        if (special.Expenses.anyCheck()) {
            special.TransfersOut.explicitCheck();
        }

        if (special.Revenues.anyCheck()) {
            special.TransfersIn.explicitCheck();
        }


        _.invoke(transfers, 'showCompletely');
    }

    function removeTransfers() {
        transfersCheckbox.removeClass('fullCheck');
        transfersCheckbox.addClass('emptyCheck');

        _.each(transfers, function (t) {
            t.hideCompletely();
            t.explicitUncheck();
            makeDisabled(t);

            makeNoAggregate(t);
        });

        _.each(transfers, function (t, k) {
            t.inspectMother();
        });
    }

    //Attach event handles to DOM elements
    function attachEvents() {
        window.addEvent('resize', resize);

        msd.dropdowns.Ledger.element.addEvent('click:relay(.transfersCheckbox, .transfersLabel)', function () {
            if (transfersChecked) {
                transfersChecked = false;
                removeTransfers();
            } else {
                transfersChecked = true;
                addTransfers();
            }
            B.updateData();
        });

        msd.addEvent('checkClick', function () {
            this.breakdown &&
                setBreakdown(this.breakdown);

            this.toggleExplicitCheckClick();
        });

        msd.addEvent('textClick', function () {
            this.breakdown &&
                setBreakdown(this.breakdown);

            this.explicitTextClick();
        });

        buttonContainer.addEvent('click:relay(.graphButton.enabled)', function () {
            graph.currentGraph = this.get('id');
            var graphType = B.chooseGraphType(B.data);
            selectGraph(graphType, B.data);
        });

        msd.container.addEvent('mouseout:relay(.hierarchyAndApply)', function () {
            this.getParent().removeClass('dropDownHovered');
        });


        graph.container.addEvent('mouseleave', mouseOutOnEverything);

        graph.container.addEvent('mouseout', mouseOutOnEverything);
        //if (!Browser.firefox) {
        //    window.addEvent('mousemove', function () {
        //        mouseOutOnEverything();
        //    });
        //}

        var downloadButton = document.id('downloadButton');
        var downloadOptions = document.id('downloadOptions');
        document.id('downloadOptionsWrapper').setStyle('display','block');
        downloadOptions.set('slide', {mode:'horizontal', duration:300}).slide('hide');
        var downloadMenu = new new Class({
            Implements : [Options, Events],
            initialize : function(element, options){
                this.element = element;
                this.setOptions(options);
                if(this.options.button){
                    this.options.button = document.id(this.options.button);
                    this.options.button.addEvent('click', function(event){
                        if(this.opened){
                            this.close();
                            this.setDeselected();
                        }else{
                            this.open();
                            B.Overlay.setSelected(this);
                            this.setSelected();
                        }
                        event.stop();
                    }.bind(this));
                }
                B.Overlay.addCloseItem(this);
            },
            open : function(){
                this.opened = true;
                this.element.slide('in');
                B.Overlay.show();
            },
            close :function(){
                this.opened = false;
                this.element.slide('out');
                B.Overlay.hide();
            },
            toggle : function(){
                if(this.opened){
                    this.setDeselected();
                    this.close();
                }else{
                    this.setSelected();
                    this.open();
                }
            },
            setSelected : function(){
                if(this.options.button) this.options.button.addClass('active');
            },
            setDeselected : function(){
                if(this.options.button) this.options.button.removeClass('active');
            }
        })(downloadOptions, {
            button : downloadButton
        });
       /* var closeDownload = true;
        downloadButton.addEvent('click', function (event) {
            if (this.hasClass('active')) {
                this.removeClass('active');
                downloadOptions.slide('out');
            } else {
                closeDownload = false;
                this.addClass('active');
                downloadOptions.slide('in');
            }
            event.stop();
        });*/

        /*document.getElement('body').addEvent('click', function () {
            if (closeDownload && downloadButton.hasClass('active')) {
                downloadOptions.slide('hide');
                downloadButton.removeClass('active');
            }
            closeDownload = true;
        });

        // maybe unnecessary...not needed for Chrome etc., since that's done in the CSS
        document.getElement('body').addEvent('dblclick', function() {
            if(document.selection && document.selection.empty) {
                document.selection.empty();
            }
            else if(window.getSelection) {
                var sel = window.getSelection();
                sel.removeAllRanges();
            }
        });*/

        document.id('csvButton').addEvent('click', renderCSV);
        document.id('imgButton').addEvent('click', renderSVG);

        window.onhashchange = processHash;

        window.onorientationchange = resize;
        //window.onhashchange = reloadPage;

        window.addEvent('load', function() {
            resize();
        });
    }

    var isEven = function(someNumber){
        return (someNumber%2 == 0) ? true : false;
    };

    function renderTable(data) {
        tableContainer.getChildren().destroy();
        var table = new Element('table', {id: 'tableElement'});
        var thead = new Element('thead', {id: 'tableHead'});
        var header = new Element('tr');
        var totalYears = yearOrder.length;

        table.append(thead);
        thead.append(
            header.append(
                new Element('th', {'html':'&nbsp;'})));

        var j = 1; // counter for th's
        _.each(yearOrder, function (year) {
            var th = new Element('th', {'text': year});
            header.appendChild(th);
            if (j == totalYears) {
                th.addClass('head-last-child');
                j = 1;
            }
            j++;
        });

        var tbody = new Element('tbody', {id: 'tableBody'});
        table.appendChild(tbody);

        var totals = new Array();
        var i = 0;
        var sortedData = data.sort(function(a,b){return b.sortedYears.slice(-1)-a.sortedYears.slice(-1)});
        _.each(sortedData, function (d) {
            var j = 1; // counter for td's
            if (!isEven(i) == true) {
                var tr = new Element('tr', {'class':'odd'});
            } else {
                var tr = new Element('tr');
            }
            i++;
            tbody.appendChild(tr);
            var td = new Element('td', {'text': d.name});
            tr.appendChild(td);

            _.each(d.sortedYears, function (year, index) {
                td = new Element('td', {'html': numberFormat(year).replace('$ ', '&nbsp;&nbsp;&nbsp;&nbsp;')});
                if (j == totalYears) {
                    td.addClass('tbody-last-child');
                    j = 1;
                }
                j++;
                if (!totals[index])
                    totals[index] = 0;
                totals[index] += year;
                tr.appendChild(td);
            });
        });

        var tfoot = new Element('tfoot', {id: 'tableFoot'});
        table.append(tfoot);

        var tr = new Element('tr');
        tfoot.appendChild(tr);

        var th = new Element('th', {'text': 'TOTAL'});
        tr.appendChild(th);
        var j = 1;
        _.each(totals, function (year) {
            th = new Element('th', {'text': numberFormat(year).replace(' ', '')});
            tr.appendChild(th);
            if (j == totalYears) {
                th.addClass('foot-last-child');
                j = 1;
            }
            j++;
        });

        if(currentBreakdown == 'salaryJobAverage' || currentBreakdown == 'expVsRevBreakdown'){
        	tfoot.style.visibility = 'hidden';
        }else{
        	tfoot.style.visibility = 'visible';
        }

        tableContainer.appendChild(table);
    }

    function getRoots(nodes) {
        return _.filter(nodes, function (n) {
            if (n.mother.isDropdown && n.checked) {
                return true;
            }
            return (n.enabled && n.checked && n.mother.partialChecked);
        });
    }

    B.getRoots = getRoots;

    function shouldGraph(nodes) {
        var roots = getRoots(nodes);

        // This is a single tree
        while (roots.length === 1 && roots[0].children) {
            roots = _.filter(roots[0].children, function (n) { return n.enabled });
        }

        return roots;
    }

    function csvClean (str) {
        return '"' + str.toString().replace('"', '""') + '"';
    }

    function renderSVG() {

        var titleText = title.container.get('text');

        /*
        //var text = graph.canvas.text("hi there", [50,-50], pythia.style({color:0xffffff}));
        //graph.canvas._r._paper.setSize(0, 0, size[0] + 100, size[1] + 1000);
        //graph.canvas._r._paper.setViewBox(0, -100, size[0], size[1]);

        //var text = graph.canvas._r._paper.text(size[0]/2, -50, titleText);
        //text.attr('fill','#F9F9F9')
        //text.attr('text-anchor','middle')
        //text.attr('font-size',16)
        */

        downloadSVG(
            document.id('graph').get('html'),
            title.container.get('html'),
            JSON.stringify(legend.state));
    }

    B.renderSVG = renderSVG;

    function renderCSV() {
        var allLines = [],
            line   = [],
            header = [''];

        _.each(yearOrder, function (year) {
            header.push(csvClean(year));
        });

        allLines.push(header.join(','));

        _.each(B.data, function (d) {
            var line = [];
            line.push(d.name);
            _.each(d.sortedYears, function (yearData) {
                line.push(csvClean(numberFormat(yearData)));
            });
            allLines.push(line.join(','));
        });

        downloadFile('transparency_data', allLines.join('\r\n'));
    }

    function downloadSVG (data, title, legendState) {
        document.id('svgdata').set('value', encodeURIComponent(data));
        document.id('svgtitle').set('value', encodeURIComponent(title));
        document.id('svglegend').set('value', legendState);
        if (graph.currentGraph === 'pieButton') {
            document.id('svgpieyear').set('value', graph.yearOrder[graph.graph.pos]);
        } else {
            document.id('svgpieyear').set('value', '');
        }
        document.id('svg').submit();
    }

    function downloadFile (filename, data) {
        document.id('csvdata').set('value', encodeURIComponent(data));
        document.id('csv').submit();
        //var a = new Element('a');
        //a.set('download', filename);
        //a.set('href', 'data:text/csv;charset=utf-8,' + escape(data));
        //a.set('style', 'display:none');
        //document.body.appendChild(a);
        //a.fireEvent('click');

        //  window.open('data:text/csv;charset=utf-8,' + escape(data));

    }



    function shortCurrencyFormat(num) {
        var abs = Math.abs(num);
        if (abs > 1e9) {
            num /= 1e9;
            num = num.toFixed(1);
            num = num + 'B';
            return num;
        }

        if (abs > 1e6) {
            num /= 1e6;
            num = num.toFixed(1);
            num = num + 'M';
            return num;
        }

        if (abs > 1e3) {
            num /= 1e3;
            num = num.toFixed(1);
            num = num + 'K';
            return num;
        }

        return num.toFixed(0);
    }

    function currencyFormat(num) {
        return num.formatCurrency();
    }

    function shortFteFormat(num) {
        return num.toFixed(1);
    }

    function fteFormat(num) {
        return num.toFixed(2);
    }

    Element.implement({'append': function () {
        _.each(arguments, function (e) {
            if (e)
                this.appendChild(e);
        }, this);
        return this;
    }});

    B.checkEmpty = function (quiet) {
        var reset = false;

        currentBreakdown = currentBreakdown || 'fundBreakdown';

        checkRevenuesVsExpenses();
        checkEmptyDropdowns();

        if (reset && !quiet) {
            info.update(null, null, 'reset');
        }

        if (reset)
            special[currentBreakdown].fireEvent('checkClick');


        return;

        // If *only* expenses or *only* revenues are checked in the Expenses Vs
        // Revenue Breakdown.  Change the breakdown to *just* Expenses or
        // *just* Revenues
        function checkRevenuesVsExpenses() {
            if (special.expVsRevBreakdown.checked) {
                if (!special.Revenues.anyCheck() && special.Expenses.anyCheck()) {
                      info.update(null, null, 'toexp');
                      special.expenseBreakdown.fireEvent('checkClick');
                }
                if (special.Revenues.anyCheck() && !special.Expenses.anyCheck()) {
                      info.update(null, null, 'torev');
                      special.revenueBreakdown.fireEvent('checkClick');
                }
            }
        }

        // Reset the default state for any dropdowns that are completely empty
        function checkEmptyDropdowns() {
            _.each(dataDropdowns, function (dropdown, id) {

                var empty = !_.any(dropdown.children, function (child) {
                    return child.anyCheck();
                });

                if (empty) {
                    if (id === 'Ledger') {
                        checkEmptyLedger();
                    } else {
                        //Other dropdowns can simply recheck all their nodes
                        _.all(dropdown.children, function (child) {
                            reset = true;
                            child.implicitCheck(true);
                            return false;
                        });
                    }
                }
            });
        }

        // The ledger dropdown is special and rechecks nodes based on breakdown
        function checkEmptyLedger() {
              switch (currentBreakdown) {
                  case 'revenueBreakdown':
                      special.Revenues.implicitCheck(true);
                      break;
                  case 'expenseBreakdown':
                      special.Expenses.implicitCheck(true);
                      break;
                  case 'fundBreakdown':
                      special.Expenses.implicitCheck(true);
                      break;
                  case 'departmentBreakdown':
                      special.Expenses.implicitCheck(true);
                      break;
                  case 'expVsRevBreakdown':
                      special.Expenses.implicitCheck(true);
                      special['Non-Taxes'].implicitCheck(true);
                      break;
                  default:
                      special.jobTypes.implicitCheck(true);
              }
              reset = true;
        }

        B.inspectMotherFlush();
    }

        // Main DOM Containers
    var buttonContainer, // graph type buttons
        tableContainer,  // the table
        graphAndLegend,

        info,
        legend,
        notes,
        title,
        graph,

        // Function to format fully expanded numbers
        numberFormat = currencyFormat,

        // Function to format shortened numbers along the y axis
        shortNumberFormat = shortCurrencyFormat,

        // Graphs that should *not* be used if we only have a single year of
        // data
        multiYearGraphs = [
            'lineButton',
            'stackedButton',
            'percentageButton'],

        // Graphs that should *not* be used if we have negative data
        positiveGraphs = [
            'pieButton',
            'stackedButton',
            'percentageButton'],

        msd, //Our multi-drop-select object

        nodes = B.nodes = {}, // All the Node objects!

        // Special named nodes we have to create special cases for
        special = B.special = {},

        // Dropdowns that contain data nodes
        dataDropdowns = {},

        dataSource = {
            nodes: [],          // The tree that appear in our breakdown
            aggregate: 'amount' // The property of the data we are graphing
        },

        yearOrder = [], // Ordering of the keys in a line of data
        yearsUsed = {},

        graphTypes = [
            'stackedButton',
            'lineButton',
            'percentageButton',
            'pieButton',
            'tableButton'
        ],

        currentBreakdown,
        oldBreakdown,

        transfers = {
            'TransfersIn':1,
            'TransfersOut':1
        },

        employeeBreakdowns = {
            'fteJob':1,
            'salaryJob':1,
            'salaryJobAverage':1,
            'fteDepartment':1
        },

        currentColor = 0,
        transfersCheckbox,
        transfersChecked,
        resizeDelayHack = true,

        colors = [ 0x5578B4
                 , 0xAB72A6
                 , 0xF3715B
                 , 0x00B039
                 , 0xF79750
                 , 0x66C190
                 , 0xA9CEEC
                 , 0xCACEC3
                 , 0xAAA7CA
                 , 0xDF8B96
                 , 0x68B3E2
                 , 0xFFDB4E
                 , 0x96D4C3
                 , 0xA7A9AC
                 , 0xBBBA59
                 , 0xE7A7CB
                ]
    ;
}(window, document));

document.addEvent('domready', DelphiBudget.main);
