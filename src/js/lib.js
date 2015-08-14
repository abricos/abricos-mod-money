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
        }
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
            UserRoleList: {value: NS.UserRoleList}
        }
    });

};