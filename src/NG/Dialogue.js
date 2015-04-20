Ext.define('NG.Dialogue', {

    extend : 'Unity.Component',

    ctype : 'NG_Dialogue',

    configs : {
        props : []
    },

    dialogueText: null,
    showLength: 0,

    showDialogueText : function(dialogueText) {
        this.dialogueText = dialogueText;
        this.showLength = 0;
    },

    draw : function(context) {
        if(this.dialogueText) {
            var text = this.dialogueText.slice(0, Math.ceil(this.showLength));
            context.fillStyle = '#000000';
            context.globalAlpha = 0.8;
            context.fillRect(0, 0, Unity.stage.viewport.width, Unity.stage.viewport.height);
            if (text) {
                context.globalAlpha = 1;
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                context.fillStyle = '#16dddb';
                context.font = 'bold 34px Arial';
                context.fillText(text, Unity.stage.viewport.width / 2, 400);
            }
            this.showLength += 0.5;
            if(this.showLength >= this.dialogueText.length) {
                this.showLength = this.dialogueText.length;
                context.fillText('Tap to start', Unity.stage.viewport.width / 2, 600);
                context.fillRect(Unity.stage.viewport.width/2-100, 620, 200, 2);
            }
        }
    }

});