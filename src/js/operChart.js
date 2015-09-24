var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: '{C#MODNAME}', files: ['category.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.OperChartColWidget = Y.Base.create('operChartColWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(){
            var tp = this.template,
                isExpense = this.get('isExpense'),
                cats = {};

            this.get('operList').each(function(oper){
                if (oper.get('isexpense') != isExpense){
                    return;
                }
                var categoryid = oper.get('categoryid'),
                    value = oper.get('value');
                if (!cats[categoryid]){
                    cats[categoryid] = {
                        value: oper.get('value')
                    };
                }else{
                    cats[categoryid].value += oper.get('value');
                }
            }, this);
            console.log(cats);
        },
        destructor: function(){
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'col'},
            operList: {},
            isExpense: {}
        }
    });


    NS.OperChartRowWidget = Y.Base.create('operChartRowWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(){
            var tp = this.template,
                operList = this.get('operList');

            this.incomingWidget = new NS.OperChartColWidget({
                isExpense: false,
                srcNode: tp.gel('incoming'),
                operList: operList
            });

            this.expenseWidget = new NS.OperChartColWidget({
                isExpense: true,
                srcNode: tp.gel('incoming'),
                operList: operList
            });
        },
        destructor: function(){
            if (this.incomingWidget){
                this.incomingWidget.destroy();
                this.expenseWidget.destroy();
            }
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'row'},
            operList: {}
        }
    });

    NS.OperChartWidget = Y.Base.create('operChartWidget', SYS.AppWidget, [
        NS.GroupByIdExt,
        NS.OperLogExt
    ], {
        initializer: function(){
            this._listWidget = [];
        },
        destructor: function(){
            this._cleanWidget();
        },
        _cleanWidget: function(){
            var ws = this._listWidget;
            for (var i = 0; i < ws.length; i++){
                ws[i].destroy();
            }
            return this._listWidget = [];
        },
        renderOperList: function(){
            var app = this.get('appInstance'),
                accountList = app.get('accountList'),
                operList = this.get('operList'),
                group = this.get('group');

            if (!operList || !group){
                return;
            }

            var tp = this.template,
                ws = this._cleanWidget(),
                bySign = {};

            operList.each(function(oper){
                if (oper.get('methodid') > 0){
                    return;
                }
                var accountid = oper.get('accountid'),
                    account = accountList.getById(accountid),
                    currency = account ? NS.currencyList.getById(account.get('currency')) : null,
                    sign = currency ? currency.get('sign') : '';

                if (!bySign[sign]){
                    bySign[sign] = {
                        operList: new (app.get('OperList'))({
                            appInstance: app
                        }),
                        srcNode: tp.append('list', '<div></div>')
                    };
                }
                bySign[sign].operList.add(oper);
            }, this);

            for (var sign in bySign){
                ws[ws.length] = new NS.OperChartRowWidget(bySign[sign]);
            }
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'}
        }
    });
};