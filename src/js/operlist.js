var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sys', files: ['widgets.js']},
        {name: 'widget', files: ['period.js']},
        {name: '{C#MODNAME}', files: ['category.js']}
    ]
};
Component.entryPoint = function(NS){

    var Dom = YAHOO.util.Dom,
        E = YAHOO.util.Event,
        L = YAHOO.lang;

    var DM = YAHOO.widget.DateMath;

    var buildTemplate = this.buildTemplate;

    var OperListWidget = function(container, group, cfg){
        cfg = L.merge({}, cfg || {});
        this.init(container, group, cfg);
    };
    OperListWidget.prototype = {
        init: function(container, group, cfg){
            this.filter = {};
            this.group = group;
            this.opers = new NS.OperList();
            this.cfg = cfg;

            var TM = buildTemplate(this, 'list,table,rowfilter,row,rowtdbase,rowtdmove,rowsum,rbtns,rbtnsn,rowfilter,filterval');
            container.innerHTML = TM.replace('list');

            this.pagTop = new YAHOO.widget.Paginator({
                containers: TM.getEl('list.pagtop'),
                rowsPerPage: 15
            });
            this.pagTop.subscribe('changeRequest', this.onPaginatorChanged, this, true);

            this._savedHeight = 20;

            var __self = this;
            E.on(container, 'click', function(e){
                var el = E.getTarget(e);
                if (__self.onClick(el)){
                    E.preventDefault(e);
                }
            });
        },
        destroy: function(){
        },
        onClick: function(el){

            var TId = this._TId,
                prefix = el.id.replace(/([0-9]+$)/, ''),
                numid = el.id.replace(prefix, ""),
                oper = numid > 0 ? this.opers.get(numid) : null;

            switch (prefix) {
                case TId['row']['bfd'] + '-':
                    this.onClickAction('filterdate', oper);
                    return true;
                case TId['rowtdbase']['bftype'] + '-':
                    this.onClickAction('filtertype', oper);
                    return true;
                case TId['rowtdbase']['bfacc'] + '-':
                    this.onClickAction('filteraccount', oper);
                    return true;
                case TId['rowtdbase']['bfcat'] + '-':
                    this.onClickAction('filtercategory', oper);
                    return true;
                case TId['rbtns']['bedit'] + '-':
                    this.onClickAction('edit', oper);
                    return true;
                case TId['rbtns']['bremove'] + '-':
                    this.onClickAction('remove', oper);
                    return true;
            }

            // клик отмены фильтра
            var arr = el.id.split('--');
            if (arr.length == 2 && arr[0] == TId['filterval']['bclear']){
                this.removeFilter(arr[1]);
                return true;
            }

            return false;
        },
        onClickAction: function(action, oper){
        },
        addFilter: function(action, oper){
            var val = "";
            switch (action) {
                case 'date':
                    val = oper.date;
                    break;
                case 'type':
                    val = oper.isExpense;
                    break;
                case 'account':
                    val = oper.accountid;
                    break;
                case 'category':
                    val = oper.categoryid;
                    break;
            }
            this.filter[action] = val;
            this.render();
        },
        removeFilter: function(action){
            delete this.filter[action];
            this.render();
        },

        clearFilter: function(){
            this.filter = {};
            this.render();
        },
        setOpers: function(opers){
            this.opers = opers;

            this.pagTop.setState({'page': 1});
            this.pagTop.render();

            this.render();
        },
        onPaginatorChanged: function(state){
            this.pagTop.setState({'page': state.page});
            this.pagTop.render();
            this.render();
        },
        render: function(){
            var TM = this._TM, lst = "", MM = NS.moneyManager, sum = {},
                filter = this.filter;

            var pgst = this.pagTop.getState(),
                index = 0, fromrec = 0,
                group = this.group;

            if (!L.isNull(pgst['records'])){
                fromrec = pgst['records'][0];
            }

            var opers = this.opers, dmets = {};

            var roundDay = function(d){
                return new Date(d.getFullYear(), d.getMonth(), d.getDate());
            };

            opers.foreach(function(oper){

                // метод перемещения состоит из двух/трех операций
                // показать нужно только всю операцию
                if (oper.methodid > 0){
                    if (dmets[oper.methodid]){
                        return;
                    }
                    dmets[oper.methodid] = true;
                }

                // проверка на фильтр
                var v = "";
                for (var n in filter){
                    v = filter[n];

                    switch (n) {
                        case 'account':
                        case 'category':
                            if (oper.methodid > 0){
                                return;
                            }
                            break;
                    }
                    if (n == 'date' && roundDay(oper.date).getTime() != roundDay(v).getTime()){
                        return;
                    }
                    if (n == 'type' && oper.isExpense !== v){
                        return;
                    }
                    if (n == 'account' && oper.accountid !== v){
                        return;
                    }
                    if (n == 'category' && oper.categoryid !== v){
                        return;
                    }
                }

                var account = MM.findAccount(oper.accountid),
                    cat = group.categories.get(oper.categoryid),
                    val = oper.getValue(),
                    ccid = account.currency.id;

                if (oper.methodid == 0){
                    if (!sum[ccid]){
                        sum[ccid] = 0;
                    }
                    sum[ccid] += val;
                }

                if (index < fromrec){
                    index++;
                    return;
                } else if (index >= fromrec + 15){
                    index++;
                    return;
                }


                var std = "";
                if (oper.methodid == 0){
                    std = TM.replace('rowtdbase', {
                        'id': oper.id,
                        'expcls': oper.isExpense ? 'red' : 'green',
                        'tp': oper.isExpense ? '-' : '+',
                        'v': NS.numberFormat(val),
                        'cc': account.currency.sign,
                        'acc': L.isNull(account) ? '' : account.getTitle(),
                        'cat': L.isNull(cat) ? '' : cat.title
                    });
                } else {
                    var opMove = opers.methods.get(oper.methodid),
                        fAcc = MM.findAccount(opMove.fromAccountId),
                        tAcc = MM.findAccount(opMove.toAccountId);

                    std = TM.replace('rowtdmove', {
                        'facc': L.isNull(fAcc) ? '' : fAcc.getTitle(),
                        'tacc': L.isNull(tAcc) ? '' : tAcc.getTitle(),
                        'cc': account.currency.sign,
                        'v': NS.numberFormat(Math.abs(val))
                    });
                }

                lst += TM.replace('row', {
                    'id': oper.id,
                    'd': Brick.dateExt.convert(oper.date.getTime() / 1000, 2, true),
                    'dtl': Brick.dateExt.convert(oper.date.getTime() / 1000, 0, true),
                    'dsc': oper.descript,
                    'btns': TM.replace(account.isOperRole() ? 'rbtns' : 'rbtnsn', {
                        'id': oper.id
                    }),
                    'td': std
                });
                index++;
            });

            var first = true;
            for (var n in sum){
                var val = sum[n];
                lst += TM.replace('rowsum', {
                    'first': first ? 'first' : '',
                    'expcls': val < 0 ? 'red' : 'green',
                    'v': NS.numberFormat(val),
                    'cc': NS.currencyList.get(n).sign
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
                        fdv['d'] = TM.replace('filterval', {
                            'tp': n,
                            'v': Brick.dateExt.convert(v.getTime() / 1000, 2, true)
                        });
                        break;
                    case 'type':
                        fdv['tp'] = TM.replace('filterval', {
                            'tp': n,
                            'v': v ? '-' : '+'
                        });
                        break;
                    case 'account':
                        var acc = MM.findAccount(v);
                        if (!L.isNull(acc)){
                            fdv['acc'] = TM.replace('filterval', {
                                'tp': n,
                                'v': acc.getTitle()
                            });
                        }
                        break;
                    case 'category':
                        var cat = group.categories.get(v);
                        if (!L.isNull(cat)){
                            fdv['cat'] = TM.replace('filterval', {
                                'tp': n,
                                'v': cat.title
                            });
                        }
                        break;
                }
            }

            var elTable = TM.getEl('list.table');
            elTable.innerHTML = TM.replace('table', {
                'filter': isFilter ? TM.replace('rowfilter', fdv) : '',
                'rows': lst
            });

            var rg = Dom.getRegion(elTable);

            var h = this._savedHeight = Math.max(this._savedHeight, rg.height);
            Dom.setStyle(elTable, 'min-height', h + 'px');

            this.pagTop.setState({'totalRecords': index});
            this.pagTop.render();
        }
    };
    NS.OperListWidget = OperListWidget;

    var OperLogWidget = function(container, group){
        this.init(container, group);
    };
    OperLogWidget.prototype = {
        init: function(container, group){
            this.group = group;
            var TM = buildTemplate(this, 'widget');
            container.innerHTML = TM.replace('widget');

            this.listWidget = new NS.OperListWidget(TM.getEl('widget.list'), group);

            var __self = this;
            this.listWidget.onClickAction = function(action, oper){
                __self.onRowClickAction(action, oper);
            };

            var edt = new Date(),
                fdt = DM.add(edt, DM.DAY, -7);

            fdt = new Date(fdt.getFullYear(), fdt.getMonth(), fdt.getDate(), 0, 0);
            edt = new Date(edt.getFullYear(), edt.getMonth(), edt.getDate(), 23, 59);

            this.opers = null;

            NS.moneyManager.balanceChangedEvent.subscribe(this.onBalanceChanged, this, true);

            this.periodWidget = new Brick.mod.widget.PeriodWidget(TM.getEl('widget.period'));
            this.periodWidget.periodChangedEvent.subscribe(this.onPeriodChanged, this, true);

            this.periodWidget.selectType('week');
        },
        destroy: function(){
            NS.moneyManager.balanceChangedEvent.unsubscribe(this.onBalanceChanged);
            this.periodWidget.periodChangedEvent.unsubscribe(this.onPeriodChanged);
        },
        onRowClickAction: function(action, oper){
            switch (action) {
                case 'edit':
                    this.onRowClickEdit(oper);
                    break;
                case 'remove':
                    this.onRowClickRemove(oper);
                    break;
                case 'filterdate':
                    this.addFilter('date', oper);
                    break;
                case 'filtertype':
                    this.addFilter('type', oper);
                    break;
                case 'filteraccount':
                    this.addFilter('account', oper);
                    break;
                case 'filtercategory':
                    this.addFilter('category', oper);
                    break;
            }
        },
        onRowClickEdit: function(oper){
        },
        onRowClickRemove: function(oper){
        },
        onPeriodChanged: function(){
            var pd = this.periodWidget.getValue();
            this.setPeriod(pd['fdt'], pd['edt']);
        },
        onBalanceChanged: function(e, prm){
            var acc = prm[0],
                byRemoveOper = prm[1];
            if (L.isNull(acc)){
                return;
            }

            if (byRemoveOper){
                this.opers = null;
            }
            this.loadPeriod();
        },
        setPeriod: function(fromdt, enddt){
            this.fromdt = fromdt;
            this.enddt = enddt;
            this.opers = null;
            this.loadPeriod();
        },
        addFilter: function(type, oper){
            this.listWidget.addFilter(type, oper);
        },
        clearFilter: function(){

        },
        updateOpers: function(opers){
            this.opers = opers;
            this.listWidget.setOpers(opers);
        },
        loadPeriod: function(){
            var __self = this, TM = this._TM,
                fromdt = this.fromdt, enddt = this.enddt,
                copers = this.opers;

            Dom.setStyle(TM.getEl('widget.loading'), 'display', '');
            NS.moneyManager.operLogLoad(this.group.id, fromdt, enddt, copers, function(opers){
                Dom.setStyle(TM.getEl('widget.loading'), 'display', 'none');
                __self.updateOpers(opers);
            });
        }
    };
    NS.OperLogWidget = OperLogWidget;
};