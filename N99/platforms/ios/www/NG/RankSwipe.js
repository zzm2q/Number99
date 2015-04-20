Ext.define('NG.RankSwipe', {

    extend : 'Unity.Component',

    ctype : 'NG_RankSwipe',

    dragStartX : null,
    dragStartTx : null,

    pageWidth : 440,
    pageCount : 10,

    curPage : 0,

    curFocusCell : null,

    init : function() {
        var me = this;
        me.oPages = me.gameObject.child('RankContainer');
        me.gameObject.on({
            scope: me,
            dragstart : me.onDragStart,
            drag : me.onDrag,
            dragend : me.onDragEnd,
            swipe : me.onSwipe
        });
    },

    onDragStart : function(e) {
        this.dragStartX = e.x;
        this.dragStartTx = this.oPages.transform.x;
        this.oPages.transform.clearTweens();
        this.updateCurPage();
    },

    onDrag : function(e) {
        var deltaX = (e.x - this.dragStartX);
        if(this.oPages.transform.x <= -this.pageWidth * this.pageCount + this.pageWidth && e.gesture.direction === 'left') {
            deltaX /= 3;
        } else if(this.oPages.transform.x >= 0 && e.gesture.direction === 'right') {
            deltaX /= 3;
        }
        this.oPages.transform.x = this.dragStartTx  + deltaX;
    },

    onDragEnd : function(e) {
        this.animateToPage(-Math.round(this.oPages.transform.x / this.pageWidth));
    },

    onSwipe : function(e) {
        e.gesture.stopDetect();
        if(e.gesture.direction === 'left') {
            this.animateToPage(this.curPage + 1);
        } else {
            this.animateToPage(this.curPage - 1);
        }
    },

    animateToPage : function(toPage, time) {
        var me = this;
        if(toPage < 0) {
            toPage = 0;
        } else if(toPage > this.pageCount - 1) {
            toPage =  this.pageCount - 1;
        }
        this.oPages.transform.tween(true).to({
            x : -toPage * this.pageWidth
        }, time || 260).call(function() {
            me.updateCurPage();
        });
    },

    setPageCount : function(pageCount) {
        this.pageCount = pageCount;
    },

    setCurPage : function(curPage) {
        this.curPage = curPage;
        this.animateToPage(this.curPage, 1);
    },

    updateCurPage : function() {
        this.curPage = -Math.round(this.oPages.transform.x / this.pageWidth);
    }

});