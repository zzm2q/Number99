Ext.define('NG.Game', {

    requires : [
        'NG.Local'
    ],

    extend : 'Unity.cmp.BaseTexture',

    mixins : {
        observable : 'Ext.util.Observable'
    },

    ctype : 'NG_Game',

    local : null,
    oGameArea: null,

    constructor : function() {
        this.callParent(arguments);
        this.mixins.observable.constructor.call(this);
        this.local = new NG.Local(this);
    },

    init : function() {
        var me = this;
        var oGamePanel = me.gameObject.child('GamePanel');

        oGamePanel.transform.regX = me.gameObject.getStage().getWidth() / 2;
        oGamePanel.transform.x = -oGamePanel.transform.regX;

        setTimeout(function() {
            var oBG = me.gameObject.child('BG');
            var oMask = me.gameObject.child('Mask');
            oBG.removeMe();
            oMask.removeMe();
            me.gameObject.getStage().insert(0, oBG);
            me.gameObject.getStage().insert(0, oMask);
            me.oMask = oMask;
            me.oBG = oBG;
        }, 10);
        me.oGameArea = me.gameObject.child('GamePanel').child('GameArea');
        me.oGameArea.transform.y = parseInt((me.gameObject.getStage().getHeight() - 960) /3);

        if(me.oGameArea.transform.y < 0) me.oGameArea.transform.y = 0;
        me.oCurRandomNums = me.oGameArea.child('CurRandomNums');
        me.oNumCt = me.oGameArea.child('NumberCt');
        me.oNextNumCt = me.oGameArea.child('NextNumberCt');
        me.gameObject.on({
            tap : function(e) {
                var target = e.target;
                switch(target.name) {
                    case 'PlayBtn' : me.onPlayBtnClick(); break;
                    case 'NumberCt' : me.onNumberCtClick(e); break;
                    case 'PauseBtn' : me.onPauseBtnClick(); break;
                    case 'PauseMask' : me.onPauseMaskClick(); break;
                    case 'RetryBtn' : me.onRetryBtnClick();  break;
                    case 'ShareBtn' : me.onShareBtnClick(); break;
                    case 'ReturnFromRankBtn' : me.onReturnFromRankBtnClick(); break;
                }
            }
        });

        me.score = 0;

        me.curLevel = 0;
        me.probabilityOfQuestMark = 0.1;
        me.randomLevelBase = [
            0, 0, 0, 0, 0, 0, 0, 0,
            1, 1, 1, 1, 1, 1, 1,
            2, 2, 2, 2, 2, 2,
            3, 3, 3, 3, 3,
            4, 4, 4, 4,
            5, 5, 5
        ];
        me.cells = [ [], [], [], [], [], [] ];

        me.on({
            scope: me,
            joinComplete : function(joinCell, joinCount, combo) {
                if(combo && joinCount > 0) {
                    var oCombo = me.oNextNumCt.child('Combo');
                    oCombo.setActive(true);
                    oCombo.transform.alpha = 0;
                    oCombo.transform.x = joinCell.gameObject.transform.x;
                    oCombo.transform.y = joinCell.gameObject.transform.y;
                    oCombo.transform.scaleX = 0.2;
                    oCombo.transform.scaleY = 0.2;

                    oCombo.transform.tween(true).to({
                        scaleX : 1,
                        scaleY : 1,
                        y : oCombo.transform.y - 80,
                        alpha : 1
                    }, 500, createjs.Ease.getPowOut(10)).to({
                        alpha : 0
                    }, 200).call(function() {
                        oCombo.setActive(false);
                    });
                }
                if(me.local.isFirstPlay()) {
                    Unity.stage.touch.disable();
                    var oYeah = me.oGameArea.child('GuideYeah');
                    oYeah.setActive(true);
                    oYeah.transform.alpha = 0;
                    oYeah.transform.scaleX = 0.2;
                    oYeah.transform.scaleY = 0.2;

                    oYeah.transform.tween(true).to({
                        scaleX : 1,
                        scaleY : 1,
                        y : oYeah.transform.y - 80,
                        alpha : 1
                    }, 500, createjs.Ease.getPowOut(10)).to({
                        alpha : 0
                    }, 200).call(function() {
                        oYeah.setActive(false);
                        var cDialogue = me.gameObject.child('Dialogue').getCmp('NG_Dialogue');
                        cDialogue.showDialogueText("0 => 1 => 2... so easy, let's go!");
                        cDialogue.gameObject.setActive(true);
                        cDialogue.gameObject.on('tap', function() {
                            me.local.setLastPlay();
                            me.local.setNoFirstPlay();
                            me.startGame();
                            cDialogue.gameObject.setActive(false);
                        });
                        setTimeout(function() {
                            Unity.stage.touch.enable();
                        }, 2000);
                    });


                }
            },
            join : function(joinCell, joinCount) {
                if(joinCell.gameObject.number >= me.curLevel + 6) {
                    me.curLevel = joinCell.gameObject.number - 5;

                    // level up animation
                    var newRandomNum = me.curLevel + 5;
                    var oToRemove = me.oCurRandomNums.child('Number' + (me.curLevel-1));
                    oToRemove.setName('Number' + newRandomNum);
                    oToRemove.transform.tween(true).to({
                        alpha : 0
                    }, 100).set({
                        scaleX : 0,
                        scaleY : 0,
                        x : oToRemove.transform.x + 240
                    }).call(function() {
                        oToRemove.getCmp('NG_Number').setNumber(newRandomNum);
                        oToRemove.transform.tween(true).to({
                            scaleX : 0.4,
                            scaleY : 0.4,
                            alpha : 1
                        }, 100);
                    });
                    me.oCurRandomNums.transform.tween(true).to({
                        x : me.oCurRandomNums.transform.x - 40
                    }, 100);
                }

                var deltaScore = joinCell.gameObject.number * joinCount;
                deltaScore *= joinCount / 3;
                deltaScore = parseInt(deltaScore);
                me.score += deltaScore;
                me.updateScore();
                playCombine();
            }
        });
    },

    onPlayBtnClick : function() {
        var me = this;
        setTimeout(function() {
            me.gameObject.transform.tween(true).to({
                x : me.gameObject.getStage().getWidth()
            }, 200).call(function() {
                me.gameObject.child('StartScreen').setActive(false);
                me.startGame();
            });
            me.oBG.transform.tween().to({
                alpha : 0.25
            }, 200);
        }, 200);
    },

    onNumberCtClick : function(e) {
        var me = this;
        var x = e.x - me.oNumCt.transform.x - me.oGameArea.transform.x;
        var y  = e.y - me.oNumCt.transform.y - me.oGameArea.transform.y;
        var row = parseInt(y / 104);
        var col = parseInt(x / 104);

        var cell = this.cells[row][col];
        if(cell.isUsed()) {
            return;
        }

        if(this.curONum.number === '?') {
            var toNum = cell.findMaxNumberOfSublings();
            if(toNum === false) {
                toNum = 0;
            }
            this.curONum.setNumber(toNum);
        }

        this.curONum.transform.clearTweens();
        this.curONum.removeMe(true);

        var toAddONum = this.createNumberGameObject(this.curONum.number, row, col);
        this.oNumCt.add(toAddONum);

        cell.gameObject = toAddONum;

        me.fireEvent('addNumber', toAddONum);
        if(me.local.isFirstPlay()) {
            me.oGameArea.child('Guide').setActive(false);
        }

        playClickSound();
        this.next(cell);
    },

    onPauseBtnClick : function() {
        var me = this;
        me.oGameArea.child('OverBtns').setActive(true);
        me.gameObject.child('GamePanel').transform.tween(true).to({
            scaleX: 0.8,
            scaleY: 0.8
        }, 400);
        me.oGameArea.child('PauseMask').setActive(true);
        me.stopAnimateCurONum();
    },

    onPauseMaskClick : function() {
        var me = this;
        me.oGameArea.child('OverBtns').setActive(false);
        me.gameObject.child('GamePanel').transform.tween(true).to({
            scaleX: 1,
            scaleY: 1
        }, 400).call(function() {
            me.animateCurONum();
            me.oGameArea.child('PauseMask').setActive(false);
        });
    },

    onShareBtnClick : function() {
        var me = this;
        if(me.showingRanking) {
            return;
        }
        me.showingRanking = true;

        var ranking = me.local.getRanking();
        var oRankList = Unity.GameObject.getById('RankList');
        var oRankCt = oRankList.child('RankContainer');
        oRankList.transform.y = Unity.stage.getHeight();
        oRankList.transform.x = -Unity.stage.getWidth();
        var oLoadRoot = Unity.create('gameobject', { name : 'loadRoot' });
        for(var i=0; i<ranking.length; i++) {
            var gameObj = Unity.create('gameobject', {
                name : 'rank' + i
            });
            var image = Unity.create('Framework_Image', {
                imageSrc : ranking[i].base64
            });
            gameObj.addCmp(image);
            gameObj.transform.x = i * 440 + (600 - 400)/2 + 20;
            oLoadRoot.add(gameObj);
        }

        Unity.loadAssets(oLoadRoot, function() {
            var cRankSwipe = oRankList.getCmp('NG_RankSwipe');
            oLoadRoot.init();
            oLoadRoot.each(function(child) {
                child.removeMe();
                oRankCt.add(child);
            });
            cRankSwipe.setPageCount(me.local.ranking.length);
            cRankSwipe.setCurPage(me.local.lastRankIdx);

            me.gameObject.transform.tween(true).to({
                y : -Unity.stage.getHeight()
            }, 500).call(function() {
                me.showingRanking = false;
            });
        });
    },

    onRetryBtnClick : function() {
        var me = this;
        me.fireEvent('retry');
        me.oGameArea.child('OverBtns').setActive(false);
        me.gameObject.child('GamePanel').transform.tween(true).to({
            scaleX: 1,
            scaleY: 1
        }, 400).call(function() {
            me.oGameArea.child('PauseMask').setActive(false);
            me.startGame();
        });
    },

    onReturnFromRankBtnClick : function() {
        this.gameObject.transform.tween(true).to({
            y : 0
        }, 500).call(function() {
            var oRankList = Unity.GameObject.getById('RankList');
            var oRankCt = oRankList.child('RankContainer');
            oRankCt.each(function(child) {
                child.destroy(true);
            });
        });
    },

    startGame : function() {
        var me = this;
        // TODO newer introduction

        // clear last time play
        me.oNumCt.clear();
        me.score = 0;
        me.curLevel = 0;
        me.oNextNumCt.each(function(child) {
            if(child.name !== 'Combo') {
                child.destroy(true);
            }
        });

        me.oCurRandomNums.each(function(child, idx) {
            child.setName('Number' + idx);
            child.getCmp('NG_Number').setNumber(idx);
        });

        // init cells
        for(var row=0; row<6; row++) {
            for(var col=0; col<6; col++) {
                me.cells[row][col] = {
                    row : row,
                    col : col,
                    gameObject : null,
                    isUsed : function() {
                        return !!this.gameObject;
                    },
                    findMaxNumberOfSublings : function() {
                        var pos = {
                            x : this.col,
                            y : this.row
                        };
                        var searchList = [
                            {x: pos.x, y: pos.y+1},
                            {x: pos.x+1, y: pos.y},
                            {x: pos.x, y: pos.y-1},
                            {x: pos.x-1, y: pos.y}
                        ];
                        var sublingsMaxNumber = 0;
                        var find = false;
                        for(var i=0; i<searchList.length; i++) {
                            var p = searchList[i];
                            try {
                                var cell = me.cells[p.y][p.x];
                                if(cell.gameObject) {
                                    var number = cell.gameObject.number;
                                    if(number >= sublingsMaxNumber) {
                                        sublingsMaxNumber = number;
                                        find = true;
                                    }
                                }
                            } catch(e) {
                                continue;
                            }
                        }
                        return find ? sublingsMaxNumber : false;
                    }
                };
            }
        }

        if(me.local.isFirstPlay()) {
            var oNumber1 = this.cells[2][2].gameObject = me.createNumberGameObject(0, 2, 2);
            var oNumber2 = this.cells[2][3].gameObject = me.createNumberGameObject(0, 2, 3);
            me.oNumCt.add(oNumber1);
            me.oNumCt.add(oNumber2);
        } else {

            var lastPlay = me.local.getLastPlay();
            if (!lastPlay) {
                // 8 random number for starting
                var count = 8;
                while (count--) {
                    var cell = me.randomUnusedCell();
                    var oNum = me.randomNumberObject(cell.row, cell.col);
                    cell.gameObject = oNum;
                    me.oNumCt.add(oNum);
                }

            } else {

                for (var row = 0; row < 6; row++) {
                    for (var col = 0; col < 6; col++) {
                        var lastPlayNum = lastPlay.cells[row][col];
                        if (typeof lastPlayNum === 'number') {
                            var oNumber = this.cells[row][col].gameObject = me.createNumberGameObject(lastPlayNum, row, col);
                            me.oNumCt.add(oNumber);
                        }
                    }
                }

                // set cur level
                me.curLevel = lastPlay.level;

                me.oCurRandomNums.each(function (child, idx) {
                    child.setName('Number' + (me.curLevel + idx));
                    child.getCmp('NG_Number').setNumber(me.curLevel + idx);
                });
            }
        }

        me.updateScore();
        me.next(null, true);
    },

    next : function(lastCell, gameStart) {
        var me = this;
        me.running = false;

        if(lastCell) {
            me.checkJoin(lastCell, function(joined) {
                me.showNext(lastCell);
                me.running = true;
            });
        } else {
            me.showNext(lastCell, gameStart);
            me.running = true;
            if(me.local.isFirstPlay()) {
                me.oGameArea.child('Guide').setActive(true);
            }
        }
    },

    showNext : function(lastCell, gameStart) {
        var me = this;
        if(me.checkGameOver()) {
            me.showGameOver(gameStart);
            return;
        }
        var cell = null;
        if(lastCell) {
            var cells = this.breadthFirstSearch(lastCell, function(sCell) {
                return sCell.isUsed();
            });
            cell = cells[1];
        }
        if(!cell) {
            if(me.local.isFirstPlay()) {
                cell = this.cells[5][5];
            } else {
                cell = this.randomUnusedCell();
            }
        }

        var oNum;
        if(me.local.isFirstPlay()) {
            oNum = this.createNumberGameObject(0, 5, 5);
        } else {
            oNum = this.randomNumberObject(cell.row, cell.col, true);
        }
        me.oNextNumCt.add(oNum);

        me.curONum = oNum;
        me.animateCurONum();
    },

    stopAnimateCurONum : function() {
        this.curONum.transform.clearTweens();
    },

    animateCurONum : function() {
        var oNum = this.curONum;
        oNum.transform.tween(true).to({
            scaleX : 0.8,
            scaleY : 0.8
        }, 300).to({
            scaleX : 1,
            scaleY : 1
        }, 600).to({
            scaleX : 0.9,
            scaleY : 0.9
        }, 300).loop = true;
    },

    updateScore : function() {
        this.oGameArea.child('Score').getCmp('Framework_Text').text = this.score + '';
        this.fireEvent('updateScore', this.score);
    },

    checkGameOver : function() {
        return this.getUnusedCells().length === 0;
    },

    searchWillJoinCells : function(lastCell) {
        return this.breadthFirstSearch(lastCell, function(sCell) {
            if(!sCell.isUsed()) {
                return true;
            }
            return lastCell.gameObject.number !== sCell.gameObject.number;
        });
    },

    checkJoin : function(lastCell, finish, combo, totalJoinCount) {
        if(lastCell.gameObject.number >= 99) {
            finish();
            return;
        }
        if(totalJoinCount === undefined) {
            totalJoinCount = 0;
        }
        var me = this;
        var willJoinCells = this.cacheSearchResult || this.searchWillJoinCells(lastCell);
        this.cacheSearchResult = null;
        if(willJoinCells.length >= 3) {
            for(var j=0; j<willJoinCells.length; j++) {
                if(willJoinCells[j] === lastCell) continue;
                var cell = willJoinCells[j];
                cell.gameObject.transform.tween(true).to({
                    x : lastCell.gameObject.transform.x,
                    y : lastCell.gameObject.transform.y,
                    alpha : 0
                }, 500);
            }
            me.fireEvent('prejoin', lastCell, willJoinCells.length, combo);
            (function(lastCell, willJoinCells) {
                setTimeout(function() {
                    lastCell.gameObject.increaseNumber();
                    for(var i=0; i<willJoinCells.length; i++) {
                        if(willJoinCells[i] === lastCell) continue;
                        willJoinCells[i].gameObject.removeMe(true);
                        willJoinCells[i].gameObject = null;
                    }
                    totalJoinCount += willJoinCells.length
                    me.fireEvent('join', lastCell, totalJoinCount, combo);
                    me.checkJoin(lastCell, function() {
                        me.fireEvent('joinComplete', lastCell, totalJoinCount, combo);
                        finish(true);
                    }, true, totalJoinCount);
                }, 600);
            })(lastCell, willJoinCells);
        } else {
            setTimeout(function() {
                finish();
            }, 50);
        }
    },

    breadthFirstSearch : function(cell, filter, result) {
        var prefix = 'k_';
        var pos = {
            x : cell.col,
            y : cell.row
        };
        var searchList = [
            {x: pos.x, y: pos.y+1},
            {x: pos.x+1, y: pos.y},
            {x: pos.x, y: pos.y-1},
            {x: pos.x-1, y: pos.y}
        ];
        result = result || {
            results : [],
            queue : [],
            inQueue : {},
            searched : {}
        };
        result.results.push(cell);
        result.inQueue[prefix + pos.x + pos.y] = true;
        for(var i=0; searchList[i]; i++) {
            var x = searchList[i].x;
            var y = searchList[i].y;
            if(!this.cells[y]) continue;
            var sCell = this.cells[y][x];
            if(!sCell) continue;
            if(!result.searched[prefix + x + y]) {
                if(filter(sCell)) {
                    continue;
                }
                result.searched[prefix + x + y] = true;
            }
            if(!result.inQueue[prefix + x + y]) {
                result.queue.push(sCell);
                result.inQueue[prefix + x + y] = true;
            }
        }
        if(result.queue.length <= 0) {
            return result.results;
        }
        return this.breadthFirstSearch(result.queue.shift(), filter, result);
    },

    showGameOver : function(gameStart) {
        var me = this;
        me.oGameArea.child('OverBtns').setActive(true);
        me.gameObject.child('GamePanel').transform.tween(true).to({
            scaleX: 0.8,
            scaleY: 0.8
        }, 400).call(function() {
            !gameStart && me.fireEvent('gameover');
        });
    },

    randomNumberObject : function(row, col, containsQuestMark) {
        return this.createNumberGameObject(this.randomNumber(containsQuestMark), row, col);
    },

    randomNumber : function(containsQuestMark) {
        var createQuestMark = containsQuestMark ? Date.now() % 100 < this.probabilityOfQuestMark * 100 : false;
        var number = createQuestMark ? "?" : this.randomLevelBase[parseInt(Math.random()*10000) % this.randomLevelBase.length];
        if(number !== '?') {
            number += this.curLevel;
        }
        return number;
    },

    createNumberGameObject : function(number, row, col) {
        var oNumber = Unity.create('gameobject', {
            name : 'Number_' + row + col,
            number : number,
            row : row,
            col : col,
            increaseNumber : function() {
                this.number ++;
                this.getCmp('NG_Number').increaseNumber();
            },
            setNumber : function(number) {
                this.number = number;
                this.getCmp('NG_Number').setNumber(number);
            }
        });

        oNumber.transform.x = col * 104 + 55;
        oNumber.transform.y = row * 104 + 55;
        oNumber.transform.regX = 50;
        oNumber.transform.regY = 50;
        oNumber.transform.scaleX = 0.9;
        oNumber.transform.scaleY = 0.9;
        oNumber.addCmp(Unity.create('NG_Number', {
            number : number,
            texture : this.texture
        }));
        oNumber.init();
        return oNumber;
    },

    randomUnusedCell : function() {
        var unusedCells = this.getUnusedCells();
        if(unusedCells.length <= 0) return null;
        var idx = Date.now() % unusedCells.length;
        return unusedCells[idx];
    },
    getUnusedCells : function() {
        var unused = [];
        for(var i=0; this.cells[i]; i++) {
            for(var j=0; this.cells[i][j]; j++)
                if(!this.cells[i][j].isUsed()) {
                    unused.push(this.cells[i][j]);
                }
        }
        return unused;
    },
    randomUsedCell : function() {
        var usedCells = this.getUsedCells();
        if(usedCells.length <= 0) return null;
        var idx = Date.now() % usedCells.length;
        return usedCells[idx];
    },
    getUsedCells : function() {
        var used = [];
        for(var i=0; this.cells[i]; i++) {
            for(var j=0; this.cells[i][j]; j++)
                if(this.cells[i][j].isUsed()) {
                    used.push(this.cells[i][j]);
                }
        }
        return used;
    }
});