var assert  = require('assert'),
    testlib = require('wrms-dash-test-lib'),
    should  = require('should'),
    dsu     = require('../lib/data_sync_utils'),
    promise = require('../lib/data_store_promise'),
    util    = require('wrms-dash-util');

describe('data_sync_utils', function(){
    describe.skip('add_quote', function(){
    });
    describe.skip('quote_is_valid', function(){
    });
    describe.skip('modify_budget_for_quote', function(){
    });
    describe.skip('find_last_row_for_this_wr', function(){
    });
    describe('make_budget_name_and_increment_date', function(){
        it('should handle monthly types', function(done){
            let d       = new Date('2018-03-01'),
                acme    = testlib.cp(testlib.get_test_org({org_id:100}));

            acme.type = 'monthly';

            d.getMonth().should.equal(2);
            let [_, k]  = dsu.__testonly.make_budget_name_and_increment_date(acme, d);
            k.should.equal(acme.name + ' month 2018-3');
            d.getMonth().should.equal(3);
            done();
        });
        it('should handle 6 monthly types', function(done){
            let d       = new Date('2018-03-01'),
                acme    = testlib.cp(testlib.get_test_org({org_id:100}));

            acme.type = '6 monthly';

            d.getMonth().should.equal(2);
            let [_, k]  = dsu.__testonly.make_budget_name_and_increment_date(acme, d);
            k.should.equal(acme.name + ' biannual 2018-3 to 2018-9');
            d.getMonth().should.equal(8);
            done();
        });
        it('should handle annual types', function(done){
            let d       = new Date('2018-03-01'),
                acme    = testlib.cp(testlib.get_test_org({org_id:100}));

            acme.type = 'annually';

            d.getMonth().should.equal(2);
            d.getFullYear().should.equal(2018);
            let [_, k]  = dsu.__testonly.make_budget_name_and_increment_date(acme, d);
            k.should.equal(acme.name + ' annual 2018-3 to 2019-3');
            d.getMonth().should.equal(2);
            d.getFullYear().should.equal(2019);
            done();
        });
        it('should handle unknown types', function(done){
            let d       = new Date('2018-03-01'),
                e       = new Date('2018-07-01'),
                acme    = testlib.cp(testlib.get_test_org({org_id:100}));

            acme.type = 'bogus';

            let [err, k]  = dsu.__testonly.make_budget_name_and_increment_date(acme, d, e);

            should.exist(err);
            d.getMonth().should.equal(6);

            done();
        });
    });
    describe.skip('add_budgets_for_contract', function(){
    });
    describe('add_new_contract_and_systems', function(){
        it('should handle single systems', function(done){
            let acme = testlib.get_test_org({org_id:100});

            let contract_created = false;

            promise.load_test_hook({
                fn: args => {
                    contract_created = !!args[0].match(/INTO contracts/i) &&
                        args[1] === acme.name &&
                        args[2] === acme.org_id;
                }
            });

            let system_added = false;

            promise.load_test_hook({
                fn: args => {
                    system_added = !!args[0].match(/INTO systems/i) &&
                        args[1] === acme.systems[0];
                }
            });

            let link_added = false;

            promise.load_test_hook({
                fn: args => {
                    link_added = !!args[0].match(/INTO contract_system_link/i) &&
                        args[1] === acme.name &&
                        args[2] === acme.systems[0];
                }
            });

            dsu.add_new_contract_and_systems(null, acme).then(() => {
                contract_created.should.equal(true);
                system_added.should.equal(true);
                link_added.should.equal(true);
                done();
            });
        });
        it('should handle multiple systems', function(done){
            let basco = testlib.get_test_org({org_id:200});

            let contract_created = false;

            promise.load_test_hook({
                fn: args => {
                    contract_created = !!args[0].match(/INTO contracts/i) &&
                        args[1] === basco.name &&
                        args[2] === basco.org_id;
                }
            });

            let system_1_added = false;

            promise.load_test_hook({
                fn: args => {
                    system_1_added = !!args[0].match(/INTO systems/i) &&
                        args[1] === basco.systems[0];
                }
            });

            let link_1_added = false;

            promise.load_test_hook({
                fn: args => {
                    link_1_added = !!args[0].match(/INTO contract_system_link/i) &&
                        args[1] === basco.name &&
                        args[2] === basco.systems[0];
                }
            });

            let system_2_added = false;

            promise.load_test_hook({
                fn: args => {
                    system_2_added = !!args[0].match(/INTO systems/i) &&
                        args[1] === basco.systems[1];
                }
            });

            let link_2_added = false;

            promise.load_test_hook({
                fn: args => {
                    link_2_added = !!args[0].match(/INTO contract_system_link/i) &&
                        args[1] === basco.name &&
                        args[2] === basco.systems[1];
                }
            });

            dsu.add_new_contract_and_systems(null, basco).then(() => {
                contract_created.should.equal(true);
                system_1_added.should.equal(true);
                system_2_added.should.equal(true);
                link_1_added.should.equal(true);
                link_2_added.should.equal(true);
                done();
            });
        });
    });

    describe('soft_failure', function(){
        it('should resolve false', function(done){
            let val = 'green';

            dsu.soft_failure(v => {val = v}, "test message: ")(new Error('test error'));
            val.should.equal(false);
            done();
        });
    });

    describe('set_wr_tags_fron_string', function(){
        it('should set false on empty string', function(done){
            let x = dsu.set_wr_tags_from_string({}, null);
            x.additional.should.equal(false);
            x.unchargeable.should.equal(false);
            done();
        });
        it('should set additional from "Additional"', function(done){
            let x = dsu.set_wr_tags_from_string({}, "a b c Additional d");
            x.additional.should.equal(true);
            done();
        });
        it('should not set additional from "Project"', function(done){
            let x = dsu.set_wr_tags_from_string({}, "a b c Project d");
            x.additional.should.equal(false);
            done();
        });
        it('should not set additional from "Warranty"', function(done){
            let x = dsu.set_wr_tags_from_string({}, "a b c Warranty d");
            x.additional.should.equal(false);
            done();
        });
        it('should not set additional from "Maintenance"', function(done){
            let x = dsu.set_wr_tags_from_string({}, "a b c Maintenance d");
            x.additional.should.equal(false);
            done();
        });
        it('should not set unchargeable from "Additional"', function(done){
            let x = dsu.set_wr_tags_from_string({}, "a b c Additional d");
            x.unchargeable.should.equal(false);
            done();
        });
        it('should not set unchargeable from "Project"', function(done){
            let x = dsu.set_wr_tags_from_string({}, "a b c Project d");
            x.unchargeable.should.equal(false);
            done();
        });
        it('should set unchargeable from "Warranty"', function(done){
            let x = dsu.set_wr_tags_from_string({}, "a b c Warranty d");
            x.unchargeable.should.equal(true);
            done();
        });
        it('should set unchargeable from "Maintenance"', function(done){
            let x = dsu.set_wr_tags_from_string({}, "a b c Maintenance d");
            x.unchargeable.should.equal(true);
            done();
        });
    });
});

