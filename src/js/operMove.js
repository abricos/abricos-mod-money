var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'widget', files: ['calendar.js']},
        {name: '{C#MODNAME}', files: ['accountList', 'category.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.OperMoveEditorWidget = Y.Base.create('operMoveEditorWidget', SYS.AppWidget, [
        NS.KeyPressExt
    ], {
        onInitAppWidget: function(err, appInstance){
            var tp = this.template,
                groupid = this.get('groupid');

            this.dateTimeWidget = new Brick.mod.widget.DateInputWidget(tp.gel('editor.dt'), {
                'date': new Date(),
                'showBClear': false,
                'showBTime': false,
                'showTime': false
            });

            this.srcListWidge = new NS.AccountSelectWidget({
                srcNode: tp.gel('srcAccount'),
                groupid: groupid
            });

            this.destListWidget = new NS.AccountSelectWidget({
                srcNode: tp.gel('destAccount'),
                groupid: groupid
            });
            this._widgetInitialized = true;
            this.renderOper();
        },
        destructor: function(){
            if (this._widgetInitialized){
                this.dateTimeWidget.destroy();
                this.srcListWidge.destroy();
                this.destListWidget.destroy();
            }
        },
        clearForm: function(){
            this.set('oper', null);
            this.renderOper();
        },
        onKeyPress: function(e){
            if (e.keyCode !== 13){
                return;
            }
            this.save();
            return true;
        },
        inputFocus: function(){
            this.template.one('in').focus();
        },
        renderOper: function(){
            var tp = this.template,
                oper = this.get('oper');

            tp.toggleView(!!oper, 'bsave,bcancel', 'bcreate');

            this.inputFocus();
        },
        save: function(){
            if (this.get('waiting')){
                return;
            }
            /*
             this.set('waiting', true);
             this.get('appInstance').operSave(sd, function(err, result){
             this.set('waiting', false);
             if (result.balanceList){
             var b = result.balanceList.getById(accountid);
             if (b){
             account.set('upddate', b.get('upddate'));
             account.set('balance', b.get('balance'));
             }
             }
             this.clearForm();
             }, this);
             /**/
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'editor'},
            groupid: {
                writeOnce: true
            },
            group: {
                readOnly: true,
                getter: function(){
                    var app = this.get('appInstance'),
                        groupid = this.get('groupid');
                    if (groupid === 0 || !app){
                        return null;
                    }
                    return app.get('groupList').getById(groupid);
                }
            },
            oper: {
                value: null
            }
        },
        CLICKS: {
            save: 'save',
            cancel: 'clearForm'
        }
    });
};