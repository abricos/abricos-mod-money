var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sys', files: ['appModel.js']},
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        SYS = Brick.mod.sys;

    NS.Account = Y.Base.create('account', SYS.AppModel, [], {
        structureName: 'Account',
        getTitle: function(){
            var title = this.get('title'),
                type = this.get('type');

            if (L.isString(title) && title.length > 0){
                return title;
            }
            return Abricos.I18n.get('mod.money.account.type.' + type);
        }
    });

    NS.AccountList = Y.Base.create('accountList', SYS.AppModelList, [], {
        appItem: NS.Account
    });

    NS.Group = Y.Base.create('group', SYS.AppModel, [], {
        structureName: 'Group'
    });

    NS.GroupList = Y.Base.create('groupList', SYS.AppModelList, [], {
        appItem: NS.Group
    });

};