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
        onInitAppWidget: function(err, appInstance, options){
            var wsPage = new SYS.AppWorkspacePage(options.arguments[0].workspacePage);

            this.set('waiting', true);
            appInstance.groupList(function(err, result){
                this.set('waiting', false);
                this.renderMenuList();

                appInstance.on('appResponses', this._onAppResponses, this);
                this.on('workspaceWidgetChange', this._updateSelectedGroup, this);

                this.showWorkspacePage(!wsPage.isEmpty() ? wsPage : null);
            }, this);
        },
        destructor: function(){
            this.get('appInstance').detach('appResponses', this._onAppResponses, this);
        },
        _onAppResponses: function(e){
            if (e.err || !e.result.groupList){
                return;
            }
            this.renderMenuList();
        },
        defineDefaultPage: function(callback, context){
            var groupList = this.get('appInstance').get('groupList');
            if (!groupList){
                return;
            }
            var group = groupList.item(0),
                defPage = {
                    component: 'groupEditor',
                    widget: 'GroupEditorWidget'
                };

            if (group){
                defPage = {
                    component: 'groupView',
                    widget: 'GroupViewWidget',
                    args: [group.get('id')]
                };
            }
            callback.call(context || this, null, defPage);
        },
        _updateSelectedGroup: function(e){
            var tp = this.template,
                selectedGroupId = 0,
                wsPage = new SYS.AppWorkspacePage(e.newVal ? e.newVal.get('workspacePage') : null);

            if (wsPage.component === 'groupView' && wsPage.widget === 'GroupViewWidget'){
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
        renderMenuList: function(){
            var groupList = this.get('appInstance').get('groupList');
            if (!groupList){
                return;
            }
            var tp = this.template,
                lst = "";

            groupList.each(function(group){
                lst += tp.replace('menuItem', [
                    {title: group.getTitle()},
                    group.toJSON()
                ]);
            });

            tp.gel('menu').innerHTML = lst;
            this.appURLUpdate();
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget,menuItem'},
            defineDefaultPage: {value: true}
        }
    });

    NS.ws = SYS.AppWorkspace.build('{C#MODNAME}', NS.WorkspaceWidget);

};