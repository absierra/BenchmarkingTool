(function (B, window, document) {
    "use strict";
	
	function matches(name, breakdown, selectedWithParents){
		if(breakdown == 'department'){
			var toCheck = selectedWithParents.Departments;
		}else if(breakdown == 'fund'){
			var toCheck = selectedWithParents.Funds;
		}else if(breakdown == 'ledger'){
			var toCheck = selectedWithParents.Ledger;
		}
		for (var level1 in toCheck){
			for (var level2 in toCheck[level1]){
				if (toCheck[level1][level2][1] == name){
					return true;
				}
			}
		}
		return false;
	}
	
    // Returns an area of notes depending on the breakdown and selected nodes
    function getNotes(breakdown, selectedNodes, selectedWithParents) {
    	//fundBreakdown, department, expense, revenue
		var text = new Array();
		var notes = window.DelphiBudget.budget.notes;
		for (var index in notes){
			var note = notes[index];
			if(note.title != undefined){
				if ((note.fund1 == undefined || matches(note.fund1, 'fund', selectedWithParents) && (note.fund2 == undefined || matches(note.fund2, 'fund', selectedWithParents))) &&
        		(note.dept1 == undefined || matches(note.dept1, 'department', selectedWithParents) && (note.dept2 == undefined || matches(note.dept2, 'department', selectedWithParents))) &&
        		(note.ledger1 == undefined || (matches(note.ledger1, 'ledger', selectedWithParents) && (note.ledger2 == undefined || matches(note.ledger2, 'ledger', selectedWithParents) &&
        		(note.ledger3 == undefined || (matches(note.ledger3, 'ledger', selectedWithParents) && (note.ledger4 == undefined || matches(note.ledger4, 'ledger', selectedWithParents))))))))
				{
					if((breakdown == 'fundBreakdown' && note.fund1 !== undefined) || (breakdown == 'departmentBreakdown' && note.dept1 !== undefined) || ((breakdown == 'expenseBreakdown' || breakdown == 'revenueBreakdown') && note.ledger1 !== undefined)){
    					text.push(note.title);
    					text.push(note.text);
    				}
    			}
			}
		}
		
        return text;
    }


    B.Notes = new window.Class({
        initialize: function () {
            this.overlay = B.Overlay;
            B.Overlay.addCloseItem(this);
            this.container = document.id('notes');
            this.buttonEl  = document.id('notesButton');
            this.textEl    = document.id('notesText');
            this.nextEl    = document.id('notesNext');
            this.prevEl    = document.id('notesPrev');
            this.titleEl   = document.id('notesTitle');
            this.dotsEl    = document.id('notesNav');
            this.attachEvents();
        },
        close : function(){
            this.buttonEl.removeClass('active');
            this.container.slide('out');
            (function() {
                notesNextWrapper.hide();
                notesPrevWrapper.hide();
            }).delay(170);
            this.overlay.hide();
        },
        open : function(){
            this.buttonEl.addClass('active');
            this.container.slide('in');
            (function() {
                notesNextWrapper.show();
                notesPrevWrapper.show();
            }).delay(300);
            this.overlay.show();
        },
        setDeselected : function(){
            this.buttonEl.removeClass('active');
        },

        update: function (enabledBreakdown, selectedNodes, selectedWithParents) {
            this.notes = getNotes(enabledBreakdown, selectedNodes, selectedWithParents);
            this.index = 0;
            this.setText();
        },

        setText: function () {
            var length = this.notes.length/2;

            this.nextEl.removeClass('disabled');
            this.prevEl.removeClass('disabled');
            
            var thisHolder = this;
            
            if (length !== 0) {
            	document.id('notesButton').removeClass('disabled');
                this.textEl.set('html', this.notes[this.index*2+1]);
                this.titleEl.set('html', this.notes[this.index*2]);

                if (this.index === length - 1) {
                    this.nextEl.addClass('disabled');
                }
                if (this.index === 0) {
                    this.prevEl.addClass('disabled');
                }
                
                this.dotsEl.getChildren().each(function(child){child.destroy();});
                for (var i = 0; i < length; i++){
                	var newDot = new Element('li').inject(this.dotsEl);
                	if (i == this.index){
                		newDot.addClass('active');
                	}
                	(function(){
                		var index = i;
                		newDot.addEvent('click', function(){
                			thisHolder.index = index;
                			thisHolder.setText();
                		});
                	})();
                }
            } else {
            	document.id('notesButton').addClass('disabled');
            }
        },

        attachEvents: function () {
            var self = this;
            var notesNextWrapper = document.id('notesNextWrapper');
            var notesPrevWrapper = document.id('notesPrevWrapper');
            document.id('notesWrapper').setStyle('display','block');
            self.container.set('slide', {mode:'horizontal', duration:300}).slide('hide');

            this.buttonEl.addEvent('click', function (event) {
                if (this.buttonEl.hasClass('active')) {
                    self.close();
                } else if (!this.buttonEl.hasClass('disabled')) {
                    B.Overlay.setSelected(this);
                }
                event.stop();
            }.bind(this));

            this.container.addEvent('click:relay(#notesNext:not(.disabled))', function () {
                self.index++;
                self.setText();
            });

            this.container.addEvent('click:relay(#notesPrev:not(.disabled))', function () {
                self.index--;
                self.setText();
            });
            
            //this snippet adds functionality to the keyboard left and right arrows; consider putting this outside notes.js and this functionality, since it's an event added on the document
            //try the Keyboard object: more compatible, more tested, more efficient and nicer to look at
            document.addEvent('keyup', function(event){
                if (document.getElement('#notes').getParent().getStyle('width').trim() !== "0px") //we do a full document selection to get an ID, this is horrific
                {
                    if (event.key == 'left' && !self.prevEl.hasClass('disabled'))
                    {
                        self.container.fireEvent('click:relay(#notesPrev:not(.disabled))');
                    }
                    else if (event.key == 'right' && !self.nextEl.hasClass('disabled'))
                    {
                        self.container.fireEvent('click:relay(#notesNext:not(.disabled))');
                    }
                }
            });

            /*var closeClick = true;
            this.container.addEvent('click', function () {
                closeClick = false;
            });
            this.buttonEl.addEvent('click', function () {
                closeClick = false;
            });

            document.getElement('body').addEvent('click', function () {
                if (closeClick && self.buttonEl.hasClass('active')) {
                    self.container.slide('hide');
                    self.buttonEl.removeClass('active');
                    notesNextWrapper.hide();
                    notesPrevWrapper.hide();
                }
                closeClick = true;
            });*/
        }
    });

}(DelphiBudget, window, document));
