var assert  = require('assert'),
    testlib = require('wrms-dash-test-lib'),
    should  = require('should'),
    store   = require('../lib/data_store'),
    promise = require('../lib/data_store_promise'),
    util    = require('wrms-dash-util');

describe('data_store', function(){
    describe('init', function(){
        it('should create schemas', function(done){
            store.init(() => { done(); });
        });
        it('should perform a trivial query', function(done){
            store.internal_query('select 1', (err, rows) => {
                (!!err).should.equal(false);
                Array.isArray(rows).should.equal(true);
                rows[0]["1"].should.equal(1);
                done();
            });
        });
    });
});

