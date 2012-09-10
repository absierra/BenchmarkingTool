/*
---
script: tabs.js
description: MGFX.Tabs, extension of base class that adds tabs to control the rotater. 
authors: Sean McArthur (http://seanmonstar.com) 
license: MIT-style license 
requires:
 core/1.3.0: [Event, Element.Event, Fx.CSS]
 more/1.3.0.1: [Fx.Elements]
provides: [MGFX.Tabs]
...
*/

//MGFX.Tabs. Copyright (c) 2008-2011 Sean McArthur <http://seanmonstar.com/>, MIT Style License.
//modded by abbey hawk sparrow
if(!window.MGFX) MGFX = {};

MGFX.Tabs = new Class({
	
	Extends: MGFX.Rotater,
	
	options: {
		autoplay: false,
		onShowSlide: function(slideIndex) {
			this.tabs.removeClass('active');
			this.tabs[slideIndex].addClass('active');
			if(this.options.follower) document.id(this.options.follower).setStyle('margin-top', this.slides[slideIndex].getHeight()+this.tabs[slideIndex].getHeight());
		}
	},
	
	initialize: function(tabs, slides, options){
		this.tabs = $$(tabs);
		this.createTabs();
		if(options && options.hash && window.location.hash) {
			this.getHashIndex(options);
		}
		return this.parent(slides,options);
	},
	
	createTabs: function () {
		var that = this;
		this.tabs.forEach(function(tab,index){
			//need index, thats why theres the forEach
			tab.addEvent('click', function(event){
				if (that.options.clickable) {
					if (!this.match(that.options.clickable)) {
						return false;
					}
				}
				event.preventDefault();
				that.showSlide(index);
				that.stop(true);
				if (that.options.callback) {
						that.options.callback.call(this);
				}
			});
		});
	}.protect(),
	
	getHashIndex: function(options) {
		var hash = window.location.hash.substring(1);
		this.tabs.forEach(function(el, index) {
			if(el.get('id') == hash) {
				options.startIndex = index;
			}
		});
	}.protect()
	
});

if(!window.Tabs) var Tabs = MGFX.Tabs;
