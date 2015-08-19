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
            isAccount: {},
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
                userList = owner.get('appInstance').get('userList'),
                userid = role.get('id'),
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
                tp.hide('btns');
            }
            this.get('roleList').each(this._renderRole, this);
        },
        _renderRole: function(role){
            var w = new NS.RoleRowWidget({
                boundingBox: this.template.append('list', '<div></div>'),
                role: role,
                owner: this
            });
            this._ws[this._ws.length] = w;
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
            return new NS.UserRole({
                appInstance: app,
                id: uid || UID,
                r: r|| NS.AURoleType.ADMIN
            });
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
            isAccount: {},
            roleList: {}
        },
        CLICKS: {
            edit: {event: 'showEditor'},
            ok: {event: 'applyEdChanges'},
            cancel: {event: 'cancelEdChanges'}
        }
    });

};