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

            this.srcListWidget = new NS.AccountSelectWidget({
                srcNode: tp.gel('srcAccount'),
                groupid: groupid
            });

            this.destListWidget = new NS.AccountSelectWidget({
                srcNode: tp.gel('destAccount'),
                groupid: groupid
            });
            this._widgetInitialized = true;
            this.renderOper();
            this.after('operChange', this.renderOper, this);
        },
        destructor: function(){
            if (this._widgetInitialized){
                this.dateTimeWidget.destroy();
                this.srcListWidget.destroy();
                this.destListWidget.destroy();
            }
        },
        clearForm: function(){
            this.get('oper') ? this.set('oper', null) : this.renderOper();
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
                oper = this.get('oper'),
                move = oper ? oper.move : null;

            this.srcListWidget.select(move ? move.get('srcid') : 0);
            this.destListWidget.select(move ? move.get('destid') : 0);
            this.dateTimeWidget.setValue(move ? new Date(move.get('date') * 1000) : new Date());

            tp.setValue({
                in: oper ? oper.get('value') : '',
                dsc: oper ? oper.get('descript') : ''
            });

            this.srcListWidget.set('readOnly', !!move);
            this.destListWidget.set('readOnly', !!move);

            tp.toggleView(!!oper, 'bsave,bcancel', 'bcreate');

            this.inputFocus();
        },
        save: function(){
            if (this.get('waiting')){
                return;
            }

            var tp = this.template,
                oper = this.get('oper'),
                dt = this.dateTimeWidget.getValue(),
                val = tp.getValue('in') + '',
                accountList = this.get('appInstance').get('accountList'),
                srcid = this.srcListWidget.selected(),
                srcAccount = accountList.getById(srcid),
                destid = this.destListWidget.selected(),
                destAccount = accountList.getById(srcid);

            if (!srcAccount || !destAccount || srcid === destid){
                return;
            }

            var sd = {
                id: oper ? oper.move.get('id') : 0,
                srcid: srcid,
                destid: destid,
                value: val.replace(/\s/gi, '').replace(/,/gi, '.'),
                date: (dt ? dt : new Date()).getTime() / 1000,
                upddate: Math.min(srcAccount.get('upddate'), destAccount.get('upddate')),
                descript: tp.getValue('dsc')
            };

            this.set('waiting', true);
            this.get('appInstance').operMoveSave(sd, function(err, result){
                this.set('waiting', false);
                this.clearForm();
            }, this);
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