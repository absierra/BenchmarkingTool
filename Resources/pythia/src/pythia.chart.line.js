(function (p) {
    "use strict";

    p.element.element('lineChart', p.Class(p.chart, {
        init: function () {
            this.refresh();
        },

        defaultOptions: [
            ['multiline', false]
          , ['stacked', false]
          , ['percent', false]
          , ['roundLongest', false]
          , ['fill', false] ],

        refresh: function() {
            this._r.pause();
            this.killAllAnimations();
            if (_.isEmpty(this._data._data)) {
                this.clear();
                return;
            }

            this.flipCache();

            var lines;
            this.lines = lines = [];

            var self       = this
              , multiline  = this._opts.multiline  || false
              , stacked    = this._opts.stacked    || false
              , lineWidth  = this._opts.lineWidth  || 0
              , fill       = this._opts.fill       || false
              , percent    = this._opts.percent    || false
              , lineColor  = p.accessor(this._opts.lineColor    , this.style('color'))
              , marker     = this._opts.marker || 4 //TODO
              , cumulativeHeight = []
              , cumulativeValue  = []
              ;

            var longest = percent ? 100 : p.max(this._data._data, this.dataValue, this.dataLine, multiline, stacked);


            var shortest = percent ? 100 : p.min(this._data._data, this.dataValue, this.dataLine, multiline, stacked);
            var longShort = pythia.axisScale(longest, shortest, 5);
            longest = longShort[0];
            shortest = longShort[1];

            if (this._opts.roundLongest) {
                longest = this.roundLongest(longest);
            }
            this.longest = longest;
            this.shortest = shortest;
            this.step = longShort[2];

            var stepSize;

            var totals = {};

            var data = this._data._data;
            if (multiline && percent) {
                _.each(data, function (line, lineKey) {
                    _.each(this.dataLine(line), function (d, key) {
                        if (_.isUndefined(totals[key])) {
                            totals[key] = 0;
                        }
                        totals[key] += this.dataValue(d, key, lineKey);
                    }, this);
                }, this);
            }

            var offset = 0;
            if (!percent && !stacked) {
                offset = shortest < 0 ? -1 * shortest : 0;
            }

            if (multiline) {
                stepSize =  100 / (_.size(this.dataLine(data[0])) - 1);
            } else {
                stepSize = 100 / (_.size(data) - 1);
            }
            var last;

            if (multiline) {
                _.each(data, function(line, lineNo) { addLine(line, lineNo); });
            } else { //not multiline
                addLine(data, 0);
            }

            function addLine(line, lineNumber) {
                var vertices = [];
                var oldHeight = [];

                var i = 0;
                var points = [];
                _.each(self.dataLine(line), function(element, key) {
                  var value;
                    if (percent) {
                        value = self.dataValue(element, key, lineNumber)/totals[key] * 100;
                    } else {
                        value = self.dataValue(element, key, lineNumber);
                    }

                    var height = (value + offset)/(longest + offset) * 100;


                    oldHeight[i] = cumulativeHeight[i] || 0;
                    cumulativeValue[i] = cumulativeValue[i] || 0;
                    if (stacked && lineNumber) {
                        height = (cumulativeHeight[i] += height);
                        cumulativeValue[i] += value;
                    } else {
                        cumulativeHeight[i] = height;
                        cumulativeValue[i] = value;
                    }

                    var y = 100 - height;
                    if (y < 0.001 && y > -0.001) {
                        y = 0;
                    }

                    var vertex = [stepSize * i, y];
                    vertices.push(vertex);
                    points.push([element, key, vertex, value]);
                    ++i;
                });

                var lineElement = self.cache(self.dataLineId(line), 'line');
                var cached = false;
                if (!lineElement) {


                    lineElement = self.line( [vertices[0]]
                                        , p.chainStyle(self.style, {
                                             'line-width': lineWidth
                                           , 'strokeColor': lineColor(line, lineNumber)
                                          })
                                        ).data(line, line, line.id, line.id);
                } else {
                    cached = true;
                    //lineElement._vertices = vertices;
                }
                lineElement._last = false;
                var color = lineElement._style('strokeColor');

                lines.push(lineElement);
                self.cache(self.dataLineId(line), 'line', lineElement);

                var pointElements = [];

                _.each(points, function (p,i) {
                    var point = self.cache([self.dataLineId(line), i], 'point');

                    if (!point) {
                        point = self.circleSlice
                                        ( p[2]
                                        , 4
                                        , 0
                                        , Math.PI * 2.1
                                        , pythia.chainStyle
                                            ( self.style
                                            , {color: color
                                            , pointerEvents: 'always'
                                            , stroke: false
                                            , size:'fixed'}
                                            )
                                        ).addClass('point');

                          point.style.pointerEvents = 'always';
                          point.parent(lineElement);
                    } else {
                    }

                    point.data(p[0], line, p[1], line.id);
                    point._total = cumulativeValue[i];
                    point.value = p[3];


                    pointElements.push(point);
                    self.cache([self.dataLineId(line), i], 'point', point);
                });

                if (fill) {
                    var path =
                        self.cache([self.dataLineId(line)], 'fill');

                    if (!path) {
                        path = self.path()
                                       .move(vertices[0]);

                        //_.each(vertices, function(v) {
                        //   path.line(v);
                        //});

                        //for (var i = oldHeight.length - 1; i >= 0; --i) {
                        //   path.line([vertices[i][0], 100 - oldHeight[i]]);
                        //}
                        path.oldBottom = oldHeight;

                        path.style(p.chainStyle(self.style, {
                            color: color,
                            alpha: 0.6,
                            fill: true,
                            stroke: false,
                            pointerEvents:'always'
                        }));

                        path.addClass('fill')
                            .refresh();
                        path.toBottom();
                        path._vertices = vertices;
                    } else {
                        path.wasFill = true;
                    }

                    path.data(line, line, line.id, line.id);
                    self.cache([self.dataLineId(line)], 'fill', path);
                }

                if (cached) {
                    self.animate(
                        self.doTranslate(
                            lineElement,
                            pointElements,
                            lineElement._vertices.clone(),
                            vertices,
                            path,
                            oldHeight,
                            fill && path.oldBottom && path.oldBottom.clone()
                        ),
                        500
                    );
                } else {
                    self.animate(
                        self.doEnter(
                            lineElement,
                            pointElements,
                            vertices,
                            path,
                            oldHeight
                        ),
                        500
                    );
                }
                last = lineElement;
            }
            last._last = true;

            this.flushCache();
            this._r.unPause();

            return this;
        },

        doEnter: function (line, points, vertices, fill, fillBottom) {
            var length = vertices.length;
            fillBottom = _.map(fillBottom, function (n) {return 100 - n});

            return function (scale) {
                var x, y, i, xTmp, furthest = 0;

                fill && fill.reset();

                var furthestIndex = scale * (length - 1);

                for (i = 0; i < furthestIndex; ++i) {
                    x = vertices[i][0];
                    y = vertices[i][1];

                    if (!line._vertices[i]) {
                        line._vertices[i] = [x,y];
                    } else {
                        line._vertices[i][0] = x;
                        line._vertices[i][1] = y;
                    }

                    if (fill) {
                        if (i === 0) {
                            fill.move([x,y]);
                        } else {
                            fill.line([x,y]);
                        }
                    }
                }

                if (i !== length) {
                    var furthestPoint = interpolatePoint(vertices, scale);
                    line._vertices[i] = furthestPoint;
                }

                line.updateTransform();

                if (fill) {
                    if (i !== length) {
                        fill.line(furthestPoint);
                        var furthestBot = interpolate(fillBottom, scale);
                        fill.line([line._vertices[i][0], furthestBot]);
                    }

                    for (--i; i >= 0; --i) {
                        fill.line([line._vertices[i][0], fillBottom[i]]);
                    }

                    fill.updateTransform();
                }
            }
        },

        doExit: function (el) {
            if (el.hasClass('line')) {
                return function (scale) {
                    if (scale === 1) {
                        el.remove();
                        return;
                    }

                    var furthest = interpolatePoint(el._vertices, scale)
                      , length = el._vertices.length
                      , furthestIndex = Math.ceil(scale * (length - 1))
                      , newVertices = [furthest];

                    for (var i = furthestIndex; i < length; ++i) {
                        newVertices.push(el._vertices[i]);
                    }

                    el._vertices = newVertices;
                    el.updateTransform();
                }
            } else if (el.hasClass('fill')) {

                var verts = _.filter(el._path, _.isArray);

                return function (scale) {
                    if (scale === 1) {
                        el.remove();
                        return;
                    }

                    var furthest = interpolatePoint(el._vertices, scale);
                    var i = 0;
                    _.each(verts, function (v) {
                        if (v[0] < furthest[0]) {
                            v[0] = furthest[0];
                            if (i < 1) {
                                v[1] = furthest[1];
                                ++i;
                            }
                        }
                    });

                    el.updateTransform();
                }
            }
        },

        doTranslate: function (line, points, oldVertices, newVertices, fill, fillBottom, oldFillBottom) {
            var length    = newVertices.length;
            line._vertices = line._vertices.slice(0,length);

            if (oldVertices.length < length) {
                for (var i = oldVertices.length; i < length; ++i) {
                    oldVertices[i]    = newVertices[i];
                    line._vertices[i] = newVertices[i];
                    oldFillBottom[i]  = newVertices[i][1] + 100;
                }
            }

            return function (scale) {
                var x, y, i;

                if (fill) {
                    fill.reset();
                }

                for (i = 0; i < length; ++i) {
                    x =
                        (newVertices[i][0] - oldVertices[i][0]) * scale +
                        oldVertices[i][0];
                    y =
                        (newVertices[i][1] - oldVertices[i][1]) * scale +
                        oldVertices[i][1];

                    line._vertices[i][0] = x;
                    line._vertices[i][1] = y;

                    points[i]._pos[0] = x;
                    points[i]._pos[1] = y;
                    points[i].repath();
                    points[i].updateTransform();

                    if (fill) {
                        if (i == 0) {
                            fill.move([x,y]);
                        } else {
                            fill.line([x,y]);
                        }
                    }
                }
                if (fill) {
                    for (var i = length - 1; i >= 0; --i) {
                       var height,
                           heightScale, heightFinal,
                           top = points[i]._pos;

                       if (!fill.wasFill) {
                           heightScale = scale * 100;
                           heightFinal = fillBottom[i];

                           height = 100 - Math.min(heightScale, heightFinal);
                       } else {
                           height = 100 - (scale * (fillBottom[i] - oldFillBottom[i]) +
                                           oldFillBottom[i]);
                       }

                       fill.line([top[0], height]);
                    }

                    fill.oldBottom = fillBottom;
                }

                line.updateTransform();
                fill &&
                    fill.updateTransform();
            }

        },

        dofill: function (path, top, bottom) {
            return function (scale) {
                path.reset();
                path.move(top[0]);

                _.each(top, function(v) {
                     path.line(v);
                });

                for (var i = bottom.length - 1; i >= 0; --i) {
                     var y = scale * ((100 - bottom[i]) - top[i][1])

                     path.line([top[i][0], top[i][1] + y]);
                }
                path.updateTransform();
            }
        }
    }));


    function interpolateDim(points, dim, t) {
        var count = points.length - 1;

        var startIndex = furthestIndex(count, t),
            start      = points[startIndex][dim],
            endIndex   = startIndex === t * count ? startIndex : startIndex + 1,
            end        = points[endIndex][dim],
            subT       = t - startIndex;

        return start + subT * (end - start);
    }

    function interpolate(points, t) {
        var count = points.length - 1;

        var startIndex = Math.floor(t * count),
            start      = points[startIndex],
            endIndex   = startIndex === count ? count : startIndex + 1,
            end        = points[endIndex],
            subT       = t * count - startIndex;

        return start + subT * (end - start);
    }

    function interpolatePoint(points, t) {
        var count = points.length - 1;

        var startIndex = Math.floor(t * count),
            start      = points[startIndex],
            endIndex   = startIndex === count ? count : startIndex + 1,
            end        = points[endIndex],
            subT       = t * count - startIndex;

        return [start[0] + subT * (end[0] - start[0]),
                start[1] + subT * (end[1] - start[1])];
    }
})(pythia);
