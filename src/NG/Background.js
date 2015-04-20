Ext.define('NG.Background', {

    extend : 'Unity.Component',

    ctype : 'NG_BG',

    configs : {
        props : [{
            name : 'lineWidth',
            type : 'int',
            defaultValue : 2000
        }, {
            name : 'lineHeight',
            type : 'int',
            defaulvalue : 100
        }, {
            name : 'lineCount',
            type : 'int',
            defaultValue : 20
        }, {
            name : 'bgColor',
            type : 'string'
        }, {
            name : 'lineColor',
            type : 'string'
        }]
    },

    startX : null,

    init : function() {
        this.startX = this.gameObject.transform.x;
        this.animate();
    },

    animate : function() {
        this.gameObject.transform.tween(true).to({
            x : this.startX + this.lineHeight*4
        }, 3000).loop = true;
    },

    stop : function() {
        var me = this;
        var time = 3000 - 3000 * ((me.gameObject.transform.x - me.startX) / (me.lineHeight*4));
        me.gameObject.transform.tween(true).to({
            x : me.startX + me.lineHeight*4
        }, time).call(function() {
            me.gameObject.transform.x = me.startX;
        });
    },

    draw : function(context) {
        context.fillStyle = this.bgColor;
        context.fillRect(-2000, -2000, 4000, 4000);
        context.fillStyle = this.lineColor;
        for(var i=0; i<this.lineCount; i+=2) {
            context.fillRect(0, i*this.lineHeight, this.lineWidth, this.lineHeight);
        }
    }

});