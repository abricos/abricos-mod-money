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