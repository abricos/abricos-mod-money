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


    NS.GroupViewWidget = Y.Base.create('groupViewWidget', SYS.AppWidget, [], {
        buildTData: function(){
            return {groupid: this.get('groupid')}
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
        onClick: function(e){
            switch (e.dataClick) {
                case '':
                    return true;
            }
        },
        renderGroup: function(){
            var groupid = this.get('groupid'),
                groupList = this.get('groupList'),
                group = groupList ? groupList.getById(groupid) : null,
                tp = this.template;

            if (!group){
                Y.one(tp.gel('ws')).addClass('hide');
                Y.one(tp.gel('notfound')).removeClass('hide');
                return;
            }

        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            groupList: {value: null},
            group: {value: null},
            groupid: {value: 0}
        }
    });

    NS.GroupViewWidget.parseURLParam = function(args){
        return {
            groupid: args[0] | 0
        };
    };

};