/**
 * @package		Scrollbars
 *
 * @author 		Sven
 * @since 		01-03-2012
 * @version 	0.5.1
 *
 * This package requires MooTools 1.4 >
 *
 * @license The MIT License
 *
 * Copyright (c) 2011-2012 Ceramedia, <http://ceramedia.nl/>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var ScrollBars=ScrollBars||new Class({version:"0.5.1",Implements:[Options],element:null,timer:null,fadeTimer:null,nativeScrollBarSize:0,options:{scrollBarSize:15,scrollStep:20,addBar:true,barOverContent:false,fade:false},initialize:function(c,a){this.element=document.id(c);
if(!Browser.ie&&!$("webkit_hide_scrollbars")){document.id(document.body).adopt(new Element("style",{id:"webkit_hide_scrollbars",text:".scrollbar-content::-webkit-scrollbar{visibility:hidden;} .scrollbar-content .scrollbar-content-wrapper:after{clear: both;}"}))
}var b=new Element("div",{styles:{height:"50px",overflow:"scroll"}}).adopt(new Element("div",{styles:{height:"60px"}}));document.id(document.body).adopt(b);
this.nativeScrollBarSize=b.getSize().x-b.getScrollSize().x;b.destroy();this.setOptions(a);this.injectHTML();if(this.options.fade){this._addFade(this.options.fade)
}window.addEvent("load",this.updateScrollBars.bind(this));window.addEvent("resize",this.updateScrollBars.bind(this))},injectHTML:function(){if(this.element.getElement("ul.scrollbar")){this.element.getElements("ul.scrollbar").destroy()
}this.element.setStyles({overflow:"hidden",position:"relative"});var a=new Element("div",{"class":"scrollbar-content",styles:{"padding-right":this.nativeScrollBarSize,"padding-bottom":this.nativeScrollBarSize,overflow:"hidden",height:"100%",width:"100%"}}).adopt(new Element("div",{"class":"scrollbar-content-wrapper",styles:{"float":"left","margin-right":-this.nativeScrollBarSize,"margin-bottom":-this.nativeScrollBarSize}}).adopt(this.element.childNodes));
this.element.adopt(a);this.element.grab(new Element("ul",{"class":"scrollbar vertical",styles:{position:"absolute",right:0,width:this.options.scrollBarSize}}).adopt([new Element("li",{"class":"scroll bar-wrapper",styles:{position:"absolute",top:0,bottom:0,"min-width":this.options.scrollBarSize}}),new Element("li",{"class":"scroll up",text:"up",styles:{position:"absolute",top:0,"min-height":this.options.scrollBarSize,"min-width":this.options.scrollBarSize}}).addEvents({mousedown:function(){this.element.getElement(".scrollbar-content").scrollTo(this.element.getElement(".scrollbar-content").getScroll().x,this.element.getElement(".scrollbar-content").getScroll().y-this.options.scrollStep);
this.timer=this.element.getElement("ul.scrollbar.vertical li.scroll.up").fireEvent.delay(100,this.element.getElement("ul.scrollbar.vertical li.scroll.up"),"mousedown")
}.bind(this),mouseup:function(){clearTimeout(this.timer)}.bind(this),mouseleave:function(){clearTimeout(this.timer)}.bind(this)}),new Element("li",{"class":"scroll down",text:"down",styles:{position:"absolute",bottom:0,"min-height":this.options.scrollBarSize,"min-width":this.options.scrollBarSize}}).addEvents({mousedown:function(){this.element.getElement(".scrollbar-content").scrollTo(this.element.getElement(".scrollbar-content").getScroll().x,this.element.getElement(".scrollbar-content").getScroll().y+this.options.scrollStep);
this.timer=this.element.getElement("ul.scrollbar.vertical li.scroll.down").fireEvent.delay(100,this.element.getElement("ul.scrollbar.vertical li.scroll.down"),"mousedown")
}.bind(this),mouseup:function(){clearTimeout(this.timer)}.bind(this),mouseleave:function(){clearTimeout(this.timer)}.bind(this)})]),"top");
this.element.grab(new Element("ul",{"class":"scrollbar horizontal",styles:{position:"absolute",bottom:0,height:this.options.scrollBarSize}}).adopt([new Element("li",{"class":"scroll bar-wrapper",styles:{position:"absolute",left:0,right:0,"min-height":this.options.scrollBarSize}}),new Element("li",{"class":"scroll left",text:"left",styles:{position:"absolute",left:0,"min-height":this.options.scrollBarSize,"min-width":this.options.scrollBarSize}}).addEvents({mousedown:function(){this.element.getElement(".scrollbar-content").scrollTo(this.element.getElement(".scrollbar-content").getScroll().x-this.options.scrollStep,this.element.getElement(".scrollbar-content").getScroll().y);
this.timer=this.element.getElement("ul.scrollbar.horizontal li.scroll.left").fireEvent.delay(100,this.element.getElement("ul.scrollbar.horizontal li.scroll.left"),"mousedown")
}.bind(this),mouseup:function(){clearTimeout(this.timer)}.bind(this),mouseleave:function(){clearTimeout(this.timer)}.bind(this)}),new Element("li",{"class":"scroll right",text:"right",styles:{position:"absolute",right:0,"min-height":this.options.scrollBarSize,"min-width":this.options.scrollBarSize}}).addEvents({mousedown:function(){this.element.getElement(".scrollbar-content").scrollTo(this.element.getElement(".scrollbar-content").getScroll().x+this.options.scrollStep,this.element.getElement(".scrollbar-content").getScroll().y);
this.timer=this.element.getElement("ul.scrollbar.horizontal li.scroll.right").fireEvent.delay(100,this.element.getElement("ul.scrollbar.horizontal li.scroll.right"),"mousedown")
}.bind(this),mouseup:function(){clearTimeout(this.timer)}.bind(this),mouseleave:function(){clearTimeout(this.timer)}.bind(this)})]),"top");
if(this.options.addBar){this.injectBarHtml()}},injectBarHtml:function(){var c=this.element.getElement("ul.scrollbar.vertical li.scroll.bar-wrapper");
var a=this.element.getElement("ul.scrollbar.horizontal li.scroll.bar-wrapper");c.adopt(new Element("div",{"class":"scroll bar",styles:{position:"absolute",width:"100%"}}));
a.adopt(new Element("div",{"class":"scroll bar",styles:{position:"absolute",height:"100%"}}));var d=null;var b=null;c.addEvents({mousedown:function(e){this.element.getElement(".scrollbar-content").scrollTo(this.element.getElement(".scrollbar-content").getScroll().x,this.element.getElement(".scrollbar-content").getScrollSize().y*((e.page.y-(c.getElement(".scroll.bar").getSize().y/2)-c.getPosition().y)/c.getSize().y));
document.id(document.body).addEvent("mousemove",d=function(f){f.stop();this.element.getElement(".scrollbar-content").scrollTo(this.element.getElement(".scrollbar-content").getScroll().x,this.element.getElement(".scrollbar-content").getScrollSize().y*((f.page.y-(c.getElement(".scroll.bar").getSize().y/2)-c.getPosition().y)/c.getSize().y));
document.id(document.body).focus()}.bind(this));return false}.bind(this)});a.addEvents({mousedown:function(e){this.element.getElement(".scrollbar-content").scrollTo(this.element.getElement(".scrollbar-content").getScrollSize().x*((e.page.x-(a.getElement(".scroll.bar").getSize().x/2)-a.getPosition().x)/a.getSize().x),this.element.getElement(".scrollbar-content").getScroll().y);
document.id(document.body).addEvent("mousemove",b=function(f){f.stop();this.element.getElement(".scrollbar-content").scrollTo(this.element.getElement(".scrollbar-content").getScrollSize().x*((f.page.x-(a.getElement(".scroll.bar").getSize().x/2)-a.getPosition().x)/a.getSize().x),this.element.getElement(".scrollbar-content").getScroll().y);
document.id(document.body).focus()}.bind(this));return false}.bind(this)});document.id(document.body).addEvent("mouseup",function(){document.id(document.body).removeEvent("mousemove",d);
document.id(document.body).removeEvent("mousemove",b)});this.element.getElement(".scrollbar-content").addEvent("scroll",function(){var h=Math.floor((this.element.getElement(".scrollbar-content").getScroll().y/this.element.getElement(".scrollbar-content").getScrollSize().y)*100),g=Math.floor((this.element.getElement(".scrollbar-content").getScroll().x/this.element.getElement(".scrollbar-content").getScrollSize().x)*100),f=this.element.getElement("ul.scrollbar.vertical li.scroll.bar-wrapper .scroll.bar"),e=this.element.getElement("ul.scrollbar.horizontal li.scroll.bar-wrapper .scroll.bar");
if(!Browser.ie&&f.getStyle("height").toInt()+h>=100){f.setStyle("bottom","0");f.setStyle("top","auto")}else{f.setStyle("top",h+"%");
f.setStyle("bottom","auto")}if(!Browser.ie&&e.getStyle("width").toInt()+g>=100){e.setStyle("right","0");e.setStyle("left","auto")
}else{e.setStyle("left",g+"%");e.setStyle("right","auto")}}.bind(this)).fireEvent("scroll")},updateScrollBars:function(){var c=this.element.getElement(".scrollbar-content");
this.element.getElement("ul.scrollbar.vertical").setStyle("height",this.element.getSize().y-this.element.getElement("ul.scrollbar.horizontal").getSize().y);
this.element.getElement("ul.scrollbar.horizontal").setStyle("width",this.element.getSize().x-this.element.getElement("ul.scrollbar.vertical").getSize().x);
if(this.options.addBar){var b=this.element.getElement("ul.scrollbar.vertical li.scroll.bar-wrapper").setStyles({top:0,bottom:0});
var a=this.element.getElement("ul.scrollbar.horizontal li.scroll.bar-wrapper").setStyles({left:0,right:0});if(this.element.getElement("li.scroll.up").getPosition(this.element).y<c.getSize().y/2){b.setStyle("top",b.getStyle("top").toInt()+this.element.getElement("li.scroll.up").getSize().y)
}if(this.element.getElement("li.scroll.down").getPosition(this.element).y<c.getSize().y/2){b.setStyle("top",b.getStyle("top").toInt()+this.element.getElement("li.scroll.down").getSize().y)
}if(this.element.getElement("li.scroll.up").getPosition(this.element).y>c.getSize().y/2){b.setStyle("bottom",b.getStyle("bottom").toInt()+this.element.getElement("li.scroll.up").getSize().y)
}if(this.element.getElement("li.scroll.down").getPosition(this.element).y>c.getSize().y/2){b.setStyle("bottom",b.getStyle("bottom").toInt()+this.element.getElement("li.scroll.down").getSize().y)
}if(this.element.getElement("li.scroll.left").getPosition(this.element).x<c.getSize().x/2){a.setStyle("left",a.getStyle("left").toInt()+this.element.getElement("li.scroll.left").getSize().x)
}if(this.element.getElement("li.scroll.right").getPosition(this.element).x<c.getSize().x/2){a.setStyle("left",a.getStyle("left").toInt()+this.element.getElement("li.scroll.right").getSize().x)
}if(this.element.getElement("li.scroll.left").getPosition(this.element).x>c.getSize().x/2){a.setStyle("right",a.getStyle("right").toInt()+this.element.getElement("li.scroll.left").getSize().x)
}if(this.element.getElement("li.scroll.right").getPosition(this.element).x>c.getSize().x/2){a.setStyle("right",a.getStyle("right").toInt()+this.element.getElement("li.scroll.right").getSize().x)
}b.getElement(".scroll.bar").setStyle("height",Math.min(100,Math.ceil(((c.getSize().y-(Browser.ie?this.nativeScrollBarSize:0))/c.getScrollSize().y)*100))+"%");
a.getElement(".scroll.bar").setStyle("width",Math.min(100,Math.ceil(((c.getSize().x-(Browser.ie?this.nativeScrollBarSize:0))/c.getScrollSize().x)*100))+"%");
c.fireEvent("scroll")}if(!this.element.getElement("ul.scrollbar.vertical").hasClass("inactive")&&c.getScrollSize().y<=c.getSize().y){this.element.getElement("ul.scrollbar.vertical").addClass("inactive")
}else{if(c.getScrollSize().y>c.getSize().y){this.element.getElement("ul.scrollbar.vertical").removeClass("inactive")}}if(!this.element.getElement("ul.scrollbar.horizontal").hasClass("inactive")&&c.getScrollSize().x<=c.getSize().x){this.element.getElement("ul.scrollbar.horizontal").addClass("inactive")
}else{if(c.getScrollSize().x>c.getSize().x){this.element.getElement("ul.scrollbar.horizontal").removeClass("inactive")}}if(this.options.barOverContent||(this.element.getElement("ul.scrollbar.vertical").getStyle("display")=="none"&&this.element.getElement("ul.scrollbar.horizontal").getStyle("display")=="none")){c.getElement(".scrollbar-content-wrapper").setStyles({"padding-right":0,"padding-bottom":0})
}else{if(this.element.getElement("ul.scrollbar.vertical").getStyle("display")=="none"){c.getElement(".scrollbar-content-wrapper").setStyles({"padding-right":0,"padding-bottom":this.options.scrollBarSize})
}else{if(this.element.getElement("ul.scrollbar.horizontal").getStyle("display")=="none"){c.getElement(".scrollbar-content-wrapper").setStyles({"padding-right":this.options.scrollBarSize,"padding-bottom":0})
}else{c.getElement(".scrollbar-content-wrapper").setStyles({"padding-right":this.options.scrollBarSize,"padding-bottom":this.options.scrollBarSize})
}}}c.setStyle("overflow","scroll");this.element.setStyle("height",this.element.style.height?this.element.getStyle("height"):this.element.getSize().y-this.nativeScrollBarSize)
},fadeBars:function(a){this.element.getChildren("ul.scrollbar").each(function(b){b.getElements("li").each(function(c){c.get("tween").stop();
c.fade(a)})})},_addFade:function(a){a=!parseInt(a)||parseInt(a)<500?500:parseInt(a);this.element.addEvent("mousemove",function(){clearTimeout(this.fadeTimer);
this.fadeBars("show");this.fadeTimer=this.fadeBars.delay(a,this,"out")}.bind(this));this.element.getElement(".scrollbar-content").addEvent("scroll",function(){clearTimeout(this.fadeTimer);
this.fadeBars("show");this.fadeTimer=this.fadeBars.delay(a,this,"out")}.bind(this));this.fadeTimer=this.fadeBars.delay(a,this,"out")
}});Element.implement({scrollbars:function(a){return this.store("scrollbars",new ScrollBars(this,a))}});

/* Scrollbars 0.5.1 */
window.addEvent('load', function(){
	document.getElements('.scrollbars').scrollbars({
		scrollBarSize:10
	});
});