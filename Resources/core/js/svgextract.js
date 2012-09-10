/*!
 * raphaeljs.serialize
 *
 * Copyright (c) 2010 Jonathan Spies
 * Licensed under the MIT license:
 * (http://www.opensource.org/licenses/mit-license.php)
 *
 */

Raphael.fn.serialize = {
  paper: this,

  json: function() {
    var svgdata = [];

    for(var node = paper.bottom; node != null; node = node.next) {
      if (node && node.type) {
        switch(node.type) {
          case "image":
            var object = {
              type: node.type,
              width: node.attrs['width'],
              height: node.attrs['height'],
              x: node.attrs['x'],
              y: node.attrs['y'],
              src: node.attrs['src'],
              transform: node.transformations ? node.transformations.join(' ') : ''
            }
            break;
          case "ellipse":
            var object = {
              type: node.type,
              rx: node.attrs['rx'],
              ry: node.attrs['ry'],
              cx: node.attrs['cx'],
              cy: node.attrs['cy'],
              stroke: node.attrs['stroke'] === 0 ? 'none': node.attrs['stroke'],
              'stroke-width': node.attrs['stroke-width'],
              fill: node.attrs['fill']
            }
            break;
          case "rect":
            var object = {
              type: node.type,
              x: node.attrs['x'],
              y: node.attrs['y'],
              width: node.attrs['width'],
              height: node.attrs['height'],
              stroke: node.attrs['stroke'] === 0 ? 'none': node.attrs['stroke'],
              'stroke-width': node.attrs['stroke-width'],
              fill: node.attrs['fill']
            }
            break;
          case "text":
            var object = {
              type: node.type,
              font: node.attrs['font'],
              'font-family': node.attrs['font-family'],
              'font-size': node.attrs['font-size'],
              stroke: node.attrs['stroke'] === 0 ? 'none': node.attrs['stroke'],
              fill: node.attrs['fill'] === 0 ? 'none' : node.attrs['fill'],
              'stroke-width': node.attrs['stroke-width'],
              x: node.attrs['x'],
              y: node.attrs['y'],
              text: node.attrs['text'],
              'text-anchor': node.attrs['text-anchor']
            }
            break;

          case "path":
            var path = "";

            if(node.attrs['path'].constructor != Array){
              path += node.attrs['path'];
            }
            else{
              $.each(node.attrs['path'], function(i, group) {
                $.each(group,
                  function(index, value) {
                    if (index < 1) {
                        path += value;
                    } else {
                      if (index == (group.length - 1)) {
                        path += value;
                      } else {
                       path += value + ',';
                      }
                    }
                  });
              });
            }

            var object = {
              type: node.type,
              fill: node.attrs['fill'],
              opacity: node.attrs['opacity'],
              translation: node.attrs['translation'],
              scale: node.attrs['scale'],
              path: path,
              stroke: node.attrs['stroke'] === 0 ? 'none': node.attrs['stroke'],
              'stroke-width': node.attrs['stroke-width'],
              transform: node.transformations ? node.transformations.join(' ') : ''
            }
        }

        if (object) {
          svgdata.push(object);
        }
      }
    }

    return(JSON.stringify(svgdata));
  },

  load_json : function(json) {
    if (typeof(json) == "string") { json = JSON.parse(json); } // allow stringified or object input

    var paper = this;
    var set = paper.set();
    $.each(json, function(index, node) {
      try {
        var el = paper[node.type]().attr(node);
        set.push(el);
      } catch(e) {}
    });
    return set;
  }
};
/**
 * innerHTML property for SVGElement
 * Copyright(c) 2010, Jeff Schiller
 *
 * Licensed under the Apache License, Version 2
 *
 * Works in a SVG document in Chrome 6+, Safari 5+, Firefox 4+ and IE9+.
 * Works in a HTML5 document in Chrome 7+, Firefox 4+ and IE9+.
 * Does not work in Opera since it doesn't support the SVGElement interface yet.
 *
 * I haven't decided on the best name for this property - thus the duplication.
 */

(function() {
var serializeXML = function(node, output) {
  var nodeType = node.nodeType;
  if (nodeType == 3) { // TEXT nodes.
    // Replace special XML characters with their entities.
    output.push(node.textContent.replace(/&/, '&amp;').replace(/</, '&lt;').replace('>', '&gt;'));
  } else if (nodeType == 1) { // ELEMENT nodes.
    // Serialize Element nodes.
    output.push('<', node.tagName);
    if (node.hasAttributes()) {
      var attrMap = node.attributes;
      for (var i = 0, len = attrMap.length; i < len; ++i) {
        var attrNode = attrMap.item(i);
        output.push(' ', attrNode.name, '=\'', attrNode.value, '\'');
      }
    }
    if (node.hasChildNodes()) {
      output.push('>');
      var childNodes = node.childNodes;
      for (var i = 0, len = childNodes.length; i < len; ++i) {
        serializeXML(childNodes.item(i), output);
      }
      output.push('</', node.tagName, '>');
    } else {
      output.push('/>');
    }
  } else if (nodeType == 8) {
    // TODO(codedread): Replace special characters with XML entities?
    output.push('<!--', node.nodeValue, '-->');
  } else {
    // TODO: Handle CDATA nodes.
    // TODO: Handle ENTITY nodes.
    // TODO: Handle DOCUMENT nodes.
    throw 'Error serializing XML. Unhandled node of type: ' + nodeType;
  }
}
// The innerHTML DOM property for SVGElement.
Object.defineProperty(SVGElement.prototype, 'innerHTML', {
  get: function() {
    var output = [];
    var childNode = this.firstChild;
    while (childNode) {
      serializeXML(childNode, output);
      childNode = childNode.nextSibling;
    }
    return output.join('');
  },
  set: function(markupText) {
    // Wipe out the current contents of the element.
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }

    try {
      // Parse the markup into valid nodes.
      var dXML = new DOMParser();
      dXML.async = false;
      // Wrap the markup into a SVG node to ensure parsing works.
      sXML = '<svg xmlns=\'http://www.w3.org/2000/svg\'>' + markupText + '</svg>';
      var svgDocElement = dXML.parseFromString(sXML, 'text/xml').documentElement;

      // Now take each node, import it and append to this element.
      var childNode = svgDocElement.firstChild;
      while(childNode) {
        this.appendChild(this.ownerDocument.importNode(childNode, true));
        childNode = childNode.nextSibling;
      }
    } catch(e) {
      throw new Error('Error parsing XML string');
    };
  }
});

// The innerSVG DOM property for SVGElement.
Object.defineProperty(SVGElement.prototype, 'innerSVG', {
  get: function() {
    return this.innerHTML;
  },
  set: function(markupText) {
    this.innerHTML = markupText;
  }
});

})();
