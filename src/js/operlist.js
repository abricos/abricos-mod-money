/*
 @package Abricos
 @copyright Copyright (C) 2008 Abricos All rights reserved.
 @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 */

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

        onClick: function(el){

            // клик отмены фильтра
            var arr = el.id.split('--');
            if (arr.length == 2 && arr[0] == TId['filterval']['bclear']){
                this.removeFilter(arr[1]);
                return true;
            }

            return false;
        },
        setOpers: function(opers){
            this.opers = opers;

            this.pagTop.setState({'page': 1});
            this.pagTop.render();

            this.render();
        },
    };
    NS.OperListWidget = OperListWidget;

    var OperLogWidget = function(container, group){
        this.init(container, group);
    };
    OperLogWidget.prototype = {
        init: function(container, group){


            var edt = new Date(),
                fdt = DM.add(edt, DM.DAY, -7);

            fdt = new Date(fdt.getFullYear(), fdt.getMonth(), fdt.getDate(), 0, 0);
            edt = new Date(edt.getFullYear(), edt.getMonth(), edt.getDate(), 23, 59);

            this.opers = null;


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
        addFilter: function(type, oper){
            this.listWidget.addFilter(type, oper);
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