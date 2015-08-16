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

            this.operWidget = new NS.OperationWidget({
                srcNode: tp.gel('oper'),
                groupid: groupid
            });

            this.operLogWidget = new NS.OperLogWidget({
                srcNode: tp.gel('operlog'),
                groupid: groupid
            });

            this.setFirstAccount();
        },
        setFirstAccount: function(){
            var groupid = this.get('groupid'),
                first = null;
            this.get('accountList').each(function(account){
                if (!first && account.get('groupid') === groupid){
                    first = account;
                }
            }, this);
            this.accountsWidget.set('selectedAccount', first);
            return first;
        },
        onClick: function(e){
            switch (e.dataClick) {
                case '':
                    return true;
            }
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            groupList: {value: null},
            accountList: {value: null},
            group: {value: null},
            groupid: {value: 0}
        }
    });

    NS.GroupViewWidget.parseURLParam = function(args){
        args = args || [];
        return {
            groupid: (args[0] | 0)
        };
    };

};