var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sys', files: ['appModel.js']},
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        L = Y.Lang,
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
        },
        getCurrency: function(){
            var ccId = this.get('currency');
            return NS.currencyList.getById(ccId);
        }
    });

    NS.AccountList = Y.Base.create('accountList', SYS.AppModelList, [], {
        appItem: NS.Account
    });

    NS.Group = Y.Base.create('group', SYS.AppModel, [], {
        structureName: 'Group',
        getTitle: function(){
            var title = this.get('title');
            if (L.isString(title) && title.length > 0){
                return title;
            }
            return Abricos.I18n.get('mod.money.group.nottitle');
        }
    });

    NS.GroupList = Y.Base.create('groupList', SYS.AppModelList, [], {
        appItem: NS.Group
    });

    NS.Currency = Y.Base.create('currency', SYS.AppItem, [], {}, {
        ATTRS: {
            id: {value: ''},
            title: {value: ''},
            sign: {value: ''}
        }
    });

    var CLNG = Abricos.I18n.get('mod.money.currency', {isData: true});
    NS.currencyList = new SYS.AppItemList({
        appItem: NS.Currency,
        items: [
            CLNG['RUB'],
            CLNG['USD'],
            CLNG['EUR'],
            CLNG['UAH'],
            CLNG['BYR'],
            CLNG['AZN']
        ]
    });
};