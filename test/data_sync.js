var assert  = require('assert'),
    testlib = require('wrms-dash-test-lib'),
    should  = require('should'),
    sync_db = require('../lib/data_store_dbs').active(),
    sync    = require('../lib/data_sync'),
    promise = require('../lib/data_store_promise'),
    //wrms    = require('wrms-dash-db').db,
    util    = require('wrms-dash-util');

function FakeDB(){
    let sqlite3 = require('sqlite3');
    this.sqlite = new sqlite3.Database(':memory:', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
}

FakeDB.prototype.query = function(){
    let args = Array.prototype.slice.call(arguments, 0),
        query_name = args.shift(),
        ctx = args.pop();

    return new Promise((resolve, reject) => {
        args.push(function(err, data){
            if (err){
                reject(err);
            }else{
                resolve(data);
            }
        });

        this.sqlite.all.apply(this.sqlite, args);
    });
}

describe('data_sync', function(){
    describe.skip('process_wrms_data', function(){
        //wrms.__test_override(new FakeDB());
        //espo.__test_override([]);

        it('should', function(done){
            let contract = testlib.get_test_org({org_id: 100}),
                resolve = (data) => {
                    done();
                },
                reject = (err) => {
                    should.not.exist(err);
                    done();
                };

            // FINISH ME

            sync.__test.create_contract(sync_db, contract)
                .then(
                    sync.__test.fetch_wrs_from_wrms(resolve, reject, contract),
                    reject
                );
        });
    });
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
        it('should succeed trivially', function(done){
            util.send_post.__test_hook = function(state){
                process.nextTick(function(){
                    should.exist(state.data);
                    state.next(null, state.data);
                    done();
                });
            }
            sync.__test.push_org_data();
        });
    });
});

