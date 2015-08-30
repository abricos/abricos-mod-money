var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'widget', files: ['calendar.js']},
        {name: '{C#MODNAME}', files: ['operMove.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.OperEditorWidget = Y.Base.create('operEditorWidget', SYS.AppWidget, [
        NS.KeyPressExt
    ], {
        onInitAppWidget: function(err, appInstance){
            var tp = this.template,
                group = this.get('group');

            this.categorySelectWidget = new NS.CategorySelectWidget({
                boundingBox: tp.gel('cats'),
                groupid: this.get('groupid'),
                showNewRow: group.isWriteRole(),
                isExpense: this.get('isExpense')
            });

            this.categorySelectWidget.on('categoryChange', this._onCategoryChange, this);

            this.dateTimeWidget = new Brick.mod.widget.DateInputWidget(tp.gel('editor.dt'), {
                'date': new Date(),
                'showBClear': false,
                'showBTime': false,
                'showTime': false
            });

            this.after('accountChange', this.renderWidget, this);
            this.after('operChange', this.renderWidget, this);

            this.renderWidget();
        },
        destructor: function(){
            this.categorySelectWidget.destroy();
            this.dateTimeWidget.destroy();
        },
        _onCategoryChange: function(e){
            var val = e.value | 0;
            if (val === -1){
                this._showCreateCategory();
            } else {
                this._hideCreateCategory();
            }
        },
        _showCreateCategory: function(){
            if (this.categoryCreateWidget){
                return;
            }
            var tp = this.template;

            this.categoryCreateWidget = new NS.CategoryCreateWidget({
                boundingBox: tp.append('catcreate', '<div></div>'),
                groupid: this.get('groupid'),
                isExpense: this.get('isExpense')
            });
        },
        _hideCreateCategory: function(){
            if (!this.categoryCreateWidget){
                return;
            }
            this.categoryCreateWidget.destroy();
            this.categoryCreateWidget = null;
        },
        inputFocus: function(){
            this.template.one('in').focus();
        },
        renderWidget: function(){
            var appInstance = this.get('appInstance'),
                oper = this.get('oper'),
                account = oper
                    ? appInstance.get('accountList').getById(oper.get('accountid')) :
                    this.get('account');

            if (!account){
                return;
            }

            var tp = this.template;
            tp.setHTML({
                atl: account.getTitle(),
                cc: account.getCurrencySign(),
            });

            this._hideCreateCategory();

            tp.toggleView(!!oper, 'bsave,bcancel', 'bcreate');

            this.inputFocus();

            this.categorySelectWidget.select(oper ? oper.get('categoryid') : 0);

            if (!oper){
                tp.setValue({
                    in: '',
                    dsc: ''
                });
            } else {
                var attrs = oper.toJSON();

                tp.setValue({
                    in: attrs.value,
                    dsc: attrs.descript
                });
                this.dateTimeWidget.setValue(new Date(oper.get('date') * 1000));
            }
        },
        clearForm: function(){
            if (this.get('oper')){
                this.set('oper', null);
            } else {
                this.renderWidget();
            }
        },
        onKeyPress: function(e){
            if (e.keyCode !== 13){
                return;
            }
            this.save();
            return true;
        },
        save: function(){
            if (this.get('waiting')){
                return;
            }
            var tp = this.template,
                oper = this.get('oper'),
                dt = this.dateTimeWidget.getValue(),
                val = tp.gel('in').value + '',
                categoryid = this.categorySelectWidget.selected(),
                account = this.get('account'),
                accountid = account.get('id');

            var sd = {
                id: oper ? oper.get('id') : 0,
                isexpense: this.get('isExpense'),
                accountid: accountid,
                value: val.replace(/\s/gi, '').replace(/,/gi, '.'),
                date: (dt ? dt : new Date()).getTime() / 1000,
                upddate: account.get('upddate'),
                categoryid: categoryid,
                descript: tp.gel('dsc').value
            };
            if (categoryid === -1){
                sd['categoryData'] = this.categoryCreateWidget.toJSON();
            }

            this.set('waiting', true);
            this.get('appInstance').operSave(sd, function(err, result){
                this.set('waiting', false);
                if (result.balanceList){
                    var b = result.balanceList.getById(accountid);
                    if (b){
                        account.set('upddate', b.get('upddate'));
                        account.set('balance', b.get('balance'));
                    }
                }
                this.clearForm();
            }, this);
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'editor'},
            account: {value: null},
            groupid: {
                readOnly: true,
                getter: function(){
                    var account = this.get('account');
                    return account ? account.get('groupid') : 0;
                }
            },
            group: {
                readOnly: true,
                getter: function(){
                    var app = this.get('appInstance'),
                        groupid = this.get('groupid');
                    if (groupid === 0 || !app){
                        return null;
                    }
                    return app.get('groupList').getById(groupid);
                }
            },
            isExpense: {
                writeOnce: true
            },
            oper: {
                value: null
            }
        },
        CLICKS: {
            save: 'save',
            cancel: 'clearForm'
        }
    });

    NS.OperationWidget = Y.Base.create('operationWidget', SYS.AppWidget, [
        NS.GroupByIdExt,
        NS.SelectedAccountExt
    ], {
        onLoadGroupData: function(){
            var account = this.get('selectedAccount');
            var tp = this.template;

            this.tabs = {
                'expense': new NS.OperEditorWidget({
                    boundingBox: tp.gel('expense'),
                    account: account,
                    isExpense: true
                }),
                'income': new NS.OperEditorWidget({
                    boundingBox: tp.gel('income'),
                    account: account,
                    isExpense: false
                }),
                'move': new NS.OperMoveEditorWidget({
                    boundingBox: tp.gel('move'),
                    groupid: this.get('groupid')
                })
            };

            this.showPage('expense');
            this.on('selectedAccountChange', this._onSelectedAccountChange, this);
        },
        destructor: function(){
            for (var n in this.tabs){
                this.tabs[n].destroy()
            }
        },
        _onSelectedAccountChange: function(e){
            for (var n in this.tabs){
                this.tabs[n].set('account', e.newVal);
            }
        },
        _showPageByClick: function(e){
            this.showPage(e.dataClick);
        },
        showPage: function(name){
            var tp = this.template;

            for (var n in this.tabs){
                tp.hide(n);
                tp.removeClass('t' + n, 'sel');
            }
            tp.show(name);
            tp.addClass('t' + name, 'sel');
            this.tabs[name].inputFocus();
        },
        _updateByOper: function(oper){
            if (!oper){
                return;
            }
            var tabs = this.tabs;

            if (oper.move){
                this.showPage('move');
                tabs['move'].set('oper', oper);
            } else if (oper.get('isexpense')){
                this.showPage('expense');
                tabs['expense'].set('oper', oper);
            } else if (!oper.get('isexpense')){
                this.showPage('income');
                tabs['income'].set('oper', oper);
            }

            return oper;
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            oper: {
                setter: '_updateByOper'
            }
        },
        CLICKS: {
            'expense': {event: '_showPageByClick'},
            'income': {event: '_showPageByClick'},
            'move': {event: '_showPageByClick'}
        }
    });

};