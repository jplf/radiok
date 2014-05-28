#! /bin/sh
#______________________________________________________________________________

# Script used to start the server
# Jean-Paul Le Fèvre - April 2014

#______________________________________________________________________________

export NODE_PATH=/usr/local/lib/node_modules
export RADIOK_HOME=$HOME/work/radiok
export PATH=/bin:/usr/bin:/usr/local/bin:$HOME/bin:$RADIOK_HOME/bin

cd $RADIOK_HOME/run

# Check the current time. Then compare timestamp.0 and timestamp.1
rm -f timestamp.?
touch timestamp.0

# Make almost sure that ntpd has set the right time.
at now + 5 minutes -f $RADIOK_HOME/bin/start.sh

#______________________________________________________________________________
