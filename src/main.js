var inBrowser = false;

function setLoading(percentage) {
    var progress = document.getElementById('progress');
    var star = document.getElementById('progress_star');
    progress.style.width = percentage + '%';
    star.style.left = percentage + '%';
    if(percentage >= 100) {
        document.getElementById('qzone-container').style.display = 'none';
    }
}

function playClickSound() {
}
function playCombine() {
}
function playBG() {
}
function pauseBG() {
}

setLoading(33);

Ext.Loader.addClassPathMappings({
    'NG' : './NG'
});

Unity.quicklyStartStage('main', inBrowser ? 640 : window.innerWidth, inBrowser ? 1136 : window.innerHeight, function(stage) {
    stage.transform.x = inBrowser ? 0 : (window.innerWidth-640)/2;
    Unity.loadGameObject({
        file : 'NG.o',
        beforeLoadAssets : function(oRoot, next) {
            setLoading(66);
            next();
        },
        onFinished : function(obj) {
            stage.add(obj);
            setLoading(96);
            setTimeout(function() {
                setLoading(100);
            }, 200);
        }
    });
});

document.body.addEventListener('touchstart', function(event) {
    event.preventDefault();
}, false);
document.body.addEventListener('touchmove', function (event) {
    event.preventDefault();
}, false);
document.body.addEventListener('touchend', function(event) {
    event.preventDefault();
}, false);