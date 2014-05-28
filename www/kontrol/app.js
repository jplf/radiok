//__________________________________________________________________________
/**
 * Fonteny javascript library - March 2014

 * Usage: node app.js

 * It starts the http server on port 18000
 * The services are implemented in box.js

 * This software is governed by the
 * Gnu general public license (http://www.gnu.org/licenses/gpl.html)

 * This is a module managing operations on the server side.
 * @author Jean-Paul Le Fèvre <lefevre@fonteny.org>
 */
//__________________________________________________________________________

"use strict";

/**
 * Module dependencies. The http services are provided by these modules.
 * @see http://expressjs.com/
 */
var express = require('express');
var http    = require('http');
var path    = require('path');

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
var winston = require('winston');
var logger  = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({
            timestamp: true,
            filename: logfile})
   ]
});

logger.log('info', 'Starting server %s', 'ok');

var app = express();

app.set('port', 18000);

// Is this useful ?
app.set('views', __dirname + '/client/ejs');
app.set('view engine', 'ejs');

app.use(express.favicon());
app.use(express.bodyParser());
app.use(express.methodOverride());
/**
 * The session parameters.
 */
var password = '+0169083458';
app.use(express.cookieParser(password));
app.use(express.session({
    secret: password,
    cookie: {secure: false},
    maxAge: 300000
}));

/**
 * The Radio Box Kontrol server specific modules.
 */
var box = require('./server/box');
box.init(app, logger, root);

var vox = require('./server/vox');
vox.init(app, logger, root);

/**
 * Play every week day
 */
if (! box.trigger(root + '/run/trigger')) {
    console.log('Invalid box trigger !');
    process.kill();
}

/**
 * Initializes routing.
 */
app.use(app.router);
app.use(express.static(path.join(__dirname, 'client')));

/**
 * We are all set, the service can be started.
 */
http.createServer(app).listen(app.get('port'), function(){
    logger.log('info',
               'Radio Box Kontroller accepting connections on port %d',
               app.get('port'));
});
//__________________________________________________________________________
