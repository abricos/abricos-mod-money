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

    NS.SummaryWidget = Y.Base.create('summaryWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance){
            this._widgetList = [];
            this.set('waiting', true);
            Brick.use('money', 'accountList', function(){
                appInstance.groupList(function(err, result){
                    this.set('waiting', false);
                    this.renderGroupList();
                }, this);
            }, this);
        },
        renderGroupList: function(){
            var tp = this.template,
                ws = this._widgetList;

            tp.setHTML('list', '');

            this.get('appInstance').get('groupList').each(function(group){
                var w = new NS.AccountListWidget({
                    srcNode: tp.append('list', '<div></div>'),
                    groupid: group.get('id'),
                    accountMenuVisible: false,
                    readOnly: true
                });
                ws[ws.length] = w;
            }, this);
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            accountid: {value: 0}
        }
    });
};