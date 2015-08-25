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

    NS.CategoryListWidget = Y.Base.create('categoryListWidget', SYS.AppWidget, [
        NS.GroupByIdExt
    ], {
        onLoadGroupData: function(err, group, options){
            this.renderList();
        },
        renderList: function(){
            var tp = this.template,
                group = this.get('group'),
                isExpense = this.get('isExpense');

            var buildRows = function(pid, level){
                var lst = "", tab = "";
                for (var i = 0; i < level; i++){
                    tab += tp.replace('stab');
                }

                group.get('categories').each(function(category){
                    var cat = category.toJSON();
                    if (cat.parentid != pid ||
                        isExpense != cat.isexpense){
                        return;
                    }

                    lst += tp.replace('row', {
                        id: cat.id,
                        title: cat.title,
                        tab: tab
                    });
                    lst += buildRows.call(this, cat.id, level + 1);
                }, this);
                return lst;
            };

            var lst = buildRows.call(this, 0, 0);
            tp.setHTML('table', tp.replace('table', {
                rows: lst
            }));
        },
        toJSON: function(){
            return {}
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'list,table,row,stab'},
            isExpense: {value: false}
        }
    });

    NS.CategoryEditorWidget = Y.Base.create('categoryEditorWidget', SYS.AppWidget, [
        NS.GroupByIdExt
    ], {
        onLoadGroupData: function(err, group, options){
            var tp = this.template,
                groupid = this.get('groupid');

            this.expenseListWidget = new NS.CategoryListWidget({
                srcNode: tp.gel('expenseList'),
                groupid: groupid,
                isExpense: true
            });
            this.incomingListWidget = new NS.CategoryListWidget({
                srcNode: tp.gel('incomingList'),
                groupid: groupid,
                isExpense: false
            });
        },
        toJSON: function(){
            return {}
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'}
        }
    });

};