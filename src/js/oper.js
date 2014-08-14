/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = { 
	mod:[
		{name: 'widget', files: ['calendar.js']},
        {name: '{C#MODNAME}', files: ['opermove.js']}
	]
};
Component.entryPoint = function(NS){

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;

	var buildTemplate = this.buildTemplate;
	
	var OperEditorWidget = function(container, account, isExpense){
		this.init(container, account, isExpense);
	};
	OperEditorWidget.prototype = {
		init: function(container, account, isExpense){
			this.isExpense = isExpense;
			var group = NS.moneyManager.groups.get(account.groupid);
			this.group = group;
			
			var TM = buildTemplate(this, 'editor'); 
			container.innerHTML = TM.replace('editor');
			
			this.catsWidget = 
				new NS.CategorySelectWidget(TM.getEl('editor.cats'), group.categories, isExpense, {
					'showNewRow': group.isWriteRole()
				});
			
			this.catsWidget.changedEvent.subscribe(this.catsChanged, this, true);
			
			this.catCreateWidget = null;
			
			this.dateTimeWidget = new Brick.mod.widget.DateInputWidget(TM.getEl('editor.dt'), {
				'date': new Date(),
				'showBClear': false,
				'showBTime': false,
				'showTime': false
			});
			
			var __self = this;
			E.on(container, 'keypress', function(e){
				if (__self.onKeyPress(E.getTarget(e), e)){ E.stopEvent(e); }
			});
			this.setAccount(account);
			
			NS.moneyManager.categoriesChangedEvent.subscribe(this.onCategoriesChanged, this, true);
			
			this.setOper(null);
		},
		destory: function(){ 
			this.catsWidget.changedEvent.unsubscribe(this.catsChanged);
			NS.moneyManager.categoriesChangedEvent.unsubscribe(this.onCategoriesChanged);
		},
		onCategoriesChanged: function(){
			this.catsWidget.render();
			this.hideCreateCategory();
		},
		catsChanged: function(){
			var val = this.catsWidget.getValue()*1;
			if (val == -1){
				this.showCreateCategory();
			}else{
				this.hideCreateCategory();
			}
		},
		showCreateCategory: function(){
			if (!L.isNull(this.catCreateWidget)){ return; }
			
			this.catCreateWidget = 
				new NS.CategoryCreateWidget(this._TM.getEl('editor.catcreate'), this.group.categories, this.isExpense, {
					'showNewRow': false
				});
		},
		hideCreateCategory: function(){
			if (L.isNull(this.catCreateWidget)){ return; }
			this.catCreateWidget.destroy();
			this.catCreateWidget = null;
		},
		setAccount: function(acc){
			this.account = acc;
			var TM = this._TM;
			TM.getEl('editor.atl').innerHTML = acc.getTitle();
			var cc = acc.currency;
			TM.getEl('editor.cc').innerHTML = L.isNull(cc) ? "" : acc.currency.sign;
		},
		onClick: function(el){
			var tp = this._TId['editor'];
			switch(el.id){
			case tp['bcreate']: this.save(); return false;
			case tp['bsave']: this.save(); return false;
			case tp['bcancel']: this.setOper(null); return false;
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
			
			var TM = this._TM, gel = function(n){ return TM.getEl('editor.'+n);};
			
			var ss = Dom.setStyle;

			if (L.isNull(oper)){
				ss(gel('bcreate'), 'display', '');
				ss(gel('bsave'), 'display', 'none');
				ss(gel('bcancel'), 'display', 'none');
				oper = new NS.Oper();
			}else{
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
			if (this._saveProcess){ return; }
			this._saveProcess = true;
			
			var TM = this._TM, gel = function(n){ return TM.getEl('editor.'+n);},
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
				'd': dt.getTime()/1000,
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
		init: function(container, account){
			this.account = account;
			
			var TM = buildTemplate(this, 'widget'), 
				gel = function(n){ return TM.getEl('widget.'+n); };
			container.innerHTML = TM.replace('widget');
			
			this.tabs = {
				'expense': new NS.OperEditorWidget(gel('expense'), account, true),
				'income': new NS.OperEditorWidget(gel('income'), account, false),
				'move': new NS.OperMoveEditorWidget(gel('move'), account)
			};
			var __self = this;
			E.on(container, 'click', function(e){
                var el = E.getTarget(e);
                if (__self.onClick(el)){ E.preventDefault(e); }
            });
			this.showPage('expense');
		},
		destroy: function(){
			var el = this._TM.getEl('widget.id');
			el.parentNode.removeChild(el);
		},
		onClick: function(el){
			for (var n in this.tabs){
				if (this.tabs[n].onClick(el)){ return true; }
			}
			var tp = this._TId['widget'];
			switch(el.id){
			case tp['bexpense']: this.showPage('expense'); return true;
			case tp['bincome']: this.showPage('income'); return true;
			case tp['bmove']: this.showPage('move'); return true;
			}
			
			return false;
		},
		setAccount: function(acc){
			this.account = acc;
			for (var n in this.tabs){
				this.tabs[n].setAccount(acc);
			}
		},
		showPage: function(name){
			var TM = this._TM, gel = function(n){ return TM.getEl('widget.'+n); };
			
			for (var n in this.tabs){
				Dom.setStyle(gel(n), 'display', 'none');
				Dom.removeClass(gel('t'+n), 'sel');
			}
			Dom.setStyle(gel(name), 'display', '');
			Dom.addClass(gel('t'+name), 'sel');
			
			this.tabs[name].setOper(null);
		},
		setOper: function(oper){
			var tabs = this.tabs;
			
			if (oper.methodid > 0 && oper.method){
				this.showPage('move');
				tabs['move'].setOper(oper);
			}else if (oper.isExpense){
				this.showPage('expense');
				tabs['expense'].setOper(oper);
			}else if (!oper.isExpense){
				this.showPage('income');
				tabs['income'].setOper(oper);
			}
		}
	};
	NS.OperationWidget = OperationWidget;
};