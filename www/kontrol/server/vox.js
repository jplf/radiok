//__________________________________________________________________________
/**
 * Fonteny javascript library - May 2014

 * This software is governed by the
 * Gnu general public license (http://www.gnu.org/licenses/gpl.html)

 * This is a module managing operations on the server side.
 * It handles commands sent by the vox controller client.
 * It is used by the app.js main procedure.
 *
 * @author Jean-Paul Le Fèvre <lefevre@fonteny.org>
*/
//__________________________________________________________________________

"use strict";

/**
 * @module vox
 * It handles commands sent by the voice interpreter program.
 */
//var execSync = require('exec-sync');

var runSync = require('child_process').execSync;
var execSync = function(cmd) {
    return runSync(cmd, {encoding: 'utf-8'});
};

/**
 * The module giving the list of valid commands.
 * Either 'cmd-fr' or 'cmd-en'
 * However be aware that the english version in 'cmd-en' will no longer be
 * maintained.
 * Note also that the messages spoken by the program are in french.
 */
var cmd = require('./cmd-fr');

// The scripts which can be called.
var onair;
var setVolume;

// Output already recorded sounds.
var say;
// Output google synthetized sounds.
var tell;
 
// Delta volume. Increment or decrement in dB. See amixer(1)
var dvol = '12';

var logger;

// The map of radio stations.
var stationList;
// The array of station names.
var nameList;
// The index of the currently selected station.
var stationIdx = 0;

// The trigger info.
var triggerState;

//__________________________________________________________________________
/**
 * Changes the radio station.
 * Parameter: index the index of the station in the list of known stations.
 */
var setStation = function(index) {

    // Check if mplayer is running or not
    var playing = execSync('/sbin/pidof -s mplayer');
    if (playing == undefined || (!playing)) {
        // Not playing so do nothing
        execSync(tell + "\"la radio n'est pas en marche actuellement\"");
        return;
    }

    stationIdx = index;
    // Feed back. Tell the name of the station
    execSync(tell + stationList[index].name);

    // Stop the current station then play the new one.
    execSync(onair + '-k; ' + onair + stationList[index].key);
    logger.info('Tuned to ' + stationList[index].key);
};
//__________________________________________________________________________

module.exports = {
    /**
     * Initializes the module.
     */
    init: function(app, msger, root) {

        logger = msger;
        logger.info('Vox Kontroller module initialization');

        logger.info('Commands in ' + cmd.language + ' language');

        onair = root + '/bin/onair.sh ';
        tell  = root + '/bin/tell.sh ';
        setVolume = root + '/bin/set_volume.sh ' + dvol + ' ';
        say = root + '/bin/say.sh ';

        // The list of stations is fetched thanks to the script 'onair.sh'
        var str = execSync(onair + '-l');
        stationList = JSON.parse(str);

        // The current status of the player [key, pid]
        str = execSync(onair + '-s');
        var s = str.split(',');
        this.setStationIdx(s[0]);
        logger.info('Station key, index set to ' + s[0] + ', ' + stationIdx);

        // Initialize the array of names (kept in upper case)
        nameList = Array(stationList.length);

        for (var i=0; i <stationList.length; i++) {
            nameList[i] = stationList[i].name.toUpperCase();
            logger.log('info', stationList[i].key + ': '
                       + stationList[i].name);
        }
//__________________________________________________________________________
       /**
         * Processes a word request.
         *
         * The word is taken to execute a command. Words are organized as
         * list of synonyms. Different synonyms cause the same command to
         * be launched.
         *
         * The number of milliseconds since 1/1/1970 is also passed by the
         * voice recognition program. This number is measured each time
         * a word is understood. It allows to figure out how long it takes
         * process a command.
         *
         * Returns the result of the processing.
         */
        app.get('/vox/process/:word/:time?', function(req, res) {

            var word = req.params.word;
            var code = 'undefined';
            var time = req.params.time;

            // logger.debug(req.originalUrl);
            // Number of milliseconds now since Epoch.
            var now  = (new Date()).getTime();
            var dt   = now - time;
            logger.info('Word: ' + word + ' dt: ' + dt);
            // logger.debug('Times: ' + time + ' ' + now);

            /**
             * Start playing the last selected radio.
             * Check to see whether 'word' in the list of 'work' synonyms.
             */
            if (cmd.workList.indexOf(word) >= 0) {
                execSync(say + 'welcome_back.wav');
                execSync(onair);
                code = 'work';
            }
            /**
             * Tell which radio is currently selected.
             */
            else if (cmd.whichList.indexOf(word) >= 0) {
                var stationName = 'inconnue';
                if (stationIdx >= 0 && stationIdx <= stationList.length - 1) {
                    stationName = stationList[stationIdx].name;
                }
                execSync(tell + 'La station sélectionnée est ' + stationName)
                code = 'which';
            }
            /**
             * Stop playing.
             */
            else if (cmd.stopList.indexOf(word) >= 0) {
                execSync(onair + '-k');
                execSync(say + 'byebye.wav');
                code = 'stop';
            }
            /**
             * Increase or decrease volume.
             */
            else if (cmd.plusList.indexOf(word) >= 0) {
                execSync(tell + 'Le volume va être augmenté');
                execSync(setVolume + '+');
                code = 'plus';
            }
            else if (cmd.minusList.indexOf(word) >= 0) {
                execSync(tell + 'Le volume va être diminué');
                execSync(setVolume + '-');
                code = 'minus';
            }
            else if (cmd.indexList.indexOf(word) >= 0) {
                // Change the current station
                var index = -1;

                if (word === cmd.indexList[0]) {
                    index = 0;
                }
                else if (word === cmd.indexList[3]) {
                    index = stationList.length - 1;
                }
                else if (word === cmd.indexList[1]) {
                    if (stationIdx > 0) {
                        index = stationIdx - 1;
                    }
                    else {
                      index = stationList.length - 1;  
                    }
                }
                else if (word === cmd.indexList[2]) {
                    if (stationIdx < stationList.length - 1) {
                        index = stationIdx + 1;
                    }
                    else {
                      index = 0;  
                    }
                }
                
                if (index >= 0) {
                    // The new index is correct
                    setStation(index);
                }
                else {
                    // No new correct index decoded.
                    execSync(tell + 'Index de station invalide ' + word);
                }

                code = 'index';
            }
            else if (nameList.indexOf(word.toUpperCase()) >= 0) {
                //  Select another station
                var index = nameList.indexOf(word.toUpperCase());

                if (index >= 0 && index <= stationList.length - 1) {
                    if (index != stationIdx) {
                        setStation(index);
                    }
                    else {
                        execSync(tell + 'Même nom de station ' + word);
                    }
                }
                else {
                    // No new correct index decoded.
                    execSync(tell + 'Nom de station invalide ' + word);
                }

                code = 'name';
            }
            else if (cmd.timeList.indexOf(word) >= 0) {
                var d = new Date();
                var heure = d.getHours() + ' heures '
                          + d.getMinutes() + ' minutes';
                execSync(tell + 'il est ' + heure);
            }
            else if (cmd.setList.indexOf(word) >= 0) {

                var message;

                if (! triggerState) {
                    message = "le statut de l'alarme n'est pas disponible";
                }
                else if (triggerState.set) {
                  message = "\"l'alarme est mise pour "
                    + triggerState.hour + " heures "
                    + triggerState.minute + " minutes\"";
                    logger.log('info', message);
                }
                else {
                   message = "l'alarme n'est pas mise"; 
                }

                execSync(tell + message);
            }
            else if (cmd.digitList.indexOf(word) >= 0) {

                //  Select another station
                var index = cmd.digitList.indexOf(word);

                if (index >= 0 && index <= stationList.length - 1) {
                    if (index != stationIdx) {
                        setStation(index);
                    }
                    else {
                        execSync(tell + 'Même index de station ' + word);
                    }
                }
                else {
                    // No new correct index decoded.
                    execSync(tell + 'Index de station invalide ' + word);
                }

                code = 'digit';
            }
            // Other instructions are not yet implemented.
            else {
                // Protect apostrophe.
                execSync(tell + "\"Je n'ai pas compris\"");
                code = 'unknown';
            }

            res.send(code);
        });
    },
//__________________________________________________________________________
     /**
      * Saves the station index knowing the key.
      * Called from box.js
      */
    setStationIdx: function(key) {

        for (var i = 0; i < stationList.length; i++) {
            if (stationList[i].key === key) {
                stationIdx = i;
                break;
            }
        }
     },
    /**
     * Stores the trigger status got from box.js
     * Parameter: the json object.
     */
    setTriggerState: function(status) {
        triggerState = status;
    }
//__________________________________________________________________________
}
