var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: '{C#MODNAME}', files: ['accountList.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;


    NS.GroupViewWidget = Y.Base.create('groupViewWidget', SYS.AppWidget, [], {
        buildTData: function(){
            return {groupid: this.get('groupid')}
        },
        onInitAppWidget: function(err, appInstance){
            this.set('waiting', true);
            appInstance.groupList(function(err, result){
                this.set('waiting', false);
                if (!err){
                    this.set('groupList', result.groupList);
                    this.set('accountList', result.accountList);
                }
                this.renderGroup();
            }, this);
        },
        onClick: function(e){
            switch (e.dataClick) {
                case '':
                    return true;
            }
        },
        renderGroup: function(){
            var groupid = this.get('groupid'),
                groupList = this.get('groupList'),
                group = groupList ? groupList.getById(groupid) : null,
                tp = this.template;

            if (!group){
                Y.one(tp.gel('ws')).addClass('hide');
                Y.one(tp.gel('notfound')).removeClass('hide');
                return;
            }

            this.accountsWidget = new NS.AccountListWidget({
                boundingBox: tp.gel('acclist'),
                groupid: group.get('id')
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