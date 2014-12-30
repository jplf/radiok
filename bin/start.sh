#! /bin/sh
#______________________________________________________________________________

# Script used to start the server.
# It checks the environment and starts the command by screen(1).
# Jean-Paul Le Fèvre - March 2014

#______________________________________________________________________________

if [ -z "$RADIOK_HOME" ]; then
    echo "export RADIOK_HOME="
    exit 1
fi

if [ -z "$NODE_PATH" ]; then
    echo "export NODE_PATH="
    exit 1
fi

if [ -z "$AUDIODEV" ]; then
    echo "export AUDIODEV="
    exit 1
fi

if [ -z "$MIXER_CTRL" ]; then
    echo "export MIXER_CTRL="
    exit 1
fi

# Check current time and compare it to timestamp.0
touch $RADIOK_HOME/run/timestamp.1

rm -f $RADIOK_HOME/run/screenlog.? 2>/dev/null
mv -f $RADIOK_HOME/run/*.log $RADIOK_HOME/tmp 2>/dev/null

# Delete any remaining jobs in the at queue.
$RADIOK_HOME/bin/atrmall.sh

screen -L -d -m /usr/local/bin/node $RADIOK_HOME/www/kontrol/app.js

# Make sure the server is ready.
sleep 15

# Initialize the volume on the server
if [ -f $RADIOK_HOME/run/volume ]; then
    vol=`cat $RADIOK_HOME/run/volume`
else
    vol="20"
fi

/usr/bin/curl http://localhost:18000/box/set_volume/$vol >/dev/null

#______________________________________________________________________________
