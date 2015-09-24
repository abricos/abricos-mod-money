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
        groupList: {
            readOnly: true,
            getter: function(){
                var app = this.get('appInstance');
                if (!app){
                    return null;
                }
                return app.get('groupList');
            }
        },
        accountList: {
            readOnly: true,
            getter: function(){
                var app = this.get('appInstance');
                if (!app){
                    return null;
                }
                return app.get('accountList');
            }
        },
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

    var OperLogExt = function(){
    };
    OperLogExt.NAME = 'operLogExt';
    OperLogExt.ATTRS = {
        fromDate: {
            setter: function(val){
                this.set('period', [val, this.get('endDate')]);
            },
            getter: function(){
                return this.get('period')[0];
            }
        },
        endDate: {
            setter: function(val){
                this.set('period', [this.get('fromDate'), val]);
            },
            getter: function(){
                return this.get('period')[1];
            }
        },
        period: {
            validator: function(val){
                return (Y.Lang.isArray(val) &&
                val.length == 2 &&
                (val[0] instanceof Date) && (val[1] instanceof Date));
            }
        },
        operList: {value: null},
        operMoveList: {value: null},
    };
    OperLogExt.prototype = {
        onBeforeLoadGroupData: function(err, appInstance){
            this.on('periodChange', this._onPeriodChange, this);
        },
        onLoadGroupData: function(err, group, options){
            this.reloadOperList();
            this.get('appInstance').on('appResponses', this._onAppResponses, this);
        },
        destructor: function(){
            this.get('appInstance').detach('appResponses', this._onAppResponses, this);
        },
        _onAppResponses: function(e){
            if (e.err || !e.result.balanceList){
                return;
            }
            this.reloadOperList(null, true);
        },
        _onPeriodChange: function(e){
            this.reloadOperList(e.newVal);
        },
        reloadOperList: function(period, isUpdate){
            period = period || this.get('period');
            var config = {
                    groupid: this.get('groupid'),
                    period: [period[0] / 1000, period[1] / 1000]
                },
                operList = this.get('operList'),
                operMoveList = this.get('operMoveList');

            isUpdate = isUpdate && operList;

            if (isUpdate){
                var lastUpdate = 0;
                operList.each(function(oper){
                    lastUpdate = Math.max(lastUpdate, oper.get('upddate'));
                });
                config.upddate = lastUpdate;
            }

            this.set('waiting', true);
            this.get('appInstance').operList(config, function(err, result){
                this.set('waiting', true);
                if (!err){
                    if (isUpdate){
                        operList.add(result.operList);
                        operMoveList.add(result.operMoveList); // TODO: update list if not new records
                    } else {
                        this.set('operList', result.operList);
                        this.set('operMoveList', result.operMoveList);
                    }
                    this.renderOperList();
                }
            }, this);
        },
    };
    NS.OperLogExt = OperLogExt;

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