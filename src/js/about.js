/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2008-2011 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.entryPoint = function(NS){
	
	var TMG = this.template,
		initCSS = false,
		buildTemplate = function(w, ts){
		if (!initCSS){
			Brick.util.CSS.update(Brick.util.CSS['{C#MODNAME}']['{C#COMNAME}']);
			delete Brick.util.CSS['{C#MODNAME}']['{C#COMNAME}'];
			initCSS = true;
		}
		w._TM = TMG.build(ts); w._T = w._TM.data; w._TId = w._TM.idManager;
		return w._TM;
	};
	
	var AboutWidget = function(container){
		this.init(container);
	};
	AboutWidget.prototype = {
		init: function(container){
			buildTemplate(this, 'widget');
			container.innerHTML = this._TM.replace('widget');
		},
		destroy: function(){
			var el = this._TM.getEl('widget.id');
			el.parentNode.removeChild(el);
		}
	};
	NS.AboutWidget = AboutWidget;

};