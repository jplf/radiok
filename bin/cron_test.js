//__________________________________________________________________________
/**
 * Fonteny javascript library - March 2016
 *
 * A test script used to test the cron modules.
 * It was written because radiok no longer works with the new version of
 * node, this script may useful to figure out why.
 * It does not depend on the express module.
 *
 * Usage: node cron_test.js
 * The cron spec must be given in a file name 'run/cron_test.json'
 *
 * See also : box.js
 * @author Jean-Paul Le Fèvre
 *
 */
//__________________________________________________________________________

"use strict";

var root = process.env.RADIOK_HOME;

if (root === undefined) {
    console.log('Please export RADIOK_HOME=');
    process.kill();
}
/**
 * Logging initialization using winston.
 */
var fs = require('fs');
var logfile = root + '/run/cron_test.log';

/**
 * Delete existing log file if any to write into a fresh new one.
 */
fs.exists(logfile, function (exists) {
    if (exists) {
        fs.unlinkSync(logfile);
    }
});
/**
 * Known winston log levels
 * silly=0(lowest), verbose=1, info=2, warn=3, debug=4, error=5(highest)
 */
var stamp = function() {
    var d = new Date();
    return d.getDate() + '/' + (d.getMonth()+1) + ' ' + d.toLocaleTimeString();
};
var winston = require('winston');
var logger  = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({
            timestamp: stamp,
            json: false,
            level: 'debug',
            filename: logfile})
   ]
});

logger.info('Starting server %s', 'ok');

var box = require(root + '/www/kontrol/server/box');
box.init(logger, root);

/**
 * Initialize the wake up trigger from a configuration file.
 */
if (! box.trigger(root + '/run/cron_test.json')) {
    console.log('Invalid box triggers file !');
    process.kill();
}

//__________________________________________________________________________
