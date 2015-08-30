var Component = new Brick.Component();
Component.requires = {
    yui: ['datatype'],
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
            this.publish('rowClick');
            this.publish('menuClick');

            this.on('periodChange', this._onPeriodChange, this);
        },
        onLoadGroupData: function(err, group, options){
            this.reloadOperList();
            this.get('appInstance').on('appResponses', this._onAppResponses, this);
        },
        destructor: function(){
            this.get('appInstance').detach('appResponses', this._onAppResponses, this);
        },
        _onAppResponses: function(e){
            if (e.err || !e.result.balanceList){
                return;
            }
            this.reloadOperList(null, true);
        },
        reloadOperList: function(period, isUpdate){
            period = period || this.get('period');
            var config = {
                    groupid: this.get('groupid'),
                    period: [period[0] / 1000, period[1] / 1000]
                },
                operList = this.get('operList'),
                operMoveList = this.get('operMoveList');

            isUpdate = isUpdate && operList;

            if (isUpdate){
                var lastUpdate = 0;
                operList.each(function(oper){
                    lastUpdate = Math.max(lastUpdate, oper.get('upddate'));
                });
                config.upddate = lastUpdate;
            }

            this.set('waiting', true);
            this.get('appInstance').operList(config, function(err, result){
                this.set('waiting', true);
                if (!err){
                    if (isUpdate){
                        operList.add(result.operList);
                        operMoveList.add(result.operMoveList); // TODO: update list if not new records
                    } else {
                        this.set('operList', result.operList);
                        this.set('operMoveList', result.operMoveList);
                    }
                    this.renderOperList();
                }
            }, this);
        },
        renderOperList: function(){
            var app = this.get('appInstance'),
                accountList = app.get('accountList'),
                operList = this.get('operList'),
                operMoveList = this.get('operMoveList'),
                group = this.get('group'),
                isMenuVisible = this.get('menuVisible');

            if (!operList || !group){
                return;
            }

            var tp = this.template, lst = "", sum = {},
                filter = this.get('filter'),
                dmets = {},
                roundDay = function(d){
                    d = new Date(d * 1000);
                    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
                };

            operList.each(function(oper){
                var attrs = oper.toJSON(),
                    account = accountList.getById(attrs.accountid),
                    currency = account ? NS.currencyList.getById(account.get('currency')) : null,
                    sign = currency ? currency.get('sign') : '',
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

                var std = "";
                if (attrs.methodid === 0){
                    std = tp.replace('rowtdbase', {
                        id: attrs.id,
                        expcls: attrs.isexpense ? 'red' : 'green',
                        tp: attrs.isexpense ? '-' : '+',
                        v: NS.numberFormat(val),
                        cc: sign,
                        acc: account ? account.getTitle() : '',
                        cat: cat ? cat.get('title') : ''
                    });
                } else {
                    var opMove = oper.move = operMoveList.getById(attrs.methodid),
                        fAcc = accountList.getById(opMove.get('srcid')),
                        tAcc = accountList.getById(opMove.get('destid'));

                    std = tp.replace('rowtdmove', {
                        'facc': !fAcc ? '' : fAcc.getTitle(),
                        'tacc': !tAcc ? '' : tAcc.getTitle(),
                        'cc': sign,
                        'v': NS.numberFormat(Math.abs(val))
                    });
                }
                var btns = '';
                if (isMenuVisible){
                    btns = tp.replace(account.isOperRole() ? 'rbtns' : 'rbtnsn', {
                        'id': attrs.id
                    })
                }
                lst += tp.replace('row', {
                    id: attrs.id,
                    d: Brick.dateExt.convert(attrs.date, 2, true),
                    dtl: Brick.dateExt.convert(attrs.date, 0, true),
                    dsc: attrs.descript,
                    btns: btns,
                    td: std
                });

            }, this);

            var first = true;
            for (var n in sum){
                var val = sum[n],
                    currency = NS.currencyList.getById(n);
                lst += tp.replace('rowsum', {
                    'first': first ? 'first' : '',
                    'expcls': val < 0 ? 'red' : 'green',
                    'v': NS.numberFormat(val),
                    'cc': currency ? currency.get('sign') : ''
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
                            'v': Brick.dateExt.convert(v, 2, true)
                        });
                        break;
                    case 'type':
                        fdv['tp'] = tp.replace('filterval', {
                            'tp': n,
                            'v': v ? '-' : '+'
                        });
                        break;
                    case 'account':
                        var acc = accountList.getById(v);
                        if (acc){
                            fdv['acc'] = tp.replace('filterval', {
                                'tp': n,
                                'v': acc.getTitle()
                            });
                        }
                        break;
                    case 'category':
                        var cat = group.get('categories').getById(v);
                        if (cat){
                            fdv['cat'] = tp.replace('filterval', {
                                'tp': n,
                                'v': cat.get('title')
                            });
                        }
                        break;
                }
            }

            tp.setHTML('table', tp.replace('table', {
                'menuHead': isMenuVisible ? tp.replace('menuHead') : '',
                'filter': isFilter ? tp.replace('rowfilter', fdv) : '',
                'rows': lst
            }));
        },
        addFilter: function(action, oper){
            if (!oper){
                return;
            }
            var val = "", attrs = oper.toJSON();
            switch (action) {
                case 'date':
                    val = attrs.date;
                    break;
                case 'type':
                    val = attrs.isexpense;
                    break;
                case 'account':
                    val = attrs.accountid;
                    break;
                case 'category':
                    val = attrs.categoryid;
                    break;
            }
            this.get('filter')[action] = val;
            this.renderOperList();
        },
        removeFilter: function(action){
            delete this.get('filter')[action];
            this.renderOperList();
        },
        clearFilter: function(){
            this.set('filter', {});
            this.renderOperList();
        },
        _onPeriodChange: function(e){
            this.reloadOperList(e.newVal);
        },
        onClick: function(e){
            switch (e.dataClick) {
                case 'clear-filter':
                    this.fire('menuClick', {
                        action: e.dataClick,
                        filter: e.target.getData('id')
                    });
                    return true;
                case 'filter-date':
                case 'filter-type':
                case 'filter-account':
                case 'filter-category':
                case 'edit':
                case 'remove':
                    var oper = this.get('operList').getById(e.target.getData('id') | 0);
                    this.fire('rowClick', {
                        action: e.dataClick,
                        oper: oper
                    });
                    return true;
            }
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'list,table,menuHead,rowfilter,row,rowtdbase,rowtdmove,rowsum,rbtns,rbtnsn,rowfilter,filterval'},
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
            operList: {value: null},
            operMoveList: {value: null},
            menuVisible: {
                writeOnce: true,
                value: false
            }
        }
    });

    NS.OperLogWidget = Y.Base.create('operLogWidget', SYS.AppWidget, [
        NS.GroupByIdExt
    ], {
        buildTData: function(){
            return {groupid: this.get('groupid')}
        },
        onLoadGroupData: function(err, group){
            if (!group){
                return;
            }

            this.publish('rowMenuClick');

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
                period: this.periodWidget.getPeriod(),
                menuVisible: this.get('rowMenuVisible')
            });
            this.listWidget.on('menuClick', this._onOperListMenuClick, this);
            this.listWidget.on('rowClick', this._onOperRowClick, this);
        },
        destructor: function(){
            this.listWidget.destroy();
        },
        onPeriodChanged: function(){
            this.listWidget.set('period', this.periodWidget.getPeriod());
        },
        addFilter: function(type, oper){
            this.listWidget.addFilter(type, oper);
        },
        removeFilter: function(type){
            this.listWidget.removeFilter(type);
        },
        _onOperRowClick: function(e){
            switch (e.action) {
                case 'filter-date':
                case 'filter-type':
                case 'filter-account':
                case 'filter-category':
                    return this.addFilter(e.action.replace('filter-', ''), e.oper);
            }
            this.fire('rowMenuClick', {
                action: e.action,
                oper: e.oper
            });
        },
        _onOperListMenuClick: function(e){
            switch (e.action) {
                case 'clear-filter':
                    this.removeFilter(e.filter);
                    break;
            }
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            rowMenuVisible: {
                writeOnce: true,
                value: false
            }
        }
    });

    NS.OperLogWidget.parseURLParam = function(args){
        args = args || [];
        return {
            groupid: (args[0] | 0)
        };
    };

};