var me = this;
me.gameObject.on({
    scope : me,
    touch : function() {
        me.gameObject.transform.tween(true).to({
            scaleX : 1.2,
            scaleY : 1.2
        }, 120);
    },
    release : function() {
        me.gameObject.transform.tween(true).to({
            scaleX : 1,
            scaleY : 1
        }, 120);
    }
});