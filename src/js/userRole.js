var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'uprofile', files: ['users.js']},
        {name: '{C#MODNAME}', files: ['lib.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys,
        UID = Brick.env.user.id;

    NS.RoleHelpWidget = Y.Base.create('roleHelpWidget', SYS.AppWidget, [], {
        buildTData: function(){
            var tp = this.template;
            return {
                lst: tp.replace(this.get('isAccount') ? 'hacc' : 'hgroup')
            };
        },
        onInitAppWidget: function(err, appInstance){
            this.publish('close');
            this._roleSetter(this.get('role'));
        },
        _roleSetter: function(role){
            var tp = this.template,
                el = Y.one(tp.gel('wrp')),
                cpfx = 'rid';
            if (!el){
                return;
            }
            for (var i = 0; i <= 3; i++){
                el.removeClass(cpfx + i);
            }
            el.addClass(cpfx + role);
        },
        onClick: function(e){
            switch (e.dataClick) {
                case 'close':
                    this.fire('close');
                    return true;
            }
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'help,hacc,hgroup'},
            role: {
                value: 0,
                setter: '_roleSetter'
            }
        }
    });

    NS.RoleRowWidget = Y.Base.create('roleRowWidget', SYS.AppWidget, [], {
        buildTData: function(){
            var user = this.getUser();
            return {
                uid: user.get('id'),
                unm: user.getUserName()
            };
        },
        onInitAppWidget: function(err, appInstance){
            var tp = this.template,
                role = this.get('role').get('role'),
                owner = this.get('owner'),
                user = this.getUser();

            var elSel = Y.one(tp.gel('rs'));
            elSel.set('value', role);
            if (UID == user.get('id') || owner.get('readOnly')){
                elSel.addClass('hide');
                tp.gel('ro').innerHTML = Abricos.Language.get('mod.money.account.role.' + role);
            }
            elSel.on('change', this.updateHelp, this);
        },
        getRoleValue: function(){
            return this.template.gel('rs').value | 0;
        },
        updateHelp: function(){
            if (!this.helpWidget){
                return;
            }
            var role = this.getRoleValue();
            this.helpWidget.set('role', role);
        },
        getUser: function(){
            var role = this.get('role'),
                owner = this.get('owner'),
                userList = owner.get('appInstance').getFromCache('userList'),
                userid = role.get('userid'),
                user = userList.getById(userid);

            if (!user){ // TODO: optimize uprofile module
                var upUser = Brick.mod.uprofile.viewer.users.get(userid);
                userList.add([{
                    id: upUser.id | 0,
                    unm: upUser.userName,
                    fnm: upUser.firstName,
                    lnm: upUser.lastName,
                    avt: upUser.avatar
                }]);
                user = userList.getById(userid);
            }

            return user;
        },
        showHelp: function(){
            if (this.helpWidget){
                return;
            }
            this.helpWidget = new NS.RoleHelpWidget({
                srcNode: Y.one(this.template.gel('help')).appendChild('<div></div>'),
                role: this.getRoleValue(),
                isAccount: this.get('owner').get('isAccount')
            });
            this.helpWidget.on('close', this.closeHelp, this);
        },
        closeHelp: function(){
            if (!this.helpWidget){
                return;
            }
            this.helpWidget.destroy();
            this.helpWidget = null;
        },
        onClick: function(e){
            switch (e.dataClick) {
                case 'info':
                    this.showHelp();
                    return true;
            }
        },
        toJSON: function(){
            return {
                r: this.getRoleValue(),
                u: this.getUser().get('id')
            }
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'urrow'},
            owner: {value: null},
            role: {value: null}
        }
    });

    NS.RoleListWidget = Y.Base.create('roleListWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance){
            this.usersWidget = null;
            this._ws = [];
            var tp = this.template;
            if (this.get('readOnly')){
                Y.one(tp.gel('btns')).addClass('hide');
            }

            this.set('waiting', true);
            this.get('appInstance').groupList(function(err, result){
                this.set('waiting', false);
                this._renderRoleList();
            }, this);

        },
        _renderRole: function(role){
            var tp = this.template,
                ownerid = this.get('ownerid'),
                isAccount = this.get('isAccount');
            var div = Y.Node.create('<div></div>');
            Y.one(tp.gel('list')).appendChild(div);
            var w = new NS.RoleRowWidget({
                boundingBox: div,
                role: role,
                owner: this
            });
            this._ws[this._ws.length] = w;
        },
        _renderRoleList: function(){
            var ownerid = this.get('ownerid'),
                isAccount = this.get('isAccount');

            this.get('roleList').each(function(role){
                if (role.get(isAccount ? 'accountid' : 'groupid') !== ownerid){
                    return;
                }
                this._renderRole(role);
            }, this);
        },
        showEditor: function(){
            if (this.usersWidget){
                return;
            }

            var tp = this.template, ids = [], ws = this._ws;

            for (var i = 0; i < ws.length; i++){
                ids[ids.length] = ws[i].get('role').get('userid');
            }

            this.usersWidget =
                new Brick.mod.uprofile.UserSelectWidget(tp.gel('users'), ids);

            Y.one(tp.gel('v')).addClass('hide');
            Y.one(tp.gel('e')).removeClass('hide');
        },
        hideEditor: function(){
            if (!this.usersWidget){
                return [];
            }
            var tp = this.template,
                uIds = this.usersWidget.getSelectedUsers();
            this.usersWidget = null;
            tp.gel('users').innerHTML = '';

            Y.one(tp.gel('v')).removeClass('hide');
            Y.one(tp.gel('e')).addClass('hide');

            return uIds;
        },
        cancelEdChanges: function(){
            this.hideEditor();
        },
        applyEdChanges: function(){
            var uIds = this.hideEditor(),
                ws = this._ws,
                nws = [];

            uIds[uIds.length] = UID;

            for (var i = 0; i < ws.length; i++){
                var find = false;
                for (var ii = 0; ii < uIds.length; ii++){
                    if (ws[i].get('role').get('userid') === uIds[ii]){
                        find = true;
                    }
                }
                if (!find){
                    ws[i].destroy();
                } else {
                    nws[nws.length] = ws[i];
                }
            }
            this._ws = nws;
            var appInstance = this.get('appInstance');
            for (var ii = 0; ii < uIds.length; ii++){
                var find = false;
                for (var i = 0; i < ws.length; i++){
                    if (ws[i].get('role').get('userid') == uIds[ii]){
                        find = true;
                    }
                }
                if (!find){
                    var role = this._createRole(NS.AURoleType['WRITE'], uIds[ii]);
                    this._renderRole(role);
                }
            }
        },
        _createRole: function(r, uid){
            r = r || NS.AURoleType.ADMIN;
            uid = uid || UID;
            var app = this.get('appInstance'),
                ownerid = this.get('ownerid'),
                isAccount = this.get('isAccount');

            if (isAccount){
                return new NS.Account.UserRole({
                    appInstance: app,
                    id: '1', aid: ownerid, u: uid, r: r
                });
            } else {
                return new NS.Group.UserRole({
                    appInstance: app,
                    id: '1', gid: ownerid, u: uid, r: r
                });
            }
        },
        onClick: function(e){
            switch (e.dataClick) {
                case 'edit':
                    this.showEditor();
                    return true;
                case 'ok':
                    this.applyEdChanges();
                    return true;
                case 'cancel':
                    this.cancelEdChanges();
                    return true;
            }
        },
        toJSON: function(){
            var ws = this._ws, ret = [];
            for (var i = 0; i < ws.length; i++){
                ret[ret.length] = ws[i].toJSON();
            }
            return ret;
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'urlist'},
            readOnly: {value: false},
            ownerid: {value: 0},
            isAccount: {value: true},
            ownerFieldId: {
                getter: function(){
                    return this.get('isAccount') ? 'accountid' : 'groupid';
                }
            },
            roleList: {
                getter: function(){
                    var app = this.get('appInstance'),
                        ownerid = this.get('ownerid'),
                        isAccount = this.get('isAccount');

                    if (ownerid > 0){
                        var listName = (isAccount ? 'account' : 'group') + 'UserRoleList';
                        return app.getFromCache(listName);
                    }
                    if (!this._roleList){
                        if (isAccount){
                            this._roleList = new NS.Account.UserRoleList({
                                appInstance: app,
                                items: [{id: '1', aid: ownerid, u: UID, r: NS.AURoleType.ADMIN}]
                            });
                        } else {
                            this._roleList = new NS.Group.UserRoleList({
                                appInstance: app,
                                items: [{id: '1', gid: ownerid, u: UID, r: NS.AURoleType.ADMIN}]
                            });
                        }
                    }
                    return this._roleList;
                }
            }
        }
    });

};