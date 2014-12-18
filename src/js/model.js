var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sys', files: ['item.js']}
    ]
};
Component.entryPoint = function(NS){

    var L = YAHOO.lang;

    var UID = Brick.env.user.id;

    var SysNS = Brick.mod.sys;

    var LNG = this.language;

    NS.Item = SysNS.Item;
    NS.ItemList = SysNS.ItemList;

    // Account User Role Type
    NS.AURoleType = {
        'NOT': 0,
        'READ': 1,
        'WRITE': 2,
        'ADMIN': 3
    };

    var Category = function(d){
        d = L.merge({
            'pid': 0,	// parentid
            'tl': '',	// title
            'uid': 0,	// userid
            'ord': 0, 	// order
            'ise': 0	// is expense
        }, d || {});
        Category.superclass.constructor.call(this, d);
    };
    YAHOO.extend(Category, NS.Item, {
        update: function(d){
            this.parentid = d['pid'] * 1;
            this.title = d['tl'];
            this.groupid = d['gid'];
            this.userid = d['uid'] * 1;
            this.order = d['ord'] * 1;
            this.isExpense = d['ise'] * 1 > 0;
        }
    });
    NS.Category = Category;

    var CategoryList = function(d){
        CategoryList.superclass.constructor.call(this, d, Category);
    };
    YAHOO.extend(CategoryList, NS.ItemList, {});
    NS.CategoryList = CategoryList;


    var Currency = function(d){
        d = L.merge({
            'tl': '',	// title
            's': ''		// sign
        }, d || {});
        Currency.superclass.constructor.call(this, d);
    };
    YAHOO.extend(Currency, NS.Item, {
        update: function(d){
            this.title = d['tl'];
            this.sign = d['s'];
        }
    });
    NS.Currency = Currency;

    var CurrencyList = function(d){
        CurrencyList.superclass.constructor.call(this, d, Currency);
    };
    YAHOO.extend(CurrencyList, NS.ItemList, {});
    NS.CurrencyList = CurrencyList;

    var CLNG = LNG['currency'];
    NS.currencyList = new CurrencyList([
        CLNG['RUB'],
        CLNG['USD'],
        CLNG['EUR'],
        CLNG['UAH'],
        CLNG['BYR'],
        CLNG['AZN']
    ]);

    var OperMethod = function(d){
        OperMethod.superclass.constructor.call(this, d);
    };
    YAHOO.extend(OperMethod, NS.Item, {});
    NS.OperMethod = OperMethod;

    var OperMethodList = function(d){
        OperMethodList.superclass.constructor.call(this, d, OperMethod);
    };
    YAHOO.extend(OperMethodList, NS.ItemList, {
        createItem: function(di){
            // TODO: в данной верси только один метод, но на будущее возможно расширение
            return new OperMethodMove(di);
        }
    });
    NS.OperMethodList = OperMethodList;

    var OperMethodMove = function(d){
        d = L.merge({
            'faid': 0,
            'taid': 0,
            'v': 0,
            'd': 0
        }, d || {});
        OperMethodMove.superclass.constructor.call(this, d);
    };
    YAHOO.extend(OperMethodMove, NS.Item, {
        update: function(d){
            this.type = 'move';
            this.fromAccountId = d['faid'];
            this.toAccountId = d['taid'];
            this.value = d['v'] * 1;
            this.date = new Date(d['d'] * 1000);
        }
    });
    NS.OperMethodMove = OperMethodMove;


    // расчетный счет/кошелек
    var Oper = function(d){
        d = L.merge({
            'v': 0,
            'd': new Date() / 1000,
            'ise': 0,
            'api': 0,
            'uid': 0,
            'dsc': '',
            'cid': 0,
            'upd': 0,
            'mid': 0 // methodid
        }, d || {});
        Oper.superclass.constructor.call(this, d);
    };
    YAHOO.extend(Oper, NS.Item, {
        update: function(d){
            this.accountid = d['aid'];
            this.userid = d['uid'];
            this.value = d['v'] * 1;
            this.date = new Date(d['d'] * 1000);
            this.isExpense = d['ise'] * 1 > 0;
            this.descript = d['dsc'];
            this.categoryid = d['cid'];
            this.updDate = d['upd'] * 1;
            this.methodid = d['mid'];
            this.method = null;
        },
        getValue: function(){
            return this.isExpense ? this.value * (-1) : this.value;
        }
    });
    NS.Oper = Oper;

    var OperList = function(d){
        OperList.superclass.constructor.call(this, d, Oper);
    };
    YAHOO.extend(OperList, NS.ItemList, {
        init: function(d, itemClass){

            this.methods = new OperMethodList();

            OperList.superclass.init.call(this, d, itemClass);
        },
        update: function(d){
            OperList.superclass.update.call(this, d);
            this.list = this.list.sort(function(o1, o2){
                var d1 = o1.date.getTime(), d2 = o2.date.getTime();
                if (d1 > d2){
                    return -1;
                }
                if (d1 < d2){
                    return 1;
                }

                d1 = o1.updDate;
                d2 = o2.updDate;
                if (d1 > d2){
                    return -1;
                }
                if (d1 < d2){
                    return 1;
                }

                return 0;
            });

            var list = this;

            this.methods.foreach(function(mt){
                if (mt.type == 'move'){

                    list.foreach(function(oper){
                        if (oper.methodid == mt.id){
                            oper.method = mt;
                        }
                    });
                }
            });
        }
    });
    NS.OperList = OperList;

    // расчетный счет/кошелек
    var Account = function(d){
        d = L.merge({
            'tl': '',	// title
            'bc': 0,	// баланс
            'ibc': 0,	// начальный баланс
            'cc': 'RUB',// валюта
            'dsc': '',	// описание
            'gid': 0,	// группа
            'r': '0',	// роль текущего пользователя на этот аккаунт
            'tp': 1		// account type
        }, d || {});
        Account.superclass.constructor.call(this, d);
    };
    YAHOO.extend(Account, NS.Item, {
        init: function(d){
            this.roles = new AURoleList();

            Account.superclass.init.call(this, d);
        },
        update: function(d){
            this.title = d['tl'];
            this.balance = d['bc'] * 1;
            this.initBalance = d['ibc'] * 1;
            this.type = d['tp'] * 1;
            this.descript = d['dsc'];
            this.groupid = d['gid'];
            this.currency = NS.currencyList.get(d['cc']);
            if (L.isNull(this.currency)){
                this.currency = NS.currencyList.get('RUB');
            }
        },
        getTitle: function(){
            if (L.isString(this.title) && this.title.length > 0){
                return this.title;
            }
            return LNG['account']['type'][this.type];
        },
        getMyRole: function(){
            var r = this.roles.getByUserId(UID);
            if (L.isNull(r)){
                return 0;
            }
            return r.role;
        },
        isAdminRole: function(){
            return this.getMyRole() == NS.AURoleType.ADMIN;
        },
        isWriteRole: function(){
            if (this.isAdminRole()){
                return true;
            }
            return this.getMyRole() == NS.AURoleType.WRITE;
        },
        isReadRole: function(){
            if (this.isWriteRole()){
                return true;
            }
            return this.getMyRole() == NS.AURoleType.READ;
        },
        isEditRole: function(){
            return this.isAdminRole();
        },
        isOperRole: function(){
            return this.isWriteRole();
        }
    });
    NS.Account = Account;

    var AccountList = function(d){
        AccountList.superclass.constructor.call(this, d, Account);
    };
    YAHOO.extend(AccountList, NS.ItemList, {
        update: function(d){
            AccountList.superclass.update.call(this, d);

            this.list = this.list.sort(function(o1, o2){
                var d1 = L.trim(o1.title), d2 = L.trim(o2.title);
                if (d1 > d2){
                    return 1;
                }
                if (d1 < d2){
                    return -1;
                }
                return 0;
            });
        }
    });
    NS.AccountList = AccountList;

    var AURole = function(d){
        d = L.merge({
            'r': NS.AURoleType[0],
            'u': 0
        }, d || {});
        AURole.superclass.constructor.call(this, d);
    };
    YAHOO.extend(AURole, NS.Item, {
        update: function(d){
            this.role = d['r'] * 1;
            this.userid = d['u'] * 1;
            this.user = NS.users.get(d['u']);
        }
    });
    NS.AURole = AURole;

    var AURoleList = function(d){
        AURoleList.superclass.constructor.call(this, d, AURole);
    };
    YAHOO.extend(AURoleList, NS.ItemList, {
        getByUserId: function(userid){
            var ret = null;
            this.foreach(function(r){
                if (r.userid == userid){
                    ret = r;
                    return null;
                }
            });
            return ret;
        }
    });
    NS.AURoleList = AURoleList;


    // расчетный счет/кошелек
    var Group = function(d){
        d = L.merge({
            'tl': ''	// title
        }, d || {});
        Group.superclass.constructor.call(this, d);
    };
    YAHOO.extend(Group, NS.Item, {
        init: function(d){
            this.accounts = new AccountList();
            this.roles = new AURoleList();
            this.categories = new CategoryList();

            Group.superclass.init.call(this, d);
        },
        update: function(d){
            this.title = d['tl'];
        },
        createAccount: function(){
            var account = new NS.Account({
                'gid': this.id
            });
            var ur = new NS.AURole({
                'r': NS.AURoleType['ADMIN'],
                'u': UID
            });
            account.roles.add(ur);
            return account;
        },
        getTitle: function(){
            if (L.isString(this.title) && this.title.length > 0){
                return this.title;
            }
            return LNG['group']['nottitle'];
        },
        getMyRole: function(){
            var r = this.roles.getByUserId(UID);
            if (L.isNull(r)){
                return 0;
            }
            return r.role;
        },
        isAdminRole: function(){
            return this.getMyRole() == NS.AURoleType.ADMIN;
        },
        isWriteRole: function(){
            if (this.isAdminRole()){
                return true;
            }
            return this.getMyRole() == NS.AURoleType.WRITE;
        },
        isReadRole: function(){
            if (this.isWriteRole()){
                return true;
            }
            return this.getMyRole() == NS.AURoleType.READ;
        },
        isEditRole: function(){
            return this.isAdminRole();
        },
        isCreateAccountRole: function(){
            return this.isReadRole();
        }
    });
    NS.Group = Group;

    var GroupList = function(d){
        GroupList.superclass.constructor.call(this, d, Group);
    };
    YAHOO.extend(GroupList, NS.ItemList, {});
    NS.GroupList = GroupList;

};