var Component = new Brick.Component();
Component.requires = {};
Component.entryPoint = function(NS){

    var GroupByIdExt = function(){
    };
    GroupByIdExt.NAME = 'groupByIdExt';
    GroupByIdExt.ATTRS = {
        groupid: {value: 0},
        group: {
            readOnly: true,
            getter: function(){
                var groupList = this.get('groupList'),
                    groupid = this.get('groupid');
                if (!groupList){
                    return null;
                }
                return groupList.getById(groupid);
            }
        },
        groupList: {},
        accountList: {},
        firstAccount: {
            readOnly: true,
            getter: function(){
                var groupid = this.get('groupid'),
                    first = null;

                this.get('accountList').each(function(account){
                    if (!first && account.get('groupid') === groupid){
                        first = account;
                    }
                }, this);
                return first;
            }
        }
    };
    GroupByIdExt.prototype = {
        onInitAppWidget: function(err, appInstance, options){
            options = options || {};
            options.arguments = options.arguments || [];
            this.onBeforeLoadGroupData(err, appInstance, options.arguments[0]);
            this.set('waiting', true);
            appInstance.groupList(function(err, result){
                this.set('waiting', false);
                if (!err){
                    this.set('groupList', appInstance.get('groupList'));
                    this.set('accountList', appInstance.get('accountList'));
                }
                var group = this.get('group');
                this.onLoadGroupData(err, group, options.arguments[0]);
            }, this);
        },
        onBeforeLoadGroupData: function(){
        },
        onLoadGroupData: function(err, group){
        },
    }
    NS.GroupByIdExt = GroupByIdExt;

    var SelectedAccountExt = function(){
    };
    SelectedAccountExt.NAME = 'selectedAccountExt';
    SelectedAccountExt.ATTRS = {
        selectedAccount: {
            setter: function(val){
                if (Y.Lang.isNumber(val)){
                    val = this.get('accountList').getById(val);
                }
                return val;
            },
            getter: function(val){
                if (!val){
                    val = this.get('firstAccount');
                }
                return val;
            }
        }
    };
    SelectedAccountExt.prototype = {
        getFirstAccount: function(){
            return this.get('accountList').item(0);
        }
    }
    NS.SelectedAccountExt = SelectedAccountExt;

    var KeyPressExt = function(){
    };
    KeyPressExt.NAME = 'keyPressExt';
    KeyPressExt.prototype = {
        initializer: function(){
            this.get('boundingBox').on('keypress', function(e){
                if (this.onKeyPress(e)){
                    e.halt();
                }
            }, this);
        },
        onKeyPress: function(){
        }
    }
    NS.KeyPressExt = KeyPressExt;

};