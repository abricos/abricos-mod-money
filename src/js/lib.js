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

    NS.URL = {
        ws: "#app={C#MODNAMEURI}/wspace/ws/",
        'about': function(){
            return NS.URL.ws + 'about/AboutWidget/'
        },
        'accessdenied': function(){
            return NS.URL.ws + 'about/AccessDeniedWidget/'
        },
        group: {
            view: function(groupid){
                return NS.URL.ws + 'groupView/GroupViewWidget/' + groupid + '/';
            },
            create: function(){
                return NS.URL.ws + 'groupEditor/GroupEditWidget/0/'
            },
            edit: function(groupid){
                return NS.URL.ws + 'groupEditor/GroupEditWidget/' + groupid + '/';
            }
        },
        oper: {
            log: function(groupid){
                return NS.URL.ws + 'operLog/OperLogWidget/' + groupid + '/';
            }
        }
    };

    SYS.Application.build(COMPONENT, {
        groupList: {
            request: 'accountList,userList',
            cache: 'groupList',
            response: function(d){
                return new NS.GroupList({appInstance: this, items: d.list});
            }
        },
        groupSave: {
            args: ['group']
        },
        accountList: {
            cache: 'accountList',
            response: function(d){
                return new NS.AccountList({appInstance: this, items: d.list});
            }
        },
        userList: {
            cache: 'userList',
            response: function(d){
                return new NS.UserList({appInstance: this, items: d.list});
            }
        },
        operSave: {
            args: ['oper']
        },
        operList: {
            args: ['operListConfig'],
            response: function(d){
                return new NS.OperList({appInstance: this, items: d.list});
            }
        },
    }, {
        initializer: function(){
            this.initCallbackFire();
        },
        getFromCache: function(name){
            return this._appCache[name];
        }
    }, [], {
        ATTRS: {
            isLoadAppStructure: {value: true},
            UserRole: {value: NS.UserRole},
            UserRoleList: {value: NS.UserRoleList},
            Category: {value: NS.Category},
            CategoryList: {value: NS.CategoryList}
        }
    });

};