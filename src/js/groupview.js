var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: '{C#MODNAME}', files: ['accountlist.js', 'oper.js', 'operlist.js', 'accountinfo.js']}
    ]
};
Component.entryPoint = function(NS){

    var Dom = YAHOO.util.Dom,
        L = YAHOO.lang;

    var buildTemplate = this.buildTemplate;

    var GroupViewWidget = function(container, groupid){
        this.init(container, groupid);
    };
    GroupViewWidget.prototype = {
        init: function(container, groupid){

            this.operWidget = null;
            this.accountInfoWidget = null;
            this.accountEditorWidget = null;

            var TM = buildTemplate(this, 'widget');
            container.innerHTML = TM.replace('widget', {
                'groupid': groupid,
                'newgroupurl': NS.navigator.group.create
            });

            var gel = function(n){
                    return TM.getEl('widget.' + n);
                },
                __self = this;

            var group = NS.moneyManager.groups.get(groupid);
            this.group = group;
            if (L.isNull(group)){
                Dom.setStyle(gel('ws'), 'display', 'none');
                Dom.setStyle(gel('notfound'), 'display', '');
                return;
            }

            this.accountsWidget = new NS.AccountListWidget(gel('acclist'), group);
            this.accountsWidget.selectChangedEvent.subscribe(this.onAccountsSelectChanged, this, true);
            this.accountsWidget.clickGroupEditEvent.subscribe(this.onAccountsClickGroupEdit, this, true);
            this.accountsWidget.clickGroupRemoveEvent.subscribe(this.onAccountsClickGroupRemove, this, true);
            this.accountsWidget.clickCreateEvent.subscribe(this.onAccountsClickCreate, this, true);
            this.accountsWidget.clickEditEvent.subscribe(this.onAccountsClickEdit, this, true);
            this.accountsWidget.clickRemoveEvent.subscribe(this.onAccountsClickRemove, this, true);

            this.operLogWidget = new NS.OperLogWidget(gel('operlog'), group);
            this.operLogWidget.onRowClickEdit = function(oper){
                __self.onOperLogRowClickEdit(oper);
            };
            this.operLogWidget.onRowClickRemove = function(oper){
                __self.onOperLorRowClickRemove(oper);
            };

            this.setFirstAccount();
        },
        destroy: function(){
            if (this.accountsWidget){
                this.accountsWidget.selectChangedEvent.unsubscribe(this.onAccountsSelectChanged);
                this.accountsWidget.clickGroupEditEvent.unsubscribe(this.onAccountsClickGroupEdit);
                this.accountsWidget.clickGroupRemoveEvent.unsubscribe(this.onAccountsClickGroupRemove);
                this.accountsWidget.clickCreateEvent.unsubscribe(this.onAccountsClickCreate);
                this.accountsWidget.clickEditEvent.unsubscribe(this.onAccountsClickEdit);
                this.accountsWidget.clickRemoveEvent.unsubscribe(this.onAccountsClickRemove);
                this.accountsWidget.destroy();

                this.operLogWidget.destroy();
            }
            if (!L.isNull(this.operWidget)){
                this.operWidget.destroy();
            }
            if (!L.isNull(this.accountInfoWidget)){
                this.accountInfoWidget.destroy();
            }
            if (!L.isNull(this.accountEditorWidget)){
                this.accountEditorWidget.destroy();
            }
            var el = this._TM.getEl('widget.id');
            el.parentNode.removeChild(el);
        },
        setFirstAccount: function(){
            var acc = this.group.accounts.getByIndex(0);
            this.accountsWidget.selectAccount(acc);
            return acc;
        },
        onAccountsClickCreate: function(){
            this.showAccountEditor(0);
        },
        onAccountsClickEdit: function(evt, prm){
            var account = prm[0];
            this.showAccountEditor(account.id);
        },
        onAccountsClickRemove: function(evt, prm){
            var account = prm[0], __self = this;
            new AccountRemovePanel(account, function(){
                var acc = __self.setFirstAccount();
                if (L.isNull(acc)){
                    Brick.Page.reload(NS.navigator.ws);
                }
            });
        },
        onAccountsClickGroupEdit: function(evt, prm){
            var uri = NS.navigator.group.edit(this.group.id);
            Brick.Page.reload(uri);
        },
        onAccountsClickGroupRemove: function(evt, prm){
            new GroupRemovePanel(this.group, function(){
                Brick.Page.reload(NS.navigator.ws);
            });
        },
        onAccountsSelectChanged: function(evt, prm){
            var TM = this._TM, account = prm[0];

            if (L.isNull(account)){
                if (this.group.accounts.count() > 0){
                    // удалили аккаунт, а он открыт
                    var acc = this.group.accounts.getByIndex(0);
                    this.accountsWidget.selectAccount(acc);
                    return;
                }
                if (!L.isNull(this.operWidget)){
                    this.operWidget.destroy();
                    this.operWidget = null;
                }
                if (!L.isNull(this.accountInfoWidget)){
                    this.accountInfoWidget.destory();
                    this.accountInfoWidget = null;
                }
                // TODO: вывести добавление счета
            } else {
                if (L.isNull(this.operWidget)){
                    this.operWidget = new NS.OperationWidget(TM.getEl('widget.oper'), account);
                } else {
                    this.operWidget.setAccount(account);
                }
                if (L.isNull(this.accountInfoWidget)){
                    this.accountInfoWidget = new NS.AccountInfoWidget(TM.getEl('widget.accinfo'), account);
                } else {
                    this.accountInfoWidget.setAccount(account);
                }
                if (!L.isNull(this.accountEditorWidget)){
                    this._showAccEdMethod(account.id);
                }
                if (account.isOperRole()){
                    Dom.setStyle(TM.getEl('widget.oper'), 'display', '');
                } else {
                    Dom.setStyle(TM.getEl('widget.oper'), 'display', 'none');
                }
            }
        },
        onOperLogRowClickEdit: function(oper){
            this.closeAccontEditor();
            this.operWidget.setOper(oper);
        },
        onOperLorRowClickRemove: function(oper){
            var opers = this.operLogWidget.listWidget.opers;
            new NS.OperRemovePanel(oper, opers, function(){

            });
        },
        showAccountEditor: function(aid){
            Dom.setStyle(this._TM.getEl('widget.acceditor'), 'display', '');

            var __self = this;
            Brick.ff('{C#MODNAME}', 'accounteditor', function(){
                __self._showAccEdMethod(aid);
            });
        },
        _showAccEdMethod: function(aid){
            if (!L.isNull(this.accountEditorWidget)){
                this.closeAccontEditor();
            }

            var TM = this._TM, acc = NS.moneyManager.findAccount(aid);
            if (L.isNull(acc)){
                acc = this.group.createAccount();
            }
            Dom.setStyle(TM.getEl('widget.oper'), 'display', 'none');
            Dom.setStyle(TM.getEl('widget.accinfo'), 'display', 'none');
            Dom.setStyle(TM.getEl('widget.acceditor'), 'display', '');

            var __self = this;
            this.accountEditorWidget =
                new NS.AccountEditorWidget(TM.getEl('widget.acceditor'), acc, function(){
                    __self.closeAccontEditor();
                });
        },
        closeAccontEditor: function(){
            if (L.isNull(this.accountEditorWidget)){
                return;
            }

            var TM = this._TM;
            Dom.setStyle(TM.getEl('widget.oper'), 'display', '');
            Dom.setStyle(TM.getEl('widget.accinfo'), 'display', '');
            Dom.setStyle(TM.getEl('widget.acceditor'), 'display', 'none');

            this.accountEditorWidget.destroy();
            this.accountEditorWidget = null;
        }

    };
    NS.GroupViewWidget = GroupViewWidget;

    NS.GroupViewWidget.parseURLParam = function(args){
        return {
            groupid: args[0] | 0
        };
    };



    var AccountRemovePanel = function(account, callback){
        this.account = account;
        this.callback = callback;
        AccountRemovePanel.superclass.constructor.call(this, {fixedcenter: true});
    };
    YAHOO.extend(AccountRemovePanel, Brick.widget.Dialog, {
        initTemplate: function(){
            return buildTemplate(this, 'accremovepanel').replace('accremovepanel', {
                'tl': this.account.getTitle()
            });
        },
        onClick: function(el){
            var tp = this._TId['accremovepanel'];
            switch (el.id) {
                case tp['bcancel']:
                    this.close();
                    return true;
                case tp['bremove']:
                    this.accRemove();
                    return true;
            }
            return false;
        },
        accRemove: function(){
            var TM = this._TM, gel = function(n){
                    return TM.getEl('accremovepanel.' + n);
                },
                __self = this;
            Dom.setStyle(gel('btns'), 'display', 'none');
            Dom.setStyle(gel('bloading'), 'display', '');

            NS.moneyManager.accountRemove(this.account.id, function(){
                __self.close();
                NS.life(__self.callback);
            });
        }
    });
    NS.AccountRemovePanel = AccountRemovePanel;

    var GroupRemovePanel = function(group, callback){
        this.group = group;
        this.callback = callback;
        GroupRemovePanel.superclass.constructor.call(this, {fixedcenter: true});
    };
    YAHOO.extend(GroupRemovePanel, Brick.widget.Dialog, {
        initTemplate: function(){
            return buildTemplate(this, 'groupremovepanel').replace('groupremovepanel');
        },
        onClick: function(el){
            var tp = this._TId['groupremovepanel'];
            switch (el.id) {
                case tp['bcancel']:
                    this.close();
                    return true;
                case tp['bremove']:
                    this.groupRemove();
                    return true;
            }
            return false;
        },
        groupRemove: function(){
            var TM = this._TM, gel = function(n){
                    return TM.getEl('groupremovepanel.' + n);
                },
                __self = this;
            Dom.setStyle(gel('btns'), 'display', 'none');
            Dom.setStyle(gel('bloading'), 'display', '');

            NS.moneyManager.groupRemove(this.group.id, function(){
                __self.close();
                NS.life(__self.callback);
            });
        }
    });
    NS.GroupRemovePanel = GroupRemovePanel;

    var OperRemovePanel = function(oper, opers, callback){
        this.oper = oper;
        this.opers = opers;
        this.callback = callback;
        OperRemovePanel.superclass.constructor.call(this, {fixedcenter: true});
    };
    YAHOO.extend(OperRemovePanel, Brick.widget.Dialog, {
        initTemplate: function(){
            var TM = buildTemplate(this, 'orempanel'),
                oper = this.oper,
                opers = this.opers;

            var MM = NS.moneyManager, sAcc = "", sOTp = "";

            var LLNG = Abricos.I18n.get('mod.money.oper.type', {isData: true});
            if (oper.methodid == 0){
                var account = MM.findAccount(oper.accountid);
                sAcc = L.isNull(account) ? '' : account.getTitle();

                sOTp = oper.isExpense ? LLNG['expense'] : LLNG['income'];
            } else {
                var opMove = opers.methods.get(oper.methodid),
                    fAcc = MM.findAccount(opMove.fromAccountId),
                    tAcc = MM.findAccount(opMove.toAccountId);

                sAcc = (L.isNull(fAcc) ? '' : fAcc.getTitle()) + " -&gt; " +
                    (L.isNull(tAcc) ? '' : tAcc.getTitle());
                sOTp = LLNG['move'];
            }

            return TM.replace('orempanel', {
                'otp': sOTp,
                'acc': sAcc,
                'v': NS.numberFormat(oper.value),
                'd': Brick.dateExt.convert(oper.date.getTime() / 1000, 0, true),
                'dsc': oper.descript

            });
        },
        onClick: function(el){
            var tp = this._TId['orempanel'];
            switch (el.id) {
                case tp['bcancel']:
                    this.close();
                    return true;
                case tp['bremove']:
                    this.operRemove();
                    return true;
            }

            return false;
        },
        operRemove: function(){
            var TM = this._TM, gel = function(n){
                    return TM.getEl('orempanel.' + n);
                },
                __self = this;
            Dom.setStyle(gel('btns'), 'display', 'none');
            Dom.setStyle(gel('bloading'), 'display', '');

            var onremo = function(){
                __self.opers.remove();
                __self.close();
                NS.life(__self.callback);
            };

            if (this.oper.methodid > 0){
                NS.moneyManager.operMoveRemove(this.oper.methodid, onremo);
            } else {
                NS.moneyManager.operRemove(this.oper.id, onremo);
            }
        }
    });
    NS.OperRemovePanel = OperRemovePanel;

};