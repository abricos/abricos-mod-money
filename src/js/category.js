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
                pid: this.selectWidget.get('selected'),
                tl: this.template.gel('val').value
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
        onLoadGroupData: function(err, group, options){
            var tp = this.template,
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
            var lst = buildRows.call(this, 0, 0);
            this.get('boundingBox').setHTML(tp.replace('select', {
                crow: this.get('showChoiseRow') ? tp.replace('scrow') : '',
                nrow: this.get('showNewRow') ? tp.replace('snrow') : '',
                erow: this.get('showEditRow') ? tp.replace('serow') : '',
                rtrow: this.get('showRootRow') ? tp.replace('srtrow') : '',
                rows: lst
            }));

            tp.one('id').on('change', function(){
                this.set('selected', tp.one('id').get('value'));
            }, this);
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
            selected: {
                getter: function(val){
                    var el = this.template.one('id');
                    return el ? el.get('value') : val;
                },
                setter: function(val){
                    var el = this.template.one('id');
                    el ? el.set('value', val) : 0;
                    return val;
                }
            }
        }
    });
};