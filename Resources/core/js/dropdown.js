(function (B, window, document) {
    "use strict";

    var motherToInspect = {};

    B.inspectMotherFlush = function () {
        _.each(motherToInspect, function (m) {
            m.children[0].inspectMother();
        });
        motherToInspect = {};
    }

    B.MultiSelectDropdown = new window.Class({
        initialize: function (container, options) {
            this.container = container;
            //this.overlay = document.id('overlay');
            this.overlay = B.Overlay;
            B.Overlay.addCloseItem(this);
            this.attachEvents(container);
            this.dropdowns     = {};
            this.events    = {};
            this.options   = options || {};
            this.opened = false;

            if (this.options.singleDrop) {
                this.button = new Element('span', {
                    text: this.options.text,
                    'class': 'masterButton'
                });

                this.transitioning = false;
                var self = this;
                this.button.addEvent('click', function(event){
                    if(this.transitioning) return;
                    //this.toggle();
                    this.overlay.setSelected(this);
                    //event.stop();
                }.bind(this));

                this.dropContainer = new Element('div', {
                    'class':'masterDropdown',
                    //'style':'visibility: hidden'
                });

                this.container.append(this.button, this.dropContainer);
            } else {
                this.dropContainer = container;
            }
            var that = this;
            this.dropContainerSlider = new Fx.Slide(
                this.dropContainer, 
                {
                    hideOverflow : false,
                    onComplete : function(){
                        this.transitioning = false;
                        if(this.completeCallback){
                            this.completeCallback();
                            delete this.completeCallback;
                        }
                    }.bind(this)
                }
            );
            this.addEvent('load', function(){
                var FlogWorthyPadding = 40;
                this.dropContainer.setStyle('margin-left', -1500);
                //this.dropContainer.setStyle('margin-left', -1 * (this.dropContainer.getSize().x + FlogWorthyPadding));
                this.removeEvent('load');
            }.bind(this));
            this.addEvent('alter', function(){
                if(!this.open){
                    var FlogWorthyPadding = 40;
                    this.dropContainer.setStyle('margin-left', -1500); //cheap hack
                    //this.dropContainer.setStyle('margin-left', -1 * (this.dropContainer.getSize().x + FlogWorthyPadding));
                }
            }.bind(this));
            
            new Keyboard({
                defaultEventType: 'keyup',
                events: {
                    'esc': function(){
                        this.slide('out');
                        this.visible = false;
                        this.button.removeClass('active');
                    }.bind(this)
                }
            }).activate();
        },

        removeEvent: function (evt) {
            delete this.events[evt];
        },

        addEvent: function (evt, cb) { //not intuitive: I can't attach multiple events
            this.events[evt] = cb;
        },

        fireEvent: function (evt, el) {
            if (this.events[evt]) {
                this.events[evt].apply(el);
            }
        },

        Dropdown: function (id, text) {
            var options = {
            };
            var dropdown = new B.Dropdown(id, text, options);
            this.dropdowns[id] = dropdown;

            this.dropContainer.appendChild(dropdown.element);
            dropdown.root = this;

            return dropdown;
        },

        DropdownReplace: function (id, text) {

            var oldElem = this.dropdowns[id].element;
            var dropdown = new B.Dropdown(id, text);
            this.dropdowns[id] = dropdown;

//            this.dropContainer.appendChild(dropdown.element);
            dropdown.element.inject(oldElem,'before');
            oldElem.destroy();
            dropdown.root = this;
            
            return dropdown;
        },

        setDeselected : function(){
        
        },
        open : function(){
            this.overlay.show();
            B.sortOthers(false); //??
            this.button.addClass('active');
            this.dropContainer.setStyle('visibility','visible');
            this.slide('in');
            this.visible = true;
            B.resizeDropdown(); //?? (geometry should be static here?)
        },
        close : function(){
            this.transitioning = true;
            this.slide('out', function () {
                this.overlay.hide();
            });
            this.visible = false;
            this.button.removeClass('active');
//            B.checkEmpty(); //?? //adrian this was causing problems
        },

        toggle : function(){
            if(this.opened){ //close
                this.close();
            }else{ //open
                this.open();
            }
        },

        slide : function(direction, callback){
            this.transitioning = true;
            switch(direction.toLowerCase()){
                case 'in' :
                    this.dropContainerSlider.slideIn('horizontal');
                    this.opened = true;
                    break;
                case 'out' :
                    this.dropContainerSlider.slideOut('horizontal');
                    this.opened = false;
                    break;
                default : throw('slide direction not supported: '+direction);
            }
            this.completeCallback = callback;
        },

        attachEvents: function (container) {
            var self = this;
            
            //attaching *everything* via relay is a bad idea
            container.addEvent('click:relay(.expand)', function () {
                this.retrieve('node').toggleVisiblity();
                B.resizeDropdown();
            });

            container.addEvent('click:relay(.dropButton)', function () {
                this.retrieve('drop').toggleVisiblity();
            });

            container.addEvent('click:relay(.text)', function () {
                this.retrieve('drop').fireEvent('focus');
            });

            container.addEvent('click:relay(.checkbox)', function () {
                this.retrieve('node').fireEvent('checkClick');
            });
            /*container.addEvent('click:relay(.masterButton)', function () {
                if(transitioning) return;
                if (self.visible) {
                    //self.dropContainerSlider.slideOut('horizontal');
                    transitioning = true;
                    self.slide('out', function(){
                        transitioning = false;
                    });
                    self.visible = false;
                    this.removeClass('active');
                    B.checkEmpty();
                } else {
                    B.sortOthers(false);
                    this.addClass('active');
                    self.dropContainer.setStyle('visibility','visible');
                    transitioning = true;
                    self.slide('in', function(){
                        transitioning = false;
                    });
                    //self.dropContainerSlider.slideIn('horizontal');
                    self.visible = true;
                    B.resizeDropdown();
                }
            });*/

            container
                .addEvent('click:relay(.dropItem:not(.disabled) > .dropLabel)',
                    function () {
                        this.retrieve('node').fireEvent('textClick')
                    });

            var dropdownClick;
            container.addEvent('click', function () {
                dropdownClick = true;
            });

            this.overlay.addEvent('click', function (evt) {
                self.toggle();
                self.fireEvent('overlay-click');
            });
        }

    });


    // Fire Event shared by the Dropdown and Node classes.
    function fireEvent(evt) {
        if (this[evt]) {
            this[evt]();
        }
        this.root.fireEvent(evt, this);

        return this;
    }

    // Child node constructor shared by the Dropdown and Node classes
    function Node(id, text, attributes) {
        if (!this.children) {
            this.children = [];
            this.children.checkCount = 0;
            this.children.enableCount = 0;
            this.children.enableCheckCount = 0;
            this.children.partialCheckCount = 0;


            if (!this.childContainer) {
                this.childContainer =
                    new Element('ul', { 'class': 'dropMenu' });


                this.element.appendChild(this.childContainer);

                if (!this.noexpand && !this.hidden) {
                    this.childContainer &&
                    $(this.childContainer).hide();
                }
            }
        }

        var node = new B.Node(
                id,
                text,
                this.children,
                this,
                this.dropdown,
                this.depth + 1
            ).setAttributes(attributes);
        node.position = this.children.length;

        if (!this.noexpand && this.expand)
            this.element.removeClass('noExpand');


        node.root = this.root;

        this.children.push(node);
        this.children.ordered = this.children;
        node.enablers = 0;

        return node;
    };

    //ADRIAN ADDED
    function SearchBox(id, text, attributes) {
      var node = this.Node(id, text, attributes);
      var searchElem = new Element('span', {
          'class': 'searchLabel',
          'html':"<input type=\"text\" class=\"input searchBox\" id=\"" + id + "input\">"
        }).store('node', node);
      
      searchElem.replaces(node.label);
      node.label = searchElem;
      node.searchButton = new Element('span', {'class': 'searchButton'}).store('node', node);
      node.searchButton.inject(searchElem, 'before');

      return node;
    }

    B.Dropdown = new Class({
        initialize: function (id, text, options) {
            this.id   = id;   //Unique id
            this.text = text; //Default text displayed on the dropdown
            this.isDropdown = true;

            //Bookkeeping
            this.checkedNodes   = {};
            this.enabledNodes   = {};
            this.disabledNodes  = {};
            this.allNodes       = {};

            //Create DOM elements for the dropdown and store references to this
            //in the elements through storage
            this.element =
                new Element('span', {id: 'dropdown' + id, 'class': 'dropdown'})
                    .store('drop', this);

            //Well this did not end up looking as pretty as I hoped
            this.element.append(
                (this.label =
                    new Element('span', {'class': 'text', 'text': text})
                        .store('drop', this)),
                (this.button =
                    new Element('span', {'class': 'dropButton'})
                        .store('drop', this)),

                new Element('div',  {'class': 'hierarchyAndApply'})
                    .append(
                        (this.childContainer =
                            new Element(
                                'ul',
                                {'class': 'dropMenu rootDropMenu'}
                            )
                        )
                    )
            );
            this.button.hide();

            this.depth = 0;
            this.dropdown = this;

            return this;
        },

        focus: function () {
            if (this.root.focused) {
                this.root.focused
                    .element
                        .removeClass('focused');
                this.root.focused.focused = false;
            }

            this.element.addClass('focused');
            this.focused = true;
            this.root.focused = this;

            return this;
        },

        show: function () {
            if (this.exclusive && !this.anyCheck()) {
                this.hide();
            }

            this.button.addClass('expanded');
            this.childContainer &&
            $(this.childContainer).show(300);
            this.expanded = true;
            expandedDropdown = this;

            _.each(this.children, function (c) {
                if (!c.hidden) {
                    c.showInitial();
                }
            });
            return this;
        },

        toggleVisiblity: function () {
            if (this.expanded) {
                this.hide();
            } else {
                this.show();
            }

            return this;
        },

        hide: function (fast) {
            this.button.removeClass('expanded');
            this.expanded = false;
            if (this.childContainer) {
                if (fast) {
                    $(this.childContainer).hide(0);
                } else {
                    $(this.childContainer).hide(300);
                }
            }


            return this;
        },

        SearchBox: SearchBox,
        Node: Node,
        fireEvent: fireEvent
    });

    function stripColumnName(text, dropdown)
    {
        if (text == "All " + dropdown)
            return text;
        switch (dropdown)
        {
            case "Funds":
                return text.replace(/fund[s]?$/i, '');
                break;
            case "Departments":
                return text.replace(/department[s]?$/i, '');
                break;
            default:
                return text;
        }
    }

    B.Node = new Class({
        initialize: function (id, text, siblings, mother, dropdown, depth) {
            this.id       = id;       // Unique id
            this.text     = text;     // The text displayed on the node
            this.siblings = siblings; // Array of sibling Nodes and this
            this.mother   = mother;   // Parent node
            this.dropdown = dropdown; // The dropdown this is contained in
            this.depth    = depth;

            this.dropdown.allNodes[id] = this;

            // Create DOM elements for the dropdown item and store references
            // to this in the elements through storage
            if (Browser.ie) {
                 this.dropItemClass = 'dropItem extraPadding';
            } else this.dropItemClass = 'dropItem'; 
            this.element =
                new Element('li', {'id': 'node' + id, 'class': this.dropItemClass })
                    .store('node', this).append(
                    this.expand =
                        new Element('span', {'class': 'expand'})
                            .store('node', this),
                    this.checkbox =
                        new Element('span', {'class': 'checkbox'})
                            .store('node', this),
                    this.label =
                        new Element('span', {'class': 'dropLabel', 'html': stripColumnName(text, dropdown.id)}
                             ).store('node', this)
                );
            return this;
        },

        setAttributes: function (attributes) {
            this.hidden     = attributes.hidden || this.mother.hidden;
            this.order      = (attributes.order + 1) || Infinity;
            this.noexpand   = attributes.noexpand;
            this.nocheckbox = attributes.nocheckbox;
            this.exclusive  = attributes.exclusive;
            this.fixed      = attributes.fixed;
            this.unchecked  = attributes.uncheck || this.mother.unchecked;

            this.element.addClass('noExpand');

            if (this.nocheckbox) {
                this.checkbox.setStyle('display', 'none');
            }

            if (this.exclusive) {
                this.checkbox.addClass('radio');
            }

            if (!this.hidden) {
                this.mother.childContainer.appendChild(this.element);
            }

            if (this.noexpand)
                this.expand.hide();

            return this;
        },

        // TODO: This should become hide. hide should become fold
        hideCompletely: function () {
            this.element.hide();
            return this;
        },

        // TODO: This should become show. show should become expand
        showCompletely: function () {
            this.element.show();
            return this;
        },

        uncheckSiblings: function(all) {
            var self = this;

            _.each(this.siblings, function (s) {
                if (s !== self) {
                    s.implicitUncheck();
                }
            });
        },

        explicitCheck: function () {
            this.implicitCheck();
            this.inspectParent();
            B.inspectMotherFlush();
        },


        implicitCheck: function (disable) {
            if (!this.enabled)
                return this; //adrian stop disabled nodes from being checked
            _.invoke(this.children, this.implicitCheck);
            if (!this.checked && !this.noaggregate) {
                this.setCheck();

                var self = this;

                _.each(this.links, function (linkChild, linkChildId) {
                    //temp fix for node links
                    if (B.nodes[linkChildId] && B.nodes[linkChildId].checked) {
                        _.each(linkChild, function (wtf, linkGrandchildId) {
                            var grandchild = B.nodes[linkGrandchildId];
                            if (!grandchild) { return; } //temp fix for node links
                            grandchild.enablers++;
                            grandchild.enablerStore = grandchild.enablerStore || {};
                            grandchild.enablerStore[self.id] =
                                (grandchild.enablerStore[self.id]
                                   ? grandchild.enablerStore[self.id] + 1 : 1);
                            grandchild.enablerStore[linkChildId] =
                                (grandchild.enablerStore[linkChildId]
                                   ? grandchild.enablerStore[linkChildId] + 1 : 1);
                            grandchild.enable();
                        });
                    }
                });

                this.updateDomCheckState();

                if (this.exclusive) {
                    this.uncheckSiblings();
                    this.show(true);
                }
            }

            return this;
        },

        explicitUncheck: function () {
            this.implicitUncheck()
            this.inspectParent();
            B.inspectMotherFlush();

            return this;
        },

        implicitUncheck: function () {
            if (this.checked || this.partialChecked) {
                this.setUncheck();

                var self = this;

                _.each(this.links, function (linkChild, linkChildId) {
                    // temp fix for node links
                    if (B.nodes[linkChildId] && B.nodes[linkChildId].checked) {
                        _.each(linkChild, function (wtf, linkGrandchildId) {

                            var grandchild = B.nodes[linkGrandchildId];
                            if (!grandchild) { return; } //temp fix for node links
                            grandchild.enablers--;

                            grandchild.enablerStore[self.id] =
                                (grandchild.enablerStore[self.id] ? grandchild.enablerStore[self.id] - 1 : -1);

                            grandchild.enablerStore[linkChildId] =
                                (grandchild.enablerStore[linkChildId] ? grandchild.enablerStore[linkChildId] - 1 : -1);

                            if (!grandchild.enablers) {
                                grandchild.disable();
                            }

                        });
                    }
                });

                this.updateDomCheckState();
            }

            _.invoke(this.children, 'implicitUncheck');

            if (this.exclusive) {
                this.hide(true);
            }

            return this;

            function existsOneCheckCheck(node) {
                return _.any(node.links, function (linkChild, linkChildId) {
                    return _.any(B.nodes[linkChildId], function (wtf, linkGrandchildId) {
                        return
                            B.nodes[linkChildId].checked &&
                            B.nodes[linkGrandchildId].checked;
                    });
                });
            }
        },

        inspectParent: function () {
            if (!this.mother.isDropdown) {
               motherToInspect[this.mother.id] = this.mother;
               //motherToInspect.push(this.mother);
            }
            return this;
        },

        inspectMother: function () {

            if (this.mother.isDropdown) {
                return this;
            }

            var mom = this.mother;

            if (this.siblings.enableCheckCount && this.siblings.enableCheckCount === this.siblings.enableCount) {
                mom.setCheck();
            } else if (this.siblings.enableCheckCount || this.siblings.partialCheckCount) {
                mom.setPartial();
            } else {
                mom.setUncheck();
            }

            mom.updateDomCheckState();

            mom.inspectMother();

            return this;
        },

        updateDomCheckState: function () {
            if (this.checked) {
                this.checkbox.addClass('fullCheck');
                this.checkbox.removeClass('partialCheck');
                this.checkbox.removeClass('emptyCheck');

                return;
            }

            if (this.partialChecked) {
                this.checkbox.addClass('partialCheck');
                this.checkbox.removeClass('fullCheck');
                this.checkbox.removeClass('emptyCheck');
                return;
            }

            this.checkbox.addClass('emptyCheck');
            this.checkbox.removeClass('fullCheck');
            this.checkbox.removeClass('partialCheck');

            return this;
        },

        updateDomEnableState: function () {
            if (this.enabled) {
                this.element.removeClass('disabled');
            } else {
                this.element.addClass('disabled');
            }
        },

        enable: function () {
            if (!this.enabled && !this.noaggregate) {
                this.enabled = true;
                this.element.removeClass('disabled');

                this.incEnableCount();
                if (!this.mother.enabled && !this.mother.isDropdown) {
                    this.mother.enable();
                }

                this.inspectParent();
            }

            return this;
        },

        decEnableCount: function () {
            if (this.checked)
                this.siblings.enableCheckCount--;
            this.siblings.enableCount--;
        },

        incEnableCount: function () {
            if (this.checked)
                this.siblings.enableCheckCount++;
            this.siblings.enableCount++;
        },

        setCheck: function () {
            if (!this.checked) {
                this.dropdown.checkedNodes[this.id] = this;
                this.siblings.checkCount++;
                this.checked = true;

                if (this.enabled)
                    this.siblings.enableCheckCount++;

                if (this.partialChecked) {
                    this.siblings.partialCheckCount--;
                    this.partialChecked = false;
                }
            }
        },

        setUncheck: function () {
            if (this.checked) {
                delete this.dropdown.checkedNodes[this.id];
                this.siblings.checkCount--;
                this.checked = false;

                if (this.enabled)
                    this.siblings.enableCheckCount--;
            }

            if (this.partialChecked) {
                this.siblings.partialCheckCount--;
                this.partialChecked = false;
            }
        },

        setPartial: function () {
            if (!this.partialChecked) {
                if (this.checked) {
                    this.setUncheck();
                }

                this.partialChecked = true;
                this.siblings.partialCheckCount++;

                if (this.exclusive) {
                    this.uncheckSiblings();
                    this.show(true);
                }
            }
        },

        disable: function () {
            if (this.enabled) {
                this.enabled = false;

                this.decEnableCount();
                this.element.addClass('disabled');

                var mother = this.mother;
                while(mother.enabled && !mother.isDropdown) {
                    if (mother.children.enableCount === 0) {
                        mother.disable();
                    }
                    mother = mother.mother;
                }

                this.inspectParent();
            }

            return this;
        },

        onlyChild: function () {
            return this.enabled && this.siblings.enableCount == 1;
        },

        explicitTextClick: function () {
            var node = this;
            while (!node.isDropdown) {
                node.uncheckSiblings();
                node = node.mother;
            }

            this.explicitCheck();

            // This updates the graph
//            B.updateData();

            return this;
        },

        anyCheck: function () {
            return this.partialChecked || this.checked;
        },

        affectsData: function () {
            return this.enabled && this.checked && !this.noaggregate;
        },

        minimal: function () {
            return !(this.mother && this.mother.checked);
        },

        alone: function () {
            var self = this;
            return !_.any(this.siblings, function (s) {
                return (s.enabled && s.checked && s !== self);
            });
        },

        singleTree: function () {
            var node = this;
            while (node.mother && !node.mother.isDropdown) {
                if (!node.alone()) {
                    return false;
                }
                node = node.mother;
            }
            return true;
        },

        show: function () {
            if (this.firstShow) {
                this.showInitial(true);
                this.firstShow = false;
            }

            this.childContainer &&
            $(this.childContainer).show(300);

            this.expand.addClass('expanded');
            this.expanded = true;
        },

        // On the first showing of a partially checked dropdown we need to
        // make sure and reflect the internal check states
        showInitial: function (manual) {
            this.expand.addClass('expanded');
            this.expanded = true;
            this.childContainer &&
            $(this.childContainer).show(300);

            if (this.exclusive && !this.anyCheck()) {
                this.hide();
            }

            if (this.noexpand) {
                _.invoke(this.children, 'showInitial');
            } else if (!this.enabled) {
                this.hide();
            } else if (this.partialChecked) {
                _.invoke(this.children, 'showInitial');
            } else  if (this.checked && this.singleTree()) {
                _.invoke(this.children, 'showInitial');
            } else if (manual) {
                _.invoke(this.children, 'showInitial');
            } else {
                this.hide();
                this.firstShow = true;
            }

            if (!this.children) {
                this.expand.hide();
            }
        },

        toggleVisiblity: function () {
            if (this.expanded) {
                this.hide();
            } else {
                this.show();
            }

            return this;
        },

        hide: function () {
//            if (this.nocheckbox)
//                return;

            this.childContainer &&
            $(this.childContainer).hide();
            this.expand.removeClass('expanded');
            this.expanded = false;

            return this;
        },

        toggleExplicitCheckClick: function () {
            if (this.exclusive) {
                this.explicitTextClick();
                return;
            }

            if (!this.checked || this.partialChecked) {
                this.explicitCheck();
            } else {
                this.explicitUncheck();
            }

            // Updates the graph
//            B.updateData();

            return this;
        },

        makeRadioButton: function () {
            this.checkbox.addClass('radio');
            this.exclusive = 1;

            return this;
        },

        makeCheckbox: function () {
            this.exclusive = 0;
            this.checkbox.removeClass('radio');
            this.show(true);

            return this;
        },

        SearchBox: SearchBox,
        Node: Node,
        fireEvent: fireEvent
    });
}(DelphiBudget, window, document));

