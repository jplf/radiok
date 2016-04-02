//__________________________________________________________________________
/**
 * Fonteny javascript library - March 2014

 * Usage: node app.js

 * It starts the http server on port 18000
 * The services are implemented in box.js and in vox.js for the vox control.

 * This software is governed by the
 * Gnu general public license (http://www.gnu.org/licenses/gpl.html)

 * This is a module managing operations on the server side.
 * @author Jean-Paul Le Fèvre <lefevre@fonteny.org>
 */
//__________________________________________________________________________

"use strict";
/**
 * The default port number used by this web application.
 * The serveur will be available at http://localhost:18000
 */
var port = 18000;

/**
 * Module dependencies. The http services are provided by these modules.
 * @see http://expressjs.com/
 */
var express = require('express');
var http    = require('http');
var path    = require('path');

var favicon        = require('serve-favicon');
var bodyParser     = require('body-parser');
var methodOverride = require('method-override');

var root = process.env.RADIOK_HOME;

if (root === undefined) {
    console.log('Please export RADIOK_HOME=');
    process.kill();
}
/**
 * Logging initialization using winston.
 */
var fs = require('fs');
var logfile = root + '/run/radiok.log';

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
            filename: logfile})
   ]
});

logger.log('info', 'Starting server %s', 'ok');

var app = express();

app.set('port', port);

app.use(favicon(__dirname + '/client/triskell.ico'));
app.use(bodyParser.json());
app.use(methodOverride());

/**
 * The Radio Box Kontrol server specific modules.
 */
var box = require('./server/box');
box.init(logger, root);
box.sender(app);

var vox = require('./server/vox');

/**
 * Initialize the wake up trigger from a configuration file.
 * Play every week day by default.
 */
if (! box.trigger(root + '/run/triggers.json')) {
    console.log('Invalid box triggers file !');
    process.kill();
}

app.use(express.static(path.join(__dirname, '/client')));

app.get("/state", function(req, res, next){
  res.sendFile(__dirname + '/client/index.html');
});

app.get("/trigger", function(req, res, next){
  res.sendFile(__dirname + '/client/index.html');
});

/**
 * We are all set, the service can be started.
 */
http.createServer(app).listen(app.get('port'), function(){
    logger.log('info',
               'Radio Box Kontroller accepting connections on port %d',
               app.get('port'));
});
//__________________________________________________________________________
