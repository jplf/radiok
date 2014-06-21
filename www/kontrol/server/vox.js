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
 * It handles commands sent by the vox controller..
 */
var execSync = require('exec-sync');

// The scripts which can be called.
var onair;
var setVolume;
var say;

// Delta volume. Increment or decrement in dB. See amixer(1)
var dvol = '12';

var logger;

// The map of radio stations.
var stationList;
// The index of the currently selected station.
var stationIdx = 0;
//__________________________________________________________________________
/**
 * Changes the radio station.
 * Parameter: index the index of the station in the list of known stations.
 */
var setStation = function(index) {

    stationIdx = index;
    // Feed back.
    execSync(say + 'ok.wav');
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
        onair = root + '/bin/onair.sh ';
        setVolume = root + '/bin/set_volume.sh ' + dvol + ' ';
        say = root + '/bin/say.sh ';

        /**
         * Words leading to the same action are grouped in list of
         * synonyms.
         */
        var yesList   = ['okay', 'yes', 'yep', 'sure', 'absolutely'];
        var noList    = ['no', 'nope', 'no way'];
        var plusList  = ['more', 'louder', 'plus', 'higher'];
        var minusList = ['less', 'lower', 'minus'];
        var workList  = ['play', 'run', 'begin', 'music', 'radio', 'wake up'];
        var stopList  = ['terminate', 'shut up', 'silence', 'sleep', 'quiet'];
        var digitList = ['zero', 'one', 'two', 'three', 'four', 'five',
                         'six', 'seven', 'height', 'nine', 'ten'];
        var indexList = ['first', 'previous', 'next', 'last'];

        // The list of stations is fetched thanks to the script 'onair.sh'
        var str = execSync(onair + '-l');
        stationList = JSON.parse(str);

        for (var i=0; i <stationList.length; i++) {
            logger.log('info', stationList[i].key + ': '
                       + stationList[i].name);
        }
//__________________________________________________________________________
       /**
         * Processes a word request.
         * Returns the result of the processing.
         */
        app.get('/vox/process/:word', function(req, res) {

            var word = req.params.word;
            var code = 'undefined';

            logger.info('Word ' + word);

            /**
             * Start playing the last selected radio.
             */
            if (workList.indexOf(word) >= 0) {
                execSync(say + 'welcome_back.wav');
                execSync(onair);
                code = 'work';
            }
            /**
             * Stop playing.
             */
            else if (stopList.indexOf(word) >= 0) {
                execSync(onair + '-k');
                execSync(say + 'byebye.wav');
                code = 'stop';
            }
            /**
             * Increase or decrease volume.
             */
            else if (plusList.indexOf(word) >= 0) {
                execSync(say + 'louder.wav');
                execSync(setVolume + '+');
                code = 'plus';
            }
            else if (minusList.indexOf(word) >= 0) {
                execSync(say + 'softer.wav');
                execSync(setVolume + '-');
                code = 'minus';
            }
            else if (indexList.indexOf(word) >= 0) {
                // Change the current station
                var index = -1;

                if (word === 'first') {
                    index = 0;
                }
                else if (word === 'last') {
                    index = stationList.length - 1;
                }
                else if (word === 'previous') {
                    if (stationIdx > 0) {
                        index = stationIdx - 1;
                    }
                    else {
                      index = stationList.length - 1;  
                    }
                }
                else if (word === 'next') {
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
                    execSync(say + 'sorry.wav');
                }

                code = 'index';
            }
            else if (digitList.indexOf(word) >= 0) {

                //  Select another station
                var index = digitList.indexOf(word);

                if (index >= 0 && index <= stationList.length - 1) {
                    if (index != stationIdx) {
                        setStation(index);
                    }
                    else {
                        execSync(say + 'sure.wav');
                    }
                }
                else {
                    // No new correct index decoded.
                    execSync(say + 'sorry.wav');
                }

                code = 'digit';
            }
            // Other instructions are not yet implemented.
            else if (yesList.indexOf(word) >= 0) {
                // Actually does nothing
                execSync(say + 'ok.wav');
                code = 'ok';
            }
            else if (noList.indexOf(word) >= 0) {
                // Actually does nothing
                execSync(say + 'too_bad.wav');
                code = 'ok';
            }
            else if ('shutdown' === word) {
                execSync(say + 'confirm.wav');
                code = 'shutdown';
            }
            else if ('again' === word) {
                execSync(say + 'sure.wav');
                code = 'again';
            }
            else if ('goodbye' === word) {
                execSync(say + 'cu_later.wav');
                code = 'bye';
            }
            else {
                execSync(say + 'notundersand.wav');
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
     }
//__________________________________________________________________________
}
