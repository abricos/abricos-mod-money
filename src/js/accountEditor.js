var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sys', files: ['form.js']},
        {name: '{C#MODNAME}', files: ['userRole.js', 'currency.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;
    var UID = Brick.env.user.id;

    NS.AccountEditorRowWidget = Y.Base.create('accountEditorRowWidget', SYS.AppWidget, [
        SYS.Form
    ], {
        onInitAppWidget: function(err, appInstance){
            this.publish('menuClick');

            var tp = this.template,
                account = this.get('account'),
                accountid = account.get('id'),
                readOnly = accountid > 0 && !account.isAdminRole();

            this.rolesWidget = new NS.RoleListWidget({
                owner: this,
                srcNode: tp.gel('ulst'),
                readOnly: readOnly,
                roleList: account.get('roles')
            });

            this.currencyWidget = new NS.CurrencySelectWidget({
                srcNode: tp.gel('cc'),
                readOnly: readOnly,
                selected: account.get('currency')
            });

            if (readOnly){
                this.get('boundingBox').all('.isROD').set('disabled', 'disabled');
            }

            this.set('model', account);
        },
        destructor: function(){
            this.rolesWidget.destroy();
            this.currencyWidget.destroy();
        },
        onClick: function(e){
            var facade = {
                action: e.dataClick,
                account: this.get('account')
            };
            switch (e.dataClick) {
                case 'remove':
                    this.fire('menuClick', facade);
                    break;
            }
        },
        toJSON: function(){
            this.updateModelFromUI();
            var d = this.get('model').toJSON();
            d.roles = this.rolesWidget.toJSON();
            return d;
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'row'},
            account: {value: null},
            isVisibleButtons: {
                setter: function(val){
                    var elButtons = Y.one(this.template.gel('buttons'));
                    if (elButtons){
                        if (val){
                            elButtons.removeClass('hide');
                        } else {
                            elButtons.addClass('hide');
                        }
                    }
                    return val;
                }
            }
        }
    });

    NS.AccountEditorWidget = Y.Base.create('accountEditorWidget', SYS.AppWidget, [], {}, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            groupid: {value: 0},
            groupList: {value: null}
        }
    });

    NS.AccountEditorListWidget = Y.Base.create('accountEditorListWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance){
            this._ws = [];
            var group = this.get('group'),
                groupid = group.get('id');

            if (groupid === 0){
                this.createAccount();
            } else {
                group.accountEach(this._renderAccount, this);
            }
        },
        _renderAccount: function(account, isInsert){
            var elList = Y.one(this.template.gel('list')),
                elChilds = elList.get('children'),
                div = Y.Node.create('<div></div>');

            if (isInsert && elChilds.size() > 0){
                elChilds.item(0).insert(div, 'before');
            } else {
                elList.appendChild(div);
            }

            var w = new NS.AccountEditorRowWidget({
                boundingBox: div,
                account: account
            });
            div._widget = w;
            w.on('menuClick', this._rowMenuClick, this);
            this._ws[this._ws.length] = w;
            this._updateWidgetList();
        },
        _updateWidgetList: function(){
            var elChilds = this.template.one('list').get('children');
            elChilds.each(function(node){
                if (node._widget){
                    node._widget.set('isVisibleButtons', elChilds.size() > 1);
                }
            });
        },
        createAccount: function(){
            var account = new NS.Account({
                appInstance: this.get('appInstance'),
                tp: 1,
                cc: Abricos.config.locale === 'ru-RU' ? 'RUB' : 'USD',
                roles: {
                    list: [{id: UID, r: NS.AURoleType.ADMIN}]
                }
            });
            this._renderAccount(account, true);
        },
        removeAccount: function(account){
            var ws = this._ws, nws = [];
            for (var i = 0; i < ws.length; i++){
                if (ws[i].get('account') !== account){
                    nws[nws.length] = ws[i];
                } else {
                    ws[i].destroy();
                }
            }
            this._ws = nws;
            this._updateWidgetList();
        },
        _rowMenuClick: function(e){
            switch (e.action) {
                case 'remove':
                    this.removeAccount(e.account);
                    break;
            }
        },
        toJSON: function(){
            var ws = this._ws, d = [];
            for (var i = 0; i < ws.length; i++){
                d[d.length] = ws[i].toJSON();
            }
            return d;
        },
        onClick: function(e){
            switch (e.dataClick) {
                case 'create':
                    this.createAccount();
                    return true;
            }
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            group: {value: null}
        }
    });
};