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
        nf = nf || NS.NumberFormat;
        return YAHOO.util.Number.format(val, nf);
    };

    NS.roles = new Brick.AppRoles('{C#MODNAME}', {
        isView: 10,
        isWrite: 30,
        isAdmin: 50
    });

    SYS.Application.build(COMPONENT, {}, {
        initializer: function(){
            this.initCallbackFire();
        }
    }, [], {
        ATTRS: {
            isLoadAppStructure: {value: true},
            GroupList: {value: NS.GroupList},
            AccountList: {value: NS.AccountList},
            UserList: {value: NS.UserList},
            UserRole: {value: NS.UserRole},
            UserRoleList: {value: NS.UserRoleList},
            Category: {value: NS.Category},
            CategoryList: {value: NS.CategoryList},
            OperList: {value: NS.OperList},
            BalanceList: {value: NS.BalanceList}
        },
        REQS: {
            groupList: {
                attach: 'accountList,userList',
                attribute: true,
                type: 'modelList:GroupList'
            },
            groupSave: {
                args: ['group']
            },
            accountList: {
                attribute: true,
                type: 'modelList:AccountList'
            },
            userList: {
                attribute: true,
                type: 'modelList:UserList'
            },
            operSave: {
                args: ['oper']
            },
            operList: {
                args: ['operListConfig'],
                attribute: false,
                type: 'modelList:OperList'
            },
            balanceList: {
                type: 'modelList:BalanceList',
                response: function(){
                    console.log(arguments);
                }
            },
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
                view: function(groupid){
                    return this.getURL('ws') + 'groupView/GroupViewWidget/' + groupid + '/';
                },
                create: function(){
                    return this.getURL('ws') + 'groupEditor/GroupEditorWidget/0/'
                },
                edit: function(groupid){
                    return this.getURL('ws') + 'groupEditor/GroupEditorWidget/' + groupid + '/';
                }
            },
            oper: {
                log: function(groupid){
                    return this.getURL('ws') + 'operLog/OperLogWidget/' + groupid + '/';
                }
            }
        }
    });

};