var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: '{C#MODNAME}', files: ['userRole.js', 'currency.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.AccountEditorWidget = Y.Base.create('accountEditorWidget', SYS.AppWidget, [
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
                groupid = this.get('groupid'),
                group = groupid > 0 ?
                    this.get('groupList').getById(groupid) :
                    new NS.Group({appInstance: appInstance});

            this.set('model', group);

        },
        onSubmitFormAction: function(){
            this.set('waiting', true);

            var model = this.get('model');

            this.get('appInstance').configSave(model, function(err, result){
                this.set('waiting', false);
            }, this);
        },
        onClick: function(e){

        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            groupid: {value: 0},
            groupList: {value: null}
        }
    });

};