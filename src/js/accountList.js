var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: '{C#MODNAME}', files: ['lib.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.AccountSelectWidget = Y.Base.create('accountSelectWidget', SYS.AppWidget, [
        NS.GroupByIdExt
    ], {
        onLoadGroupData: function(){
            this.publish('accountChange');
            this.get('appInstance').on('appResponses', this._onAppResponses, this);
            this.renderList();
        },
        destructor: function(){
            this.get('appInstance').detach('appResponses', this._onAppResponses, this);
        },
        _onAppResponses: function(e){
            if (e.err || !e.result.accountList){
                return;
            }
            this.renderList();
        },
        renderList: function(){
            var tp = this.template,
                group = this.get('group'),
                lst = "";

            if (!group){
                return;
            }
            group.accountEach(function(account){
                lst += tp.replace('selrow', [
                    {
                        title: account.getTitle(),
                        balance: NS.numberFormat(account.get('balance')),
                        sign: account.getCurrency().get('sign')
                    },
                    account.toJSON()
                ]);
            });

            if (tp.one('id')){
                tp.one('id').detachAll();
            }
            this.get('boundingBox').setHTML(tp.replace('select', {
                rows: lst
            }));
            tp.one('id').on('change', this.onSelectedChange, this);
        },
        onSelectedChange: function(){
            this.fire('accountChange', {value: this.selected()});
        },
        select: function(val){
            if (!Y.Lang.isNumber(val) || !this.get('group') || !this.template.one('id')){
                return null;
            }
            this.template.setValue('id', val);
        },
        selected: function(){
            return this.template.getValue('id') | 0;
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'select,selrow'},
            accountList: {value: null},
            readOnly: {
                value: false,
                setter: function(val){
                    var tp = this.template;
                    if (tp){
                        tp.one('id').set('disabled', val ? 'disabled' : '');
                    }
                    return val;
                }
            }
        }
    });

    NS.AccountRowWidget = Y.Base.create('accountRowWidget', SYS.AppWidget, [], {
        buildTData: function(){
            return this.get('account').toJSON();
        },
        onInitAppWidget: function(err, appInstance){
            this.publish('menuClick');
            this.renderAccount();
        },
        renderAccount: function(){
            var account = this.get('account');
            if (!account){
                return;
            }

            var tp = this.template;

            tp.setHTML({
                'tl': account.getTitle(),
                'cc': account.getCurrency().get('sign')
            });

            tp.visible('bedit,brem', account.isEditRole());
            tp.visible('badd', account.isOperRole());

            this.renderBalance();
        },
        renderBalance: function(){
            var account = this.get('account');
            if (!account){
                return;
            }

            var tp = this.template,
                val = account.get('balance');

            tp.setHTML({
                'val': NS.numberFormat(val)
            });

            tp.replaceClass('val', 'text-success', 'text-danger', val >= 0);
            return {
                balance: val,
                sign: account.getCurrency().get('sign')
            };
        },
        _isSelectedSetter: function(isSelected){
            this.template.toggleClass('sel', 'sel', isSelected);

            return !!isSelected;
        },
        closeRemove: function(){
            if (!this._removeWidget){
                return;
            }
            this._removeWidget.destroy();
            this._removeWidget = null;
            this.template.show('buttons');
        },
        showRemove: function(){
            this.closeRemove();
            var tp = this.template;
            this._removeWidget = new NS.AccountRowWidget.RemoveWidget({
                srcNode: tp.append('remove', '<div></div>'),
                CLICKS: {
                    cancel: {
                        event: this.closeRemove, context: this
                    },
                    remove: {
                        event: this.remove, context: this
                    }
                }
            });
            tp.hide('buttons');
        },
        remove: function(){
            this.set('waiting', true);
            var account = this.get('account');

            this.get('appInstance').accountRemove(account, function(err, result){
                this.set('waiting', false);
                if (!err){
                    this.go('group.view', account.get('groupid'), true);
                }
            }, this);
        },
        _onMenuClick: function(e){
            if (e.dataClick === 'remove'){
                return this.showRemove();
            }
            this.fire('menuClick', {
                account: this.get('account'),
                action: e.dataClick
            });
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'row'},
            accountid: {
                writeOnce: true
            },
            account: {
                readOnly: true,
                getter: function(){
                    var accountid = this.get('accountid');
                    return this.get('appInstance').get('accountList').getById(accountid);
                }
            },
            isSelected: {
                setter: '_isSelectedSetter'
            }
        },
        CLICKS: {
            'edit,create,remove,select': '_onMenuClick'
        }
    });

    NS.AccountRowWidget.RemoveWidget = Y.Base.create('removeWidget', SYS.AppWidget, [], {}, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'remove'},
        }
    });

    NS.AccountGroupRowWidget = Y.Base.create('accountGroupRowWidget', SYS.AppWidget, [], {
        buildTData: function(){
            var groupType = this.get('groupType');
            return {
                title: Abricos.I18n.get('mod.money.account.group.' + groupType)
            }
        },
        onInitAppWidget: function(){
            this.publish('accountMenuClick');
            this._clearWidgets();
        },
        destructor: function(){
            this._clearWidgets();
        },
        _clearWidgets: function(){
            var ws = this._ws || [];
            for (var i = 0; i < ws.length; i++){
                ws[i].destroy();
            }
            this._ws = [];
            this.template.hide('grow');
        },
        each: function(fn, context){
            var ws = this._ws;
            for (var i = 0; i < ws.length; i++){
                fn.call(context || this, ws[i].get('account'), ws[i]);
            }
        },
        accountAppend: function(account){
            var w, tp = this.template;
            this.each(function(iAccount, iW){
                if (account.get('id') === iAccount.get('id')){
                    w = iW;
                }
            }, this);
            if (!w){
                w = new NS.AccountRowWidget({
                    boundingBox: tp.append('list', '<div></div>'),
                    accountid: account.get('id'),
                    appInstance: this.get('appInstance')
                });
                w.on('menuClick', this._onRowMenuClick, this);
                this._ws[this._ws.length] = w;
            }
            tp.show('grow');
            return w;
        },
        renderList: function(){
            var ws = this._ws,
                sum = {};

            for (var i = 0; i < ws.length; i++){
                var r = ws[i].renderBalance();
                if (!sum[r.sign]){
                    sum[r.sign] = 0;
                }
                sum[r.sign] += r.balance;
            }

            var tp = this.template,
                lst = "";

            for (var cc in sum){
                var val = sum[cc];
                lst += tp.replace('gsmrow', {
                    'ise': val >= 0 ? 'text-success' : 'text-danger',
                    'sm': NS.numberFormat(val),
                    'cc': cc
                });
            }
            tp.setHTML('grow.sumlist', lst);
        },
        _onRowMenuClick: function(e){
            this.fire('accountMenuClick', {action: e.action, account: e.account});
        },
        _selectedAccountSetter: function(account){
            var accountid = 0, ret = null;
            if (account){
                accountid = Y.Lang.isNumber(account) ? account : account.get('id');
            }
            var ws = this._ws;
            for (var i = 0; i < ws.length; i++){
                var w = ws[i];
                if (w.get('account').get('id') === accountid){
                    ret = w.get('account');
                    w.set('isSelected', true);
                } else {
                    w.set('isSelected', false);
                }
            }
            return ret;
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'grow,gsmrow'},
            groupType: {value: 0},
            selectedAccount: {
                setter: '_selectedAccountSetter'
            }
        }
    });

    NS.AccountListWidget = Y.Base.create('accountListWidget', SYS.AppWidget, [
        NS.GroupByIdExt
    ], {
        buildTData: function(){
            return {id: this.get('groupid')}
        },
        onBeforeLoadGroupData: function(){
            this.get('appInstance').on('appResponses', this._onAppResponses, this);

            this.publish('menuClick');
            this.publish('accountMenuClick');

            this._wgs = {};
            for (var i = 1; i <= 3; i++){
                var w = this._wgs[i] = new NS.AccountGroupRowWidget({
                    boundingBox: this.template.append('list', '<div></div>'),
                    groupType: i
                });
                w.on('accountMenuClick', this._onAccountMenuClick, this);
            }
            this._widgetsInitialized = true;
        },
        _onAppResponses: function(e){
            if (e.err || !e.result.balanceList){
                return;
            }
            this.renderList();
        },
        destructor: function(){
            this.get('appInstance').detach('appResponses', this._onAppResponses, this);

            if (this._widgetsInitialized){
                for (var i = 1; i <= 3; i++){
                    this._wgs[i].destroy();
                }
            }
        },
        onLoadGroupData: function(err, group){
            if (!group){
                return;
            }
            var tp = this.template;

            tp.setHTML('gtl', group.getTitle());

            this.get('accountList').each(this._renderAccount, this);

            this.selectAccount(this.get('firstAccount'));
            this.renderList();
        },
        renderAccount: function(account){
            if (Y.Lang.isNumber(account)){
                account = this.get('appInstance').get('accountList').getById(account);
            }
            this._renderAccount(account);
            this.selectAccount(account);
            this.renderList();
        },
        _renderAccount: function(account){
            if (this.get('groupid') !== account.get('groupid')){
                return;
            }
            var agid = 1;
            switch (account.get('type')) {
                case 5:
                    agid = 2;
                    break;
                case 6:
                case 7:
                    agid = 3;
                    break;
            }
            this._wgs[agid].accountAppend(account);
        },
        renderList: function(){
            for (var i = 1; i <= 3; i++){
                this._wgs[i].renderList();
            }
        },
        each: function(fn, context){
            for (var i = 1, wgs = this._wgs; i <= 3; i++){
                wgs[i].each(function(account, w){
                    fn.call(context || this, account, w, wgs[i]);
                });
            }
        },
        _onAccountMenuClick: function(e){
            this.fire('accountMenuClick', {account: e.account, action: e.action});
        },
        selectAccount: function(account){
            this.set('selectedAccount', account);
        },
        _selectedAccountSetter: function(account){
            var ret = null;

            for (var i = 1; i <= 3; i++){
                var w = this._wgs[i];
                w.set('selectedAccount', account);
                var acc = w.get('selectedAccount');
                if (acc){
                    ret = acc;
                }
            }
            return ret;
        },
        closeRemove: function(){
            if (!this._removeWidget){
                return;
            }
            this._removeWidget.destroy();
            this._removeWidget = null;
        },
        showRemove: function(){
            this.closeRemove();
            var tp = this.template;
            this._removeWidget = new NS.AccountListWidget.GroupRemoveWidget({
                srcNode: tp.append('groupRemove', '<div></div>'),
                CLICKS: {
                    cancel: {
                        event: this.closeRemove, context: this
                    },
                    remove: {
                        event: this.remove, context: this
                    }
                }
            });
        },
        remove: function(){
            this.set('waiting', true);
            var group = this.get('group');

            this.get('appInstance').groupRemove(group.get('id'), function(err, result){
                this.set('waiting', false);
                if (!err){
                    this.go('ws');
                }
            }, this);
        },
        _onMenuClick: function(e){
            if (e.dataClick === 'remove'){
                return this.showRemove();
            }
            this.fire('menuClick', {group: this.get('group'), action: e.dataClick});
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            selectedAccount: {
                setter: '_selectedAccountSetter'
            }
        },
        CLICKS: {
            'create,remove': '_onMenuClick'
        }
    });

    NS.AccountListWidget.GroupRemoveWidget = Y.Base.create('groupRemoveWidget', SYS.AppWidget, [], {}, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'groupRemove'},
        }
    });


};