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
                groupid = this.get('groupid'),
                group = groupid > 0 ?
                    this.get('groupList').getById(groupid) :
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
                owner: this,
                srcNode: tp.gel('ulst'),
                readOnly: readOnly,
                roleList: group.get('roles')
            });

            this.accountListWidget = new NS.AccountEditorListWidget({
                srcNode: tp.gel('accountList'),
                group: group
            });
        },
        onClick: function(e){
            switch (e.dataClick) {
                case 'save':
                    this.save();
                    return true;
                case 'cancel':
                    return true;
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
            this.set('waiting', true);

            var d = this.toJSON();

            this.get('appInstance').groupSave(d, function(err, result){
                this.set('waiting', false);
            }, this);
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'}
        }
    });

    NS.GroupEditorWidget.parseURLParam = function(args){
        args = args || [];
        return {
            groupid: args[0] | 0
        };
    };

};