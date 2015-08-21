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
            var tp = this.template;

            this._savedHeight = 20;

            this.filter = {};
            /*
             // this.opers = new NS.OperList();

             this.pagTop = new YAHOO.widget.Paginator({
             containers: tp.gel('pagtop'),
             rowsPerPage: 15
             });
             this.pagTop.subscribe('changeRequest', this.onPaginatorChanged, this, true);
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
                    // console.log(result);
                }
            }, this);
        },
        _onPeriodChange: function(){
            this.reloadOperList();
        },
        onClick: function(e){
            switch (e.dataClick) {
                case '':
                    return true;
            }
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'list,table,rowfilter,row,rowtdbase,rowtdmove,rowsum,rbtns,rbtnsn,rowfilter,filterval'},
            operList: {},
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