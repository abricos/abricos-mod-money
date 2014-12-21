var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sys', files: ['application.js', 'form.js', 'number.js']},
        {name: 'uprofile', files: ['lib.js']},
        {name: '{C#MODNAME}', files: ['model.js']}
    ]
};
Component.entryPoint = function(NS){

    NS.roles = new Brick.AppRoles('{C#MODNAME}', {
        isAdmin: 50,
        isWrite: 30,
        isView: 10
    });

    var Y = Brick.YUI,

        COMPONENT = this,

        SYS = Brick.mod.sys;

    NS.URL = {
        ws: "#app={C#MODNAMEURI}/wspace/ws/",
        group: {
            view: function(groupid){
                return NS.URL.ws + 'groupview/GroupViewWidget/' + groupid + '/';
            },
            create: function(){
                return NS.URL.ws + 'groupeditor/GroupEditorWidget/0/'
            },
            edit: function(groupid){
                return NS.URL.ws + 'groupeditor/GroupEditorWidget/' + groupid + '/';
            }
        }
    };

    SYS.Application.build(COMPONENT, {
        groupList: {
            cache: 'groupList',
            response: function(d){
                return new NS.GroupList(d);
            }
        },
        initData: {
            cache: 'initData'
        }
    }, {
        initializer: function(){
            var instance = this;
            NS.roles.load(function(){
                instance.initCallbackFire();
            });
        }
    });


    /* * * * * TODO: old to remove * * * */

    var L = YAHOO.lang,
        R = NS.roles,
        CE = YAHOO.util.CustomEvent,
        UP = Brick.mod.uprofile;

    this.buildTemplate({});

    NS.lif = function(f){
        return L.isFunction(f) ? f : function(){
        };
    };
    NS.life = function(f, p1, p2, p3, p4, p5, p6, p7){
        f = NS.lif(f);
        f(p1, p2, p3, p4, p5, p6, p7);
    };

    NS.NumberFormat = {
        decimalPlaces: 2,
        thousandsSeparator: ' ',
        suffix: ' '
    };
    NS.numberFormat = function(val, nf){
        nf = nf || NS.NumberFormat;
        return YAHOO.util.Number.format(val, nf);
    };

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

            this.groups = new NS.GroupList();

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
            var group = new NS.Group();
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