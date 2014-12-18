/*
 @package Abricos
 @copyright Copyright (C) 2008 Abricos All rights reserved.
 @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 */

var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'widget', files: ['calendar.js']},
        {name: '{C#MODNAME}', files: ['accountlist.js', 'category.js']}
    ]
};
Component.entryPoint = function(NS){

    var Dom = YAHOO.util.Dom,
        E = YAHOO.util.Event,
        L = YAHOO.lang;

    var buildTemplate = this.buildTemplate;

    var OperMoveEditorWidget = function(container, account){
        this.init(container, account);
    };
    OperMoveEditorWidget.prototype = {
        init: function(container, account){
            this.group = NS.moneyManager.groups.get(account.groupid);

            var TM = buildTemplate(this, 'editor');
            container.innerHTML = TM.replace('editor');

            this.dateTimeWidget = new Brick.mod.widget.DateInputWidget(TM.getEl('editor.dt'), {
                'date': new Date(),
                'showBClear': false,
                'showBTime': false,
                'showTime': false
            });

            this.fromAccountWidget = new NS.AccountSelectWidget(TM.getEl('editor.fromacc'), this.group);
            this.toAccountWidget = new NS.AccountSelectWidget(TM.getEl('editor.toacc'), this.group);

            var __self = this;
            E.on(container, 'keypress', function(e){
                if (__self.onKeyPress(E.getTarget(e), e)){
                    E.stopEvent(e);
                }
            });
            this.setAccount(account);
            this.setOper(null);
        },
        destory: function(){
            this.catsWidget.changedEvent.unsubscribe(this.catsChanged);
        },
        setAccount: function(acc){
            this.account = acc;
            var TM = this._TM;
            var cc = acc.currency;
            TM.getEl('editor.cc').innerHTML = L.isNull(cc) ? "" : acc.currency.sign;
        },
        onClick: function(el){
            var tp = this._TId['editor'];
            switch (el.id) {
                case tp['bcreate']:
                case tp['bsave']:
                    this.save();
                    return false;
                case tp['bcancel']:
                    this.setOper(null);
                    return false;
            }
            return false;
        },
        onKeyPress: function(el, e){
            if (e.keyCode == 13 && el.id == this._TM.getElId('editor.in')){
                this.save();
            }
            return false;
        },
        setOper: function(oper){
            this.oper = oper;

            var mt = new NS.OperMethodMove();

            var TM = this._TM, gel = function(n){
                return TM.getEl('editor.' + n);
            };

            var ss = Dom.setStyle;

            if (L.isNull(oper)){
                ss(gel('bcreate'), 'display', '');
                ss(gel('bsave'), 'display', 'none');
                ss(gel('bcancel'), 'display', 'none');
                oper = new NS.Oper();

                this.fromAccountWidget.setReadonly(false);
                this.toAccountWidget.setReadonly(false);
            } else {
                ss(gel('bcreate'), 'display', 'none');
                ss(gel('bsave'), 'display', '');
                ss(gel('bcancel'), 'display', '');

                var acc = NS.moneyManager.findAccount(oper.accountid);
                this.setAccount(acc);

                mt = oper.method;

                this.fromAccountWidget.setReadonly(true);
                this.toAccountWidget.setReadonly(true);
            }

            gel('in').value = oper.value == 0 ? '' : oper.value;
            gel('dsc').value = oper.descript;
            this.dateTimeWidget.setValue(oper.date);

            this.fromAccountWidget.setValue(mt.fromAccountId);
            this.toAccountWidget.setValue(mt.toAccountId);
        },
        save: function(){
            if (this._saveProcess){
                return;
            }
            this._saveProcess = true;

            var TM = this._TM, gel = function(n){
                    return TM.getEl('editor.' + n);
                },
                __self = this;

            var dt = this.dateTimeWidget.getValue();
            dt = L.isNull(dt) ? new Date() : dt;

            gel('bsave').disabled = "disabled";
            Dom.setStyle(gel('pcsave'), 'display', '');
            var sd = {
                'id': L.isNull(this.oper) ? 0 : this.oper.methodid,
                'faid': this.fromAccountWidget.getValue(),
                'taid': this.toAccountWidget.getValue(),
                'v': gel('in').value,
                'd': dt.getTime() / 1000,
                'dsc': gel('dsc').value
            };
            NS.moneyManager.operMoveSave(sd, function(){
                __self._saveProcess = false;
                gel('bsave').disabled = "";
                Dom.setStyle(gel('pcsave'), 'display', 'none');
                gel('in').value = "";
                gel('dsc').value = "";
                __self.setOper(null);
            });
        }
    };
    NS.OperMoveEditorWidget = OperMoveEditorWidget;

};