/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = { 
	mod:[
        {name: '{C#MODNAME}', files: ['userrole.js', 'currency.js']}
	]		
};
Component.entryPoint = function(NS){

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;

	var LNG = Brick.util.Language.geta(['mod', '{C#MODNAME}']);
	var buildTemplate = this.buildTemplate;
	
	var AccountEditorRowWidget = function(container, account, isFirst, callbackRemove){
		this.init(container, account, isFirst, callbackRemove);
	};
	AccountEditorRowWidget.prototype = {
		init: function(container, account, isFirst, callbackRemove){
			this.account = account;
			this.callbackRemove = callbackRemove;
			
			var TM = buildTemplate(this, 'row'),
				div = document.createElement('div');

			div.innerHTML = TM.replace('row');
			
			var el = div.childNodes[0];
			if (isFirst && container.childNodes.length > 0){
				Dom.insertBefore(el, container.childNodes[0]);
			}else{
				container.appendChild(el);
			}
			
			this.rolesWidget = new NS.RoleListWidget(TM.getEl('row.ulst'), account.roles, {
				'readonly': !account.isAdminRole()
			});
			this.currencyWidget = new NS.CurrencySelectWidget(TM.getEl('row.cc'), account.currency.id, {
				'readonly': !account.isAdminRole()
			});
			if (!L.isFunction(callbackRemove) || !account.isEditRole()){
				var el = this._TM.getEl('row.bremove');
				el.parentNode.removeChild(el);
			}

			var gel = function(n){ return TM.getEl('row.'+n);};
			gel('tp').value = account.type;
			gel('tl').value = account.title;
			gel('dsc').value = account.descript;
			gel('bc').value = account.initBalance;
			
			if (!account.isAdminRole()){
				gel('tp').disabled = 'disabled';
				gel('tl').disabled = 'disabled';
				gel('dsc').disabled = 'disabled';
				gel('bc').disabled = 'disabled';
			}
		},
		destroy: function(){
			this.rolesWidget.destroy();
			this.currencyWidget.destroy();
			
			var el = this._TM.getEl('row.id');
			el.parentNode.removeChild(el);
		},
		onClick: function(el){
			if (this.rolesWidget.onClick(el)){ return true; }
			var tp = this._TId['row'];
			switch(el.id){
			case tp['bremove']: this.onRemoveWidget(); return true;
			}
			return false;
		},
		getSaveData: function(){
			var TM = this._TM, gel = function(n){ return TM.getEl('row.'+n);};
			var sd = {
				'id': this.account.id,
				'tp': gel('tp').value,
				'tl': gel('tl').value,
				'dsc': gel('dsc').value,
				'ibc': gel('bc').value,
				'cc': this.currencyWidget.getValue(),
				'roles': this.rolesWidget.getSaveData()
			};
			return sd;
		},
		onRemoveWidget: function(){
			if (!L.isFunction(this.callbackRemove)){ return; }
			this.callbackRemove(this);
		}
	};
	NS.AccountEditorRowWidget = AccountEditorRowWidget;
	
	var AccountEditorWidget = function(container, account, closeCallback){
		this.init(container, account, closeCallback);
	};
	AccountEditorWidget.prototype = {
		init: function(container, account, closeCallback){
			this.closeCallback = closeCallback;
			var TM = buildTemplate(this, 'editor');
			container.innerHTML = TM.replace('editor', {
				'stclass': account.id > 0 ? 'isedit' : 'isnew'
			});
			
			var __self = this;
			E.on(container, 'click', function(e){
                var el = E.getTarget(e);
                if (__self.onClick(el)){ E.preventDefault(e); }
            });
			
			this.edWidget = null;
			this.setAccount(account);
		},
		destroy: function(){
			this.edWidget.destroy();
			var el = this._TM.getEl('editor.id');
			el.parentNode.removeChild(el);
		},
		setAccount: function(account){
			this.account = account;
			if (!L.isNull(this.edWidget)){
				this.edWidget.destroy();
			}
			var TM = this._TM, gel = function(n){return TM.getEl('editor.'+n);};
			this.edWidget =  
				new NS.AccountEditorRowWidget(gel('editor'), account, true, null);
			
			if (account.isAdminRole()){
				Dom.setStyle(gel('bsave'), 'display', '');
				Dom.setStyle(gel('bcancel'), 'display', '');
				Dom.setStyle(gel('bclose'), 'display', 'none');
			}else{
				Dom.setStyle(gel('bsave'), 'display', 'none');
				Dom.setStyle(gel('bcancel'), 'display', 'none');
				Dom.setStyle(gel('bclose'), 'display', '');
			}
			
		},
		onClick: function(el){
			if (this.edWidget.onClick(el)){ return true; }
			var tp = this._TId['editor'];
			switch(el.id){
			case tp['bsave']: this.save(); return true;
			case tp['bclose']: 
			case tp['bcancel']: 
				this.cancel(); return true;
			}
			return false;
		},
		cancel: function(){
			NS.life(this.closeCallback, false);
		},
		save: function(){
			var TM = this._TM,
				gel = function(n){return TM.getEl('editor.'+n);},
				sd = this.edWidget.getSaveData(),
				__self = this;
			
			sd['gid'] = this.account.groupid;
			
			Dom.setStyle(gel('pcsave'), 'display', '');
			gel('bsave').disabled = 'disabled';
			gel('bcancel').disabled = 'disabled';
			
			NS.moneyManager.accountSave(sd, function(){
				NS.life(__self.closeCallback, true);
			});
		}
	};
	NS.AccountEditorWidget = AccountEditorWidget;
	
	var AccountEditorListWidget = function(container, group){
		this.init(container, group);
	};
	AccountEditorListWidget.prototype = {
		init: function(container, group){
			this.group = group;
			
			var TM = buildTemplate(this, 'widget');
			container.innerHTML = TM.replace('widget');
			
			var __self = this;
			E.on(container, 'click', function(e){
                var el = E.getTarget(e);
                if (__self.onClick(el)){ E.preventDefault(e); }
            });
			
			var isFirst = false;
			if (!group.isCreateAccountRole()){
				Dom.setStyle(TM.getEl('widget.bslst'), 'display', 'none');
				isFirst = true;
			}

			this.ws = [];
			var __self = this;
			group.accounts.foreach(function(acc){
				__self.renderAccount(acc, isFirst);
				isFirst = false;
			});
		},
		destroy: function(){
			this._clearws();
		},
		onClick: function(el){
			var ws = this.ws;
			for (var i=0;i<ws.length;i++){
				if (ws[i].onClick(el)){ return true; }
			}
			var tp = this._TId['widget'];
			switch(el.id){
			case tp['bcreate']: this.createAccount(); return true;
			}
			return false;
		},
		_clearws: function(){
			for (var i=0;i<this.ws.length;i++){
				this.ws[i].destroy();
			}
			this.ws = [];
		},
		createAccount: function(){
			var acc = this.group.createAccount();
			this.renderAccount(acc, true);
		},
		renderAccount: function(acc, isFirst){
			var __self = this;
			var w = 
				new NS.AccountEditorRowWidget(this._TM.getEl('widget.list'), acc, isFirst, function(wd){
					__self.accountRemove(wd.account);
				});
			
			this.ws[this.ws.length] = w;
			return w;
		},
		getSaveData: function(){
			var ws = this.ws, sd = [];
			for (var i=0;i<ws.length;i++){
				sd[sd.length] = ws[i].getSaveData();
			}
			return sd;
		},
		accountRemove: function(acc){
			var ws = this.ws, nws = [];
			for (var i=0;i<ws.length;i++){
				if (ws[i].account != acc){
					nws[nws.length] = ws[i];
				}else {
					ws[i].destroy();
				}
			}
			this.ws = nws;
		}
	};
	NS.AccountEditorListWidget = AccountEditorListWidget;

};