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
        'NOT': 0,
        'READ': 1,
        'WRITE': 2,
        'ADMIN': 3
    };

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
        },
        getUserRole: function(userid){
            var roleList = this.appInstance.getFromCache('accountUserRoleList');
            if (!roleList){
                return null;
            }
            return roleList.getUserRole(this.get('id'), userid);
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
    });

    NS.Account.UserRole = Y.Base.create('accountUserRole', SYS.AppModel, [], {
        structureName: 'AccountUserRole'
    });

    NS.Account.UserRoleList = Y.Base.create('accountUserRoleList', SYS.AppModelList, [], {
        appItem: NS.Account.UserRole,
        getUserRole: function(accountid, userid){
            var ret = null;
            this.each(function(role){
                if (role.get('accountid') === accountid && role.get('userid') === userid){
                    ret = role;
                }
            });
            return ret;
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
        },
        getUserRole: function(userid){
            var roleList = this.appInstance.getFromCache('groupUserRoleList');
            if (!roleList){
                return null;
            }
            return roleList.getUserRole(this.get('id'), userid);
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
    });

    NS.Group.UserRole = Y.Base.create('groupUserRole', SYS.AppModel, [], {
        structureName: 'GroupUserRole'
    });

    NS.Group.UserRoleList = Y.Base.create('groupUserRoleList', SYS.AppModelList, [], {
        appItem: NS.Group.UserRole,
        getUserRole: function(groupid, userid){
            var ret = null;
            this.each(function(role){
                if (role.get('groupid') === groupid && role.get('userid') === userid){
                    ret = role;
                }
            });
            return ret;
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