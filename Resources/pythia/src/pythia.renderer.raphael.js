(function (p) {
    "use strict";

    var r = {};

    r.remove = function (el) {
        if (el._raph) {
            el._raph.remove();
        }
    }

    r.init = function (container, element) {
        var r = this;
        this._paper = Raphael(container).setSize(10,10);

        pythia.element.append('refresh', function () {
            var self = this;

            var old = this._raph;
            if (this._path)
                this._raph = r.path(this._path, this._style, this._raph);

            this._mousedOver = false;

            var onMouseOver = self.processEvent('mouseover');
            var onMouseOut = self.processEvent('mouseout');
            //TODO fix events on refreshed text
            if (old !== this._raph) {
                //this._raph.hover(this.processEvent('mouseover'), this.processEvent('mouseout'), this, this);
                this._raph.hover(function () {
                    if (!self._mousedOver) {
                        self._mousedOver = true;
                        onMouseOver.call(self);
                    }
                }, function () {
                    if (self._mousedOver) {
                        self._mousedOver = false;
                        onMouseOut.call(self);
                    }
                }, this, this);
                this._raph.click(this.processEvent('click'), this);
            }

            return this;
        });

        pythia.element.append('center', function () {
            var box = this._raph.getBBox(true);
            return [box.x + box.width/2, box.y + box.height/2];
        });

        pythia.element.append('bounds', function () {
            var box = this._raph.getBBox(true);
            return {min: [box.x, box.y], max:[box.x2, box.y2]};
        });

        pythia.element.extend('toTop', function () {
            if (this._raph)
                this._raph.toFront();
            _.each(this._children, function (c) {
                c.toTop();
            });
        });

        pythia.element.extend('toBottom', function () {
            _.each(this._children, function (c) {
                c.toBottom();
            });
            if (this._raph)
                this._raph.toBack();
            return this;
        });

        pythia.element.extend('calcTransform', function (cumulativeT) {
            cumulativeT = cumulativeT || this._parent._totalT;
            this._scale = 1;

            if (this.hasClass('port')) {
                var scaleX = Math.sqrt(cumulativeT[0] * cumulativeT[0] + cumulativeT[1] * cumulativeT[1]);
                var scaleY = Math.sqrt(cumulativeT[3] * cumulativeT[3] + cumulativeT[4] * cumulativeT[4]);
                var sx = ((this._r._size[0] - this._dim[0]) / 100) / scaleX;
                var sy = ((this._r._size[1] - this._dim[1]) / 100) / scaleY;
                this.scaleT = [ sx, 0 , 0
                              , 0 , sy, 0
                              , 0 , 0 , 1
                              ];
            }

            if (this._style && this._style('size') === 'fixed') {
                var cumulativeS = p.mCopy(cumulativeT);

                var scaleX = Math.sqrt(cumulativeT[0] * cumulativeT[0] + cumulativeT[1] * cumulativeT[1]);
                var scaleY = Math.sqrt(cumulativeT[3] * cumulativeT[3] + cumulativeT[4] * cumulativeT[4]);
                cumulativeS[0] = cumulativeT[0] / scaleX;
                cumulativeS[1] = cumulativeT[1] / scaleX;
                cumulativeS[3] = cumulativeT[3] / scaleY;
                cumulativeS[4] = cumulativeT[4] / scaleY;
            } else {
                cumulativeS = cumulativeT;
            }


            var pos = [this.translateT[2], this.translateT[5]];

            if (this.hasClass('text')) {
                if (this._raph) {
                    if (this._style && this._style('baseline') === 'bottom') {
                        var box = this._raph.getBBox(true);
                        pos[1] -= box.height/2
                    } else
                    if (this._style && this._style('baseline') === 'top') {
                        var box = this._raph.getBBox(true);
                        pos[1] += box.height/2
                    }
                }
            }

            var newPos;
            if (this._style && this._style('position') === 'fixed-horizontal') {

                var transformedPos = p.mMulV(cumulativeT, pos);
                newPos = [transformedPos[0], pos[1]];

            } else if (this._style && this._style('position') === 'fixed-vertical') {

                var transformedPos = p.mMulV(cumulativeT, pos);
                newPos = [pos[0], transformedPos[1]];

            } else if (this._style && this._style('position') === 'fixed') {

                newPos = pos;

            } else {
                newPos = p.mMulV(cumulativeT, pos);
            }

            if (this._style && this._style('yrelative') === 'bottom') {
                newPos[1] = this._r._size[1] - newPos[1];
            }


            var transform = p.mCopy(this.scaleT);

            var totalT = p.mMulM(cumulativeS, transform);
            totalT = p.mMulM(this.rotateT, totalT);
            totalT[2] = newPos[0];
            totalT[5] = newPos[1];


            if (this._style && this._style('size') === 'proportional') {
                var scaleX = Math.sqrt(totalT[0] * totalT[0] + totalT[1] * totalT[1]);
                var scaleY = Math.sqrt(totalT[3] * totalT[3] + totalT[4] * totalT[4]);

                if (scaleX > scaleY) {
                    var rescale = scaleY / scaleX;
                    totalT[0] *= rescale;
                    totalT[1] *= rescale;
                    this._proportionalDim = 0;
                    this._scale = scaleY;
                } else {
                    var rescale = scaleX / scaleY;
                    totalT[3] *= rescale;
                    totalT[4] *= rescale;
                    this._proportionalDim = 1;
                    this._scale = scaleX;
                }
            }

            this._proportianalScale = rescale;

            this._totalT = totalT;

            return this._totalT;
        });

        pythia.element.extend('renderedPos', function (pos) {
            var totalT = this.calcTransform();
            return p.mMulV(totalT, pos);
        });

        pythia.element.extend('updateTransform', function (cumulativeT) {
            var totalT = this.calcTransform(cumulativeT);

            //Workaround for bad line scaling in firefox and older webkit
            //and IE
            if (this.hasClass('line') && this._vertices.length) {
                var tv = p.mMulV(this._totalT, this._vertices[0]);
                var pathM = ['M' + tv[0] + ',' + tv[1] + 'L'];
                var pathL = [];
                var pathHack1 = ['L'];
                var pathHack2 = [];
                _.each(this._vertices, function (v) {
                    tv = p.mMulV(this._totalT ,v);
                    //pathL.push(tv[0]);
                    //pathL.push(tv[1]);

                    // TODO: Use stroke width for this hack
                    pathHack1.push(tv[0]);
                    pathHack1.push(tv[1] + 1);
                    pathHack2.unshift(tv[1] - 1);
                    pathHack2.unshift(tv[0]);
                }, this);
                if (this.lineWidth) {
                    this._raph.node.style.strokeWidth = this.lineWidth;
                }
                pathHack2.unshift('L');
                var joinM = pathM.join('');
                var joinL = pathL.join(',');

                //this._raph.attr('path', joinM + joinL);
                this._raph.attr('path', joinM + pathHack1.join(',') + pathHack2.join(','));
                this._raph.attr('fill', p.color(this._style('strokeColor')).html());
            } else if (this.hasClass('path')) {
                var path = [];
                _.each(this._path, function (p) {
                    if (_.isArray(p)) {
                        path.push(pythia.mMulV(this._totalT, p));
                    } else {
                        path.push(p);
                    }
                }, this);

                this._raph.attr('path', path);
            } else if (this.hasClass('circleSlice') && this._pos) {
                var scaleX = Math.sqrt(totalT[0] * totalT[0] + totalT[1] * totalT[1]);
                var scaleY = Math.sqrt(totalT[3] * totalT[3] + totalT[4] * totalT[4]);
                var isCircle;

                if ((1.99 * Math.PI) < this._angle) {
                    isCircle = true;
                }

                var pos    = pythia.mMulV(totalT, [0,0]);
                var radius = this._radius * (scaleX > scaleY ? scaleX : scaleY);
                var pathL = [];

                if (false && isCircle) {
                    if (!this._raph.isCircle) {
                        var oldattr = this._raph.attr();
                        this._raph.remove();
                        this._raph = this._r._paper.circle(pos[0], pos[1], radius);
                        this._raph.attr(oldattr);
                        this._raph.isCircle = true;
                    } else {
                        this._raph.attr({cx:pos[0], cy:pos[1], radius:radius});
                    }
                } else {
                    var vertCount = Math.floor(radius * this._angle / Math.PI);
                    vertCount = Math.max(vertCount, 15);
                    var vertices = arc(pos[0], pos[1], radius, this._startAngle, this._angle, vertCount);

                    _.each(vertices, function (v) {
                        //tv = p.mMulV(this._totalT ,v);
                        pathL.push(v[0]);
                        pathL.push(v[1]);
                    }, this);
                    var joinL = pathL.join(',');

                    if (isCircle) {
                        var path = 'M' + vertices[0].join(',') + 'L' + joinL;
                    } else {
                        var path = 'M' + pos.join(',') + 'L' + joinL;
                    }

                    this._raph.attr('path', path + 'Z');
                }
            } else {
                var m =  Raphael.matrix(
                               totalT[0], totalT[1],  totalT[3]
                             , totalT[4], totalT[2],  totalT[5]);

                if (this._raph) {
                    this._raph.transform(m.toTransformString());
                }
            }

            if (this.hasClass('axis')) {
                this.toBottom();
            }

            _.each(this._children, function (child) {
                if (!child._totalT || this.dirtyScale || this.dirtyPos) {
                    child.dirtyScale = true;
                    child.updateTransform();
                }
            }, this);

            this.dirtyScale = false;

            return this;
        });

        pythia.element.extend('measure', function () {
            var box = this._raph.getBBox(true);
            return [box.width, box.height];
        });


        pythia.elements.path.extend('arc', function (pos, radius, startAngle, angle) {
            var self = this;
            var endAngle = startAngle + angle;
            var p2 = Math.PI/2;

            var a = 0;
            while (a < angle) {
                arc(startAngle, (angle - a) < p2 ? (angle - a) : p2)
                a += Math.PI/2;
                startAngle += Math.PI/2;
            }

            function arc(start, angle) {
                var endPoint = [radius * Math.cos(startAngle + angle) + pos[0]
                               ,radius * Math.sin(startAngle + angle) + pos[1]];
                self._path.push('A', radius, radius, startAngle, 0, 1, endPoint);
            }

            return this;
        });

        pythia.elements.path.append('parent', function () {
            if (this._parent._raph && this._raph && this._parent._raph.node) {
                if (this._parent._raph.node.nextSibling) {
                  this._raph.node.parentNode.insertBefore
                    (this._raph.node, this._parent._raph.node.nextSibling);
                } else {
                  this._raph.node.parentNode(appendChild, this._raph);
                }
            }
        });

        pythia.elements.text.append('parent', function () {
            if (this._parent._raph && this._raph && this._parent._raph.node) {
                if (this._parent._raph.node.nextSibling) {
                  this._raph.node.parentNode.insertBefore
                    (this._raph.node, this._parent._raph.node.nextSibling);
                } else {
                  this._raph.node.parentNode.appendChild(this._raph.node);
                }
            }
        });

        //this.__super.init(container, element);

        this.updateTransform(false);
    }

    r.path = function(path, style, raphPath) {
        style = style || p.style({})
        var fill = (typeof(style('fill')) === 'undefined') ? true : style('fill');
        var alpha = style('alpha') || 1;

        var attr = {};

        attr.fill            = fill ? (p.color(style('color')).html() || p.color(style('fillColor')).html())  : "none";
        attr.stroke          = style('stroke') ? p.color(style('strokeColor')).html() : "none";
        attr['stroke-width'] = style('line-width') || 1;
        attr.opacity = alpha;
        //attr.opacity = style('fillOpacity');

        if (path[0] === 'F') {
            if (style('font-size')) {
                attr['font-size'] = style('font-size');
            }
            if (style('text-align') === 'right') {
                attr['text-anchor'] = 'end';
            }
            if (style('text-align') === 'left') {
                attr['text-anchor'] = 'start';
            }

            attr.stroke = 'none';
            if (raphPath) {
                raphPath.remove();
            }
            raphPath = this._paper.text(0, 0, path[1]).attr(attr);
            var baseline = style('baseline') || 'middle';

            var box = raphPath.getBBox(true);

            if (style('baseline') === 'bottom') {
                raphPath.translate(0, -box.height/2);
            }
            if (style('baseline') === 'top') {
                raphPath.translate(0, box.height/2);
            }
        } else {
            if (raphPath) {
                raphPath.attr('path', path)
                raphPath
                        .attr(attr);
            } else {
                raphPath = this._paper.path(path).attr(attr);
            }
        }

        if (attr.stroke !== 'none') {
            raphPath.node.style.strokeWidth = attr['stroke-width'];
            raphPath.node.style.vectorEffect = 'non-scaling-stroke';
        }

        if (style('pointerEvents') === 'none') {
            raphPath.node.style['pointer-events'] = 'none';
            raphPath.node.style['pointerEvents'] = 'none';
        }

        if (style('z-index')) {
            raphPath.node.style['z-index'] = style('z-index');
            raphPath.node.style['zIndex'] = style('z-index');
        }

        this.render();

        return raphPath;
    }

    r.size = function(dim) {
        this._paper.setSize(dim[0], dim[1]);
        this.__super.size.call(this, dim);
    }

    function arc(cx, cy, r, startAngle, angle, steps) {
        var theta           = angle / (steps - 1)
          , tangetialFactor = Math.tan(theta)
          , radialFactor    = Math.cos(theta)
          , x               = r * Math.cos(startAngle)
          , y               = r * Math.sin(startAngle)
          , vertices        = []
          , tx
          , ty
          , i;

        for(i = 0; i < steps; ++i) {
            //vertices.push(new THREE.Vector3(x + cx, y + cy, 0));
            vertices.push([x + cx, y + cy]);

            tx = -y;
            ty = x;

            x += tx * tangetialFactor;
            y += ty * tangetialFactor;

            x *= radialFactor;
            y *= radialFactor;
        }
        return vertices;
    }

    r.render = p.doNil;

    p.renderer.raphael = p.Class(p.renderer, r);
})(pythia);
