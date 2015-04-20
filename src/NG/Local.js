Ext.define('NG.Local', {

    FIRST_PLAY : 'NG.firstPlay',
    RANKING : 'NG.ranking',
    LASTPLAY : 'NG.last.play',

    ranking : [],
    lastPlay : null,

    game : null,

    lastRankIdx : 0,

    constructor : function(game) {
        this.game = game;
        try {
            this.ranking = JSON.parse(localStorage.getItem(this.RANKING)) || [];
        } catch(e) {
            this.ranking = [];
        }
        try {
            this.lastPlay = JSON.parse(localStorage.getItem(this.LASTPLAY));
        } catch(e) {}

        this.game.on({
            scope : this,
            updateScore : this.saveLastPlay,
            addNumber : this.saveLastPlay,
            retry : function() {
                this.setLastPlay(undefined);
            },
            gameover : function() {
                this.saveLastPlay();
                this.lastRankIdx = this.addRankItem(this.lastPlay);
            }
        });
    },

    saveLastPlay : function() {
        if(!this.lastPlay) {
            this.lastPlay = {
                score : 0,
                level : 0,
                cells : [
                    [], [], [], [], [], []
                ]
            };
        }
        for(var row=0; row<6; row++) {
            for(var col=0; col<6; col++) {
                var go = this.game.cells[row][col].gameObject;
                if(go) {
                    this.lastPlay.cells[row][col] = go.number;
                } else {
                    this.lastPlay.cells[row][col] = undefined;
                }
            }
        }
        this.lastPlay.score = this.game.score;
        this.lastPlay.level = this.game.curLevel;
        this.setLastPlay(this.lastPlay);
    },

    addRankItem : function(item) {
        var rankIdx;
        var canvas = Unity.createCanvas(400, 430);
        var context = canvas.getContext('2d', { antialias : true });
        context.fillStyle = '#000000';
        context.fillRect(0, 0, 400, 430);
        context.translate(8, -78);
        context.scale(0.6, 0.6);
        this.game.oGameArea.doDraw(context);

        item.base64 = canvas.toDataURL();

        context.dispose && context.dispose();
        canvas.dispose && canvas.dispose();

        this.ranking.push(item);
        this.ranking.sort(function(a, b) {
            return a.score - b.score;
        });
        for(var i=0; i<this.ranking.length; i++) {
            if(this.ranking[i] === item) {
                rankIdx = i;
            }
        }
        if(this.ranking.length > 10) {
            this.ranking.unshift();
        }
        localStorage.setItem(this.RANKING, JSON.stringify(this.ranking));
        return rankIdx;
    },

    getRanking : function() {
        return this.ranking;
    },

    getLastPlay : function() {
        return this.lastPlay;
    },

    setLastPlay : function(lastPlay) {
        this.lastPlay = lastPlay;
        if(!this.lastPlay) {
            localStorage.removeItem(this.LASTPLAY);
        } else {
            localStorage.setItem(this.LASTPLAY, JSON.stringify(this.lastPlay));
        }
    },

    isFirstPlay : function() {
        return !localStorage.getItem(this.FIRST_PLAY);
    },

    setNoFirstPlay : function() {
        localStorage.setItem(this.FIRST_PLAY, 1);
    }

});