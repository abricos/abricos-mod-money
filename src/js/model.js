var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sys', files: ['appModel.js']},
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        L = Y.Lang,
        SYS = Brick.mod.sys,
        UID = Brick.env.user.id;

    NS.AURoleType = {
        NOT: 0,
        READ: 1,
        WRITE: 2,
        ADMIN: 3
    };

    NS.Category = Y.Base.create('category', SYS.AppModel, [], {
        structureName: 'Category'
    });

    NS.CategoryList = Y.Base.create('categoryList', SYS.AppModelList, [], {
        appItem: NS.Category,
        getPath: function(categoryid){
            var category = this.getById(categoryid);
            if (!category){
                return null;
            }
            if (Y.Lang.isArray(category._cachePath)){
                return category._cachePath;
            }
            var parentid = category.get('parentid'),
                parent,
                path = [];

            while (parentid > 0){
                parent = this.getById(parentid);
                if (parent){
                    path[path.length] = parentid;
                    parentid = parent.get('parentid');
                } else {
                    parentid = 0;
                }
            }
            path.reverse();

            return category._cachePath = path;
        },
        eachChild: function(parentid, fn, context){
            parentid = parentid | 0;

            this.each(function(category){
                if (category.get('parentid') === parentid){
                    fn.call(context || this, category);
                }
            }, this);
        },
        isIncluded: function(checkid, parentid){
            checkid = checkid | 0;
            parentid = parentid | 0;

            if (parentid > 0 && checkid === parentid){
                return true;
            }
            if (parentid === 0){
                return !!this.getById(checkid);
            }

            var path = this.getPath(checkid);
            if (!path){
                return false;
            }

            for (var i = 0; i < path.length; i++){
                if (path[i] === parentid){
                    return true;
                }
            }
            return false;
        }
    });

    var UserRolesBase = function(){
    };
    UserRolesBase.NAME = 'userRolesBase';
    UserRolesBase.prototype = {
        getUserRole: function(userid){
            return this.get('roles').getById(userid);
        },
        getMyRole: function(){
            var r = this.getUserRole(UID);
            return r ? r.get('role') : 0;
        },
        isAdminRole: function(){
            return this.getMyRole() === NS.AURoleType.ADMIN;
        },
        isWriteRole: function(){
            return this.isAdminRole() || this.getMyRole() === NS.AURoleType.WRITE;
        },
        isReadRole: function(){
            return this.isWriteRole() || this.getMyRole() === NS.AURoleType.READ;
        },
        isEditRole: function(){
            return this.isAdminRole();
        },
        isOperRole: function(){
            return this.isWriteRole();
        }
    };
    NS.UserRolesBase = UserRolesBase;

    NS.UserRole = Y.Base.create('userRole', SYS.AppModel, [], {
        structureName: 'UserRole'
    });

    NS.UserRoleList = Y.Base.create('userRoleList', SYS.AppModelList, [], {
        appItem: NS.UserRole
    });

    NS.Account = Y.Base.create('account', SYS.AppModel, [
        NS.UserRolesBase
    ], {
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
        },
        getCurrencySign: function(){
            var currency = this.getCurrency();
            return currency ? currency.get('sign') : "";
        }
    });

    NS.AccountList = Y.Base.create('accountList', SYS.AppModelList, [], {
        appItem: NS.Account,
        comparator: function(account){
            return account.getTitle();
        }
    });

    NS.Group = Y.Base.create('group', SYS.AppModel, [
        NS.UserRolesBase
    ], {
        structureName: 'Group',
        getTitle: function(){
            var title = this.get('title');
            if (L.isString(title) && title.length > 0){
                return title;
            }
            return Abricos.I18n.get('mod.money.group.nottitle');
        },
        accountEach: function(fn, context){
            var groupid = this.get('id');
            this.appInstance.get('accountList').each(function(account){
                if (account.get('groupid') !== groupid){
                    return;
                }
                fn.call(context || this, account)
            }, this);
        }
    });

    NS.GroupList = Y.Base.create('groupList', SYS.AppModelList, [], {
        appItem: NS.Group
    });

    NS.User = Y.Base.create('user', SYS.AppModel, [], {
        structureName: 'User',
        getUserName: function(){
            var d = this.toJSON();
            if (d.firstname !== '' && d.lastname !== ''){
                return d.firstname + ' ' + d.lastname;
            }
            return d.username;
        }
    });

    NS.UserList = Y.Base.create('userList', SYS.AppModelList, [], {
        appItem: NS.User
    });

    NS.Oper = Y.Base.create('oper', SYS.AppModel, [], {
        structureName: 'Oper'
    });

    NS.OperList = Y.Base.create('operList', SYS.AppModelList, [], {
        appItem: NS.Oper,
        comparator: function(model){
            return (new Date()).getTime() - model.get('date');
        }
    });

    NS.OperMove = Y.Base.create('operMove', SYS.AppModel, [], {
        structureName: 'OperMove'
    });

    NS.OperMoveList = Y.Base.create('operMoveList', SYS.AppModelList, [], {
        appItem: NS.OperMove
    });

    NS.Balance = Y.Base.create('balance', SYS.AppModel, [], {
        structureName: 'Balance'
    });

    NS.BalanceList = Y.Base.create('balanceList', SYS.AppModelList, [], {
        appItem: NS.Balance
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