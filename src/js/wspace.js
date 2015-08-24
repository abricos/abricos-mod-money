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
                this.renderMenuList();
                this._showPageByInit();
                appInstance.on('appResponses', this._onAppResponses, this);
                this.on('workspaceWidgetChange', this._onWorkspaceWidgetChange, this);
            }, this);
        },
        destructor: function(){
            Y.detach('appResponses', this._onAppResponses);
        },
        _onAppResponses: function(e){
            if (e.err || !e.result.groupList){
                return;
            }
            this.renderMenuList();
        },
        _onWorkspaceWidgetChange: function(){
            this._updateSelectedGroup();
        },
        _updateSelectedGroup: function(){
            var tp = this.template,
                selectedGroupId = 0,
                wsPage = this.get('workspacePage') || {};

            if (wsPage && wsPage.component === 'groupView' && wsPage.widget === 'GroupViewWidget' && wsPage.args){
                selectedGroupId = wsPage.args[0] | 0;
            }

            tp.one('menu').all('[data-type]').each(function(node){
                var id = node.getData('id') | 0;
                if (id === selectedGroupId){
                    node.addClass('active');
                } else {
                    node.removeClass('active');
                }
            }, this);

        },
        _showPageByInit: function(){
            var wsPage = this.get('workspacePage') || {};

            if (wsPage.component){
                this.showWorkspacePage();
                this._updateSelectedGroup();
                return;
            }

            var groupList = this.get('appInstance').get('groupList');
            if (!groupList){
                return;
            }
            var group = groupList.item(0);

            if (!group){
                this.showWorkspacePage({
                    component: 'groupEditor',
                    widget: 'GroupEditorWidget'
                });
            } else {
                this.showWorkspacePage({
                    component: 'groupView',
                    widget: 'GroupViewWidget',
                    args: [group.get('id')]
                });
            }
        },
        renderMenuList: function(){
            var groupList = this.get('appInstance').get('groupList');
            if (!groupList){
                return;
            }
            var tp = this.template,
                lst = "";

            groupList.each(function(group){
                lst += tp.replace('menuItem', [
                    group.toJSON(),
                    {title: group.getTitle()}
                ]);
            });

            tp.gel('menu').innerHTML = lst;
            this.appURLUpdate();
        }
    }, {
        ATTRS: {
            component: {
                value: COMPONENT
            },
            templateBlockName: {
                value: 'widget,menuItem'
            }
        }
    });

    NS.ws = SYS.AppWorkspace.build('{C#MODNAME}', NS.WorkspaceWidget);

};