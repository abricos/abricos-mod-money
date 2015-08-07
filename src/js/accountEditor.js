var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: '{C#MODNAME}', files: ['userRole.js', 'currency.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.AccountEditorRowWidget = Y.Base.create('accountEditorRowWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance){
            var tp = this.template,
                account = this.get('account'),
                accountid = account.get('id'),
                readOnly = accountid > 0 && !account.isAdminRole();

            this.rolesWidget = new NS.RoleListWidget({
                srcNode: tp.gel('ulst'),
                readOnly: readOnly,
                isAccount: true,
                ownerid: accountid
            });

            this.currencyWidget = new NS.CurrencySelectWidget({
                srcNode: tp.gel('cc'),
                readOnly: readOnly,
                selected: account.get('currency')
            });
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'row'},
            account: {value: null},
            isFirst: {value: false}
        }
    });

    NS.AccountEditorWidget = Y.Base.create('accountEditorWidget', SYS.AppWidget, [], {
        buildTData: function(){
            return {
                'gstclass': this.get('groupid') > 0 ? 'isgedit' : 'isgnew'
            };
        },
        onInitAppWidget: function(err, appInstance){
            this.set('waiting', true);
            appInstance.groupList(function(err, result){
                this.set('waiting', false);
                if (!err){
                    this.set('groupList', result.groupList);
                }
                this.renderGroup();
            }, this);
        },
        renderGroup: function(){
            var appInstance = this.get('appInstance'),
                groupid = this.get('groupid'),
                group = groupid > 0 ?
                    this.get('groupList').getById(groupid) :
                    new NS.Group({appInstance: appInstance});

            this.set('model', group);

        },
        onSubmitFormAction: function(){
            this.set('waiting', true);

            var model = this.get('model');

            this.get('appInstance').configSave(model, function(err, result){
                this.set('waiting', false);
            }, this);
        },
        onClick: function(e){

        }
    }, {
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
                var account = new NS.Account({appInstance: appInstance});
                this._renderAccount(account);
            } else {
                this.get('group').accountEach(this._renderAccount, this);
            }
        },
        _renderAccount: function(account){
            var w = new NS.AccountEditorRowWidget({
                srcNode: Y.one(this.template.gel('list')).appendChild('<div></div>'),
                account: account
            });
            this._ws[this._ws.length] = w;
        }

    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            group: {value: null}
        }
    });
};