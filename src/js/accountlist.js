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



    var AccountGroupRowWidget = function(container, agid, cfg){
        cfg = cfg || {};
        this.init(container, agid, cfg);
    };
    AccountGroupRowWidget.prototype = {

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

        reBuildList: function(){
            for (var i = 1; i <= 3; i++){
                this.wgs[i]._clearWidgets();
            }
            this.buildList();
            if (!L.isNull(this.selectedAccount)){
                this.selectAccount(this.selectedAccount);
            }
        },



    };
    NS.AccountListWidget = AccountListWidget;

};