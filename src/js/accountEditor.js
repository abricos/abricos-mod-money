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
                isAccount: true,
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
        _visibleButtons: function(val){
            this.template.toggleView(val, 'buttons');
            return val;
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
                setter: '_visibleButtons'
            }
        }
    });

    NS.AccountEditorWidget = Y.Base.create('accountEditorWidget', SYS.AppWidget, [
        NS.GroupByIdExt
    ], {
        buildTData: function(){
            return {
                'stclass': this.get('accountid') > 0 ? 'isedit' : 'isnew'
            };
        },
        initializer: function(){
            this.publish('save');
            this.publish('cancel');
        },
        onLoadGroupData: function(err, group){
            if (!group){
                return;
            }

            var account = this.get('accountid') > 0 ?
                this.get('appInstance').get('accountList').getById(this.get('accountid')) :
                NS.AccountEditorWidget.createAccount(this.get('appInstance'), group.get('id'));

            if (!account){
                return;
            }

            var tp = this.template;

            this.editorWidget = new NS.AccountEditorRowWidget({
                boundingBox: tp.gel('editor'),
                account: account,
                isVisibleButtons: false
            });

            tp.toggleView(account.isAdminRole(), 'bsave,bcancel', 'bclose');
        },
        destructor: function(){
            if (this.editorWidget){
                this.editorWidget.destroy();
            }
        },
        save: function(){
            this.set('waiting', true);

            var d = this.editorWidget.toJSON();

            this.get('appInstance').accountSave(d, function(err, result){
                this.set('waiting', false);
                if (!err){
                    this.fire('save', result);
                }
            }, this);
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'editor'},
            accountid: {value: 0}
        },
        CLICKS:{
            save: 'save',
            cancel: {
                event: function(){
                    this.fire('cancel');
                }
            }
        }
    });

    NS.AccountEditorWidget.createAccount = function(app, groupid){
        return new NS.Account({
            appInstance: app,
            tp: 1, gid: groupid,
            cc: Abricos.config.locale === 'ru-RU' ? 'RUB' : 'USD',
            roles: {
                list: [{id: UID, r: NS.AURoleType.ADMIN}]
            }
        });
    };

    NS.AccountEditorListWidget = Y.Base.create('accountEditorListWidget', SYS.AppWidget, [
        NS.GroupByIdExt
    ], {
        onLoadGroupData: function(err, group){
            this._ws = [];
            this.get('groupid') === 0
                ? this.createAccount()
                : group.accountEach(this._renderAccount, this);
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
            var account = NS.AccountEditorWidget.createAccount(
                this.get('appInstance'),
                this.get('groupid')
            );
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