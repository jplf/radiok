//__________________________________________________________________________
/**
 * Fonteny javascript library - March 2016
 * A test script used to test another approach to crontab.
 * It is motivated by the fact that radiok no longer works with
 * the new version of node, this script may useful to check an alternative.
 *
 * Usage: node cron_test.js
 *
 * See also : cron_test box.js
 * @author Jean-Paul Le Fèvre
 */
//__________________________________________________________________________

"use strict";

var root = process.env.RADIOK_HOME;

if (root === undefined) {
    console.log('Please export RADIOK_HOME=');
    process.kill();
}

var runSync = require('child_process').execSync;
var crontab = runSync('crontab -l', {encoding: 'utf-8'});
var lines   = crontab.split('\n');
var todo    = [];

for (var i = 0; i < lines.length; i++) {

    lines[i].trim();
    if (lines[i].length < 1) {
        continue;
    }
    todo.push(lines[i]);
}

var fs = require('fs');

var trigfile = root + '/run/cron_test.json'
var data = fs.readFileSync(trigfile);

var spec  = '*/5' + ' ' + '*' + ' * * * ';
spec = spec + '$HOME/bin/onair.sh -t 1 a-fip > cron.log 2>&1'
todo.push(spec);

crontab = lines[0];

for (var i = 1; i < todo.length; i++) {

    crontab = crontab + '\n' + todo[i];
}
crontab = crontab + '\n';

var cronfile = 'crontab.txt';
fs.writeFileSync(cronfile, crontab);

runSync('crontab ' + cronfile);

crontab = runSync('crontab -l', {encoding: 'utf-8'});
console.log(crontab);

//__________________________________________________________________________
