var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'widget', files: ['calendar.js']},
        {name: '{C#MODNAME}', files: ['userRole.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.AccountInfoWidget = Y.Base.create('accountInfoWidget', SYS.AppWidget, [
        NS.GroupByIdExt
    ], {
        onLoadGroupData: function(err, group){
            var account = this.get('firstAccount');
            if (account){
                this.set('accountid', account.get('id'));
            }
            this.renderAccount();
            this.after('accountidChange', this.renderAccount, this);
            this.get('appInstance').on('appResponses', this._onAppResponses, this);
        },
        destructor: function(){
            this.get('appInstance').detach('appResponses', this._onAppResponses, this);
            if (this.rolesWidget){
                this.rolesWidget.destroy();
            }
        },
        _onAppResponses: function(e){
            if (e.result.accountList || e.result.balanceList){
                this.renderAccount();
            }
        },
        renderAccount: function(){
            var accountid = this.get('accountid'),
                account = this.get('appInstance').get('accountList').getById(accountid);

            if (!account){
                return;
            }
            var tp = this.template;
            tp.setHTML({
                tl: account.getTitle(),
                dsc: account.get('descript'),
                cc: account.getCurrencySign(),
                bc: NS.numberFormat(account.get('balance'))
            });
            tp.toggleView(account.get('descript').length > 0, 'dsc');
            tp.replaceClass('bc', 'text-success', 'text-danger', account.get('balance') >= 0);

            if (this.rolesWidget){
                this.rolesWidget.destroy();
            }

            this.rolesWidget = new NS.RoleListWidget({
                isAccount: true,
                srcNode: tp.append('roles', '<div></div>'),
                readOnly: true,
                roleList: account.get('roles')
            });
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            accountid: {value: 0}
        }
    });
};