/*
 @package Abricos
 @copyright Copyright (C) 2008 Abricos All rights reserved.
 @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 */
var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'uprofile', files: ['users.js']}
    ]
};
Component.entryPoint = function(NS){

    var Dom = YAHOO.util.Dom,
        E = YAHOO.util.Event,
        L = YAHOO.lang;

    var UID = Brick.env.user.id;
    var buildTemplate = this.buildTemplate;

    var RoleRowWidget = function(container, ur, cfg){
        this.init(container, ur, cfg);
    };
    RoleRowWidget.prototype = {
        init: function(container, ur, cfg){
            this.role = ur;
            this.config = cfg;
            this.helpWidget = null;

            var TM = buildTemplate(this, 'urrow'),
                div = document.createElement('div');

            var user = NS.users.get(ur.userid);

            div.innerHTML = TM.replace('urrow', {
                'uid': user.id,
                'unm': user.getUserName()
            });
            container.appendChild(div.childNodes[0]);

            var __self = this, elSel = TM.getEl('urrow.rs');
            elSel.value = ur.role;
            if (UID == user.id || cfg['readonly']){
                Dom.setStyle(elSel, 'display', 'none');
                TM.getEl('urrow.ro').innerHTML = Abricos.Language.get('mod.money.lib.account.role.' + ur.role);
            }
            E.on(elSel, 'change', function(){
                __self.updateHelp();
            });
        },
        destroy: function(){
            var el = this._TM.getEl('urrow.id');
            el.parentNode.removeChild(el);
        },
        onClick: function(el){
            if (!L.isNull(this.helpWidget)){
                if (this.helpWidget.onClick(el)){
                    return true;
                }
            }

            var tp = this._TId['urrow'];
            switch (el.id) {
                case tp['binfo']:
                    this.showHelp();
                    return true;
            }
            return false;
        },
        getSaveData: function(){
            return {
                'r': this._TM.getEl('urrow.rs').value,
                'u': this.role.userid
            };
        },
        updateHelp: function(){
            if (L.isNull(this.helpWidget)){
                return;
            }
            this.helpWidget.setRole(this.getSaveData());
        },
        showHelp: function(){
            if (!L.isNull(this.helpWidget)){
                return;
            }
            var __self = this, r = this.getSaveData();
            this.helpWidget = new NS.RoleAccountHelpWidget(this._TM.getEl('urrow.hlp'), this.config, r, function(){
                __self.closeHelp();
            });
        },
        closeHelp: function(){
            if (L.isNull(this.helpWidget)){
                return;
            }
            this.helpWidget.destroy();
            this.helpWidget = null;
        }
    };
    NS.RoleRowWidget = RoleRowWidget;

    var RoleAccountHelpWidget = function(container, cfg, r, closeCallback){
        this.init(container, cfg, r, closeCallback);
    };
    RoleAccountHelpWidget.prototype = {
        init: function(container, cfg, r, closeCallback){
            this.closeCallback = closeCallback;
            var TM = buildTemplate(this, 'help,hacc,hgroup');
            container.innerHTML = TM.replace('help', {
                'lst': TM.replace(cfg['isAccount'] ? 'hacc' : 'hgroup')
            });
            this.setRole(r);
        },
        destroy: function(){
            var el = this._TM.getEl('help.id');
            el.parentNode.removeChild(el);
        },
        setRole: function(r){
            var TM = this._TM,
                el = TM.getEl('help.wrp'), cpfx = 'rid';
            for (var i = 0; i <= 3; i++){
                Dom.removeClass(el, cpfx + i);
            }
            Dom.addClass(el, cpfx + r.r);
        },
        onClick: function(el){
            if (this._TId['help']['bclose'] == el.id){
                this.close();
                return true;
            }
            return false;
        },
        close: function(){
            NS.life(this.closeCallback, this);
        }
    };
    NS.RoleAccountHelpWidget = RoleAccountHelpWidget;

    var RoleListWidget = function(container, roles, cfg){
        cfg = L.merge({
            'readonly': false,
            'isAccount': true
        }, cfg || {});
        this.init(container, roles, cfg);
    };
    RoleListWidget.prototype = {
        init: function(container, roles, cfg){

            this.config = cfg;

            var TM = buildTemplate(this, 'urlist');
            container.innerHTML = TM.replace('urlist');

            if (cfg['readonly']){
                Dom.setStyle(TM.getEl('urlist.btns'), 'display', 'none');
            }

            this.ws = [];
            var __self = this;
            roles.foreach(function(ur){
                __self.renderRole(ur);
            });
            this.usersWidget = null;
        },
        destroy: function(){
            var ws = this.ws;
            for (var i = 0; i < ws.length; i++){
                ws[i].destroy();
            }
            var el = this._TM.getEl('urlist.id');
            el.parentNode.removeChild(el);
        },
        onClick: function(el){
            var ws = this.ws;
            for (var i = 0; i < ws.length; i++){
                if (ws[i].onClick(el)){
                    return true;
                }
            }
            var tp = this._TId['urlist'];
            switch (el.id) {
                case tp['bedit']:
                    this.showEditor();
                    return true;
                case tp['bok']:
                    this.applyEdChanges();
                    return true;
                case tp['bcancel']:
                    this.cancelEdChanges();
                    return true;
            }
            return false;
        },

        renderRole: function(ur){
            var w = new NS.RoleRowWidget(this._TM.getEl('urlist.list'), ur, this.config);
            this.ws[this.ws.length] = w;
            return w;
        },

        getSaveData: function(){
            var ws = this.ws, sd = [];
            for (var i = 0; i < ws.length; i++){
                sd[sd.length] = ws[i].getSaveData();
            }
            return sd;
        }
    };
    NS.RoleListWidget = RoleListWidget;

};