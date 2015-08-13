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

    NS.GroupEditorWidget = Y.Base.create('groupEditorWidget', SYS.AppWidget, [
        SYS.Form
        // , SYS.FormAction
    ], {
        buildTData: function(){
            return {
                'gstclass': this.get('groupid') > 0 ? 'isgedit' : 'isgnew'
            };
        },
        onInitAppWidget: function(err, appInstance){
            this.set('waiting', true);
            appInstance.groupList(function(err, result){
                this.set('waiting', false);
                if (!err){
                    this.set('groupList', result.groupList);
                }
                this.renderGroup();
            }, this);
        },
        renderGroup: function(){
            var appInstance = this.get('appInstance'),
                tp = this.template,
                groupid = this.get('groupid'),
                group = groupid > 0 ?
                    this.get('groupList').getById(groupid) :
                    new NS.Group({appInstance: appInstance}),
                readOnly = groupid > 0 && !group.isAdminRole();

            this.set('model', group);

            if (readOnly){
                tp.gel('title').disabled = 'disabled';
            }

            this.rolesWidget = new NS.RoleListWidget({
                srcNode: tp.gel('ulst'),
                readOnly: readOnly,
                isAccount: false,
                ownerid: groupid
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
            this.updateModelFromUI();

            var d = this.get('model').toJSON();
            d.roles = this.rolesWidget.toJSON();
            d.accounts = this.accountListWidget.toJSON();

            return d;
        },
        save: function(){
            this.set('waiting', true);

            var d = this.toJSON();
            console.log(d.accounts[0]);

            this.get('appInstance').groupSave(d, function(err, result){
                this.set('waiting', false);
            }, this);
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            groupid: {value: 0},
            groupList: {value: null}
        }
    });

    NS.GroupEditorWidget.parseURLParam = function(args){
        args = args || [];
        return {
            groupid: args[0] | 0
        };
    };

};