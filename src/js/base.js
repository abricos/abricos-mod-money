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
    };
    GroupByIdExt.prototype = {
        onInitAppWidget: function(err, appInstance){
            this.onBeforeLoadGroupData();
            this.set('waiting', true);
            appInstance.groupList(function(err, result){
                this.set('waiting', false);
                if (!err){
                    this.set('groupList', result.groupList);
                    this.set('accountList', result.accountList);
                }
                var group = this.get('group');
                this.onLoadGroupData(err, group);
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
                    val = this.getFirstAccount();
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

};