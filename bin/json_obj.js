//__________________________________________________________________________
/**
 * Fonteny javascript library - May 2016
 * A test script used to check how json objects are handled in javascript
 *
 * Usage: node json_obj.js
 * @author Jean-Paul Le Fèvre
 *
 */
//__________________________________________________________________________

"use strict";

var triggerState = {
    wakeup: {
        hour:     "6",
        minute:   "59",
        day:      "*",
        duration: "20",
        set:      "false",
        station:  "b-inter"
    },
    alarm: {
        hour:     "16",
        minute:   "0",
        day:      "*",
        duration: "20",
        set:      "false",
        station:  "a-fip"
    }
};

console.log(triggerState);

console.log('\n');

triggerState.wakeup.hour = "24";

triggerState.alarm = {
        hour:     "0",
        minute:   "30",
        day:      "1",
        duration: "60",
        set:      "true",
        station:  "b-inter"
    }

console.log(triggerState);

//__________________________________________________________________________
