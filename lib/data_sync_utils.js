var util    = require('wrms-dash-util'),
    dbs     = require('./data_store_dbs'),
    promise = require('./data_store_promise'),
    sql     = require('./data_store_sql');

'use strict';

const DEBUG = false;

function dump_rows_as_csv(rows){
    /* eslint-disable no-console */
    if (Array.isArray(rows) && rows.length > 0){
        console.log(Object.keys(rows[0]).join(','));
        rows.forEach(row => {
            console.log(Object.values(row).join(','));
        });
    }
    /* eslint-enable no-console */
}

function dump(db, label = '', __force){
    if (!DEBUG && !__force){
        return;
    }
    Object.keys(sql.dump).forEach(key => {
        db.all(
            sql.dump[key],
            (err, res) => {
                if (err){
                    util.log(__filename, `ERROR in dump()/${key}: ${err.message || err}`);
                    return;
                }
                // eslint-disable-next-line no-console
                console.log('======================== ' + label + ' ========================');
                dump_rows_as_csv(res);
            }
        );
    });
}

function set_wr_tags_from_string(wr, str){
    wr.additional = false;
    wr.unchargeable = false;

    if (str){
        wr.additional = !!str.match(new RegExp('Additional', 'i'));
        wr.unchargeable = (!!str.match(new RegExp('Warranty', 'i'))) || (!!str.match(new RegExp('Maintenance', 'i')));
    }

    return wr;
}

// Soft failures shouldn't stop the other contracts from being created.
function soft_failure(resolve , msg, file){
    return function(err){
        util.log(file||__filename, msg + (err.message || err));
        resolve(false);
    }
}

function add_new_contract_and_systems(db, contract){
    let stmt_fns = [];

    // default active to 1 if it's missing (e.g. left out of static config.)
    if (contract.active === undefined){
        contract.active = 1;
    }

    util.log_debug(__filename, `Adding ${JSON.stringify(contract)}`, DEBUG);
    util.org_data.syncing().add_org(contract);
    stmt_fns.push(
        promise.generate(
            db,
            sql.add_contract,
            contract.name,
            contract.org_id,
            contract.org_name,
            contract.start_date,
            contract.end_date,
            contract.cash_value,
            contract.cash_rate,
            contract.cash_currency,
            contract.active
        )
    );

    for (let i = 0; i < contract.systems.length; ++i){
        util.org_data.syncing().add_system(contract, contract.systems[i]);
        stmt_fns.push(promise.generate(db, sql.add_system, contract.systems[i]));
        stmt_fns.push(promise.generate(db, sql.add_contract_system_link, contract.name, contract.systems[i]));
    }

    return util.promise_sequence(stmt_fns, fn => {
        return fn();
    });
}

function add_budgets_for_contract(db, contract){
    let current = new Date(contract.start_date),
        end = new Date(contract.end_date),
        stmt_fns = [];

    // For more reliable date incrementing:
    current.setDate(1);
    current.setHours(8);
    // And disambiguate contracts that end on the last day of the month
    end.setDate(end.getDate()+1);

    while (current < end){
        let [err, key] = make_budget_name_and_increment_date(contract, current, end);
        if (err){
            return err;
        }else{
            stmt_fns.push(promise.generate(db, sql.add_budget, key, contract.hours));
            stmt_fns.push(promise.generate(db, sql.add_contract_budget_link, contract.name, key));
        }
    }

    return util.promise_sequence(stmt_fns, fn => {
        return fn();
    });
}

function make_budget_name_and_increment_date(contract, current, end){
    let this_month = util.dates.date_fmt(current),
        key = null;

    switch(contract.type){
        case 'monthly':
            current.setMonth(current.getMonth()+1);
            key = util.naming.create_budget_name(contract, 'month', this_month);
            break;
        case '6 monthly':
            current.setMonth(current.getMonth()+6);
            key = util.naming.create_budget_name(contract, 'biannual', this_month + ' to ' + util.dates.date_fmt(current));
            break;
        case 'annually':
            current.setMonth(current.getMonth()+12);
            key = util.naming.create_budget_name(contract, 'annual', this_month + ' to ' + util.dates.date_fmt(current));
            break;
        default:
            current.setTime(end.getTime());
            return [new Error(`Unsupported contract type "${contract.type}"`)];
    }
    return [null, key];
}

function find_last_row_for_this_wr(arr, i){
    let id = arr[i].request_id;
    while (i < arr.length && arr[i].request_id === id){
        ++i;
    }
    return i-1;
}

function modify_budget_for_quote(budget, quote, quote_description){
    if (quote_description.additional){
        // Additional quote hours are recorded as a separate tally on additional_hours
        return promise.promise(
            dbs.syncing(),
            'UPDATE budgets SET additional_hours=? WHERE id=?',
            budget.additional_hours + quote.quote_amount,
            budget.id
        );
    }else{
        // SLA quote hours are subtracted from base_hours as base_hours_spent
        return promise.promise(
            dbs.syncing(),
            'UPDATE budgets SET base_hours_spent=?, sla_quote_hours=? WHERE id=?',
            budget.base_hours_spent + quote.quote_amount,
            budget.sla_quote_hours + quote.quote_amount,
            budget.id
        );
    }
}

function quote_may_affect_budget(quote){
    return !!quote.approved_by_id || !quote.expired;
}

function add_quote(quote, desc, budget){
    util.log_debug(__filename, `add_quote(${JSON.stringify(quote)})`, DEBUG);

    return promise.promise(
        dbs.syncing(),
        sql.add_quote,
        quote.quote_id,
        budget.id,
        quote.request_id,
        util.dates.date_fmt(new Date(desc.period)), // take wrs.invoice_to and quotes.approved_on into account
        quote.quote_amount,
        desc.additional|0,
        quote_may_affect_budget(quote)|0,
        !!quote.approved_by_id|0
    );
}

module.exports = {
    dump: dump,
    set_wr_tags_from_string: set_wr_tags_from_string,
    soft_failure: soft_failure,
    add_new_contract_and_systems: add_new_contract_and_systems,
    add_budgets_for_contract: add_budgets_for_contract,
    __testonly:{
        make_budget_name_and_increment_date: make_budget_name_and_increment_date
    },
    find_last_row_for_this_wr: find_last_row_for_this_wr,
    modify_budget_for_quote: modify_budget_for_quote,
    quote_may_affect_budget: quote_may_affect_budget,
    add_quote: add_quote
};

