var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: '{C#MODNAME}', files: ['oper.js', 'operLog.js', 'accountList.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.GroupViewWidget = Y.Base.create('groupViewWidget', SYS.AppWidget, [
        NS.GroupByIdExt
    ], {
        buildTData: function(){
            return {groupid: this.get('groupid')}
        },
        destructor: function(){
            if (this._widgetsInitialized){
                this.accountListWidget.destroy();
                this.operWidget.destroy();
                this.operLogWidget.destroy();
            }
        },
        onLoadGroupData: function(err, group){
            var tp = this.template;

            if (!group){
                tp.toggleView(true, 'notfound', 'ws');
                return;
            }
            var groupid = group.get('id');
            this._widgetsInitialized = true;

            var accounts = this.accountListWidget = new NS.AccountListWidget({
                boundingBox: tp.gel('accountList'),
                groupid: groupid
            });
            accounts.on('selectedAccountChange', this._onAccountsSelectedChanged, this);
            accounts.on('accountMenuClick', this._onAccountMenuClick, this);
            accounts.on('menuClick', this._onGroupMenuClick, this);

            this.operWidget = new NS.OperationWidget({
                srcNode: tp.gel('oper'),
                groupid: groupid
            });

            this.operLogWidget = new NS.OperLogWidget({
                srcNode: tp.gel('operlog'),
                groupid: groupid
            });
        },
        closeAccountEditor: function(){
            if (!this.accountEditorWidget){
                return;
            }
            this.accountEditorWidget.destroy();
            this.accountEditorWidget = null;
        },
        showAccountEditor: function(accountid){
            var tp = this.template;
            tp.show('accountEditor');
            Brick.use('{C#MODNAME}', 'accountEditor', function(){
                this._showAccountEditor(accountid);
            }, this);
        },
        _showAccountEditor: function(accountid){
            this.closeAccountEditor();
            this.accountEditorWidget = new NS.AccountEditorWidget({
                srcNode: this.template.append('accountEditor', '<div></div>'),
                groupid: this.get('groupid'),
                accountid: accountid | 0
            });
        },
        _onAccountsSelectedChanged: function(e){
            this.operWidget.set('selectedAccount', e.newVal);
        },
        _onAccountMenuClick: function(e){
            switch (e.action) {
                case 'select':
                    this.accountListWidget.selectAccount(e.account);
                    break;
            }
        },
        _onGroupMenuClick: function(e){
            switch (e.action) {
                case 'create':
                    this.showAccountEditor();
                    break;
                case 'remove':
                    break;
            }
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
        }
    });

    NS.GroupViewWidget.parseURLParam = function(args){
        args = args || [];
        return {
            groupid: (args[0] | 0)
        };
    };

};