var Component = new Brick.Component();
Component.requires = {
    yui: ['datatype'],
    mod: [
        {name: 'sys', files: ['widgets.js']},
        {name: 'widget', files: ['period.js']},
        {name: '{C#MODNAME}', files: ['category.js']}
    ]
};
Component.entryPoint = function(NS){
    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.OperListWidget = Y.Base.create('operListWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance){
            var tp = this.template;

            this._savedHeight = 20;

            this.filter = {};
            /*
            // this.opers = new NS.OperList();

            this.pagTop = new YAHOO.widget.Paginator({
                containers: tp.gel('pagtop'),
                rowsPerPage: 15
            });
            this.pagTop.subscribe('changeRequest', this.onPaginatorChanged, this, true);
            /**/

            this.set('waiting', true);
            appInstance.groupList(function(err, result){
                this.set('waiting', false);
                if (!err){
                    this.set('groupList', result.groupList);
                    this.set('accountList', result.accountList);
                }
                this._onLoadData();
            }, this);
        },
        _onLoadData: function(){
            var groupid = this.get('groupid'),
                groupList = this.get('groupList'),
                group = groupList ? groupList.getById(groupid) : null,
                tp = this.template;

            this.set('group', group);

            if (!group){
                return;
            }
        },
        onClick: function(e){
            switch (e.dataClick) {
                case '':
                    return true;
            }
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'list,table,rowfilter,row,rowtdbase,rowtdmove,rowsum,rbtns,rbtnsn,rowfilter,filterval'},
            groupList: {},
            accountList: {},
            groupid: {value: 0},
            group: {}
        }
    });

    NS.OperLogWidget = Y.Base.create('operLogWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance){
            this.set('waiting', true);
            appInstance.groupList(function(err, result){
                this.set('waiting', false);
                if (!err){
                    this.set('groupList', result.groupList);
                    this.set('accountList', result.accountList);
                }
                this._onLoadData();
            }, this);
        },
        _onLoadData: function(){
            var groupid = this.get('groupid'),
                groupList = this.get('groupList'),
                group = groupList ? groupList.getById(groupid) : null,
                tp = this.template;

            this.set('group', group);

            this.listWidget = new NS.OperListWidget({
                srcNode: tp.gel('list'),
                groupid: groupid
            });

            if (!group){
                return;
            }
        },
        onClick: function(e){
            switch (e.dataClick) {
                case '':
                    return true;
            }
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            groupList: {},
            accountList: {},
            groupid: {value: 0},
            group: {}
        }
    });
};