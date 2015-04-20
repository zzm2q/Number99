var me = this;
var oBan = me.gameObject.child('Ban');
NG.audioPaused = false;

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
    },
    tap : function() {
        var active = me.gameObject.child('Ban').isActive(false);
        !active && bgAudio.pause();
        active && bgAudio.play();
        NG.audioPaused = !active;
    }
});

me.update = function() {
    oBan && oBan.setActive(NG.audioPaused);
};

