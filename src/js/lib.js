var Component = new Brick.Component();

Component.requires = {
    yui: ['datatype-number'],
    mod: [
        {name: 'sys', files: ['application.js']},
        {name: 'uprofile', files: ['lib.js']},
        {name: 'tag', files: ['lib.js']}, // load if exist
        {name: '{C#MODNAME}', files: ['model.js', 'base.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.NumberFormat = {
        decimalPlaces: 2,
        thousandsSeparator: ' ',
        suffix: ' '
    };
    NS.numberFormat = function(val, nf){
        nf = Y.merge(NS.NumberFormat, nf || {});
        return Y.Number.format(val, nf);
    };

    NS.roles = new Brick.AppRoles('{C#MODNAME}', {
        isView: 10,
        isWrite: 30,
        isAdmin: 50
    });

    NS.Application = {
        ATTRS: {
            isLoadAppStructure: {value: true},
            GroupList: {value: NS.GroupList},
            AccountList: {value: NS.AccountList},
            UserList: {value: NS.UserList},
            UserRole: {value: NS.UserRole},
            UserRoleList: {value: NS.UserRoleList},
            Category: {value: NS.Category},
            CategoryList: {value: NS.CategoryList},
            Oper: {value: NS.Oper},
            OperList: {value: NS.OperList},
            OperMove: {value: NS.OperMove},
            OperMoveList: {value: NS.OperMoveList},
            BalanceList: {value: NS.BalanceList},
            uprofile: {}
        },
        REQS: {
            groupList: {
                attach: 'accountList,userList',
                attribute: true,
                type: 'modelList:GroupList'
            },
            groupSave: {args: ['group']},
            groupRemove: {args: ['groupid']},
            categorySave: {args: ['category']},
            categoryRemove: {args: ['category']},
            accountList: {
                attribute: true,
                type: 'modelList:AccountList'
            },
            accountSave: {args: ['account']},
            accountRemove: {args: ['account']},
            userList: {
                attribute: true,
                type: 'modelList:UserList'
            },
            operSave: {args: ['oper']},
            operRemove: {args: ['operid']},
            operMoveSave: {args: ['operMove']},
            operList: {
                args: ['operListConfig'],
                attribute: false,
                type: 'modelList:OperList'
            },
            operMoveList: {
                args: ['operListConfig'],
                attribute: false,
                type: 'modelList:OperMoveList'
            },
            balanceList: {
                type: 'modelList:BalanceList',
                onResponse: function(balanceList){
                    var accountList = this.get('accountList');
                    if (!accountList){
                        return;
                    }
                    balanceList.each(function(b){
                        var account = accountList.getById(b.get('id'));
                        if (!account){
                            return;
                        }
                        account.set('balance', b.get('balance'));
                        account.set('upddate', b.get('upddate'));
                    });
                }
            }
        },
        URLS: {
            ws: "#app={C#MODNAMEURI}/wspace/ws/",
            about: function(){
                return this.getURL('ws') + 'about/AboutWidget/'
            },
            accessdenied: function(){
                return this.getURL('ws') + 'about/AccessDeniedWidget/'
            },
            group: {
                view: function(groupid, notCache){
                    var url = this.getURL('ws') + 'groupView/GroupViewWidget/' + groupid + '/';
                    if (notCache){
                        url += (new Date()).getTime();
                    }
                    return url;
                },
                create: function(){
                    return this.getURL('ws') + 'groupEditor/GroupEditorWidget/0/'
                },
                edit: function(groupid){
                    return this.getURL('ws') + 'groupEditor/GroupEditorWidget/' + groupid + '/';
                },
                config: function(groupid){
                    return this.getURL('ws') + 'groupConfig/GroupConfigWidget/' + groupid + '/';
                }
            },
            oper: {
                log: function(groupid){
                    return this.getURL('ws') + 'operLog/OperLogWidget/' + groupid + '/';
                }
            }
        }
    };

    if (Brick.mod.tag){
        NS.TAG = Brick.mod.tag;
        Y.mix(NS.Application, Brick.mod.tag.Application, false, null, 0, true);
    }

    SYS.Application.build(COMPONENT, {}, {
        initializer: function(){
            var instance = this;
            Brick.mod.uprofile.initApp({
                initCallback: function(err, appInstance){
                    instance.set('uprofile', appInstance);
                    instance.initCallbackFire();
                }
            });
        }
    }, [], NS.Application);
};