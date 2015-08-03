'use strict';

var DEFAULT_OPTIONS = {
    id: 'module-money',
    log: {
        console: {
            label: '<%= ^.log.console.label %>.money'
        }
    }
};

var MONEY = 'money';

function APIModule(api, options){
    var config = api.config;

    this.config = config.instance([DEFAULT_OPTIONS, options]);

    this.api = api;

    this.name = 'money';
};

APIModule.prototype.logger = function(){
    return this.config.logger();
};


APIModule.prototype.accountList = function(callback){
    var logger = this.logger();

    var reqData = {
        do: 'accountList'
    };
    logger.debug('Account List');
    this.api.post(MONEY, reqData, function(err, result){
        if (err){
            return callback(err, null);
        }

        /*
        if (result.err && result.err > 0){
            var message = 'Unknown error saving group';
            switch (result.err) {
                case 1:
                    message = '';
                    break;
            }

            err = new Error(message);
            err.code = result.err;
            return callback(err, null);
        }
        /**/

        return callback(null, result.accountList);
    });
};
/**/

/*APIModule.prototype.groupSave = function(groupData){
 var logger = this.logger();

 var groupData = {
 do: 'groupSave',
 groupData: groupData
 };
 logger.debug('Saving group');
 this.api.post(MONEY, data, function(err, result){
 if (err){
 return callback(err, null);
 }

 if (result.err && result.err > 0){
 var message = 'Unknown error saving group';
 switch (result.err) {
 case 1:
 message = '';
 break;
 }

 err = new Error(message);
 err.code = result.err;
 return callback(err, null);
 }

 return callback(null, result.groupData);
 });
 };
 /**/
APIModule.prototype.groupSave = function(groupData){
    var logger = this.logger();

    var groupData = {
        do: 'groupSave',
        groupData: groupData
    };
    logger.debug('Saving group');
    this.api.post(MONEY, data, function(err, result){
        if (err){
            return callback(err, null);
        }

        if (result.err && result.err > 0){
            var message = 'Unknown error saving group';
            switch (result.err) {
                case 1:
                    message = '';
                    break;
            }

            err = new Error(message);
            err.code = result.err;
            return callback(err, null);
        }

        return callback(null, result.groupData);
    });
};
/**/

module.exports = function(api, options){
    return new APIModule(api, options);
};

module.exports.APIModule = APIModule;