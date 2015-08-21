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
        onLoadGroupData: function(err, group){
            var tp = this.template;

            if (!group){
                tp.toggleView(true, 'notfound', 'ws');
                return;
            }
            var groupid = group.get('id');

            this.accountsWidget = new NS.AccountListWidget({
                boundingBox: tp.gel('acclist'),
                groupid: groupid
            });
            this.accountsWidget.on('selectedAccountChange', this._onAccountsSelectedChanged, this);
            this.accountsWidget.on('accountMenuClick', this._onAccountMenuClick, this);

            this.operWidget = new NS.OperationWidget({
                srcNode: tp.gel('oper'),
                groupid: groupid
            });

            this.operLogWidget = new NS.OperLogWidget({
                srcNode: tp.gel('operlog'),
                groupid: groupid
            });
        },
        _onAccountsSelectedChanged: function(e){
            this.operWidget.set('selectedAccount', e.newVal);
        },
        _onAccountMenuClick: function(e){
            switch(e.action){
                case 'select':
                    this.accountsWidget.selectAccount(e.account);
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