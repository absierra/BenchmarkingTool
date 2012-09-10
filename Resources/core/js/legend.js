(function (B, window, document) {
    "use strict";

    B.Legend = new window.Class({
        initialize: function () {
            this.container = document.id('legend');
            this.state     = [];
            this.expanded  = {};

            this.attachEvents();
        },

        fill: function (data) {
            var self = this;
            this.data = data;

            // Clear the legend completely
            this.container.getChildren().destroy();
            this.state = [];

            var root = new Element('ul');
            var rootList = [];
            this.container.appendChild(root);

            var shallowest = Infinity;

            var depthComparison = {};
            _.each(data, function (d) {
                var node = B.nodes[d.id];
                var depth = node.depth;

                if (!depthComparison[depth]) {
                    depthComparison[depth] = {};
                }
                depthComparison[depth][node.mother.id] = 1;

                if (self.expanded[node.mother.id]) {
                    depth -= 1;
                }

                if (depth < shallowest) {
                    shallowest = depth;
                }
            });

            if (depthComparison[shallowest]) {
               if (_.size(depthComparison[shallowest]) > 1) {
                  shallowest -= 1;
               }
            }

            var motherCache = {};

            var index = 0;
            _.each(data, function (d) {
                index++;
                var li     = new Element('li', {'class': 'legendItem', 'id': 'legendItem' + d.id});
                var expand = new Element('span', {'class': 'expand'});
                var label  = new Element('span', {'class': 'legendLabel', 'text': d.name});
                var colorKey = new Element('span', {'class': 'colorkey', html:'&nbsp;'});


                li.appendChild(expand);
                if (!B.nodes[d.id].children) {
                    li.addClass('noExpand');
                }

                d.index = index;
                li.store('id', d.id);
                label.store('id', d.id);

                li.store('data', d);
                expand.store('data', d);

                var graphElements = B.graph.select('lineKey' + d.id + '.data');
                li.appendChild(colorKey);

                if (graphElements.length) {
                    var el = graphElements[0];

                    var color;
                    if (el.hasClass('line')) {
                        color = graphElements[0]._style('strokeColor');
                    } else {
                        color = graphElements[0]._style('color');
                    }

                    colorKey.setStyle('background-color', pythia.color(color).html());
                }

                li.appendChild(label);

                var current = B.nodes[d.id];

                var cached = false;
                var tree = [li, '',[], current, color];
                while (current.depth > shallowest || self.expanded[current.mother.id]) {
                    var pid = current.mother.id;

                    if (motherCache[pid]) {
                        motherCache[pid][2].push(tree);
                        cached = true;
                        break;
                    } else {
                        if (!B.nodes[pid]) {
                            break;
                        }

                        var ul;
                        li = new Element('li', {'class': 'legendItem expanded'}).append(
                            expand = new Element('span', {'class': 'expand'}),
                            label = new Element('span', {
                                'class': 'legendLabel',
                                'text': B.nodes[pid].text
                            }),
                            ul = new Element('ul', {'class': 'legendUL'})
                        );
                        if (!self.expanded[pid]) {
                            li.addClass('disabled');
                            li.store('index', self.expanded[pid]);
                        } else {
                            li.store('data', self.expanded[pid]);
                            expand.store('data', self.expanded[pid]);
                        }
                        label.store('id', pid);
                        expand.store('id', pid);

                        current = B.nodes[pid];
                        tree    = motherCache[pid] = [li, ul, [tree], current, 'none'];
                    }
                }
                if (!cached) {
                    rootList.push(tree);
                }
            });

            function sortAndAdd(root, children) {
                children = _.sortBy(children, function (c) {
                    var d = c[0].retrieve('data');
                    return d && d.average;
                });
                _.each(children, function (c) {
                    root.appendChild(c[0]);

                    var node = c[3];
                    self.state.push({text:node.text, id:node.id, color:c[4], depth:node.depth});

                    sortAndAdd(c[1], c[2]);

                });
            }
            sortAndAdd(root, rootList);
        },


        attachEvents: function () {
            var self = this;

            this.container.addEvent('click:relay(.legendLabel)', function () {
                var id = this.retrieve('id');
                if (id) {
                    B.drill(this.retrieve('id'));
                }
            });

            this.container.addEvent('mouseover:relay(.legendItem)', function () {
                var id = this.retrieve('id');
                var graphEl = B.graph.select('lineKey' + id +'.data');
                _.invoke(graphEl, 'invoke', 'legendOver');
                _.invoke(graphEl, 'invoke', 'littlePopUp');
            });

            this.container.addEvent('mouseout:relay(.legendItem)', function () {
                var id = this.retrieve('id');
                var graphEl = B.graph.select('lineKey' + id +'.data');
                _.invoke(graphEl, 'invoke', 'legendOut');
                _.invoke(graphEl, 'invoke', 'littlePopOff');
            });

            this.container.addEvent('click:relay(.legendItem.disabled > .expand)', function () {
                B.info.update(null, null, 'collapseDisabledLegend');
            });

            this.container.addEvent('click:relay(.expand)', function () {
                B.deleteToolTip();
                if (this.getParent().hasClass('disabled')) {
                    return;
                }
                if (this.getParent().hasClass('noExpand')) {
                    return;
                }

                var node = this.retrieve('data');
                var negativeData;

                // Compress if expanded
                if (this.getParent().hasClass('expanded')) {
                    self.compress(node);
                } else {
                    self.expand(node);
                }

                B.fixYears(self.data);
                B.selectGraph(B.chooseGraphType(self.data), self.data);
            });
        },

        // Display node's children in graph and legend
        expand: function (node) {
            this.expanded[node.id] = node;

            this.data = _.filter(this.data, function (d) {
                return d !== node;
            });

            var dataToInsert = [];
            _.each(B.nodes[node.id].children, function (child) {
                var color = node.cachedColors && node.cachedColors[child.id];
                var line = B.buildDataLine(child, color);
                line && dataToInsert.push(line);
            });

            var dataToInsert = B.sortDataByAverage(dataToInsert);

            var splice = [node.index - 1, 0].concat(dataToInsert);
            Array.prototype.splice.apply(this.data, splice);
        },

        //  Hide node's children in graph and legend
        compress: function (node) {
        	var self = this;
            node.cachedColors = {};
			var removed = {}
			removed[node.id] = true;

            this.expanded = Object.filter(this.expanded, function (d) {
                if (!removed[B.nodes[d.id].mother.id]) {
                    return true;
                }
                delete self.expanded[d.id];
                removed[d.id] = true;
                return false;
            });
            
            // Filter out the nodes children, but remember their colors
            this.data = _.filter(this.data, function (d) {
                if (!removed[B.nodes[d.id].mother.id]) {
                    return true;
                }
                removed[d.id] = true;
                node.cachedColors[d.id] = d.color;
                return false;
            });

            this.data.splice(node.index - 1, 0, node);

            delete this.expanded[node.id];
        }
    });
}(DelphiBudget, window, document));
