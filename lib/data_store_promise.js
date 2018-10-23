var util = require('wrms-dash-util'),
    dbs  = require('./data_store_dbs');

const DEBUG = false;

var test_hooks = [/*{fn: args=>{}, err: new Error()}*/];

function load_test_hook(hook){
    test_hooks.push(hook);
    return test_hooks.length;
}

function use_test_hook(args){
    let h = test_hooks.shift();

    if (h){
        process.nextTick(() => {
            let cb = args.pop();
            h.fn && h.fn(args);
            cb(h.err);
        });
    }
}

function sqlite_promise(/* ... */){
    let args = Array.prototype.slice.call(arguments, 0),
        db = args.shift();
    return new Promise((resolve, reject) => {
        if (!args[0]){
            util.log_debug(__filename, 'sqlite_promise() with no query - skipping', DEBUG);
            resolve(false);
            return;
        }

        let already_handled = false;

        function callback(err){
            if (already_handled){
                return;
            }

            already_handled = true;
            if (err){
                util.log_debug(__filename, 'ERROR in sqlite3.Database.run(): ' + err, DEBUG);
                reject(err);
            }else{
                resolve(true);
            }
        }

        args.push(callback);

        if (test_hooks.length > 0){
            util.log_debug(__filename, 'using test hook');
            use_test_hook(args);
            return;
        }

        if (!db){
            reject(new Error('sqlite_promise() with no DB - if this is a unit test, did you add too few test_hooks?'));
            return;
        }

        try{
            db.run.apply(db, args);
            util.log_debug(__filename, 'db_' + dbs.identify(db) + ': ' + JSON.stringify(args));
        }catch(ex){
            util.log_debug(__filename, 'ERROR in sqlite_promise(): ' + ex, DEBUG);
            reject(ex);
        }
    });
}

// For use with util.promise_sequence() - bind the DB (+ sql if needed) and generate new promises
// on successive calls that actually do the work.
function generate_sqlite_promise(/* ... */){
    let bound_args = Array.prototype.slice.call(arguments, 0);
    return function(/* ... */){
        let call_args = Array.prototype.slice.call(arguments, 0);
        return sqlite_promise.apply(null, bound_args.concat(call_args));
    }
}

module.exports = {
    load_test_hook: load_test_hook,
    promise: sqlite_promise,
    generate: generate_sqlite_promise
}

