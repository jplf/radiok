//__________________________________________________________________________
/**
 * Fonteny javascript library - January 2015
 * A test script used to check how utf strings are managed in javascript
 *
 * Usage: node utf_str.js string
 * @author Jean-Paul Le Fèvre
 *
 */
//__________________________________________________________________________

"use strict";

var s1 = "Jean-Paul";
var s2 = "LeFèvre"
var s3 = "lefevre"
var s4 = "çà"

// Actually there is nothing to worry about.
process.argv.forEach(function (val, i, array) {
    if (i > 1) {

        console.log('val:', val);

        if (val === s1) {
            console.log('val = ', s1);  
        }
        else {
            console.log('val # ', s1);    
        }
        if (val === s2) {
            console.log('val = ', s2);  
        }
        else {
            console.log('val # ', s2);    
        }
        if (val === s3) {
            console.log('val = ', s3);  
        }
        else {
            console.log('val # ', s3);    
        }
        if (val === s4) {
            console.log('val = ', s4);  
        }
        else {
            console.log('val # ', s4);    
        }
    }
});
//__________________________________________________________________________
