//__________________________________________________________________________
/**
 * Fonteny javascript library - March 2014 - May 2016 - January 2023

 * This software is governed by the
 * Gnu general public license (http://www.gnu.org/licenses/gpl.html)

 * This is a module managing operations on the server side.
 * It is used by the app.js main procedure.
 * Most of the functions provided by this modules are implemented by the
 * scripts found in the bin subdirectory.
 *
 * It has been partly rewritten in April 2016. This new version do not use
 * the cronjob module which is buggy.
 * It simply use the crontab(1) unix command.
 * The crontab must define RADIOK_HOME and RADIOK_PLAYER
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

// The configuration of the triggers
var triggerState = {
    wakeup: {
        hour:     "6",
        minute:   "59",
        day:      "*",
        duration: "10",
        set:      "false",
        station:  "b-inter"
    },
    alarm: {
        hour:     "16",
        minute:   "0",
        day:      "*",
        duration: "10",
        set:      "false",
        station:  "a-fip"
    }
};

// The top directory of radiok.
var root;
// The script to run if triggered.
var onair;
// The log file manager.
var logger;

// The name of the file storing the trigger state.
var triggerStateFile;

//__________________________________________________________________________
/**
 * Updates the crontab.
 * Parameters are the following :
 * id identifies the job. (ID in crontab(1))
 * spec gives the time and the command.
 * set enables or disables the execution of the command.
 * Returns true if arguments are correct.
 */
var updateCrontab = function(id, spec, set) {

    // Read and parse the current content of the crontab.
    var crontab = execSync('crontab -l');
    // The array of lines in the current crontab.
    var cronIn  = crontab.split('\n');

    // What will be the updated content.
    var cronOut = [];
    // Flag telling whether the job was specified in the crontab.
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
            // It is the job to be disabled. Comment it out !
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
    var cronfile = root + '/run/crontab~';
    fs.writeFileSync(cronfile, crontab);

    execSync('crontab ' + cronfile);
}
//__________________________________________________________________________
/**
 * Initializes the cron job.
 *
 * id identifies the job. See crontab(1)
 * h & m give the hour and minutes.
 * d specifies the days.
 * station identifies the radio.
 * set enables or disables the cron.
 * If one is already running kills it.
 * Returns true if arguments are correct.
 */
var setTrigger = function(id, h, m, d, set, station) {

    // Check input arguments
    if (isNaN(h) || isNaN(m)) {
        logger.error('Invalid numbers: '+ h + ' ' + m + ' ' + on);
        return false;
    }

    var hour   = new Number(h);
    var minute = new Number(m);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        logger.error('Invalid times: '+ h + ' ' + m + ' ' + on);
        return false;
    }

    // Only 2 choices allowed in this version.
    if (d != '*' && d != '1-5') {
        logger.error('Invalid days: '+ d);
        return false;
    }
    var day = d;
    var triggered = false;

    // Argument set is a string, triggered a boolean.
    if (set === 'true') {
        triggered = true;
    }

    var dt  = '10';
    var key = station;

    if (id == 'wakeup') {
        triggerState.wakeup =  {
            hour:     hour,
            minute:   minute,
            day:      day,
            duration: dt,
            set:      triggered,
            station:  key
        };
    }
    else {
        triggerState.alarm =  {
            hour:     hour,
            minute:   minute,
            day:      day,
            duration: dt,
            set:      triggered,
            station:  key
       };
    }

    // Identify the job, define the command to execute.
    var cmd = 'ID=' + id + ' ';
    cmd = cmd + onair + ' -t ' + dt + ' ' + key;
    // Redirect stdout and stderr
    var out = root + '/run/' + id + '.log';
    cmd = cmd + ' 1>' + out + ' 2>&1';

    // From Monday to Friday : 1-5
    var spec  = minute + ' ' + hour + ' * * ' + day + ' ' + cmd;
    logger.info('Crontab spec: ' + spec + ' set ' + triggered);

    // Communicate the spec to crontab(1)
    updateCrontab(id, spec, triggered);

    var m = moment().format('HH:mm');
    if (triggered) {
        logger.info('Trigger ' + id + ' set at ' + m);
    }
    else {
        logger.info('Trigger ' + id + ' unset at ' + m);
    }

    // Make vox.js aware of the new trigger
    vox.setTriggerState(triggerState);
    var wtf = JSON.stringify(triggerState, null, 4);
    
    fs.writeFileSync(triggerStateFile, JSON.stringify(triggerState, null, 4));

    return true;
}
//__________________________________________________________________________
/**
 * Parses a line of contrab
 * Returns something like : 'Set at 7:15'
 */
var parseCronline = function(str) {

    var s;
    var i;
    if (str.startsWith('#')) {
        s = 'Unset at ';
        i = 1;
    }
    else {
        s = 'Set at ';
        i = 0;
    }

    // End of time stpec
    var j = str.indexOf('ID');
    if (j < 0) {
        // Should work if ID is not found
        j = 12;
    }

    str = str.substring(i, j);
    var mh = str.split(' ');

    return s + mh[1] + ':' + mh[0] + ' on days ' + mh[4];
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

            var str = parseCronline(output.wakeup);
            output.wakeup = str;

            str = parseCronline(output.alarm);
            output.alarm = str;

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
        * Parameter id can be 'wakeup' or 'alarm'
        * Returns the cron parameters.
        */
        app.get('/box/cronjob/:id', function(req, res) {

            var id = req.params.id;

            if (id == 'wakeup') {
                res.send({
                    job:    id,
                    hour:   triggerState.wakeup.hour,
                    minute: triggerState.wakeup.minute,
                    set:    triggerState.wakeup.set
                });
            }
            else {
                res.send({
                    job:    id,
                    hour:   triggerState.alarm.hour,
                    minute: triggerState.alarm.minute,
                    set:    triggerState.alarm.set
                });
            }
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
        app.get('/box/trigger/:id/:hour/:minute/:day/:on', function(req, res) {
            var i = req.params.id;
            var h = req.params.hour;
            var m = req.params.minute;
            var d = req.params.day;
            var o = req.params.on;
            var k = 'c-musique';

            // Define the cronjob
            var status = setTrigger(i, h, m, d, o, k);

            // Send back the cronjob parameters
            if (i == 'wakeup') {
                res.send({
                    id: 'wakeup',
                    hour:   triggerState.wakeup.hour,
                    minute: triggerState.wakeup.minute,
                    day:    triggerState.wakeup.day,
                    set:    triggerState.wakeup.set
                });
            }
            else {
                res.send({
                    id: 'alarm',
                    hour:   triggerState.alarm.hour,
                    minute: triggerState.alarm.minute,
                    day:    triggerState.alarm.day,
                    set:    triggerState.alarm.set
                });

            }
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
                code = setTrigger('wakeup', '10', '10', '*', false, 'a-fip');
            }
            else {
                var state = JSON.parse(data);

                var wakeup = state.wakeup;
                logger.debug('Trigger wake up ' + wakeup);

                code = setTrigger('wakeup', wakeup.hour, wakeup.minute,
                                  wakeup.day, wakeup.set, wakeup.station);

                var alarm = state.alarm;
                logger.debug('Trigger alarm ' + alarm);

                code = setTrigger('alarm', alarm.hour, alarm.minute,
                                  alarm.day, alarm.set, alarm.station);
            }
        });

        return code;
    }
 //__________________________________________________________________________
}
