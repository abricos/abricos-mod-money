var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'widget', files: ['calendar.js']},
        {name: '{C#MODNAME}', files: ['opermove.js']}
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

            this.after('accountChange', this.renderAccount, this);
            this.after('operChange', this.renderOper, this);

            this.renderAccount();
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

        renderAccount: function(){
            var account = this.get('account');

            if (!account){
                return;
            }
            var tp = this.template;
            tp.setHTML({
                atl: account.getTitle(),
                cc: account.getCurrencySign(),
            });

            this.renderOper();
        },
        renderOper: function(){
            var tp = this.template,
                oper = this.get('oper');

            this._hideCreateCategory();

            tp.toggleView(!!oper, 'bsave,bcancel', 'bcreate');

            tp.one('in').focus();

            if (!oper){
                this.categorySelectWidget.select(0);
                tp.setValue({
                    in: '',
                    dsc: ''
                });
            } else {
                var acc = NS.moneyManager.findAccount(oper.accountid);
                this.setAccount(acc);
                gel('in').value = oper.value == 0 ? '' : oper.value;
                gel('dsc').value = oper.descript;
                this.dateTimeWidget.setValue(oper.date);
                this.categorySelectWidget.setValue(oper.categoryid);
            }
        },
        clearForm: function(){
            this.set('oper', null);
            this.renderOper();
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
                categoryid = this.categorySelectWidget.selected();

            var sd = {
                'id': oper ? oper.get('id') : 0,
                'isexpense': this.get('isExpense'),
                'accountid': this.get('account').get('id'),
                'value': val.replace(/\s/gi, '').replace(/,/gi, '.'),
                'upddate': (dt ? dt : new Date()).getTime() / 1000,
                'categoryid': categoryid,
                'descript': tp.gel('dsc').value
            };
            if (categoryid === -1){
                sd['categoryData'] = this.categoryCreateWidget.toJSON();
            }

            this.set('waiting', true);
            this.get('appInstance').operSave(sd, function(){
                this.set('waiting', false);
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
                // 'move': new NS.OperMoveEditorWidget(gel('move'), account)
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
            // this.tabs[name].set('oper', null);
        },
        _updateByOper: function(val){
            var tabs = this.tabs;

            if (oper.methodid > 0 && oper.method){
                this.showPage('move');
                tabs['move'].setOper(oper);
            } else if (oper.isExpense){
                this.showPage('expense');
                tabs['expense'].setOper(oper);
            } else if (!oper.isExpense){
                this.showPage('income');
                tabs['income'].setOper(oper);
            }

            return val;
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