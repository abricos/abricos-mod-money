var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sys', files: ['form.js']},
        {name: '{C#MODNAME}', files: ['accountEditor.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;
    var UID = Brick.env.user.id;

    NS.GroupEditorWidget = Y.Base.create('groupEditorWidget', SYS.AppWidget, [
        NS.GroupByIdExt
    ], {
        buildTData: function(){
            return {
                'gstclass': this.get('groupid') > 0 ? 'isgedit' : 'isgnew'
            };
        },
        onLoadGroupData: function(err, group){
            var appInstance = this.get('appInstance'),
                tp = this.template,
                groupList = this.get('groupList'),
                groupid = this.get('groupid'),
                group = groupid > 0 ?
                    groupList.getById(groupid) :
                    new NS.Group({
                        appInstance: appInstance,
                        roles: {
                            list: [{id: UID, r: NS.AURoleType.ADMIN}]
                        }
                    }),
                readOnly = groupid > 0 && !group.isAdminRole();

            tp.setValue(group.toJSON());

            this.set('model', group);

            if (readOnly){
                tp.gel('title').disabled = 'disabled';
            }

            this.rolesWidget = new NS.RoleListWidget({
                isAccount: false,
                srcNode: tp.gel('ulst'),
                readOnly: readOnly,
                roleList: group.get('roles')
            });

            this.accountListWidget = new NS.AccountEditorListWidget({
                srcNode: tp.gel('accountList'),
                groupid: groupid
            });

            if (groupList.size() === 0){
                tp.hide('bcancel,bclose');
            }
        },
        toJSON: function(){
            var d = {
                id: this.get('groupid'),
                title: this.template.getValue('title')
            };

            d.roles = this.rolesWidget.toJSON();
            d.accounts = this.accountListWidget.toJSON();

            return d;
        },
        save: function(){
            var d = this.toJSON();

            this.set('waiting', true);
            this.get('appInstance').groupSave(d, function(err, result){
                this.set('waiting', false);
                if (!err){
                    this.go('group.view', result.groupSave.groupid);
                }
            }, this);
        },
        cancel: function(){
            var groupList = this.get('appInstance').get('groupList'),
                groupid = this.get('groupid');
            if (groupid === 0){
                var group = groupList.item(0);
                if (!group){
                    this.go('ws');
                    return;
                }
                groupid = group.get('id');
            }
            this.go('group.view', groupid);
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'}
        },
        CLICKS: {
            save: 'save',
            cancel: 'cancel'
        }
    });

    NS.GroupEditorWidget.parseURLParam = function(args){
        args = args || [];
        return {
            groupid: args[0] | 0
        };
    };

};