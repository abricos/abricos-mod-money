var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'uprofile', files: ['userSelect.js']},
        {name: '{C#MODNAME}', files: ['lib.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys,
        UP = Brick.mod.uprofile,
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
                el = tp.one('wrp'),
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
            return {uid: this.get('userid')};
        },
        onInitAppWidget: function(err, appInstance){
            var tp = this.template,
                role = this.get('role'),
                rValue = role.get('role'),
                userid = role.get('id'),
                owner = this.get('owner');

            tp.one('rs').on('change', this.updateHelp, this);
            tp.setValue('rs', rValue);
            if (UID == userid || owner.get('readOnly')){
                tp.hide('rs');
                tp.setHTML('ro', Abricos.Language.get('mod.money.account.role.' + rValue));
            }

            appInstance.get('uprofile').user(userid, function(err, result){
                tp.setHTML('user', result.user.get('viewName'));
            }, this);
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
                u: this.get('userid')
            }
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'urrow'},
            owner: {value: null},
            role: {},
            userid: {
                readOnly: true,
                getter: function(){
                    return this.get('role').get('id');
                }
            }
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
                ids[ids.length] = ws[i].get('userid');
            }

            this.usersWidget = new UP.UserSelectWidget({
                srcNode: tp.append('users', '<div></div>'),
                users: ids
            });

            tp.toggleView(true, 'e', 'v');
        },
        hideEditor: function(){
            if (!this.usersWidget){
                return [];
            }
            var uIds = this.usersWidget.get('users');
            this.usersWidget.destroy();
            this.usersWidget = null;

            this.template.toggleView(true, 'v', 'e');

            return uIds;
        },
        applyEdChanges: function(){
            var uIds = this.hideEditor(),
                ws = this._ws,
                nws = [];

            var appInstance = this.get('appInstance');

            uIds[uIds.length] = UID;

            for (var i = 0; i < ws.length; i++){
                var find = false;
                for (var ii = 0; ii < uIds.length; ii++){
                    if (ws[i].get('userid') === uIds[ii]){
                        find = true;
                    }
                }
                find ? (nws[nws.length] = ws[i]) : ws[i].destroy()
            }
            this._ws = nws;
            for (var ii = 0; ii < uIds.length; ii++){
                var find = false;
                for (var i = 0; i < ws.length; i++){
                    if (ws[i].get('userid') === uIds[ii]){
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
                appInstance: this.get('appInstance'),
                id: uid || UID,
                r: r || NS.AURoleType.ADMIN
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
            cancel: {event: 'hideEditor'}
        }
    });

};