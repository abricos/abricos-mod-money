'use strict';

var Abricos = require('abricos-rest');
var helper = Abricos.helper;
var should = require('should');

describe('Money Module', function(){

    var moneyModule;
    var userTestAPI;

    beforeEach(function(done){
        var api = new Abricos.API();
        var userModule = api.getModule('user');
        userTestAPI = userModule.testAPI();

        moneyModule = api.getModule('money');
        done();
    });

    it('should registered new user', function(done){
        userTestAPI.registration(function(err, user){
            should.not.exist(err);
            should.exist(user);
            done();
        });
    });

    it('should get an empty account list', function(done){
        moneyModule.accountList(function(err, accountList){
            done();
        });
    });


    it('should updated group info');
    it('should remote group');
});
