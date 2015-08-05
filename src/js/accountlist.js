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

    var CE = YAHOO.util.CustomEvent;

    var buildTemplate = this.buildTemplate;

    var elChildForeach = function(el, callback){
        NS.life(callback, el);

        var els = el.childNodes;
        for (var i = 0; i < els.length; i++){
            elChildForeach(els[i], callback);
        }
    };

    var AccountSelectWidget = function(container, group){
        this.init(container, group);
    };
    AccountSelectWidget.prototype = {
        init: function(container, group){

            var TM = buildTemplate(this, 'select,selrow');

            var lst = "";
            group.accounts.foreach(function(acc){
                lst += TM.replace('selrow', {
                    'id': acc.id, 'tl': acc.getTitle()
                });
            });
            container.innerHTML = TM.replace('select', {'rows': lst});
        },
        destroy: function(){
            var el = this._TM.getEl('select.id');
            el.parentNode.removeChild(el);
        },
        getValue: function(){
            return this._TM.getEl('select.id').value;
        },
        setValue: function(value){
            this._TM.getEl('select.id').value = value;
        },
        setReadonly: function(readonly){
            this._TM.getEl('select.id').disabled = readonly ? 'disabled' : '';
        }
    };
    NS.AccountSelectWidget = AccountSelectWidget;

    var AccountRowWidget = function(container, account, cfg){
        cfg = cfg || {};
        this.init(container, account, cfg);
    };
    AccountRowWidget.prototype = {
        destroy: function(){
            var el = this._TM.getEl('row.id');
            el.parentNode.removeChild(el);
        },

        onSelectByClick: function(){
            NS.life(this.cfg['onSelCallback'], this);
        }
    };
    NS.AccountRowWidget = AccountRowWidget;

    var AccountGroupRowWidget = function(container, agid, cfg){
        cfg = cfg || {};
        this.init(container, agid, cfg);
    };
    AccountGroupRowWidget.prototype = {
        onClick: function(el){
            for (var i = 0; i < this.ws.length; i++){
                if (this.ws[i].onClick(el)){
                    return true;
                }
            }
            return false;
        },
        renderAccount: function(acc){
            var __self = this,
                w = new NS.AccountRowWidget(this._TM.getEl('grow.list'), acc, {
                        'onEditCallback': function(row){
                            __self.onMenuEditClick(row);
                        },
                        'onRemoveCallback': function(row){
                            __self.onMenuRemoveClick(row);
                        },
                        'onAddOperCallback': function(row){
                            __self.onSelectByClick(row);
                        },
                        'onSelCallback': function(row){
                            __self.onSelectByClick(row);
                        }
                    }
                );
            this.ws[this.ws.length] = w;
            return w;
        },
        render: function(){
            var TM = this._TM, ws = this.ws;
            Dom.setStyle(TM.getEl('grow.id'), 'display', ws.length > 0 ? '' : 'none');
            if (ws.length == 0){
                return;
            }

            var sum = {};
            for (var i = 0; i < ws.length; i++){
                var acc = ws[i].account, ccid = acc.currency.sign;
                if (!sum[ccid]){
                    sum[ccid] = 0;
                }

                sum[ccid] += acc.balance * 1;
            }
            var lst = "";
            for (var cc in sum){
                var val = sum[cc];
                lst += TM.replace('gsmrow', {
                    'ise': val >= 0 ? 'green' : 'red',
                    'sm': NS.numberFormat(val),
                    'cc': cc
                });
            }
            TM.getEl('grow.sumlist').innerHTML = lst;

            for (var i = 0; i < this.ws.length; i++){
                this.ws[i].render();
            }
        },
        onMenuEditClick: function(row){
            NS.life(this.cfg['onEditCallback'], row);
        },
        onMenuRemoveClick: function(row){
            NS.life(this.cfg['onRemoveCallback'], row);
        },
        onSelectByClick: function(rowWidget){
            NS.life(this.cfg['onSelCallback'], rowWidget);
        }
    };
    NS.AccountGroupRowWidget = AccountGroupRowWidget;

    var AccountListWidget = function(container, group){
        this.init(container, group);
    };
    AccountListWidget.prototype = {
        init: function(container, group){
            this.group = group;
            var TM = buildTemplate(this, 'widget,grow');

            this.selectedAccount = null;

            this.selectChangedEvent = new CE('selectChangedEvent');
            this.clickCreateEvent = new CE('clickCreateEvent');
            this.clickGroupEditEvent = new CE('clickGroupEditEvent');
            this.clickEditEvent = new CE('clickEditEvent');
            this.clickRemoveEvent = new CE('clickRemoveEvent');
            this.clickGroupRemoveEvent = new CE('clickGroupRemoveEvent');

            container.innerHTML = TM.replace('widget');

            var __self = this;
            this.wgs = {};
            for (var i = 1; i <= 3; i++){
                this.wgs[i] =
                    new AccountGroupRowWidget(TM.getEl('widget.list'), i, {
                        'onEditCallback': function(row){
                            __self.onClickEdit(row.account);
                        },
                        'onRemoveCallback': function(row){
                            __self.onClickRemove(row.account);
                        },
                        'onSelCallback': function(row){
                            __self.selectAccountById(row.account.id);
                        }
                    });
            }

            var __self = this;
            E.on(container, 'click', function(e){
                var el = E.getTarget(e);
                if (__self.onClick(el)){
                    E.preventDefault(e);
                }
            });

            this.buildList();

            var mm = NS.moneyManager;
            mm.balanceChangedEvent.subscribe(this.onBalanceChanged, this, true);

            mm.accountCreatedEvent.subscribe(this.onAccountChanged, this, true);
            mm.accountChangedEvent.subscribe(this.onAccountChanged, this, true);
            mm.accountRemovedEvent.subscribe(this.onAccountChanged, this, true);
        },
        onAccountChanged: function(e, prm){
            this.reBuildList();
        },
        onBalanceChanged: function(e, prm){
            var acc = prm[0];
            if (L.isNull(acc) || acc.groupid != this.group.id){
                return;
            }

            this.render();
        },
        onClick: function(el){
            for (var i = 1; i <= 3; i++){
                if (this.wgs[i].onClick(el)){
                    return true;
                }
            }
            var tp = this._TId['widget'];
            switch (el.id) {
                case tp['bcreate']:
                    this.onClickCreate();
                    return true;
                case tp['bgpedt']:
                    this.onClickGroupEdit();
                    return true;
                case tp['bgprem']:
                    this.onClickGroupRemove();
                    return true;
            }

            return false;
        },
        reBuildList: function(){
            for (var i = 1; i <= 3; i++){
                this.wgs[i]._clearWidgets();
            }
            this.buildList();
            if (!L.isNull(this.selectedAccount)){
                this.selectAccount(this.selectedAccount);
            }
        },


        onSelectAccount: function(account){
            this.selectChangedEvent.fire(account);
        },
        onClickCreate: function(){
            this.clickCreateEvent.fire();
        },
        onClickGroupEdit: function(){
            this.clickGroupEditEvent.fire(this.group);
        },
        onClickEdit: function(acc){
            this.clickEditEvent.fire(acc);
        },
        onClickRemove: function(acc){
            this.clickRemoveEvent.fire(acc);
        },
        onClickGroupRemove: function(){
            this.clickGroupRemoveEvent.fire(this.group);
        }
    };
    NS.AccountListWidget = AccountListWidget;

};