/*
 * Copyright (c) 2014 Alexander Kuzmin <roosit@abricos.org>
 * Licensed under the MIT license.
 */

'use strict';

var DEFAULT_OPTIONS = {
    id: 'money',
    log: {
        console: {
            label: '<%= ^.log.console.label %>.money'
        }
    }
};

function APIModule(api, options){
    var config = api.config;

    options = config.merge(DEFAULT_OPTIONS, options || {});

    this.config = config.instance(options);

    this.api = api;

    this.name = 'money';
};
APIModule.prototype = {
    logger: function(){
        return this.config.logger();
    }
};

module.exports = function(api, options){
    return new APIModule(api, options);
};

module.exports.APIModule = APIModule;