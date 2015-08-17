var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'widget', files: ['calendar.js']},
        {name: '{C#MODNAME}', files: ['opermove.js']}
    ]
};
Component.entryPoint = function(NS){

    var OperEditorWidget = function(container, account, isExpense){
        this.init(container, account, isExpense);
    };
    OperEditorWidget.prototype = {
        init: function(container, account, isExpense){

            this.setOper(null);
        },
        onCategoriesChanged: function(){
            this.catsWidget.render();
            this.hideCreateCategory();
        },
        catsChanged: function(){
            var val = this.catsWidget.getValue() * 1;
            if (val == -1){
                this.showCreateCategory();
            } else {
                this.hideCreateCategory();
            }
        },

        onClick: function(el){
            var tp = this._TId['editor'];
            switch (el.id) {
                case tp['bcreate']:
                    this.save();
                    return false;
                case tp['bsave']:
                    this.save();
                    return false;
                case tp['bcancel']:
                    this.setOper(null);
                    return false;
            }
            return false;
        },
        onKeyPress: function(el, e){
            if (e.keyCode == 13 && el.id == this._TM.getElId('editor.in')){
                this.save();
            }
            return false;
        },
        setOper: function(oper){
            this.oper = oper;

            var TM = this._TM, gel = function(n){
                return TM.getEl('editor.' + n);
            };

            var ss = Dom.setStyle;

            if (L.isNull(oper)){
                ss(gel('bcreate'), 'display', '');
                ss(gel('bsave'), 'display', 'none');
                ss(gel('bcancel'), 'display', 'none');
                oper = new NS.Oper();
            } else {
                ss(gel('bcreate'), 'display', 'none');
                ss(gel('bsave'), 'display', '');
                ss(gel('bcancel'), 'display', '');

                var acc = NS.moneyManager.findAccount(oper.accountid);
                this.setAccount(acc);
            }

            gel('in').value = oper.value == 0 ? '' : oper.value;
            gel('dsc').value = oper.descript;
            this.dateTimeWidget.setValue(oper.date);
            this.catsWidget.setValue(oper.categoryid);
        },
        save: function(){
            if (this._saveProcess){
                return;
            }
            this._saveProcess = true;

            var TM = this._TM, gel = function(n){
                    return TM.getEl('editor.' + n);
                },
                __self = this;

            var dt = this.dateTimeWidget.getValue();
            dt = L.isNull(dt) ? new Date() : dt;

            gel('bsave').disabled = "disabled";
            Dom.setStyle(gel('pcsave'), 'display', '');

            var val = gel('in').value + '';
            val = val.replace(/\s/gi, '');
            val = val.replace(/,/gi, '.');

            var sd = {
                'id': L.isNull(this.oper) ? 0 : this.oper.id,
                'ise': this.isExpense,
                'aid': this.account.id,
                'v': val,
                'd': dt.getTime() / 1000,
                'cid': this.catsWidget.getValue(),
                'dsc': gel('dsc').value
            };
            if (sd['cid'] == -1){
                sd['catnew'] = this.catCreateWidget.getSaveData();
            }
            NS.moneyManager.operSave(sd, function(){
                __self._saveProcess = false;
                gel('bsave').disabled = "";
                Dom.setStyle(gel('pcsave'), 'display', 'none');
                gel('in').value = "";
                gel('dsc').value = "";
                __self.setOper(null);
            });
        }
    };
    NS.OperEditorWidget = OperEditorWidget;

    var OperationWidget = function(container, account){
        this.init(container, account);
    };
    OperationWidget.prototype = {

        onClick: function(el){
            for (var n in this.tabs){
                if (this.tabs[n].onClick(el)){
                    return true;
                }
            }
            var tp = this._TId['widget'];
            switch (el.id) {
                case tp['bexpense']:
                    this.showPage('expense');
                    return true;
                case tp['bincome']:
                    this.showPage('income');
                    return true;
                case tp['bmove']:
                    this.showPage('move');
                    return true;
            }

            return false;
        },
        setAccount: function(acc){
            this.account = acc;
            for (var n in this.tabs){
                this.tabs[n].setAccount(acc);
            }
        },

        setOper: function(oper){
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
        }
    };
    NS.OperationWidget = OperationWidget;
};