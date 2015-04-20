var me = this;
var children = me.gameObject.children();
var nameChildren = children.slice(0, 8);
var $99Children = children.slice(6, 8);

function jump() {


    nameChildren.forEach(function(oName, idx) {
        setTimeout(function() {
            oName.transform.tween(true).to({
                scaleX : 0.86,
                scaleY : 0.86
            }, 200).to({
                scaleX : 1,
                scaleY : 1
            }, 200);
        }, idx*100);
    });

    setTimeout(function() {
        $99Children.forEach(function(o9, idx) {
            setTimeout(function() {
                o9.transform.tween(true).to({
                    scaleY : 1.2
                }, 100).to({
                    scaleY : 1
                }, 100);
            }, idx*100);
        });
    }, 1300);

}

setTimeout(function() {
    jump();
    setInterval(jump, 4000);
}, 500);