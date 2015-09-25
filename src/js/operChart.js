var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'chart', files: ['pie.js']},
        {name: '{C#MODNAME}', files: ['category.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys,
        CHART = Brick.mod.chart;

    NS.OperChartColWidget = Y.Base.create('operChartColWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance){
            var tp = this.template,
                isExpense = this.get('isExpense'),
                group = this.get('group'),
                currency = this.get('currency'),
                categories = group.get('categories'),
                cats = {};

            this.get('operList').each(function(oper){
                if (oper.get('isexpense') !== isExpense){
                    return;
                }

                var categoryid = oper.get('categoryid'),
                    value = oper.get('value');

                if (!cats[categoryid]){
                    var cat = categories.getById(categoryid);
                    cats[categoryid] = {
                        id: categoryid,
                        title: cat ? cat.get('title') : '',
                        value: oper.get('value')
                    };
                } else {
                    cats[categoryid].value += oper.get('value');
                }
            }, this);

            var pieItemList = new CHART.PieItemList({
                maxPartCount: 8
            });

            for (var id in cats){
                pieItemList.add(new CHART.PieItem(cats[id]));
            }

            this.pieChartWidget = new CHART.PieChartWidget({
                srcNode: tp.gel('chart'),
                pieItemList: pieItemList,
                maxRadius: 100
            });

            var report = pieItemList.toReport();

            tp.setHTML('head', tp.replace(isExpense ? 'colHeadExpense' : 'colHeadIncoming', {
                sum: NS.numberFormat(report.sum),
                sign: currency ? currency.get('sign') : ''
            }));
        },
        destructor: function(){
            if (this.pieChartWidget){
                this.pieChartWidget.destroy();
            }
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'col,colHeadIncoming,colHeadExpense,legend'},
            group: {},
            currency: {},
            operList: {},
            isExpense: {}
        }
    });

    NS.OperChartRowWidget = Y.Base.create('operChartRowWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(){
            var tp = this.template,
                group = this.get('group'),
                currency = this.get('currency'),
                operList = this.get('operList');

            this.incomingWidget = new NS.OperChartColWidget({
                isExpense: false,
                srcNode: tp.gel('incoming'),
                operList: operList,
                group: group,
                currency: currency
            });

            this.expenseWidget = new NS.OperChartColWidget({
                isExpense: true,
                srcNode: tp.gel('expense'),
                operList: operList,
                group: group,
                currency: currency
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
            group: {},
            currency: {},
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
                        srcNode: tp.append('list', '<div></div>'),
                        group: group,
                        currency: currency,
                        operList: new (app.get('OperList'))({
                            appInstance: app
                        })
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