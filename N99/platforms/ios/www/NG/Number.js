Ext.define('NG.Number', {

    extend : 'Unity.cmp.BaseTexture',

    ctype : 'NG_Number',

    configs : {
        props : [{
            name : 'number',
            type : 'string',
            defaultValue : 22
        }, {
            name : 'numberX',
            type : 'int',
            defaultValue : 30
        }, {
            name : 'numberY',
            type : 'int',
            defaultValue : 30
        }, {
            name : 'wordWidth',
            type : 'int',
            defaultValue : 26
        }, {
            name : 'colorCircle',
            type : 'string',
            defaultValue : '',
            provider : 'texture_frame'
        }]
    },

    wordWidth : 26,

    numberStr : '22',

    init : function() {
        this.setNumber(this.number);
    },

    increaseNumber : function() {
        this.setNumber(this.number+1);
    },

    setNumber : function(number) {
        this.number = number === '?' ? number : parseInt(number);
        this.numberStr = number + '';

        // number coords
        this.numberY = 25;
        if(this.number === '?') {
            this.numberX = 32;
            this.colorCircle = '@bg.png';
        }
        else if(this.number >= 10) {
            this.numberX = 20;

        } else {
            this.numberX = 32;
        }

        if(this.number !== '?') {
            if(this.number < 10) {
                this.colorCircle = '0.png';
            }
            else {
                var num = parseInt(this.number / 5) * 5;
                this.colorCircle = num + '.png';
            }
        }

        switch(this.number) {
            case 0 :
            case 1 :
            case 10:
                this.numberX -= 2; break;
            case 7 :
                this.numberX += 2; break;
            case 11 :
            case 12 :
                this.numberX -= 1; break;
        }
    },

    draw : function(context) {
        if(!this.texture || !this.numberStr) return;

        if(this.numberStr === '?') {
            if(this.colorCircle) {
                this.texture.drawFrame(context, this.colorCircle, 0, 0);
            }
            this.texture.drawFrame(context, 'images/@.png', this.numberX, this.numberY);
        }  else {
            var ch0 = this.numberStr.charAt(0);
            var ch1 = this.numberStr.charAt(1);

            if (this.colorCircle) {
                this.texture.drawFrame(context, this.colorCircle, 0, 0);
            }
            this.texture.drawFrame(context, 'images/' + ch0 + '.png', this.numberX, this.numberY);
            if (ch1) {
                this.texture.drawFrame(context, 'images/' + ch1 + '.png', this.numberX + this.wordWidth, this.numberY);
            }
        }
    }

});