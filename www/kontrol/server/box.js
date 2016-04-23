//__________________________________________________________________________
/**
 * Fonteny javascript library - March 2014

 * This software is governed by the
 * Gnu general public license (http://www.gnu.org/licenses/gpl.html)

 * This is a module managing operations on the server side.
 * It is used by the app.js main procedure.
 * Most of the functions provided by this modules are implemented by the
 * scripts found in the bin subdirectory.
 *
 * It has been partly rewritten in April 2016. This new version do not use
 * the cronjob module which is buggy. It simply use the crontab(1) unix command.
 *
 * @author Jean-Paul Le Fèvre <lefevre@fonteny.org>
 */
//__________________________________________________________________________

"use strict";

/**
 * @module box
 * It handles all operations on the radio box.
 */
// Run google to get information about these nodejs modules.

var runSync = require('child_process').execSync;
var execSync = function(cmd) {
    var out = runSync(cmd, {encoding: 'utf-8'});
    logger.debug(out);
    return out;
};

var moment   = require('moment');
var CronJob  = require('cron').CronJob;
var fs       = require('fs');
var vox      = require('./vox');

// The default trigger time
var hour      =  6;
var minute    = 59;
// Not triggered by default
var triggered = false;
// Play France Inter for 20 minutes by default
var duration  = 20;
// The key of the wake up station which can be different
// from the current one.
var wakeUpStation = 'b-inter';

// The top directory of radiok.
var root;
// The script to run if triggered.
var onair;
// The log file manager.
var logger;

// The name of the file storing the trigger state.
var triggerStateFile;
// The current station
var station   = 'b-inter';

//__________________________________________________________________________
/**
 * Update the crontab.
 * id identifies the job.
 * spec gives the time and the command.
 * set enables or disables the execution of the command.
 * Returns true if arguments are correct.
 */
var updateCrontab = function(id, spec, set) {

    // Read and parse the current content of the crontab.
    var crontab = execSync('crontab -l');
    var cronIn  = crontab.split('\n');

    // What will be the updated content.
    var cronOut = [];
    var found   = false;

    for (var i = 0; i < cronIn.length; i++) {

        // Get rid of white spaces and empty lines.
        cronIn[i].trim();
        if (cronIn[i].length < 1) {
            continue;
        }
        else if (cronIn[i].indexOf(id) < 0) {
            // It is not the job to update : keep it as is.
            cronOut.push(cronIn[i]);
        }
        else if (set) {
            // It is the job to update.
            found = true;
            cronOut.push(spec);
        }
        else {
            // It is the job to be disabled.
            found = true;
            cronOut.push('#' + spec);
        }
    }

    // The job was not yet in the crontab.
    if (! found && set) {
        cronOut.push(spec);
    }

    // Write the updated content of the new crontab
    crontab = cronOut[0];
    for (var i = 1; i < cronOut.length; i++) {
        crontab = crontab + '\n' + cronOut[i];
    }
    crontab = crontab + '\n';

    // Save the updated content to a file.
    var cronfile = root + '/run/crontab.txt';
    fs.writeFileSync(cronfile, crontab);

    runSync('crontab ' + cronfile);
}
//__________________________________________________________________________
/**
 * Initializes the cron job.
 * id identifies the job. See crontab(1)
 * If one is already running kills it.
 * Returns true if arguments are correct.
 */
var setTrigger = function(id, h, m, set) {

    // Check input arguments
    if (isNaN(h) || isNaN(m)) {
        logger.error('Invalid numbers: '+ h + ' ' + m + ' ' + on);
        return false;
    }

    hour   = new Number(h);
    minute = new Number(m);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        logger.error('Invalid times: '+ h + ' ' + m + ' ' + on);
        return false;
    }

    // Argument set is a string, triggered a boolean.
    if (set === 'true') {
        triggered = true;
    }
    else {
        triggered = false;
    }

    // Identify the job, define the command to execute.
    var cmd = 'ID=' + id + ' ';
    cmd = cmd + onair + ' -t ' + duration + ' ' + wakeUpStation;
    // Redirect stdout and stderr
    var out = root + '/run/' + id + '.log';
    cmd = cmd + ' 1>' + out + ' 2>&1';

    // From Monday to Friday : 1-5
    var spec  = minute + ' ' + hour + ' * * * ' + cmd;
    // var spec  = '*/3' + ' ' + '*' + ' * * *  + cmd';
    logger.info('Crontab spec: ' + spec + ' set ' + triggered);

    // Communicate the spec to crontab(1)
    updateCrontab(id, spec, triggered);

    if (triggered) {
        logger.info('Trigger set at ' + moment().format('HH:mm'));
    }
    else {
        logger.info('Trigger unset at ' + moment().format('HH:mm'));
    }

    var triggerState = {
        wakeup: {
            hour:     hour,
            minute:   minute,
            duration: duration,
            set:      triggered.toString(),
            station:  wakeUpStation
        },
        alarm: {
            hour:     "16",
            minute:   "0",
            duration: "20",
            set:      "false",
            station:  "a-fip"
        }
    };

    // Make vox.js aware of the new trigger
    vox.setTriggerState(triggerState);

    fs.writeFile(triggerStateFile, JSON.stringify(triggerState, null, 4),
                 function (err) {
                     if (err) {
                         logger.error('Trigger failed saving data');
                     }
                     else {
                         logger.info('Trigger successfully saved.');
                     }
    });

    return true;
}
//__________________________________________________________________________

module.exports = {
    /**
     * Initializes the module.
     */
    init: function(msger, rootdir) {

        root  = rootdir;
        onair = root + '/bin/onair.sh';

        logger = msger;
        logger.info('Box Kontroller module initialization');
    },
    /**
     * Initializes the http get methods.
     */
    sender: function(app) {

        logger.info('Box Kontroller sender definition');

//__________________________________________________________________________
        /**
         * Processes a get status request.
         * It executes the script onair.sh
         * Returns the current status of the box, e.g. "a-fip, 4652"
         */
        app.get('/box/status', function(req, res) {

            logger.info('Fetching the box status');

            var output = execSync(onair + ' -s');

            res.send({status: output});
        });
//__________________________________________________________________________
       /**
        * Processes a get state request.
        * A json string is returned by a script,
        * it provides some details about the box.
        *
        * Returns the current state of the box.
        */
        app.get('/box/get_state', function(req, res) {

            logger.info('Fetching the state of the box');

            var str = execSync(root + '/bin/get_state.sh');
            // The syntax of a valid json object may be checked.
            logger.debug(str);

            var output = JSON.parse(str);

            // More info about the crontab is stored internally
            if (triggered) {
                output.trigger = 'Set at ';
            }
            else {
                output.trigger = 'Unset at ';
            }
            // It is appended to the output
            output.trigger = output.trigger + hour + ':' + minute
            + ' on ' + wakeUpStation;

            res.send(output);
        });
//__________________________________________________________________________
        /**
         * Processes a start or stop station request.
         * The parameter may be a station name or the -k flag
         * Returns the new status of the box.
         */
        app.get('/box/start/:station', function(req, res) {

            var key = req.params.station;

            if (key === '-k') {
                logger.info('Stop streaming radio');
            }
            else {
                // Keep track of the selected station.
                station = key;
                logger.info('Starting station key %s', key);
                // Let vox know the new station.
                vox.setStationIdx(key);
            }
            
            var output = execSync(onair + ' ' + key);

            res.send({status: output});
        });
//__________________________________________________________________________
       /**
        * Gets the status of the cron job.
        * Returns the cron parameters.
        */
        app.get('/box/cronjob', function(req, res) {

            res.send({
                job: triggered,
                hour: hour,
                minute: minute,
                set: triggered
            });
        });
//__________________________________________________________________________
       /**
        * Gets the list of declared stations.
        * Returns the list.
        */
        app.get('/box/stations', function(req, res) {

            var str  = execSync(onair + ' -l');
            var list = JSON.parse(str);

            res.send(list);
        });
//__________________________________________________________________________
       /**
        * Gets the value of the volume.
        * It is a number between 0 and 100.
        * Returns the value.
        */
        app.get('/box/get_volume', function(req, res) {

            var value = execSync(root + '/bin/get_volume.sh');

            res.send(value);
        });
//__________________________________________________________________________
       /**
        * Sets the value of the volume.
        * It is a number between 0 and 100.
        * Returns the value.
        */
        app.get('/box/set_volume/:value', function(req, res) {

            var volume = new Number(req.params.value);
            if (volume < 0) {
                volume = 0;
            }
            else if (volume > 100) {
                volume = 100;
            }

            var cmd = root + '/bin/set_volume.sh ' + volume;
            logger.debug(cmd);

            var status = execSync(cmd);
            logger.info('Volume set to ' + volume + '%');
 
            res.send({status: status});
        });
//__________________________________________________________________________
       /**
        * Starts or stops the cron job.
        * Returns the new cron spec.
        */
        app.get('/box/trigger/:hour/:minute/:on', function(req, res) {

            var i = 'wakeup';
            var h = req.params.hour;
            var m = req.params.minute;
            var o = req.params.on;

            // Define the cronjob
            var status = setTrigger(i, h, m, o);

            // Send back the cronjob parameters
            res.send({
                job: triggered,
                hour: hour,
                minute: minute,
                set: triggered
            });
        });
    },
 //__________________________________________________________________________
    /**
     * Initializes the cron job.
     * If one is already running kill it.
     * Returns true if arguments are correct.
     */
    trigger: function(trigfile) {

        triggerStateFile = trigfile;
        var code = true;

        fs.readFile(trigfile, function (err, data) {
            if (err) {
                logger.error('Cannot read ' + trigfile);
                code = setTrigger('wakeup', '10', '10', false);
            }
            else {
                var state = JSON.parse(data);
                var wakeup = state.wakeup;
                logger.debug('Trigger wake up ' + wakeup);

                code = setTrigger('wakeup',
                                  wakeup.hour, wakeup.minute, wakeup.set);
                duration = wakeup.duration;
                station  = wakeup.station;

                var alarm = state.alarm;
                logger.debug('Trigger alarm ' + alarm);
            }
        });

        return code;
    }
 //__________________________________________________________________________
}
