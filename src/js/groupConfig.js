var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: '{C#MODNAME}', files: ['categoryEditor.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.GroupConfigWidget = Y.Base.create('groupConfigWidget', SYS.AppWidget, [
        NS.GroupByIdExt
    ], {
        buildTData: function(){
            return {'id': this.get('groupid')};
        },
        onLoadGroupData: function(err, group){
            var appInstance = this.get('appInstance'),
                tp = this.template;

            if (!group){
                return;
            }
            tp.setHTML({
                title: group.getTitle()
            });

            this.categoryEditor = new NS.CategoryEditorWidget({
                srcNode: tp.one('categoryEditor'),
                groupid: group.get('id')
            });
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'}
        },
        CLICKS: {
            save: {
                event: 'save'
            }
        }
    });

    NS.GroupConfigWidget.parseURLParam = function(args){
        args = args || [];
        return {
            groupid: args[0] | 0
        };
    };

};