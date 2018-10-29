var assert  = require('assert'),
    testlib = require('wrms-dash-test-lib'),
    should  = require('should'),
    sync    = require('../lib/data_sync'),
    promise = require('../lib/data_store_promise'),
    util    = require('wrms-dash-util');

describe('data_sync', function(){
    describe('push_org_data', function(){
        it('should fail gracefully', function(done){
            util.send_post.__test_hook = function(state){
                process.nextTick(function(){
                    state.next(new Error('send_post test error'));
                    done();
                });
            }
            sync.__test.push_org_data();
        });
    });
});

