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

    NS.CategoryCreateWidget = Y.Base.create('categoryCreateWidget', SYS.AppWidget, [
        NS.GroupByIdExt
    ], {
        onLoadGroupData: function(err, group, options){
            var tp = this.template,
                isExpense = this.get('isExpense');

            this.selectWidget = new NS.CategorySelectWidget({
                boundingBox: tp.gel('sel'),
                groupid: this.get('groupid'),
                isExpense: options.isExpense,
                showChoiseRow: false,
                showNewRow: false,
                showRootRow: true
            });
        },
        toJSON: function(){
            return {
                parentid: this.selectWidget.selected(),
                title: this.template.gel('val').value
            }
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'create'}
        }
    });

    NS.CategorySelectWidget = Y.Base.create('categorySelectWidget', SYS.AppWidget, [
        NS.GroupByIdExt
    ], {
        onLoadGroupData: function(){
            this.publish('categoryChange');
            this.get('appInstance').on('appResponses', this._onAppResponses, this);
            this.renderList();
        },
        destructor: function(){
            Y.detach('appResponses', this._onAppResponses);
        },
        _onAppResponses: function(e){
            if (e.err || !e.result.groupList){
                return;
            }
            this.renderList();
        },
        renderList: function(){
            var tp = this.template,
                group = this.get('group'),
                isExpense = this.get('isExpense'),
                stop = 1;

            var buildRows = function(pid, level){
                if (stop++ > 1000){
                    return;
                }

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

                    lst += tp.replace('srow', {
                        id: cat.id,
                        tl: cat.title,
                        tab: tab
                    });
                    lst += buildRows.call(this, cat.id, level + 1);
                }, this);
                return lst;
            };
            if (tp.one('id')){
                tp.one('id').detachAll();
            }
            var lst = buildRows.call(this, 0, 0);
            this.get('boundingBox').setHTML(tp.replace('select', {
                crow: this.get('showChoiseRow') ? tp.replace('scrow') : '',
                nrow: this.get('showNewRow') ? tp.replace('snrow') : '',
                erow: this.get('showEditRow') ? tp.replace('serow') : '',
                rtrow: this.get('showRootRow') ? tp.replace('srtrow') : '',
                rows: lst
            }));

            tp.one('id').on('change', this.onSelectedChange, this);
        },
        onSelectedChange: function(){
            this.fire('categoryChange', {value: this.selected()});
        },
        select: function(val){
            if (!Y.Lang.isNumber(val) || !this.get('group') || !this.template.one('id')){
                return null;
            }
            this.template.setValue('id', val);
        },
        selected: function(){
            return this.template.getValue('id') | 0;
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'select,srow,stab,scrow,snrow,serow,srtrow'},
            isExpense: {},
            showChoiseRow: {value: true},
            showNewRow: {value: false},
            showEditRow: {value: false},
            showRootRow: {value: false},
        }
    });
};