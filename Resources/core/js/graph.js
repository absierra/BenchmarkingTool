(function (B, window, document) {
    'use strict';

    B.Graph = new window.Class({
        initialize: function () {
            this.container = document.id('graph');
            this.slider    = document.id('sliderWrapper');

            // Currently rendered graph type
            this.currentGraph = 'stackedButton';

            // The canvas we'll draw our graphs to
            this.canvas = pythia(this.container);

            this.attachEvents();
        },

        hasTransition: {
            'lineButton':1,
            'stackedButton':1,
            'percentageButton':1
        },

        // Render the graph
        update: function (data, numberFormat, shortNumberFormat, yearOrder, graphType) {
            var options,
                graph  = this.graph,
                canvas = this.canvas,
                self   = this;

            this.numberFormat      = numberFormat;
            this.yearOrder         = yearOrder;
            this.shortNumberFormat = shortNumberFormat;

            if (!graph && !graphType) {
                graphType = B.getAvailableGraphTypes()[0];
            }

            if (graphType &&
                !(this.hasTransition[graphType] && this.hasTransition[this.lastGraph]) &&
                !(graphType === this.lastGraph)) {
                canvas.clear();

                this.win = canvas.port([10, 5], [80, 70], pythia.style({
                    position:'fixed'
                }));

                options =
                    _.extend(graphOpts[graphType][1], graphOpts.all);

                graph =
                    this.graph =
                        this.win[graphOpts[graphType][0]](options);
            } else {
                if (!graphType)
                    graphType = this.currentGraph;

                switch (graphType) {
                    case 'lineButton':
                      this.graph._opts.stacked = false;
                      this.graph._opts.percent = false;
                      this.graph._opts.fill = false;
                      break;
                    case 'stackedButton':
                      this.graph._opts.stacked = true;
                      this.graph._opts.percent = false;
                      this.graph._opts.fill = true;
                      break;
                    case 'percentageButton':
                      this.graph._opts.stacked = true;
                      this.graph._opts.percent = true;
                      this.graph._opts.fill = true;
                      break;
                }
            }
            if (graph && graphType !== 'pieButton') {
                graph.data(data);
            } else {
            }

            switch (graphType) {
                case 'lineButton':
                case 'stackedButton':
                case 'percentageButton':
                    if (this.win) {
                        this.win.resize([100, 20], [120, 80]);
                        this.win.refresh();
                    }
                    break;
                case 'pieButton':
                    if (this.win) {
                        this.win.resize([0, 20], [0, 40]);
                        this.win.refresh();
                    }
                    break;
            }

            if (this.axisX) {
                this.axisX.remove();
                this.axisY.remove();
                this.axisX = false;
                this.axisY = false;
            }

            var yText = 'Dollars per year';
            switch (graphType) {
                case 'percentageButton':
                    yText = 'Percent of Budget';
                case 'lineButton':
                case 'stackedButton':
                    this.axisX = graph.axis({
                        position: 'bottom',
                        type: 'ordinal',
                        labels: yearOrder,
                        label: 'Fiscal Year',
                        labelStyle: xAxisStyle
                    }),
                    this.axisY = graph.axis({
                        position: 'left',
                        type: 'continuous',
                        longest: graph.longest,
                        shortest: graph.shortest,
                        format: shortNumberFormat,
                        label: yText,
                        labelStyle: yAxisStyle
                    });
                    break;
                case 'pieButton':
                    if (this.text) {
                        this.text.remove();
                    }
                    //this.text = graph.text(yearOrder[0], [50, 25], pythia.style(xAxisStyle));

                    var firstYear = parseInt(yearOrder[0]);
                    var lastYear  = parseInt(yearOrder.slice(-1));
                    var count = 0;
                    graph.pos = this.yearOrder.length-1;
                    graph.data(B.data);
                    var self = this;

                    if (!this.sliderControl) {
                        this.sliderControl = new Slider('slider', 'handle', {
                            range:  [0,1000],
                            wheel:  true,
                            offset: 60,
                            initialStep: (self.yearOrder.length - 1)
                                            /self.yearOrder.length * 1000,
                            onChange: function (pos) {
                                var length = self.yearOrder.length;
                                var index = Math.floor(pos/1000 * length);
                                if (index > length - 1) {
                                    index = length - 1;
                                }
                                if (self.graph.pos !== index) {
                                    self.graph.pos = index;
                                    self.graph.data(B.data);
                                    if(sliderYears != undefined) {
                                        var elements = sliderYears.getElementsByTagName('li');
                                        for(var year = 0; year < length; year++){
                                            if (elements[year]) {
                                                elements[year].removeClass('active');
                                            }
                                        }
                                        elements[index].addClass('active');
                                    }
                                }
                            },

                            onComplete: function (pos) {
                                var length = self.yearOrder.length;
                                var index = Math.floor(pos/1000 * length);
                                if (index > length - 1) {
                                    index = length - 1;
                                }
                                var newPos = index/length * 1000 + (1000/length/2);
                                this.set(newPos - 3 * index);
                            }
                        });
                    } else {
                    }

                    // hmmmm?
                    var length = this.yearOrder.length;

                    var newPos = graph.pos/length * 1000 + (1000/length/2);

                    var sliderYears = document.id('sliderYears');

                    sliderYears.empty();
                    _.each(this.yearOrder, function (year) {
                        sliderYears.appendChild(Element('li',{'text':year}));
                    });

                    document.id('sliderWrapper').setStyle('width', length * 120);
                    document.id('slider').setStyle('width', length * 120);
                    this.slider.show();
                    if(this.yearOrder.length == 1) {
                        document.id('slider').hide();
                    } else {
                        document.id('slider').show();
                    }
                    this.sliderControl.autosize();

                    this.sliderControl.set(newPos - 3 * graph.pos);

                    sliderYears.getElementsByTagName('li')
                        [this.yearOrder.length - 1].addClass('active');

                    break;
            }

            this.lastGraph = this.currentGraph = graphType;
        },

        select: function (selector) {
            if (this.graph)
                return this.graph.select(selector);
            return [];
        },

        size: function (size) {
            return this.canvas.size(size);
        },

        attachEvents: function () {
            var self   = this,
                canvas = self.canvas;

            canvas
                .on('data', 'click', function () {
                     deleteToolTip();
                     B.drill(this._line.id);
                })

                .on('point', 'littlePopUp', function () {
                     var text = 'Year: ' + self.yearOrder[this._dataKey] + '\n' +
                                self.numberFormat(this._data);
                     if (self.currentGraph === 'percentageButton') {
                          text += '\n' + this.value.toFixed(2) + '%';
                     } else if (self.currentGraph === 'stackedButton' && this._parent._last) {
                          text += '\n\n Total:\n' + self.numberFormat(this._total);
                     }
                     this.toTop();
                     drawToolTip(self.graph, text, this._pos, true, true);
                })
                .on('point', 'littlePopOff', function () {
                     deleteToolTip();
                })
                .on('point', 'legendOver', function () {
                     this.pushScale();
                     this.scale(1.7);
                     this.toTop();
                     document.id('legendItem' + this._line.id).addClass('hovered');
                 })
                .on('point', 'legendOut', function () {
                     document.id('legendItem' + this._line.id).removeClass('hovered');
                     this.popScale();
                 })
                .on('point', 'mouseover', function () {
                     this.invoke('legendOver');
                     var text = this._line.name + '\n' +
                                'Year: ' + self.yearOrder[this._dataKey] + '\n' +
                                self.numberFormat(this._data);
                     if (self.currentGraph === 'percentageButton') {
                          text += '\n' + this.value.toFixed(2) + '%';
                     }
                     if (self.currentGraph === 'stackedButton' && this._parent._last) {
                          text += '\n\n Total: ' + self.numberFormat(this._total);
                     }
                     _.invoke(
                        self.graph.select('lineKey' + this._line.id +'.data'),
                            'invoke', 'legendOver');

                     this.toTop();
                     drawToolTip(self.graph, text, this._pos);
                })
                .on('point', 'mouseout', function () {
                     this.invoke('legendOut');
                     deleteToolTip();
                     _.invoke(self.graph.select('lineKey' + this._line.id +'.data'),
                              'invoke', 'legendOut');
                })

                .on('slice', 'legendOut', function ()  {this.invoke('mouseout');})
                .on('slice', 'legendOver', function () {this.invoke('mouseover');})
                .on('slice', 'mouseover', function () {
                     this.pushScale();
                     this.scale(1.05);
                     var text = this._line.name + '\n' +
                                'Year: ' + self.yearOrder[this._dataKey] + '\n' +
                                self.numberFormat(this._data);

                     text += '\n' + this.percent.toFixed(2) + '%';

                     drawToolTip(self.graph, text, this.center());
                     document.id('legendItem' + this._line.id).addClass('hovered');
                })
                .on('slice', 'mouseout', function () {
                     var legend = document.id('legendItem' + this._line.id);
                     if (legend) {
                        legend.removeClass('hovered');
                     }
                     deleteToolTip();
                     this.popScale();
                })

                .on('fill', 'legendOut', function ()  {
                     this.style('alpha', '0.6');
                })
                .on('fill', 'legendOver', function () {
                     this.style('alpha', '0.8');
                })
                .on('fill', 'mouseover', function () {
                     this.invoke('legendOver');
                     _.invoke(self.graph.select('lineKey' + this._line.id +'.data'),
                              'invoke', 'legendOver');
                })
                .on('fill', 'mouseout', function () {
                     this.invoke('legendOut');
                     _.invoke(self.graph.select('lineKey' + this._line.id +'.data'),
                              'invoke', 'legendOut');
                })

                .on('line', 'legendOut', function ()  {
                     this.lineWidth = 0;
                     this.style('line-width', '0');
                })
                .on('line', 'legendOver', function () {
                     this.lineWidth = 4;
                     this.style('line-width', '4');
                     this.toTop();
                })
                .on('line', 'mouseover', function () {
                     this.invoke('legendOver');
                     this.toTop();
                     if (this._line)
                         _.invoke(self.graph.select('lineKey' + this._line.id +'.data'),
                                  'invoke', 'legendOver');
                })
                .on('line', 'mouseout', function () {
                    this.invoke('legendOut');
                     if (this._line)
                         _.invoke(self.graph.select('lineKey' + this._line.id +'.data'),
                                  'invoke', 'legendOut');
                });
        }
    });


    var tooltips = [];
    function deleteToolTip() {
        if (tooltip) {
            tooltip.remove();
            tooltip = false;;
        }
        _.invoke(tooltips, 'remove');
    }

    B.deleteToolTip = deleteToolTip;

    function drawToolTip(graph, t, pos, collect, downOkay) {
        if (!collect) {
            deleteToolTip();
        }
        var style = graph.computeStyle('tooltip');

        var text = graph.text(t, [0,-3],
            pythia.chainStyle(style, graph.computeStyle('tooltip text')
        ));

        var d = text.measure();
        var w = d[0];
        var h = d[1];

        var hmargin = 4;
        var vmargin = 5;

        // this is the "up" direction, which is the default
        tooltip  = graph.path()
                          .move([0,0])
                          .line([-3, -5])
                          .line([-w/2 - 4, -5])
                          .line([-w/2 - 4, -h - 9])

                          .line([w/2 + 4 , -h - 9])
                          .line([w/2 + 4 , -5])

                          .line([3       , -5])
                          .line([0       ,  0])
                          .close()
                          .style(style)
                          .translate(pos);

        var cSize =  graph._r._size;
        var rPos  = tooltip.renderedPos(pos);

        var down, left, right, orientation;
        if (rPos[0] + d[0] > cSize[0]) {
            // too close to the right side that down and up are bad
            left = true;
        }
        if (rPos[0] - d[0] < 30) {
            // too close to the left side that down and up are bad
            right = true;
        }
        if (rPos[1] - d[1] * 2 < 0) {
            // too close to the top that up is bad
            down = true;
        }
        
        if (down) { // too close to the top that up is bad
            if (left) {
                orientation = "downleft";
            }
            else if (right) {
                orientation = "downright";
            }
            else if (downOkay) { // this is for when the mouse is over the legend item, and thus not blocking the down orientation
                orientation = "down";
            }
            else { // we want to show down and to the left to avoid hitting the mouse cursor
                orientation = "downleft";
            }
        }
        else {
            if (left) {
                orientation = "left";
            }
            else if (right) {
                orientation = "right";
            }
            else {
                orientation = "up";
            }
        }

        switch (orientation)
        {
            case "down":
                tooltip.remove();
                tooltip  = graph.path()
                                  .move([0,0])
                                  .line([-3, 5])
                                  .line([-w/2 - 4, 5])
                                  .line([-w/2 - 4, h + 9])

                                  .line([w/2 + 4 , h + 9])
                                  .line([w/2 + 4 , 5])

                                  .line([3       , 5])
                                  .line([0       , 0])
                                  .close()
                                  .style(style)
                                  .translate(pos);
                text.translate([0,12]);
                break;
            case "left":
                tooltip.remove();
                tooltip  = graph.path()
                                  .move([0,0])
                                  .line([-5, -3])
                                  .line([-5, -h/2 - 5])
                                  .line([-w - 9, -h/2 - 5])

                                  .line([-w - 9, h/2 + 5])
                                  .line([-5 ,h/2 + 4])

                                  .line([-5   , 3])
                                  .line([0    , 0])
                                  .close()
                                  .style(style)
                                  .translate(pos);
                text.translate([-w/2 - 6, -h/2 + 3]);
                break;
            case "right":
                tooltip.remove();
                tooltip  = graph.path()
                                  .move([0,0])
                                  .line([5, -3])
                                  .line([5, -h/2 - 5])
                                  .line([w + 9, -h/2 - 5])

                                  .line([w + 9, h/2 + 5])
                                  .line([5 ,h/2 + 4])

                                  .line([5   , 3])
                                  .line([0    , 0])
                                  .close()
                                  .style(style)
                                  .translate(pos);
                text.translate([w/2 + 6, -h/2 + 3]);
                break;
            case "downleft":
                tooltip.remove();
                tooltip  = graph.path()
                                  .move([0,0])
                                  .line([-9, 5])
                                  .line([-w - 9, 5])

                                  .line([-w - 9, h + 9])
                                  .line([-4, h + 9])

                                  .line([-4   , 10])
                                  .line([0    , 0])
                                  .close()
                                  .style(style)
                                  .translate(pos);
                text.translate([-w/2 - 6, 12]);
                break;
            case "downright":
                tooltip.remove();
                tooltip  = graph.path()
                                  .move([0,0])
                                  .line([9, 5])
                                  .line([w + 9, 5])

                                  .line([w + 9, h + 9])
                                  .line([4, h + 9])

                                  .line([4   , 10])
                                  .line([0    , 0])
                                  .close()
                                  .style(style)
                                  .translate(pos);
                text.translate([w/2 + 6, 12]);
                break;
            case "up":
            default:
                text.translate([0,-h - 2]);
        }

        tooltip.refresh();

        text.parent(tooltip);

        tooltip.updateTransform();
        tooltips.push(tooltip);
    }


    var tooltip,
        xAxisStyle = {
            'size':        'fixed',
            'color':       0xA5a8ab,
            'font-size':   14,
            'position':    'fixed-horizontal',
            'font-weight': 'bold',
            'baseline':    'bottom',
            'yrelative':    'bottom'
        },
        yAxisStyle = {
            'size':        'fixed',
            'color':       0xA5a8ab,
            'font-size':   14,
            'position':    'fixed-vertical',
            'font-weight': 'bold',
            'baseline':    'top'
        },
        graphOpts = {
            // Options to be passed to all the graphs
            'all': {
                dataLine:    function (d)   { return d.sortedYears; },
                dataLineId:  function (d) { return d.id; },
                dataValueId: function (d) { return d.year; },
                lineColor:   function (d)  { return d.color },
                splitFrom:   function (d)  { return d.from }
            },
            'lineButton': ['lineChart', {
                multiline: true
            }],
            'stackedButton': ['lineChart', {
                multiline: true,
                stacked:   true,
                fill:      true
            }],
            'percentageButton': ['lineChart', {
                multiline: true,
                stacked:   true,
                fill:      true,
                percent:   true
            }],
            'pieButton': ['pieChart', {
                multiline: true
            }]
        }
    ;
}(DelphiBudget, window, document));
