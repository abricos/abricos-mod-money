var Component = new Brick.Component();
Component.requires = {
    yui: ['datatype'],
    mod: [
        {name: 'sys', files: ['widgets.js']},
        {name: 'widget', files: ['period.js']},
        {name: '{C#MODNAME}', files: ['operChart.js', 'category.js']}
    ]
};
Component.entryPoint = function(NS){
    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.OperListWidget = Y.Base.create('operListWidget', SYS.AppWidget, [
        NS.GroupByIdExt,
        NS.OperLogExt
    ], {
        initializer: function(){
            this.publish('rowClick');
            this.publish('menuClick');
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
                    if (n === 'tag'){
                        if (attrs.tags === ''){
                            return;
                        }
                        var aTags = attrs.tags.split(','),
                            find = false;
                        for (var i = 0; i < aTags.length; i++){
                            if (aTags[i] == v){
                                find = true;
                                break;
                            }
                        }
                        if (!find){
                            return;
                        }
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
                    std = tp.replace('rowTDBase', {
                        id: attrs.id,
                        expcls: attrs.isexpense ? 'text-danger' : 'text-success',
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
                var sTags = '';
                if (NS.TAG){
                    var aTags = attrs.tags.split(','),
                        lstTag = [];
                    for (var iTag = 0; iTag < aTags.length; iTag++){
                        lstTag[lstTag.length] = tp.replace('tag', {
                            id: attrs.id,
                            tag: aTags[iTag]
                        });
                    }
                    sTags = tp.replace('rowTDTag', {
                        tags: lstTag.join(', ')
                    });
                }

                lst += tp.replace('row', {
                    id: attrs.id,
                    d: Brick.dateExt.convert(attrs.date, 2, true),
                    dtl: Brick.dateExt.convert(attrs.date, 0, true),
                    dsc: attrs.descript,
                    btns: btns,
                    td: std,
                    tdTag: sTags
                });

            }, this);

            var first = true;
            for (var n in sum){
                var val = sum[n],
                    currency = NS.currencyList.getById(n);
                lst += tp.replace('rowsum', {
                    'first': first ? 'first' : '',
                    'expcls': val < 0 ? 'text-danger' : 'text-success',
                    'v': NS.numberFormat(val),
                    'cc': currency ? currency.get('sign') : ''
                });
                first = false;
            }

            var isFilter = false,
                fdv = {
                    'd': '', 'tp': '', 'v': '', 'acc': '', 'cat': '',
                    tagHead: NS.TAG ? tp.replace('filterTagHead') : '',
                    menuHead: isMenuVisible ? tp.replace('filterMenuHead') : ''
                };

            for (var n in filter){
                isFilter = true;
                var v = filter[n];

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
                    case 'tag':
                        fdv['tag'] = tp.replace('filterval', {
                            'tp': n,
                            'v': v
                        });
                        break;
                }
            }

            tp.setHTML('table', tp.replace('table', {
                menuHead: isMenuVisible ? tp.replace('menuHead') : '',
                tagHead: NS.TAG ? tp.replace('tagHead') : '',
                filter: isFilter ? tp.replace('rowFilter', fdv) : '',
                rows: lst
            }));
        },
        addFilter: function(action, oper, value){
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
                case 'tag':
                    val = value;
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
        _actionNode: function(operid){
            var tp = this.template,
                elid = tp.gelid('row.action'),
                el = Y.Node.one('#' + elid + '-' + operid);
            return el;
        },
        closeRemoveWidget: function(){
            var w = this._removeWidget;
            if (!w){
                return;
            }
            w._actionNode.addClass('hide');
            w.destroy();
            this._removeWidget = null;
        },
        showRemoveWidget: function(operid){
            this.closeRemoveWidget();

            var el = this._actionNode(operid);
            if (!el){
                return;
            }
            el.removeClass('hide');
            var w = this._removeWidget = new NS.OperListWidget.RemoveWidget({
                srcNode: el.appendChild('<div></div>'),
                CLICKS: {
                    cancel: {
                        event: this.closeRemoveWidget, context: this
                    },
                    remove: {
                        event: this.removeOper, context: this
                    }
                }
            });
            w._actionNode = el;
            w._operid = operid;
        },
        removeOper: function(){
            var w = this._removeWidget;
            if (!w){
                return;
            }
            w.set('waiting', true);
            this.get('appInstance').operRemove(w._operid, function(err, result){
                if (!err){
                    this.get('operList').removeById(w._operid);
                    this.closeRemoveWidget();
                    this.renderOperList();
                }
            }, this);

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
                case 'filter-tag':
                case 'edit':
                    var oper = this.get('operList').getById(e.target.getData('id') | 0);
                    this.fire('rowClick', {
                        action: e.dataClick,
                        oper: oper,
                        value: e.target.getData('value')
                    });
                    return true;
                case 'remove':
                    this.showRemoveWidget(e.target.getData('id') | 0);
                    return true;
            }
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {
                value: 'list,table,menuHead,tagHead,filterMenuHead,filterTagHead,rowFilter,' +
                'row,rowTDBase,rowTDTag,tag,rowtdmove,rowsum,rbtns,rbtnsn,filterval'
            },
            filter: {value: {}},
            menuVisible: {
                writeOnce: true,
                value: false
            }
        }
    });

    NS.OperListWidget.RemoveWidget = Y.Base.create('removeWidget', SYS.AppWidget, [], {}, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'remove'},
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

            var tp = this.template;

            tp.setHTML('title', group.getTitle());

            this.periodWidget = new Brick.mod.widget.PeriodWidget(tp.gel('period'));
            this.periodWidget.getPeriod = function(){
                var period = this.getValue();
                return [period['fdt'], period['edt']];
            }
            this.periodWidget.selectType('week');
            this.periodWidget.periodChangedEvent.subscribe(this.onPeriodChanged, this, true);

            this.set('viewMode', 'table');
        },
        _savePanelBodyHeight: function(){
            var tp = this.template,
                nodePanelBody = tp.one('panelBody'),
                height = nodePanelBody.get('offsetHeight');

            nodePanelBody.setStyle('min-height', height);
        },
        _cleanPanelBodyHeight: function(){
            var tp = this.template,
                nodePanelBody = tp.one('panelBody');

            setTimeout(function(){
                nodePanelBody.setStyle('min-height', 'auto');
            }, 1000);
        },
        _setterViewMode: function(val){
            var tp = this.template;
            if (!tp){
                return;
            }
            this._savePanelBodyHeight();

            // tp.toggleView(val === 'table', 'listPanel', 'chartPanel');
            tp.toggleClass('btnViewTable', 'active', val === 'table');
            tp.toggleClass('btnViewChart', 'active', val !== 'table');

            var groupid = this.get('groupid');

            if (val === 'table'){
                if (this.chartWidget){
                    this.chartWidget.destroy();
                    this.chartWidget = null;
                }
                this.listWidget = new NS.OperListWidget({
                    srcNode: tp.append('list', '<div></div>'),
                    groupid: groupid,
                    period: this.periodWidget.getPeriod(),
                    menuVisible: this.get('rowMenuVisible')
                });
                this.listWidget.on('menuClick', this._onOperListMenuClick, this);
                this.listWidget.on('rowClick', this._onOperRowClick, this);
            } else {
                if (this.listWidget){
                    this.listWidget.destroy();
                    this.listWidget = null;
                }
                this.chartWidget = new NS.OperChartWidget({
                    srcNode: tp.append('chart', '<div></div>'),
                    groupid: groupid,
                    period: this.periodWidget.getPeriod()
                });
            }

           this._cleanPanelBodyHeight();

            return val;
        },
        destructor: function(){
            if (this.listWidget){
                this.listWidget.destroy();
            }
            if (this.chartWidget){
                this.chartWidget.destroy();
            }
        },
        onPeriodChanged: function(){
            this._savePanelBodyHeight();

            if (this.listWidget){
                this.listWidget.set('period', this.periodWidget.getPeriod());
            }
            if (this.chartWidget){
                this.chartWidget.set('period', this.periodWidget.getPeriod());
            }

            this._cleanPanelBodyHeight();
        },
        addFilter: function(type, oper, value){
            this.listWidget.addFilter(type, oper, value);
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
                case 'filter-tag':
                    return this.addFilter(e.action.replace('filter-', ''), e.oper, e.value);
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
            },
            viewMode: {
                // value: 'table',
                setter: '_setterViewMode'
            }
        },
        CLICKS: {
            showTableMode: {
                event: function(){
                    this.set('viewMode', 'table');
                }
            },
            showChartMode: {
                event: function(){
                    this.set('viewMode', 'chart');
                }
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