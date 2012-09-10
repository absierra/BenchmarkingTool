(function (B, window, document) {
    "use strict";

    function getInfo(breakdown, selectedNodes, trigger) {
    	if (trigger === 'reset'){
    		return 'Because you disabled all the options in the filter, we\'re assuming you just want to see the default view.';
    	}
    	else if (trigger === 'torev'){
    		return 'Because you excluded all expenses from the filters, you are now looking at only revenues instead of expenses vs. revenues.';
    	}
    	else if (trigger === 'toexp'){
    		return 'Because you excluded all revenues from the filters, you are now looking at only expenses instead of expenses vs. revenues.';
    	}
        else if (trigger === 'collapseDisabledLegend'){
            return 'You cannot collapse this item because it has sub-divisions that have been manually excluded, and to roll them up under this heading would inaccurately suggest that it represents the sum total of its parts.';
        }
        else if (trigger === 'negativeData'){
            return 'Some of the included data contains negative values, so graph types performing aggregations have been disabled.';
        }
        return null;
    }

    B.Info = new window.Class({
        initialize: function () {
            this.container = document.id('info');
            this.attachEvents();
        },

        update: function (enabledBreakdown, selectedNodes, trigger) {
            var text = getInfo(enabledBreakdown, selectedNodes, trigger);
            if (text !== null){
                this.container.set('text', text);
                this.container.style.display = '';
                this.container.fade('in');
            }
            var a = this;
            (function() {
                a.container.fade('out');
            }).delay(9000);
        },

        attachEvents: function () {
            var self = this;
            var infoBox = document.id('info');
        }
    });

}(DelphiBudget, window, document));
