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
            var id = e.defineTarget.getData('id');
            switch (e.dataClick) {
                case 'edit':
                    return this.showCategoryEditor(id);
                case 'add':
                    return this.showCategoryEditor(id, true);
                case 'remove':
                    return this.showCategoryRemove(id);
            }
        },
        _getRowElement: function(name, id){
            return Y.one('#' + this.template.gelid('row.' + name) + '-' + id);
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
            if (this._activeRemove){
                this._activeRemove.widget.destroy()
                this._activeRemove = null;
            }
        },
        showCategoryEditor: function(categoryid, isParent){
            var category = this.getCategory(categoryid);
            if (!category){
                return;
            }
            this._closeActions();

            if (isParent){
                var app = this.get('appInstance'),
                    d = category.toJSON();

                category = new (app.get('Category'))({
                    appInstance: app,
                    id: 0,
                    pid: categoryid,
                    gid: d.groupid,
                    ise: this.get('isExpense')
                });
            }

            var elInfo = this._getRowElement('info', categoryid);
            if (!isParent){
                elInfo = elInfo.addClass('hide');
            }

            this._activeEditor = {
                info: elInfo,
                widget: new NS.CategoryListWidget.EditorWidget({
                    srcNode: this._getRowElement('action', categoryid).appendChild('<div></div>'),
                    category: category,
                    owner: this
                })
            };
        },
        showCategoryRemove: function(categoryid){
            var category = this.getCategory(categoryid);
            if (!category){
                return;
            }
            this._closeActions();

            this._activeRemove = {
                widget: new NS.CategoryListWidget.RemoveWidget({
                    srcNode: this._getRowElement('action', categoryid).appendChild('<div></div>'),
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

    var ActionWidget = function(){
    };
    ActionWidget.NAME = 'actionWidget';
    ActionWidget.ATTRS = {
        component: {value: COMPONENT},
        owner: {value: null},
        category: {value: null}
    };
    ActionWidget.prototype = {
        cancel: function(){
            this.get('owner')._closeActions();
        },
        toJSON: function(){
            return this.get('category').toJSON();
        },
        _saveMethod: function(method){
            this.set('waiting', true);

            var owner = this.get('owner'),
                d = this.toJSON();

            this.get('appInstance')['category' + method](d, function(err, result){
                this.set('waiting', false);
                if (!err){
                    this.cancel();
                    owner.renderList();
                }
            }, this);
        }
    };

    NS.CategoryListWidget.EditorWidget = Y.Base.create('editorWidget', SYS.AppWidget, [
        ActionWidget
    ], {
        onInitAppWidget: function(){
            this.template.setValue(this.get('category').toJSON());
        },
        toJSON: function(){
            var tp = this.template;
            return Y.merge(this.get('category').toJSON(), {
                title: tp.getValue('title')
            });
        },
        save: function(){
            this._saveMethod('Save');
        }
    }, {
        ATTRS: {
            templateBlockName: {value: 'editor'},
        },
        // TODO: move to ActionWidget.CLICKS (release in SYS.WidgetClick)
        CLICKS: {
            save: 'save',
            cancel: 'cancel'
        }
    });

    NS.CategoryListWidget.RemoveWidget = Y.Base.create('removeWidget', SYS.AppWidget, [
        ActionWidget
    ], {
        onInitAppWidget: function(){
            var d = this.get('category').toJSON();
            console.log(d);
            this.template.setHTML('title', d.title);
        },
        save: function(){
            this._saveMethod('Remove');
        }
    }, {
        ATTRS: {
            templateBlockName: {value: 'remove'},
        },
        // TODO: move to ActionWidget.CLICKS (release in SYS.WidgetClick)
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