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
                    if (cat.parentid != pid || isExpense != cat.isexpense){
                        return;
                    }

                    lst += tp.replace('row', [cat, {tab: tab}]);
                    lst += buildRows.call(this, cat.id, level + 1);
                }, this);
                return lst;
            };

            var lst = buildRows.call(this, 0, 0);
            tp.setHTML('table', tp.replace('table', {
                title: tp.replace(isExpense ? 'expenseTitle' : 'incomingTitle'),
                rows: lst
            }));
        },
        _onRowMenuClick: function(e){
            var categoryid = e.defineTarget.getData('id');
            switch (e.dataClick) {
                case 'edit':
                    return this.showCategoryEditor(categoryid);
            }
        },
        _getRowElement: function(name, id){
            return elEditor = Y.one('#' + this.template.gelid('row.' + name) + '-' + id);
        },
        getCategory: function(id){
            return this.get('group').get('categories').getById(id);
        },
        _closeActions: function(){
            if (this._activeEditor){
                this._activeEditor.info.removeClass('hide');
                this._activeEditor.widget.destroy()
                this._activeEditor = null;
            }
        },
        showCategoryEditor: function(categoryid){
            var category = this.getCategory(categoryid);
            if (!category){
                return;
            }
            this._closeActions();

            this._activeEditor = {
                info: this._getRowElement('info', categoryid).addClass('hide'),
                widget: new NS.CategoryListWidget.EditorWidget({
                    srcNode: this._getRowElement('editor', categoryid).appendChild('<div></div>'),
                    category: category,
                    owner: this
                })
            };
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'list,table,expenseTitle,incomingTitle,row,stab'},
            isExpense: {value: false}
        },
        CLICKS: {
            'edit,add,remove': '_onRowMenuClick'
        }
    });

    NS.CategoryListWidget.EditorWidget = Y.Base.create('editor', SYS.AppWidget, [], {
        onInitAppWidget: function(){
            this.template.setValue(this.get('category').toJSON());
        },
        cancel: function(){
            this.get('owner')._closeActions();
        },
        save: function(){
            this.set('waiting', true);

            var tp = this.template,
                owner = this.get('owner'),
                d = Y.merge(this.get('category').toJSON(), {
                    title: tp.getValue('title')
                });

            this.get('appInstance').categorySave(d, function(err, result){
                this.set('waiting', false);
                if (!err){
                    this.cancel();
                    owner.renderList();
                }
            }, this);
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'editor'},
            owner: {value: null},
            category: {value: null}
        },
        CLICKS: {
            save: 'save',
            cancel: 'cancel'
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