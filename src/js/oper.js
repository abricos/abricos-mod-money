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

    NS.OperEditorWidget = Y.Base.create('operEditorWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance){
            var tp = this.template;
            var group = this.get('group');

            this.catsWidget = new NS.CategorySelectWidget({
                boundingBox: tp.gel('cats'),
                group: group,
                isExpense: isExpense
            });
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'editor'},
            account: {},
            groupid: {
                readOnly: true,
                getter: function(){
                    var app = this.get('appInstance'),
                        account = this.get('account');
                    if (!app || !account){
                        return;
                    }

                    return app.getFromCache('groupList').getById(account.get('groupid'));
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