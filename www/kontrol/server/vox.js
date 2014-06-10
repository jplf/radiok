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

// The scripts to run.
var onair;
var setVolume;
var say;

// Delta volume
var dvol = '20';

var logger;

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

        var yesList   = ['okay', 'yes', 'yep', 'sure', 'absolutely'];
        var noList    = ['no', 'nope', 'no way'];
        var plusList  = ['more', 'louder', 'plus', 'higher'];
        var minusList = ['less', 'lower', 'minus'];
        var workList  = ['play', 'run', 'begin', 'music', 'radio', 'wake up'];
        var stopList  = ['terminate', 'shut up', 'silence', 'sleep', 'quiet'];
        var digitList = ['zero', 'one', 'two', 'three', 'four', 'five',
                         'six', 'seven', 'height', 'nine', 'ten'];
        var indexList = ['first', 'previous', 'next', 'last'];

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
                execSync(onair + ' -k');
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
            else if (yesList.indexOf(word) >= 0) {
                execSync(say + 'ok.wav');
                code = 'ok';
            }
            else if (noList.indexOf(word) >= 0) {
                execSync(say + 'too_bad.wav');
                code = 'ok';
            }
            else if (indexList.indexOf(word) >= 0) {
                execSync(say + 'sorry.wav');
                code = 'index';
            }
            else if (digitList.indexOf(word) >= 0) {
                execSync(say + 'sorry.wav');
                code = 'digit';
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
//__________________________________________________________________________
    }
}
