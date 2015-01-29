'use strict';

var Abricos = require('abricos-rest');
var should = require('should');

describe('Money Module', function(){

    var userModule,
        moneyModule;

    beforeEach(function(done){
        var api = new Abricos.API();
        userModule = api.getModule('user');
        moneyModule = api.getModule('money');

        done();
    });

    it('Guest user info', function(done){
        done();
    });
});
