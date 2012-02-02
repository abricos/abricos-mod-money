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

	var LNG = Brick.util.Language.geta(['mod', '{C#MODNAME}']);
	
	var buildTemplate = this.buildTemplate;
	
	var CurrencySelectWidget = function(container, ccid, cfg){
		ccid = ccid || 'RUB';
		cfg = L.merge({
			'readonly': false,
			'select': '',
			'filter': null,
			'mode': 0 // 0 - сокращение, 1 - название, 2 - код+название
		}, cfg || {});
		this.init(container, ccid, cfg);
	};
	CurrencySelectWidget.prototype = {
		init: function(container, ccid, cfg){
			var TM = buildTemplate(this, 'select,row'), lst = '';
			
			NS.currencyList.foreach(function(cc){
				var tl = cc.sign;
				lst += TM.replace('row', {
					'id': cc.id, 
					'tl': tl
				});
			});
			container.innerHTML = TM.replace('select', {'rows': lst});
			this.setValue(ccid);
			if (cfg['readonly']){
				TM.getEl('select.id').disabled = 'disabled';
			}
		},
		destroy: function(){},
		getValue: function(){
			return this._TM.getEl('select.id').value;
		},
		setValue: function(val){
			this._TM.getEl('select.id').value = val;
		}
	};
	NS.CurrencySelectWidget = CurrencySelectWidget;
};