//__________________________________________________________________________
/**
 * Fonteny javascript library - March 2014

 * This software is governed by the
 * Gnu general public license (http://www.gnu.org/licenses/gpl.html)

 * This is a module managing operations on the server side.
 * It is used by the app.js main procedure.
*
 * @author Jean-Paul Le Fèvre <lefevre@fonteny.org>
*/
//__________________________________________________________________________

"use strict";

/**
 * @module box
 * It handles all operations on the radio box.
 */
// Google these nodejs modules for doc.
var execSync = require('exec-sync');
var moment   = require('moment');
var CronJob  = require('cron').CronJob;
var fs       = require('fs');
var vox      = require('./vox');

// The program to execute on a regular basis
var job;
// The default trigger time
var hour      = 22;
var minute    =  0;
// Not triggered by default
var triggered = false;
// Play France Inter for 30 minutes by default
var duration  = 30;
var station   = 'b-inter';

// The script to run if triggered.
var onair;
var logger;
// The name of the file storing the trigger state.
var triggerStateFile;

//__________________________________________________________________________
    /**
     * Initializes the cron job.
     * If one is already running kill it.
     * Returns true if arguments are correct.
     */
var setTrigger = function(h, m, set) {

    // Check input arguments
    if (isNaN(h) || isNaN(m)) {
        logger.log('error', 'Invalid numbers: '+ h + ' ' + m + ' ' + on);
        return false;
    }

    hour   = new Number(h);
    minute = new Number(m);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        logger.log('error', 'Invalid times: '+ h + ' ' + m + ' ' + on);
        return false;
    }

    // Argument set is a string, triggered a boolean.
    if (set === 'true') {
        triggered = true;
    }
    else {
        triggered = false;
    }

    var spec  = '00 ' + minute + ' ' + hour + ' * * 1-5';
    logger.log('info', 'Cronjob spec: ' + spec + ' set ' + triggered);

    // Stop the current job if any.
    if (job) {
        job.stop();
    }

    job = new CronJob({
        cronTime: spec,
        onTick: function() {
            logger.log('info', 'My radio goes off at '
                       + moment().format('HH:mm'));

            var cmd = execSync(onair + '-t ' + duration + ' ' + station + ' &');
        },
        start: false
    });

    if (triggered) {
        job.start();
        logger.log('info', 'Trigger set at ' + moment().format('HH:mm'));
    }
    else {
        job.stop();
        logger.log('info', 'Trigger unset at ' + moment().format('HH:mm'));
    }

    var triggerState = {
        hour:     hour,
        minute:   minute,
        duration: duration,
        set:      triggered,
        station:  station
    };

    fs.writeFile(triggerStateFile, JSON.stringify(triggerState, null, 4),
                 function (err) {
                     if (err) {
                         logger.log('error', 'Trigger failed saving data');
                     }
                     else {
                         logger.log('info', 'Trigger successfully saved.');
                     }
    });

    return true;
}
//__________________________________________________________________________

module.exports = {
    /**
     * Initializes the module.
     */
    init: function(app, msger, root) {

        onair = root + '/bin/onair.sh ';

        logger = msger;
        logger.info('Box Kontroller module initialization');

//__________________________________________________________________________
       /**
         * Processes a get status request.
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

            // More info about the cronjob is stored internally
            if (triggered) {
                output.trigger = 'Set at ';
            }
            else {
                output.trigger = 'Unset at ';
            }
            // It is appended to the output
            output.trigger = output.trigger + hour + ':' + minute;

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
                logger.log('info', 'Stop streaming radio');
            }
            else {
                // Keep track of the selected station.
                station = key;
                // Let vox know the new station.
                vox.setStationIdx(key);
                logger.log('info', 'Starting station key %s', key);
            }
            
            var output = execSync(onair + key);

            res.send({status: output});
        });
//__________________________________________________________________________
       /**
         * Gets the status of the cron job.
         * Returns the cron parameters.
         */
        app.get('/box/cronjob', function(req, res) {

            res.send({
                job: (job != undefined),
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
            logger.log('debug', cmd);

            var status = execSync(cmd);
            logger.log('info', 'Volume set to ' + volume + '%');
 
            res.send({status: status});
        });
//__________________________________________________________________________
       /**
         * Starts or stops the cron job.
         * Returns the new cron spec.
         */
        app.get('/box/trigger/:hour/:minute/:on', function(req, res) {

            var h = req.params.hour;
            var m = req.params.minute;
            var o = req.params.on;

            // Define the cronjob
            var status = setTrigger(h, m, o);

            // Send back the cronjob parameters
            res.send({
                job: (job != undefined),
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

        fs.readFile(triggerStateFile, function (err, data) {
            if (err) {
                logger.log('error', 'Cannot read ' + triggerStateFile);
                code = setTrigger('10', '10', false);
            }
            else {
                var state = JSON.parse(data);

                code = setTrigger(state.hour, state.minute, state.set);
                duration = state.duration;
                station  = state.station;
            }
        });

        return code;
    }
 //__________________________________________________________________________
}
