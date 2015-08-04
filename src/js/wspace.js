var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: '{C#MODNAME}', files: ['lib.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,

        COMPONENT = this,

        SYS = Brick.mod.sys;

    NS.WorkspaceWidget = Y.Base.create('workspaceWidget', SYS.AppWidget, [
        SYS.AppWorkspace
    ], {
        onInitAppWidget: function(err, appInstance){
            this.set('waiting', true);
            appInstance.groupList(function(err, result){
                this.set('waiting', false);
                if (!err){
                    this.set('groupList', result.groupList);
                }
                this.renderMenuList();
            }, this);
        },
        renderMenuList: function(){
            var groupList = this.get('groupList');
            if (!groupList){
                return;
            }
            var tp = this.template,
                lst = "",
                firstGroupId;

            groupList.each(function(group){
                if (!firstGroupId){
                    firstGroupId = group.get('id');
                }
                lst += tp.replace('menuItem', [
                    group.toJSON(),
                    {title: group.getTitle()}
                ]);
            });

            tp.gel('menu').innerHTML = lst;
            this.appURLUpdate();

            if (!firstGroupId){
            } else {
                this.showWorkspacePage({
                    component: 'groupView',
                    widget: 'GroupViewWidget',
                    args: [firstGroupId]
                });
            }

        }
    }, {
        ATTRS: {
            component: {
                value: COMPONENT
            },
            templateBlockName: {
                value: 'widget,menuItem'
            },
            groupList: {
                value: null
            }
        }
    });

    NS.ws = SYS.AppWorkspace.build('{C#MODNAME}', NS.WorkspaceWidget);

};