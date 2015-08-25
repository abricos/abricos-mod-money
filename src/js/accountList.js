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

    NS.AccountSelectWidget = Y.Base.create('accountSelectWidget', SYS.AppWidget, [], {
        buildTData: function(){
            var accountList = this.get('accountList'),
                tp = this.template,
                lst = "";

            accountList.each(function(account){
                lst += tp.replace('selrow', account.toJSON());
            });
            return {rows: lst};
        },
        getValue: function(){
            return this.template.gel('id').value;
        },
        setValue: function(value){
            this.template.gel('id').value = value;
        },
        setReadonly: function(readonly){
            this.template.gel('id').disabled = readonly ? 'disabled' : '';
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'select,selrow'},
            accountList: {value: null}
        }
    });

    NS.AccountRowWidget = Y.Base.create('accountRowWidget', SYS.AppWidget, [], {
        buildTData: function(){
            return this.get('account').toJSON();
        },
        onInitAppWidget: function(err, appInstance){
            this.publish('menuClick');

            var tp = this.template,
                account = this.get('account'),
                acc = account.toJSON();

            tp.setHTML({
                'tl': account.getTitle(),
                'cc': account.getCurrency().get('sign'),
                'val': NS.numberFormat(acc.balance)
            });

            tp.replaceClass('val', 'text-success', 'text-danger', acc.balance >= 0);

            tp.visible('bedit,brem', account.isEditRole());
            tp.visible('badd', account.isOperRole());
        },
        _isSelectedSetter: function(isSelected){
            this.template.toggleClass('sel', 'sel', isSelected);

            return !!isSelected;
        },
        _onMenuClick: function(e){
            this.fire('menuClick', {
                account: this.get('account'),
                action: e.dataClick
            });
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'row'},
            account: {value: null},
            isSelected: {
                setter: '_isSelectedSetter'
            }
        },
        CLICKS: {
            'edit,create,remove,select': '_onMenuClick'
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
        renderAccount: function(account){
            var w = new NS.AccountRowWidget({
                boundingBox: this.template.append('list', '<div></div>'),
                account: account
            });
            w.on('menuClick', this._onRowMenuClick, this);
            this._ws[this._ws.length] = w;
            this.template.show('grow');
            return w;
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
            this.publish('menuClick');
            this.publish('accountMenuClick');

            this._wgs = {};
            for (var i = 1; i <= 3; i++){
                this._wgs[i] = new NS.AccountGroupRowWidget({
                    boundingBox: this.template.append('list', '<div></div>'),
                    groupType: i
                });
                this._wgs[i].on('accountMenuClick', this._onAccountMenuClick, this);
            }
            this._widgetsInitialized = true;
        },
        destructor: function(){
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
            var tp = this.template,
                groupid = group.get('id');

            tp.setHTML('gtl', group.getTitle());

            this.get('accountList').each(function(account){
                if (groupid !== account.get('groupid')){
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
                this._wgs[agid].renderAccount(account);
            }, this);

            this.selectAccount(this.get('firstAccount'));
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
        _onMenuClick: function(e){
            this.fire('menuClick', {group: this.get('group'), action: e.dataClick});
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            selectedAccount: {
                setter: '_selectedAccountSetter'
            }
        },
        CLICKS: {
            'edit': {event: '_onMenuClick'},
            'create': {event: '_onMenuClick'},
            'remove': {event: '_onMenuClick'}
        }
    });

};