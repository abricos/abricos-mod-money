var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'widget', files: ['calendar.js']},
        {name: '{C#MODNAME}', files: ['opermove.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.OperEditorWidget = Y.Base.create('operEditorWidget', SYS.AppWidget, [
        NS.KeyPressExt
    ], {
        onInitAppWidget: function(err, appInstance){
            var tp = this.template,
                group = this.get('group');

            this.categorySelectWidget = new NS.CategorySelectWidget({
                boundingBox: tp.gel('cats'),
                groupid: this.get('groupid'),
                showNewRow: group.isWriteRole(),
                isExpense: this.get('isExpense')
            });

            this.categorySelectWidget.on('selectedChange', this._onCategoryChange, this);

            this.dateTimeWidget = new Brick.mod.widget.DateInputWidget(tp.gel('editor.dt'), {
                'date': new Date(),
                'showBClear': false,
                'showBTime': false,
                'showTime': false
            });

            this.on('accountChange', this._onAccountChange, this);
            this._onAccountChange();
        },
        _onCategoryChange: function(e){
            var val = e.newVal | 0;
            if (val === -1){
                this._showCreateCategory();
            } else {
                this._hideCreateCategory();
            }
        },
        _showCreateCategory: function(){
            if (this.catCreateWidget){
                return;
            }
            var tp = this.template;

            this.catCreateWidget = new NS.CategoryCreateWidget({
                boundingBox: tp.append('catcreate', '<div></div>'),
                groupid: this.get('groupid'),
                isExpense: this.get('isExpense')
            });
        },
        _hideCreateCategory: function(){
            if (!this.catCreateWidget){
                return;
            }
            this.catCreateWidget.destroy();
            this.catCreateWidget = null;
        },
        _onAccountChange: function(){
            var account = this.get('account');
            if (!account){
                return;
            }
            var tp = this.template;
            tp.setHTML({
                atl: account.getTitle(),
                cc: account.getCurrencySign(),
            });
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'editor'},
            account: {},
            groupid: {
                readOnly: true,
                getter: function(){
                    var account = this.get('account');
                    return account ? account.get('groupid') : 0;
                }
            },
            group: {
                readOnly: true,
                getter: function(){
                    var app = this.get('appInstance'),
                        groupid = this.get('groupid');
                    if (groupid === 0 || !app){
                        return null;
                    }
                    return app.getFromCache('groupList').getById(groupid);
                }
            },
            isExpense: {
                writeOnce: true
            }
        }
    });

    NS.OperationWidget = Y.Base.create('operationWidget', SYS.AppWidget, [
        NS.GroupByIdExt,
        NS.SelectedAccountExt
    ], {
        onLoadGroupData: function(){
            var account = this.get('selectedAccount');
            var tp = this.template;

            this.tabs = {
                'expense': new NS.OperEditorWidget({
                    boundingBox: tp.gel('expense'),
                    account: account,
                    isExpense: true
                }),
                'income': new NS.OperEditorWidget({
                    boundingBox: tp.gel('income'),
                    account: account,
                    isExpense: false
                }),
                // 'move': new NS.OperMoveEditorWidget(gel('move'), account)
            };

            this.showPage('expense');
        },
        showPage: function(name){
            var tp = this.template;

            for (var n in this.tabs){
                tp.hide(n);
                tp.removeClass('t' + n, 'sel');
            }
            tp.show(name);
            tp.addClass('t' + name, 'sel');
            // this.tabs[name].setOper(null);
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'}
        }
    });

};