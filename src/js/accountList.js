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

    NS.AccountRowWidget = Y.Base.create('accountRowWidget', SYS.AppWidget, [], {
        buildTData: function(){
            return this.get('account').toJSON();
        },
        onInitAppWidget: function(err, appInstance){
            this.publish('menuClick');

            var tp = this.template,
                account = this.get('account'),
                acc = account.toJSON();

            tp.gel('tl').innerHTML = account.getTitle();
            tp.gel('cc').innerHTML = account.getCurrency().get('sign');

            var elv = Y.one(tp.gel('val'));
            elv.setHTML(NS.numberFormat(acc.balance));

            if (acc.balance >= 0){
                elv.replaceClass('red', 'green');
            } else {
                elv.replaceClass('green', 'red');
            }

            if (!account.isEditRole()){
                Y.one(tp.gel('bedit')).addClass('hide');
                Y.one(tp.gel('brem')).addClass('hide');
            }
            if (!account.isOperRole()){
                Y.one(tp.gel('badd')).addClass('hide');
            }
        },
        _isSelectedSetter: function(val){
            var elSel = Y.one(this.template.gel('sel'));

            if (val){
                elSel.addClass('sel');
            } else {
                elSel.removeClass('sel');
            }
            return !!val;
        },
        onClick: function(e){
            switch (e.dataClick) {
                case 'edit':
                case 'create':
                case 'remove':
                    this.fire('menuClick', {
                        account: this.get('account'),
                        action: e.dataClick
                    });
                    return true;
            }
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'row'},
            account: {value: null},
            isSelected: {
                setter: '_isSelectedSetter'
            }
        }
    });

    NS.AccountGroupRowWidget = Y.Base.create('accountGroupRowWidget', SYS.AppWidget, [], {
        buildTData: function(){
            var groupType = this.get('groupType');
            return {
                title: Abricos.I18n.get('mod.money.account.group.' + groupType)
            }
        },
        initializer: function(){
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
        },
        renderAccount: function(account){
            var elList = Y.one(this.template.gel('list')),
                div = Y.Node.create('<div></div>'),
                ws = this._ws;

            elList.appendChild(div);

            var w = new NS.AccountRowWidget({
                boundingBox: div,
                account: account
            });
            w.on('menuClick', this._onRowMenuClick, this);
            ws[ws.length] = w;
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

    NS.AccountListWidget = Y.Base.create('accountListWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance){
            this.publish('menuClick');
            this.publish('accountMenuClick');

            this._wgs = {};

            var tp = this.template,
                elList = Y.one(tp.gel('list'));

            for (var i = 1; i <= 3; i++){
                var div = Y.Node.create('<div></div>');
                elList.appendChild(div);
                this._wgs[i] = new NS.AccountGroupRowWidget({
                    boundingBox: div,
                    groupType: i
                });
                this._wgs[i].on('accountMenuClick', this._onAccountMenuClick, this);
            }

            this.set('waiting', true);
            appInstance.groupList(function(err, result){
                this.set('waiting', false);
                if (!err){
                    this.set('groupList', result.groupList);
                    this.set('accountList', result.accountList);
                }
                this.renderList();
            }, this);
        },
        _onAccountMenuClick: function(e){
            this.fire('accountMenuClick', {account: e.account, action: e.action});
        },
        renderList: function(){
            var tp = this.template,
                groupList = this.get('groupList'),
                groupid = this.get('groupid'),
                group = groupList.getById(groupid);

            this.set('group', group);

            tp.gel('gtl').innerHTML = group.getTitle();

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
        onClick: function(e){
            switch (e.dataClick) {
                case 'edit':
                case 'create':
                case 'remove':
                    this.fire('menuClick', {group: this.get('group'), action: e.dataClick});
                    return true;
            }
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            groupid: {value: null},
            group: {value: null},
            groupList: {value: null},
            accountList: {value: null},
            selectedAccount: {
                setter: '_selectedAccountSetter'
            }
        }
    });

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

};