/*
 @version $Id$
 @package Abricos
 @copyright Copyright (C) 2008 Abricos All rights reserved.
 @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 */

var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: '{C#MODNAME}', files: ['lib.js']}
    ]
};
Component.entryPoint = function(NS){

    var Dom = YAHOO.util.Dom,
        E = YAHOO.util.Event,
        L = YAHOO.lang,
        R = NS.roles;

    var buildTemplate = this.buildTemplate;

    var WSMenuWidget = function(container, callback){
        this.init(container, callback);
    };
    WSMenuWidget.prototype = {
        init: function(container, callback){

            var nav = NS.navigator;

            buildTemplate(this, 'gbmenu,gmitemhome,gmitem');
            container.innerHTML = this._TM.replace('gbmenu', {
                'url': nav.ws,
                'urlabout': nav.about,
                'urlgroupnew': nav.group.create
            });
            var __self = this;
            NS.initMoneyManager(function(mgr){
                __self.onInitMoneyManager(mgr);
                NS.life(callback(mgr));
            });
        },
        onInitMoneyManager: function(mgr){
            this.renderItems();
            this.selectGroupMItem(0);
            mgr.groupCreatedEvent.subscribe(this.onGroupChanged, this, true);
            mgr.groupChangedEvent.subscribe(this.onGroupChanged, this, true);
            mgr.groupRemovedEvent.subscribe(this.onGroupRemoved, this, true);
        },
        destroy: function(){
            NS.moneyManager.groupCreatedEvent.unsubscribe(this.onGroupChanged);
            NS.moneyManager.groupChangedEvent.unsubscribe(this.onGroupChanged);
            NS.moneyManager.groupRemovedEvent.unsubscribe(this.onGroupRemoved);
        },
        onGroupChanged: function(){
            this.renderItems();
        },
        onGroupRemoved: function(){
            this.renderItems();
        },
        setParam: function(bosapp, page){
            this.bosapp = bosapp;
            this.page = page;
            this.render();
        },
        renderItems: function(){
            var TM = this._TM, lst = "", isFirst = true;
            lst += TM.replace('gmitemhome', {
                'url': NS.navigator.ws
            });
            NS.moneyManager.groups.foreach(function(group){
                lst += TM.replace('gmitem', {
                    'id': group.id,
                    'tl': group.getTitle(),
                    'class': isFirst ? 'active' : '',
                    'url': NS.navigator.group.view(group.id)
                });
                isFirst = false;
            });
            TM.getEl('gbmenu.mhome').innerHTML = lst;
        },
        selectMItem: function(sItem){
            var TM = this._TM, items = ['home', 'newgroup', 'about'];
            for (var i = 0; i < items.length; i++){
                var item = items[i], el = TM.getEl('gbmenu.gm' + item);
                if (item == sItem){
                    Dom.addClass(el, 'sel');
                } else {
                    Dom.removeClass(el, 'sel');
                }
            }
        },
        selectGroupMItem: function(gid){
            var TM = this._TM, TId = this._TId,
                els = TM.getEl('gbmenu.mhome').childNodes;

            for (var i = 0; i < els.length; i++){
                Dom.removeClass(els[i], 'active');
            }
            if (gid == 0){
                Dom.addClass(TM.getEl('gmitemhome.id'), 'active');
            } else {
                Dom.addClass(TId['gmitem']['id'] + '-' + gid, 'active');
            }
        },
        selectMItemByUri: function(wName, p1){
            var mitem = '', gid = 0;
            switch (wName) {
                case 'GroupEditWidget':
                    if (p1 > 0){
                        gid = p1;
                        mitem = 'home';
                    } else {
                        mitem = 'newgroup';
                    }
                    break;
                case 'GroupViewWidget':
                    mitem = 'home';
                    gid = p1;
                    break;
                case 'AboutWidget':
                    mitem = 'about';
                    break;
            }
            this.selectGroupMItem(gid);
            this.selectMItem(mitem);
        }
    };
    NS.WSMenuWidget = WSMenuWidget;

    var WSPageWidget = function(container, wid, classWidget, p1, p2, p3, p4, p5){
        this.init(container, wid, classWidget, p1, p2, p3, p4, p5);
    };
    WSPageWidget.prototype = {
        init: function(container, wid, classWidget, p1, p2, p3, p4, p5){
            var TM = buildTemplate(this, 'page');
            container.innerHTML += TM.replace('page');

            this.id = wid;
            this.widget = new classWidget(TM.getEl('page.id'), p1, p2, p3, p4, p5);
        },
        destroy: function(){
            this.widget.destroy();

            var el = this._TM.getEl('page.id');
            el.parentNode.removeChild(el);
        }
    };
    NS.WSPageWidget = WSPageWidget;


    var HomeWidget = function(container){
        this.init(container);
    };
    HomeWidget.prototype = {
        init: function(container){
            buildTemplate(this, 'home');
            container.innerHTML = this._TM.replace('home');

            var uri = NS.navigator.group.create,
                group = NS.moneyManager.groups.getByIndex(0);

            if (!L.isNull(group)){
                uri = NS.navigator.group.view(group.id);
            }
            Brick.Page.reload(uri);
        },
        destroy: function(){
            var el = this._TM.getEl('home.id');
            el.parentNode.removeChild(el);
        }
    };
    NS.HomeWidget = HomeWidget;

    var AccessDeniedWidget = function(container){
        this.init(container);
    };
    AccessDeniedWidget.prototype = {
        init: function(container){
            buildTemplate(this, 'accessdenied');
            container.innerHTML = this._TM.replace('accessdenied');
        },
        destroy: function(){
            var el = this._TM.getEl('accessdenied.id');
            el.parentNode.removeChild(el);
        }
    };
    NS.AccessDeniedWidget = AccessDeniedWidget;


    var WSPanel = function(pgInfo){
        this.pgInfo = pgInfo || [];

        WSPanel.superclass.constructor.call(this, {
            fixedcenter: true, width: '790px', height: '400px'
        });
    };
    YAHOO.extend(WSPanel, Brick.widget.Panel, {
        initTemplate: function(){
            buildTemplate(this, 'panel');
            return this._TM.replace('panel');
        },
        onLoad: function(){
            var __self = this;

            this.widget = null;

            this.gmenu = new NS.WSMenuWidget(this._TM.getEl('panel.gmenu'), function(){
                __self.showPage(__self.pgInfo);
            });
        },
        destroy: function(){
        },
        showPage: function(p){
            p = L.merge({
                'component': 'wspace',
                'wname': 'HomeWidget',
                'p1': '', 'p2': '', 'p3': ''
            }, p || {});

            if (L.isNull(NS.moneyManager)){
                return;
            }

            if ((!R.isView || Brick.env.user.id == 0) && p['wname'] != 'AboutWidget'){
                if (p['wname'] != 'AccessDeniedWidget'){
                    var uri = NS.navigator.accessdenied;
                    Brick.Page.reload(uri);
                    return;
                }
                // p['wname'] = 'AccessDeniedWidget';
            }

            var __self = this, TM = this._TM, gel = function(n){
                return TM.getEl('panel.' + n);
            };
            Dom.setStyle(gel('board'), 'display', 'none');
            Dom.setStyle(gel('loading'), 'display', '');

            Brick.ff('{C#MODNAME}', p['component'], function(){
                __self._showPageMethod(p);
                Dom.setStyle(gel('board'), 'display', '');
                Dom.setStyle(gel('loading'), 'display', 'none');
            });
        },
        _showPageMethod: function(p){

            var wName = p['wname'];
            if (!NS[wName]){
                return;
            }


            if (!L.isNull(this.widget)){
                this.widget.destroy();
                this.widget = null;
            }
            var TM = this._TM, gel = function(n){
                return TM.getEl('panel.' + n);
            };
            gel('board').innerHTMl = "";

            this.widget = new NS[wName](gel('board'), p['p1'], p['p2'], p['p3']);

            this.gmenu.selectMItemByUri(wName, p['p1']);
        }
    });
    NS.WSPanel = WSPanel;

    var activeWSPanel = null;
    NS.API.ws = function(){
        var args = arguments;
        var pgInfo = {
            'component': args[0] || 'wspace',
            'wname': args[1] || 'HomeWidget',
            'p1': args[2], 'p2': args[3], 'p3': args[4]
        };
        if (L.isNull(activeWSPanel) || activeWSPanel.isDestroy()){
            activeWSPanel = new WSPanel(pgInfo);
        } else {
            activeWSPanel.showPage(pgInfo);
        }
        return activeWSPanel;
    };

};