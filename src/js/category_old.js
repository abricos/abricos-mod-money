/*
 @package Abricos
 @copyright Copyright (C) 2008 Abricos All rights reserved.
 @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 */

var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: '{C#MODNAME}', files: ['lib.js']}
    ]
};
Component.entryPoint = function(NS){

    var Dom = YAHOO.util.Dom,
        E = YAHOO.util.Event,
        L = YAHOO.lang;

    var UID = Brick.env.user.id;
    var buildTemplate = this.buildTemplate;

    var CategoryCreateWidget = function(container, list, isExpense){
        this.init(container, list, isExpense);
    };
    CategoryCreateWidget.prototype = {
        init: function(container, list, isExpense){
            this.list = list;
            this.isExpense = isExpense;

            var TM = buildTemplate(this, 'create');
            container.innerHTML = TM.replace('create');

            this.render();
        },
        destroy: function(){
            var el = this._TM.getEl('create.id');
            el.parentNode.removeChild(el);
        },
        getSaveData: function(){
            return {
                'pid': this.selectWidget.getValue(),
                'tl': this._TM.getEl('create.val').value
            };
        },
        render: function(){
            this.selectWidget = new CategorySelectWidget(this._TM.getEl('create.sel'), this.list, this.isExpense, {
                'showChoiseRow': false,
                'showNewRow': false,
                'showRootRow': true
            });
        }
    };
    NS.CategoryCreateWidget = CategoryCreateWidget;

    var CategorySelectWidget = function(container, list, isExpense, cfg){
        cfg = L.merge({
            'showChoiseRow': true,
            'showNewRow': false,
            'showEditRow': false,
            'showRootRow': false,
            'userid': UID
        }, cfg || {});
        this.init(container, list, isExpense, cfg);
    };
    CategorySelectWidget.prototype = {
        init: function(container, list, isExpense, cfg){
            this.container = container;
            this.list = list;
            this.isExpense = isExpense;
            this.cfg = cfg;
            buildTemplate(this, 'select,srow,stab,scrow,snrow,serow,srtrow');

            this.changedEvent = new YAHOO.util.CustomEvent('changeEvent');

            this.render();
        },
        destory: function(){
        },
        render: function(){
            var TM = this._TM, list = this.list, isExpense = this.isExpense,
                cfg = this.cfg, stop = 1;

            var buildRows = function(pid, level){
                if (stop++ > 1000){
                    return;
                }

                var lst = "", tab = "";
                for (var i = 0; i < level; i++){
                    tab += TM.replace('stab');
                }

                list.foreach(function(cat){
                    if (cat.parentid != pid ||
                        isExpense != cat.isExpense){
                        return;
                    }

                    lst += TM.replace('srow', {
                        'id': cat.id,
                        'tl': cat.title,
                        'tab': tab
                    });
                    lst += buildRows(cat.id, level + 1);
                });
                return lst;
            };
            var lst = buildRows(0, 0);
            this.container.innerHTML = TM.replace('select', {
                'crow': cfg['showChoiseRow'] ? TM.replace('scrow') : '',
                'nrow': cfg['showNewRow'] ? TM.replace('snrow') : '',
                'erow': cfg['showEditRow'] ? TM.replace('serow') : '',
                'rtrow': cfg['showRootRow'] ? TM.replace('srtrow') : '',
                'rows': lst
            });
            var __self = this;
            E.on(TM.getEl('select.id'), 'change', function(){
                __self.onChange();
            });
        },
        onChange: function(){
            this.changedEvent.fire(this);
        },
        getValue: function(){
            return this._TM.getEl('select.id').value;
        },
        setValue: function(value){
            this._TM.getEl('select.id').value = value;
        }
    };
    NS.CategorySelectWidget = CategorySelectWidget;


};