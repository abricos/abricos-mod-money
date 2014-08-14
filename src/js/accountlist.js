/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = { 
	mod:[
        {name: '{C#MODNAME}', files: ['lib.js']}
	]		
};
Component.entryPoint = function(NS){

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;

	var CE = YAHOO.util.CustomEvent;
	
	var LNG = this.language,
		buildTemplate = this.buildTemplate;
	
	var elChildForeach = function(el, callback){
		NS.life(callback, el);
		
		var els = el.childNodes;
		for (var i=0;i<els.length;i++){
			elChildForeach(els[i], callback);
		}
	};
	
	var AccountSelectWidget = function(container, group){
		this.init(container, group);
	};
	AccountSelectWidget.prototype = {
		init: function(container, group){
			
			var TM = buildTemplate(this, 'select,selrow');
			
			var lst = "";
			group.accounts.foreach(function(acc){
				lst += TM.replace('selrow', {
					'id': acc.id, 'tl': acc.getTitle()
				});
			});
			container.innerHTML = TM.replace('select', {'rows': lst});
		},
		destroy: function(){
			var el = this._TM.getEl('select.id');
			el.parentNode.removeChild(el);
		},
		getValue: function(){
			return this._TM.getEl('select.id').value;
		},
		setValue: function(value){
			this._TM.getEl('select.id').value = value;
		},
		setReadonly: function(readonly){
			this._TM.getEl('select.id').disabled = readonly ? 'disabled' : '';
		}
	};
	NS.AccountSelectWidget = AccountSelectWidget;
	
	var AccountRowWidget = function(container, account, cfg){
		cfg = cfg || {};
		this.init(container, account, cfg);
	};
	AccountRowWidget.prototype = {
		init: function(container, acc, cfg){
			this.account = acc;
			this.selected = false;
			this.cfg = cfg;
			
			var TM = buildTemplate(this, 'row'),
				div = document.createElement('div');

			div.innerHTML = TM.replace('row', {
				'id': acc.id
			});
			container.appendChild(div.childNodes[0]);
			
			this.render();
		},
		destroy: function(){
			var el = this._TM.getEl('row.id');
			el.parentNode.removeChild(el);
		},
		onClick: function(el){
			var tp = this._TId['row'];
			switch(el.id){
			case tp['bedit']:
			case tp['beditc']: this.onMenuEditClick(); return true;
			
			case tp['badd']:
			case tp['baddc']: this.onMenuAddOperClick(); return true;

			case tp['brem']:
			case tp['bremc']: this.onMenuRemoveClick(); return true;
			}
			
			var TM = this._TM, findClick = false;
			
			elChildForeach(TM.getEl('row.id'), function(fel){
				if (fel == el){ findClick = true; }
			});
			if (findClick){
				this.onSelectByClick(); return true;				
			}
			return false;
		},
		render: function(){
			var TM = this._TM, gel = function(n){return TM.getEl('row.'+n);};
				acc = this.account;
			gel('tl').innerHTML = acc.getTitle();
			gel('cc').innerHTML = acc.currency.sign;

			var elv = gel('val');
			elv.innerHTML = NS.numberFormat(acc.balance);
			if (acc.balance >= 0){
				Dom.replaceClass(elv, 'red', 'green');
			}else{
				Dom.replaceClass(elv, 'green', 'red');
			}
			
			if (!acc.isEditRole()){
				Dom.setStyle(gel('bedit'), 'display', 'none');
				Dom.setStyle(gel('brem'), 'display', 'none');
			}
			if (!acc.isOperRole()){
				Dom.setStyle(gel('badd'), 'display', 'none');
			}
		},
		onMenuEditClick: function(){
			NS.life(this.cfg['onEditCallback'], this);
		},
		onMenuRemoveClick: function(){
			NS.life(this.cfg['onRemoveCallback'], this);
		},
		onMenuAddOperClick: function(){
			NS.life(this.cfg['onAddOperCallback'], this);
		},
		onSelectByClick: function(){
			NS.life(this.cfg['onSelCallback'], this);
		},
		select: function(){
			this.selected = true;
			this.renderSelStatus();
		},
		unSelect: function(){
			this.selected = false; 
			this.renderSelStatus();
		},
		renderSelStatus: function(){
			var TM = this._TM;
			if (this.selected){
				Dom.addClass(TM.getEl('row.sel'), 'sel');
			}else{
				Dom.removeClass(TM.getEl('row.sel'), 'sel');
			}
		}
	};
	NS.AccountRowWidget = AccountRowWidget;
	
	var AccountGroupRowWidget = function(container, agid, cfg){
		cfg = cfg || {};
		this.init(container, agid, cfg);
	};
	AccountGroupRowWidget.prototype = {
		init: function(container, agid, cfg){
			this.cfg = cfg;

			var TM = buildTemplate(this, 'grow,gsmrow');
			container.innerHTML += TM.replace('grow', {
				'tl': LNG['account']['group'][agid]
			});
			this.ws = [];
		},
		destroy: function(){
			this.clearws();
			var el = this._TM.getEl('grow.id');
			el.parentNode.removeChild(el);
		},
		onClick: function(el){
			for (var i=0;i<this.ws.length;i++){
				if(this.ws[i].onClick(el)){ return true; }
			}
			return false;
		},
		clearws: function(){
			for (var i=0;i<this.ws.length;i++){
				this.ws[i].destroy();
			}
			this.ws = [];
		},
		renderAccount: function(acc){
			var __self = this,
				w = new NS.AccountRowWidget(this._TM.getEl('grow.list'), acc, {
					'onEditCallback': function(row){
						__self.onMenuEditClick(row);
					},
					'onRemoveCallback': function(row){
						__self.onMenuRemoveClick(row);
					},
					'onAddOperCallback': function(row){
						__self.onSelectByClick(row);
					},
					'onSelCallback': function(row){
						__self.onSelectByClick(row);
					}
				}
			);
			this.ws[this.ws.length] = w;
			return w;
		},
		render: function(){
			var TM = this._TM, ws = this.ws;
			Dom.setStyle(TM.getEl('grow.id'), 'display', ws.length > 0 ? '' : 'none');
			if (ws.length == 0){ return; }

			var sum = {};
			for (var i=0;i<ws.length;i++){
				var acc = ws[i].account, ccid = acc.currency.sign;
				if (!sum[ccid]){ sum[ccid] = 0; }
				
				sum[ccid] += acc.balance*1;
			}
			var lst = "";
			for (var cc in sum){
				var val = sum[cc];
				lst += TM.replace('gsmrow', {
					'ise': val >= 0 ? 'green' : 'red',
					'sm': NS.numberFormat(val),
					'cc': cc
				});
			}
			TM.getEl('grow.sumlist').innerHTML = lst;
			
			for (var i=0;i<this.ws.length;i++){
				this.ws[i].render();
			}
		},
		onMenuEditClick: function(row){
			NS.life(this.cfg['onEditCallback'], row);
		},
		onMenuRemoveClick: function(row){
			NS.life(this.cfg['onRemoveCallback'], row);
		},
		onSelectByClick: function(rowWidget){
			NS.life(this.cfg['onSelCallback'], rowWidget);
		},
		selectAccount: function(accountid){
			var reta = null;
			for (var i=0;i<this.ws.length;i++){
				var w = this.ws[i];
				if (w.account.id == accountid){
					reta = w.account;
					w.select();
				}else{
					w.unSelect();
				}
			}
			return reta;
		}
	};
	NS.AccountGroupRowWidget = AccountGroupRowWidget;
	
	var AccountListWidget = function(container, group){
		this.init(container, group);
	};
	AccountListWidget.prototype = {
		init: function(container, group){
			this.group = group;
			var TM = buildTemplate(this, 'widget,grow');
			
			this.selectedAccount = null;
			
			this.selectChangedEvent = new CE('selectChangedEvent');
			this.clickCreateEvent = new CE('clickCreateEvent');
			this.clickGroupEditEvent = new CE('clickGroupEditEvent');
			this.clickEditEvent = new CE('clickEditEvent');
			this.clickRemoveEvent = new CE('clickRemoveEvent');
			this.clickGroupRemoveEvent = new CE('clickGroupRemoveEvent');

			container.innerHTML = TM.replace('widget');

			var __self = this;
			this.wgs = {};
			for (var i=1;i<=3;i++){
				this.wgs[i] = 
					new AccountGroupRowWidget(TM.getEl('widget.list'), i, {
						'onEditCallback': function(row){
							__self.onClickEdit(row.account);
						},
						'onRemoveCallback': function(row){
							__self.onClickRemove(row.account);
						},
						'onSelCallback': function(row){
							__self.selectAccountById(row.account.id);
						}
					});
			}

			var __self = this;
			E.on(container, 'click', function(e){
                var el = E.getTarget(e);
                if (__self.onClick(el)){ E.preventDefault(e); }
            });
			
			this.buildList();
			
			var mm = NS.moneyManager;
			mm.balanceChangedEvent.subscribe(this.onBalanceChanged, this, true);
			
			mm.accountCreatedEvent.subscribe(this.onAccountChanged, this, true);
			mm.accountChangedEvent.subscribe(this.onAccountChanged, this, true);
			mm.accountRemovedEvent.subscribe(this.onAccountChanged, this, true);
		},
		destroy: function(){
			var mm = NS.moneyManager;
			mm.balanceChangedEvent.unsubscribe(this.onBalanceChanged);

			mm.accountCreatedEvent.unsubscribe(this.onAccountChanged);
			mm.accountChangedEvent.unsubscribe(this.onAccountChanged);
			mm.accountRemovedEvent.unsubscribe(this.onAccountChanged);
			
			for (var i=1;i<=3;i++){
				this.wgs[i].destroy();
			}
			var el = this._TM.getEl('widget.id');
			el.parentNode.removeChild(el);
		},
		onAccountChanged: function(e, prm){
			this.reBuildList();
		},
		onBalanceChanged: function(e, prm){
			var acc = prm[0];
			if (L.isNull(acc) || acc.groupid != this.group.id){ return; }
			
			this.render();
		},
		onClick: function(el){
			for (var i=1;i<=3;i++){
				if (this.wgs[i].onClick(el)){ return true; }
			}
			var tp = this._TId['widget'];
			switch(el.id){
			case tp['bcreate']: this.onClickCreate(); return true;
			case tp['bgpedt']: this.onClickGroupEdit(); return true;
			case tp['bgprem']: this.onClickGroupRemove(); return true;
			}
			
			return false;
		},
		reBuildList: function(){
			for (var i=1;i<=3;i++){
				this.wgs[i].clearws();
			}
			this.buildList();
			if (!L.isNull(this.selectedAccount)){
				this.selectAccount(this.selectedAccount);
			}
		},
		buildList: function(){
			var __self = this;
			this.group.accounts.foreach(function(acc){
				__self.renderAccount(acc);
			});
			this.render();
		},
		renderAccount: function(acc){
			var agid = 1;
			switch(acc.type){
			case 5: agid = 2; break;
			case 6: case 7: agid = 3; break;
			}
			this.wgs[agid].renderAccount(acc);
		},
		render: function(){
			var TM = this._TM, gp = this.group;
			TM.getEl('widget.gtl').innerHTML = gp.getTitle();
			
			for (var i=1;i<=3;i++){
				this.wgs[i].render();
			}
		},
		selectAccount: function(account){
			if (L.isNull(account)){
				this.selectAccountById(null);
			}else{
				this.selectAccountById(account.id);
			}
		},
		selectAccountById: function(accountid){
			
			var reta = null;
			for (var i=1;i<=3;i++){
				var acc = this.wgs[i].selectAccount(accountid);
				if (!L.isNull(acc)){
					reta = acc;
				}
			}
			this.selectedAccount = reta;
			this.onSelectAccount(reta);
			return reta;
		},
		onSelectAccount: function(account){
			this.selectChangedEvent.fire(account);
		},
		onClickCreate: function(){
			this.clickCreateEvent.fire();
		},
		onClickGroupEdit: function(){
			this.clickGroupEditEvent.fire(this.group);
		},
		onClickEdit: function(acc){
			this.clickEditEvent.fire(acc);
		},
		onClickRemove: function(acc){
			this.clickRemoveEvent.fire(acc);
		},
		onClickGroupRemove: function(){
			this.clickGroupRemoveEvent.fire(this.group);
		}
	};
	NS.AccountListWidget = AccountListWidget;

};