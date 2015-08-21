var Component = new Brick.Component();
Component.requires = {
    yui: ['datatype', 'aui-pagination'],
    mod: [
        {name: 'sys', files: ['widgets.js']},
        {name: 'widget', files: ['period.js']},
        {name: '{C#MODNAME}', files: ['category.js']}
    ]
};
Component.entryPoint = function(NS){
    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.OperListWidget = Y.Base.create('operListWidget', SYS.AppWidget, [
        NS.GroupByIdExt
    ], {
        onBeforeLoadGroupData: function(err, appInstance){
            this._savedHeight = 20;

            this.filter = {};

            var tp = this.template;

            /*
             this.pagTop = Y.Pagination({
             itemsPerPage: 15,
             boundingBox: tp.one('pagtop')
             });
             /**/

            this.on('periodChange', this._onPeriodChange, this);
        },
        onLoadGroupData: function(err, group, options){
            this.reloadOperList();
        },
        reloadOperList: function(){
            var period = this.get('period');
            var config = {
                groupid: this.get('groupid'),
                period: this.get('periodUnix')
            };
            this.set('waiting', true);
            this.get('appInstance').operList(config, function(err, result){
                this.set('waiting', true);
                if (!err){
                    this.set('operList', result.operList);
                    this.renderOperList();
                }
            }, this);
        },
        renderOperList: function(){

            var app = this.get('appInstance'),
                accountList = app.get('accountList'),
                operList = this.get('operList'),
                group = this.get('group');

            if (!operList || !group){
                return;
            }

            var tp = this.template, lst = "",
                sum = {},
                filter = this.filter,
                dmets = {},
                index = 0, fromrec = 0,
                roundDay = function(d){
                    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
                };


            operList.each(function(oper){
                /*accountid: 1
                 categoryid: 0
                 date: 1440178020
                 descript: ""
                 id: 6
                 isexpense: true
                 methodid: 0
                 upddate: 1440178054
                 userid: 1
                 value: 5464/**/
                var attrs = oper.toJSON(),
                    account = accountList.getById(attrs.accountid),
                    cat = group.get('categories').getById(attrs.categoryid),
                    val = attrs.value,
                    ccid = account.get('currency');

                // метод перемещения состоит из двух/трех операций
                // показать нужно только всю операцию
                if (attrs.methodid > 0){
                    if (dmets[attrs.methodid]){
                        return;
                    }
                    dmets[attrs.methodid] = true;
                }

                // проверка на фильтр
                var v = "";
                for (var n in filter){
                    v = filter[n];

                    switch (n) {
                        case 'account':
                        case 'category':
                            if (attrs.methodid > 0){
                                return;
                            }
                            break;
                    }
                    if (n == 'date' && roundDay(attrs.date).getTime() != roundDay(v).getTime()){
                        return;
                    }
                    if (n == 'type' && attrs.isexpense !== v){
                        return;
                    }
                    if (n == 'account' && attrs.accountid !== v){
                        return;
                    }
                    if (n == 'category' && attrs.categoryid !== v){
                        return;
                    }
                }

                if (attrs.methodid === 0){
                    if (!sum[ccid]){
                        sum[ccid] = 0;
                    }
                    sum[ccid] += val;
                }

                // TODO: create instance pagination
                /*
                 if (index < fromrec){
                 index++;
                 return;
                 } else if (index >= fromrec + 15){
                 index++;
                 return;
                 }
                 /**/

                var std = "";
                if (attrs.methodid == 0){
                    std = tp.replace('rowtdbase', {
                        id: attrs.id,
                        expcls: attrs.isexpense ? 'red' : 'green',
                        tp: attrs.isexpense ? '-' : '+',
                        v: NS.numberFormat(val),
                        // cc: account.currency.sign,
                        acc: account ? account.getTitle() : '',
                        cat: cat ? cat.get('title') : ''
                    });
                } else {
                    var opMove = opers.methods.get(attrs.methodid),
                        fAcc = MM.findAccount(opMove.fromAccountId),
                        tAcc = MM.findAccount(opMove.toAccountId);

                    std = tp.replace('rowtdmove', {
                        'facc': L.isNull(fAcc) ? '' : fAcc.getTitle(),
                        'tacc': L.isNull(tAcc) ? '' : tAcc.getTitle(),
                        'cc': account.currency.sign,
                        'v': NS.numberFormat(Math.abs(val))
                    });
                }

                lst += tp.replace('row', {
                    id: attrs.id,
                    d: Brick.dateExt.convert(attrs.date, 2, true),
                    'dtl': Brick.dateExt.convert(attrs.date, 0, true),
                    'dsc': attrs.descript,
                    btns: tp.replace(account.isOperRole() ? 'rbtns' : 'rbtnsn', {
                        'id': attrs.id
                    }),
                    'td': std
                });
                index++;

            }, this);


            var first = true;
            for (var n in sum){
                var val = sum[n];
                lst += tp.replace('rowsum', {
                    'first': first ? 'first' : '',
                    'expcls': val < 0 ? 'red' : 'green',
                    'v': NS.numberFormat(val),
                    // 'cc': NS.currencyList.get(n).sign
                });
                first = false;
            }

            var isFilter = false,
                fdv = {'d': '', 'tp': '', 'v': '', 'acc': '', 'cat': ''};

            for (var n in filter){
                isFilter = true;
                v = filter[n];

                switch (n) {
                    case 'date':
                        fdv['d'] = tp.replace('filterval', {
                            'tp': n,
                            'v': Brick.dateExt.convert(v.getTime() / 1000, 2, true)
                        });
                        break;
                    case 'type':
                        fdv['tp'] = tp.replace('filterval', {
                            'tp': n,
                            'v': v ? '-' : '+'
                        });
                        break;
                    case 'account':
                        var acc = MM.findAccount(v);
                        if (!L.isNull(acc)){
                            fdv['acc'] = tp.replace('filterval', {
                                'tp': n,
                                'v': acc.getTitle()
                            });
                        }
                        break;
                    case 'category':
                        var cat = group.categories.get(v);
                        if (!L.isNull(cat)){
                            fdv['cat'] = tp.replace('filterval', {
                                'tp': n,
                                'v': cat.title
                            });
                        }
                        break;
                }
            }

            tp.setHTML('table', tp.replace('table', {
                'filter': isFilter ? tp.replace('rowfilter', fdv) : '',
                'rows': lst
            }));

            /*
            var rg = Dom.getRegion(elTable);

            var h = this._savedHeight = Math.max(this._savedHeight, rg.height);
            Dom.setStyle(elTable, 'min-height', h + 'px');

            this.pagTop.setState({'totalRecords': index});
            this.pagTop.render();
            /**/
        },
        _onPeriodChange: function(){
            this.reloadOperList();
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'list,table,rowfilter,row,rowtdbase,rowtdmove,rowsum,rbtns,rbtnsn,rowfilter,filterval'},
            operList: {},
            filter: {value: {}},
            fromDate: {
                setter: function(val){
                    this.set('period', [val, this.get('endDate')]);
                },
                getter: function(){
                    return this.get('period')[0];
                }
            },
            endDate: {
                setter: function(val){
                    this.set('period', [this.get('fromDate'), val]);
                },
                getter: function(){
                    return this.get('period')[1];
                }
            },
            period: {
                validator: function(val){
                    return (Y.Lang.isArray(val) &&
                    val.length == 2 &&
                    (val[0] instanceof Date) && (val[1] instanceof Date));
                }
            },
            periodUnix: {
                readOnly: true,
                getter: function(){
                    var p = this.get('period');
                    return [p[0] / 1000, p[1] / 1000];
                }
            },
            operList: {
                value: null
            }
        }
    });

    NS.OperLogWidget = Y.Base.create('operLogWidget', SYS.AppWidget, [
        NS.GroupByIdExt
    ], {
        buildTData: function(){
            return {
                groupid: this.get('groupid')
            }
        },
        onLoadGroupData: function(err, group, options){
            if (!group){
                return;
            }

            var tp = this.template,
                groupid = group.get('id');

            tp.setHTML('title', group.getTitle());

            this.periodWidget = new Brick.mod.widget.PeriodWidget(tp.gel('period'));
            this.periodWidget.getPeriod = function(){
                var period = this.getValue();
                return [period['fdt'], period['edt']];
            }
            this.periodWidget.selectType('week');
            this.periodWidget.periodChangedEvent.subscribe(this.onPeriodChanged, this, true);

            this.listWidget = new NS.OperListWidget({
                srcNode: tp.gel('list'),
                groupid: groupid,
                period: this.periodWidget.getPeriod()
            });
            /*
             var __self = this;
             this.listWidget.onClickAction = function(action, oper){
             __self.onRowClickAction(action, oper);
             };/**/

            // NS.moneyManager.balanceChangedEvent.subscribe(this.onBalanceChanged, this, true);

        },
        onPeriodChanged: function(){
            this.listWidget.set('period', this.periodWidget.getPeriod());
        },
        /*
         setPeriod: function(fromdt, enddt){
         this.fromdt = fromdt;
         this.enddt = enddt;
         this.opers = null;
         this.loadPeriod();
         },
         /**/
        onClick: function(e){
            switch (e.dataClick) {
                case '':
                    return true;
            }
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
        }
    });

    NS.OperLogWidget.parseURLParam = function(args){
        args = args || [];
        return {
            groupid: (args[0] | 0)
        };
    };

};