#! /bin/sh
#______________________________________________________________________________

# Script used to start the server
# Jean-Paul Le Fèvre - April 2014

#______________________________________________________________________________

export NODE_PATH=/usr/local/lib/node_modules
export RADIOK_HOME=$HOME/work/git/radiok
export PATH=/bin:/usr/bin:/usr/local/bin:$HOME/bin:$RADIOK_HOME/bin

cd $RADIOK_HOME/run

# Clean up any remaining timestamps.
rm -f timestamp.?
# Note the current time.
# On the RPi the time is not locally kept. Clock is set by the ntp program
# and one must make sure that this initialization is properly performed.
# This may be check by comparing the timestamp created in start.sh
touch timestamp.0

# Make almost sure that ntpd has set the right time.
sleep 60
$RADIOK_HOME/bin/listen.sh
sleep 300
$RADIOK_HOME/bin/start.sh

#______________________________________________________________________________
