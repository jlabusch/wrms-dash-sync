var assert = require('assert'),
    testlib= require('wrms-dash-test-lib'),
    should = require('should'),
    naming = require('../lib/data_sync_naming'),
    util = require('wrms-dash-util');

describe('data_sync_naming', function(){
    describe('creating names', function(){
        it('should create standard monthly names', function(done){
            naming.create_budget_name({name: 'X Y'}, 'monthly', '2017-10').should.equal('X Y monthly 2017-10');
            done();
        });
    });
    describe('matching names', function(){
        it('should match annual budgets', function(done){
            naming.match_non_monthly_budget_name('X Y annual 2017-3 to 2017-12', {period: '2017-10'}).should.equal(true);
            naming.match_non_monthly_budget_name('X Y annual 2017-3 to 2017-12', {period: '2017-2'}).should.equal(false);
            done();
        });
        it('should match biannual budgets', function(done){
            naming.match_non_monthly_budget_name('X Y biannual 2017-3 to 2017-12', {period: '2017-10'}).should.equal(true);
            naming.match_non_monthly_budget_name('X Y biannual 2017-3 to 2017-12', {period: '2017-2'}).should.equal(false);
            done();
        });
        it('should fail garbage input', function(done){
            naming.match_non_monthly_budget_name('hello world', {period: '2017-10'}).should.equal(false);
            done();
        });
    });
});
