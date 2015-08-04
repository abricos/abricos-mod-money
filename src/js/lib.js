var Component = new Brick.Component();
Component.requires = {
    mod: [
        {
            name: 'sys', files: [
            'application.js',
            'item.js', // TODO: remove
            'number.js'
        ]
        },
        {name: 'uprofile', files: ['lib.js']},
        {name: '{C#MODNAME}', files: ['model.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.roles = new Brick.AppRoles('{C#MODNAME}', {
        isView: 10,
        isWrite: 30,
        isAdmin: 50
    });

    NS.URL = {
        ws: "#app={C#MODNAMEURI}/wspace/ws/",
        'about': function(){
            return NS.URL.ws + 'about/AboutWidget/'
        },
        'accessdenied': function(){
            return NS.URL.ws + 'about/AccessDeniedWidget/'
        },
        'group': {
            'view': function(groupid){
                return NS.URL.ws + 'groupview/GroupViewWidget/' + groupid + '/';
            },
            'create': function(){
                return NS.URL.ws + 'groupeditor/GroupEditWidget/0/'
            },
            'edit': function(groupid){
                return NS.URL.ws + 'groupeditor/GroupEditWidget/' + groupid + '/';
            }
        },
        'account': {
            'list': function(){
                return NS.URL.ws + 'account/AccountListWidget/p1/p2/p3/';
            },
            'view': function(acc){
                return AWS + 'view/' + (acc ? acc + '/' : '');
            },
            'create': function(){
                return AWS + 'create/';
            }
        }
    };

    SYS.Application.build(COMPONENT, {
        accountList: {
            cache: 'accountList',
            request: 'groupList',
            response: function(d){
                return new NS.AccountList({
                    appInstance: this,
                    items: d.list
                });
            }
        },
        groupList: {
            cache: 'groupList',
            response: function(d){
                return new NS.GroupList({
                    appInstance: this,
                    items: d.list
                });
            }
        }
    }, {
        initializer: function(){
            this.initCallbackFire();
        }
    }, [], {
        ATTRS: {
            isLoadAppStructure: {
                value: true
            }
        }
    });

    var Dom = YAHOO.util.Dom,
        L = YAHOO.lang,
        R = NS.roles;

    var CE = YAHOO.util.CustomEvent;
    var UID = Brick.env.user.id;

    var SysNS = Brick.mod.sys,
        UP = Brick.mod.uprofile;

    var LNG = this.language;

    this.buildTemplate({});

    NS.lif = function(f){
        return L.isFunction(f) ? f : function(){
        };
    };
    NS.life = function(f, p1, p2, p3, p4, p5, p6, p7){
        f = NS.lif(f);
        f(p1, p2, p3, p4, p5, p6, p7);
    };
    NS.Item = SysNS.Item;
    NS.ItemList = SysNS.ItemList;

    NS.NumberFormat = {
        decimalPlaces: 2,
        thousandsSeparator: ' ',
        suffix: ' '
    };
    NS.numberFormat = function(val, nf){
        nf = nf || NS.NumberFormat;
        return YAHOO.util.Number.format(val, nf);
    };

    // old_Account User Role Type
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

    var CLNG = Abricos.I18n.get('mod.money.currency', {isData: true});
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
    var old_Account = function(d){
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
        old_Account.superclass.constructor.call(this, d);
    };
    YAHOO.extend(old_Account, NS.Item, {
        init: function(d){
            this.roles = new AURoleList();

            old_Account.superclass.init.call(this, d);
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
    NS.old_Account = old_Account;

    var old_AccountList = function(d){
        old_AccountList.superclass.constructor.call(this, d, old_Account);
    };
    YAHOO.extend(old_AccountList, NS.ItemList, {
        update: function(d){
            old_AccountList.superclass.update.call(this, d);

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
    NS.old_AccountList = old_AccountList;

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
    var old_Group = function(d){
        d = L.merge({
            'tl': ''	// title
        }, d || {});
        old_Group.superclass.constructor.call(this, d);
    };
    YAHOO.extend(old_Group, NS.Item, {
        init: function(d){
            this.accounts = new old_AccountList();
            this.roles = new AURoleList();
            this.categories = new CategoryList();

            old_Group.superclass.init.call(this, d);
        },
        update: function(d){
            this.title = d['tl'];
        },
        createAccount: function(){
            var account = new NS.old_Account({
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
    NS.old_Group = old_Group;

    var old_GroupList = function(d){
        old_GroupList.superclass.constructor.call(this, d, old_Group);
    };
    YAHOO.extend(old_GroupList, NS.ItemList, {});
    NS.old_GroupList = old_GroupList;

    NS.users = UP.viewer.users;

    var arrGroup = function(arr, fld){
        var gds = {};
        for (var i = 0; i < arr.length; i++){
            var ad = arr[i];
            if (!gds[ad[fld]]){
                gds[ad[fld]] = [];
            }
            var agds = gds[ad[fld]];
            agds[agds.length] = ad;
        }
        return gds;
    };

    var MoneyManager = function(callback){
        this.init(callback);
    };
    MoneyManager.prototype = {
        init: function(callback){

            this.groupCreatedEvent = new CE('groupCreatedEvent');
            this.groupChangedEvent = new CE('groupChangedEvent');
            this.groupRemovedEvent = new CE('groupRemovedEvent');

            this.accountCreatedEvent = new CE('accountCreatedEvent');
            this.accountChangedEvent = new CE('accountChangedEvent');
            this.accountRemovedEvent = new CE('accountRemovedEvent');

            this.balanceChangedEvent = new CE('balanceChangedEvent');

            this.categoriesChangedEvent = new CE('categoriesChangedEvent');

            var __self = this;

            this.groups = new old_GroupList();

            R.load(function(){
                var sd = {
                    'do': 'init'
                };
                __self.ajax(sd, function(data){
                    if (!L.isNull(data)){
                        __self._updateBoardData(data);
                    }
                    NS.moneyManager = __self;
                    NS.life(callback, __self);
                });
            });

        },
        onGroupCreated: function(groupid){
            this.groupCreatedEvent.fire(groupid);
        },
        onGroupChanged: function(groupid){
            this.groupChangedEvent.fire(groupid);
        },
        onGroupRemoved: function(groupid){
            this.groupRemovedEvent.fire(groupid);
        },
        onBalanceChanged: function(account, byRemoveOper){
            this.balanceChangedEvent.fire(account, byRemoveOper);
        },
        onAccountCreated: function(account){
            this.accountCreatedEvent.fire(account);
        },
        onAccountChanged: function(account){
            this.accountChangedEvent.fire(account);
        },
        onAccountRemoved: function(accountid){
            this.accountRemovedEvent.fire(accountid);
        },
        onCategoriesChanged: function(category){
            this.categoriesChangedEvent.fire(category);
        },
        ajax: function(data, callback){
            data = data || {};
            data['tm'] = Math.round((new Date().getTime()) / 1000);

            Brick.ajax('{C#MODNAME}', {
                'data': data,
                'event': function(request){
                    NS.life(callback, request.data);
                }
            });
        },
        _updateCategoriesByData: function(d){
            // update categories
            var gds = arrGroup(d, 'gid');
            for (var gid in gds){
                var group = this.groups.get(gid);
                if (!L.isNull(group)){
                    group.categories.update(gds[gid], true);
                }
            }
        },
        _updateBoardData: function(d){
            if (L.isNull(d)){
                return;
            }

            NS.users.update(d['users']);

            this.groups.update(d['groups'], true);

            this._updateCategoriesByData(d['categories']);

            // update accounts
            var gds = arrGroup(d['accounts'], 'gid');
            for (var gid in gds){
                var group = this.groups.get(gid);
                if (!L.isNull(group)){
                    group.accounts.update(gds[gid], true);
                }
            }

            var ads = arrGroup(d['aroles'], 'aid');
            for (var aid in ads){
                var acc = this.findAccount(aid);
                if (!L.isNull(acc)){
                    acc.roles.update(ads[aid], true);
                }
            }

            // TODO: пока используется классы ролей разработанные для счета
            var gds = arrGroup(d['groles'], 'aid');
            for (var gid in gds){
                var group = this.groups.get(gid);
                if (!L.isNull(group)){
                    group.roles.update(gds[gid], true);
                }
            }
        },
        createGroup: function(){
            var group = new NS.old_Group();
            group.accounts.add(group.createAccount());

            var ur = new NS.AURole({
                'r': NS.AURoleType['ADMIN'],
                'u': Brick.env.user.id
            });
            group.roles.add(ur);

            return group;
        },
        findAccount: function(aid){
            var acc = null;
            this.groups.foreach(function(g){
                var facc = g.accounts.get(aid);
                if (!L.isNull(facc)){
                    acc = facc;
                    return true;
                }
            });
            return acc;
        },
        groupSave: function(sd, callback){
            var __self = this;
            this.ajax({
                'do': 'groupsave',
                'group': sd
            }, function(r){
                var groupid = 'error';
                if (!L.isNull(r)){
                    __self._updateBoardData(r);
                    groupid = r['groupid'];
                    if (sd['id'] == 0){
                        __self.onGroupCreated(groupid);
                    } else {
                        __self.onGroupChanged(groupid);
                    }
                }
                NS.life(callback, groupid);
            });
        },
        groupRemove: function(groupid, callback){
            var __self = this;
            this.ajax({
                'do': 'groupremove',
                'groupid': groupid
            }, function(r){
                if (!L.isNull(r) && r['deldate'] > 0){
                    __self.groups.remove(groupid);
                    __self.onGroupRemoved(groupid);
                }
                NS.life(callback);
            });
        },
        _operSaveCallback: function(r, byRemoveOper){
            if (L.isNull(r) || !r['balance']){
                return;
            }

            if (r['categories']){
                this._updateCategoriesByData(r['categories']);
                this.onCategoriesChanged();
            }

            var account = this.findAccount(r['balance']['accountid']);

            if (!L.isNull(account)){
                account.balance = r['balance']['value'];
                this.onBalanceChanged(account, byRemoveOper);
            }
        },
        operSave: function(sd, callback){
            var __self = this;
            this.ajax({
                'do': 'opersave',
                'oper': sd
            }, function(r){
                __self._operSaveCallback(r);
                NS.life(callback);
            });
        },
        operRemove: function(operid, callback){
            var __self = this;
            this.ajax({
                'do': 'operremove',
                'operid': operid
            }, function(r){
                __self._operSaveCallback(r, true);
                NS.life(callback);
            });
        },
        _operMoveSaveCallback: function(r, byRemoveOper){
            var __self = this;
            var updbc = function(r){
                if (r['balance']){
                    var account = __self.findAccount(r['balance']['accountid']);

                    if (!L.isNull(account)){
                        account.balance = r['balance']['value'];
                        __self.onBalanceChanged(account, byRemoveOper);
                    }
                }
            };
            updbc(r[0]);
            updbc(r[1]);
        },
        operMoveSave: function(sd, callback){
            var __self = this;

            this.ajax({
                'do': 'opermovesave',
                'oper': sd
            }, function(r){
                if (!L.isNull(r)){
                    __self._operMoveSaveCallback(r);
                }
                NS.life(callback);
            });
        },
        operMoveRemove: function(methodid, callback){
            var __self = this;

            this.ajax({
                'do': 'opermoveremove',
                'methodid': methodid
            }, function(r){
                if (!L.isNull(r)){
                    __self._operMoveSaveCallback(r, true);
                }
                NS.life(callback);
            });
        },
        accountSave: function(sd, callback){
            var __self = this;
            this.ajax({
                'do': 'accountsave',
                'account': sd
            }, function(r){
                if (!L.isNull(r) && r['account']){
                    var ad = r['account'];
                    group = __self.groups.get(ad['gid']);

                    if (!L.isNull(group)){
                        group.accounts.update([ad]);
                        var acc = __self.findAccount(ad['id']);
                        acc.roles.update(r['roles'], true);

                        if (sd['id'] > 0){
                            __self.onAccountChanged(acc);
                        } else {
                            __self.onAccountCreated(acc);
                        }
                    }
                }
                NS.life(callback);
            });
        },
        accountRemove: function(accountid, callback){
            var account = this.findAccount(accountid);
            if (L.isNull(account)){
                return;
            }
            var group = this.groups.get(account.groupid);

            var __self = this;
            this.ajax({
                'do': 'accountremove',
                'accountid': accountid
            }, function(r){
                if (!L.isNull(r) && r['deldate'] > 0){
                    group.accounts.remove(accountid);
                    if (group.accounts.count() == 0){
                        __self.groups.remove(group.id);
                        __self.onGroupRemoved(group.id);
                    } else {
                        __self.onAccountRemoved(accountid);
                    }
                }
                NS.life(callback);
            });
        },
        operLogLoad: function(groupid, fromdt, enddt, opers, callback){

            var lastUpdate = 0;
            if (L.isNull(opers)){
                opers = new OperList();
            } else {
                opers.foreach(function(oper){
                    lastUpdate = Math.max(lastUpdate, oper.updDate);
                });
            }
            this.ajax({
                'do': 'operlog',
                'groupid': groupid,
                'fromdt': fromdt.getTime() / 1000,
                'enddt': enddt.getTime() / 1000,
                'lastupdate': lastUpdate
            }, function(d){
                if (!L.isNull(d)){
                    opers.methods.update(d['moves']);
                    opers.update(d['opers']);
                }
                NS.life(callback, opers);
            });
        }
    };
    NS.MoneyManager = MoneyManager;
    NS.moneyManager = null;

    NS.initMoneyManager = function(callback){
        if (L.isNull(NS.moneyManager)){
            NS.moneyManager = new MoneyManager(callback);
        } else {
            NS.life(callback, NS.moneyManager);
        }
    };

    var WS = "#app={C#MODNAMEURI}/wspace/ws/";
    NS.navigator = {
        'ws': WS,
        'about': WS + 'about/AboutWidget/',
        'accessdenied': WS + 'about/AccessDeniedWidget/',
        'group': {
            'view': function(groupid){
                return WS + 'groupview/GroupViewWidget/' + groupid + '/';
            },
            'create': WS + 'groupeditor/GroupEditWidget/0/',
            'edit': function(groupid){
                return WS + 'groupeditor/GroupEditWidget/' + groupid + '/';
            }
        },

        'account': {
            'list': function(){
                return WS + 'account/AccountListWidget/p1/p2/p3/';
            },
            'view': function(acc){
                return AWS + 'view/' + (acc ? acc + '/' : '');
            },
            'create': function(){
                return AWS + 'create/';
            }
        },
        'go': function(comp, func, prm){
            var uri = NS.navigator[comp][func](prm);
            Brick.Page.reload(uri);
        }
    };
};