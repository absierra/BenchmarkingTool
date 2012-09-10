    function createElements() {
        buttonContainer = document.id('graphButtons');
        tableContainer  = document.id('table');
        graphAndLegend = document.id('graphAndLegend');

//        info   = B.info   = new B.Info(); //infocomment
//        notes  = B.notes  = new B.Notes(); //notescomment
//        title  = B.title  = new B.Title(document.id('graphTitle')); //titlecomment
//        legend = B.legend = new B.Legend(); //legendcomment
//        graph  = B.graph  = new B.Graph(); //graphcomment.

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
    
    
    function createElements() {
        buttonContainer = document.id('graphButtons');
        tableContainer  = document.id('table');
        legendContainer = document.id('legend');
        graphAndLegend = document.id('graphAndLegend');

//        info  = new B.Info();
//        notes = new B.Notes();
//        title = new B.Title(document.id('graphTitle'));
//        graph = new B.Graph();

        msd = B.msd = new B.MultiSelectDropdown(document.id('dropdownsBenchmark'), {
            singleDrop:1, text:'Compare'
        });

        // Create the dropdowns        
        
        var dropdown = msd.Dropdown('Cities','My City');
        var node = nodes['citySearchBox'] = dropdown.SearchBox('citySearchBox','SirNotAppearingInThisFilm',{noexpand:1,nocheckbox:1});
        node.enabled = true;
        node.updateDomEnableState();
        var first = true;
        for (var key in B.cities) {
          if (B.cities.hasOwnProperty(key)) {
            var options = {
              title: 0,
              exclusive: 1,
              noexpand: 1
            };
            var obj = B.cities[key];
            var objID = JSON.encode(new Array('Cities',obj['CityName']));
            var node = nodes[objID] = dropdown.Node(objID,obj['CityName'],options);
            node.enabled = true;
            node.updateDomEnableState();
            if (first) {
              defaultNodes[objID] = node;
              first = false;
            }
          }
        }
        //enable search box
        enableSearchBox('search-term','#dropdownCities .dropLabel',nodes['citySearchBox'].element);
//        var myFilter = new ElementFilter('citySearchBoxinput','#dropdownCities .dropLabel',{
//            trigger:'keyup',
//            cache:true,
//            onShow: function(element) {
////              element.set('morph',{ duration: 0 });
////              element.morph({'background-color':'#a5faa9'});
//              element.retrieve('node').element.addClass('searchSelected');
//            },
//            onHide: function(element) {
////              element.set('morph',{ duration: 0 });
////              element.morph({'background-color':'#668B8B'});
//              element.retrieve('node').element.removeClass('searchSelected');
//            },
//            onComplete: function() {
//              var box = nodes['citySearchBox'];
//              var labels = $$('#dropdownCities .searchSelected');
//              labels.each(function(label) {
//                label.retrieve('node').element.inject(box.element,'after');
//              });
//            }
//          });
    
        
//        dropdown = msd.Dropdown('Groupings','Group cities based on...', {});
//        fillHierarchy(dropdown, B.SCOBudgets["Adelanto"]["Adelanto"]["Expenditure"], new Array('Groupings'));
//        var compID = JSON.encode(new Array('Groupings','Comprehensive'));
//        var node = nodes[compID] = dropdown.Node(compID,'Comprehensive',{title: 0,exclusive: 1});
//        node.enabled = true;
//        node.updateDomEnableState();
//        defaultNodes[compID] = node;
//        
//        dropdown = msd.Dropdown('Metrics','Show me...', {});
//        fillHierarchy(dropdown, B.SCOMetrics["Adelanto"], new Array('Metrics'));
    }
