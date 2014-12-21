var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sys', files: ['form.js']},
        {name: '{C#MODNAME}', files: ['accounteditor.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.GroupEditorWidget = Y.Base.create('groupEditorWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance, options){
            this.set('waiting', true);

            this.get('appInstance').groupList(function(err, result){
                this.set('waiting', false);
                if (!err){
                    this.set('groupList', result.groupList);
                }
                // this.renderGroup();
            }, this);
        }
        /*,
        renderGroupList: function(){
            var groupList = this.get('groupList');
            if (!groupList){
                return;
            }
            var tp = this.template, lst = "";

            groupList.each(function(group){
                var attrs = group.toJSON();

                lst += tp.replace('row', [
                    attrs
                ]);
            });

            tp.gel('list').innerHTML = tp.replace('list', {
                'rows': lst
            });
        },
        onClick: function(e){
            var groupId = e.target.getData('id') | 0;
            if (groupId === 0){
                return;
            }

            switch (e.dataClick) {
                case 'group-edit':
                    this.showGroupEditorDialog(groupId);
                    return true;
            }
        }
        /**/
    }, {
        ATTRS: {
            component: {
                value: COMPONENT
            },
            templateBlockName: {
                value: 'widget'
            },
            groupId: {
                value: 0
            }
        }
    });

    NS.GroupEditorWidget.parseURLParam = function(args){
        var groupId = args && (args[0]|0);
        return {
            groupId: groupId
        };
    };

    var Dom = YAHOO.util.Dom,
        E = YAHOO.util.Event,
        L = YAHOO.lang;

    var buildTemplate = this.buildTemplate;

    var GroupEditorFormWidget = function(container, group){
        this.init(container, group);
    };
    GroupEditorFormWidget.prototype = {
        init: function(container, group){
            this.group = group;
            var TM = buildTemplate(this, 'editor'),
                gel = function(n){
                    return TM.getEl('editor.' + n);
                };
            container.innerHTML = TM.replace('editor');

            gel('tl').value = group.title;

            if (!group.isAdminRole()){
                gel('tl').disabled = 'disabled';
            }

            this.rolesWidget = new NS.RoleListWidget(gel('ulst'), group.roles, {
                'readonly': !group.isAdminRole(),
                'isAccount': false
            });
            this.accountsWidget = new NS.AccountEditorListWidget(gel('accountlist'), group);
        },
        destroy: function(){
        },
        onClick: function(el){
            if (this.rolesWidget.onClick(el)){
                return true;
            }
            return false;
        },
        getSaveData: function(){
            var sd = {
                'id': this.group.id,
                'tl': this._TM.getEl('editor.tl').value,
                'roles': this.rolesWidget.getSaveData(),
                'accounts': this.accountsWidget.getSaveData()
            };
            return sd;
        }
    };
    NS.GroupEditorFormWidget = GroupEditorFormWidget;

    var GroupEditorWidget = function(container, groupid){
        groupid = groupid || 0;
        this.init(container, groupid);
    };
    GroupEditorWidget.prototype = {
        init: function(container, groupid){

            var group = NS.moneyManager.groups.get(groupid);
            if (L.isNull(group)){
                group = NS.moneyManager.createGroup();
            }
            this.group = group;

            var TM = buildTemplate(this, 'widget'),
                gel = function(n){
                    return TM.getEl('widget.' + n);
                };

            container.innerHTML = TM.replace('widget', {
                'gstclass': group.id > 0 ? 'isgedit' : 'isgnew'
            });

            this.widget = new GroupEditorFormWidget(gel('editor'), group);

            var __self = this;
            E.on(container, 'click', function(e){
                var el = E.getTarget(e);
                if (__self.onClick(el)){
                    E.preventDefault(e);
                }
            });

            if (group.isEditRole() || group.isCreateAccountRole()){
                Dom.setStyle(gel('bsave'), 'display', '');
                Dom.setStyle(gel('bcancel'), 'display', '');
                Dom.setStyle(gel('bclose'), 'display', 'none');
            } else {
                Dom.setStyle(gel('bsave'), 'display', 'none');
                Dom.setStyle(gel('bcancel'), 'display', 'none');
                Dom.setStyle(gel('bclose'), 'display', '');
            }

        },
        destroy: function(){
            this.widget.destroy();
        },
        onClick: function(el){
            if (this.widget.onClick(el)){
                return true;
            }
            var tp = this._TId['widget'];
            switch (el.id) {
                case tp['bclose']:
                case tp['bcancel']:
                    this.close();
                    return true;

                case tp['bcreate']:
                case tp['bsave']:
                    this.save();
                    return true;
            }
            return false;
        },
        save: function(){
            var sd = this.widget.getSaveData();
            NS.moneyManager.groupSave(sd, function(groupid){
                Brick.Page.reload(NS.navigator.group.view(groupid));
            });
        },
        close: function(){
            var groupid = this.group.id;
            if (groupid == 0){
                Brick.Page.reload(NS.navigator.ws);
            } else {
                Brick.Page.reload(NS.navigator.group.view(groupid));
            }
        }
    };


};