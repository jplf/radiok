#! /bin/sh
#______________________________________________________________________________

# Script used to start the frontend server.
# It checks the environment and starts.

# Jean-Paul Le Fèvre - November 2020
# @copyright Gnu general public license (http://www.gnu.org/licenses/gpl.html)

#______________________________________________________________________________

if [ -z "$RADIOK_HOME" ]; then
    echo "export RADIOG_HOME="
    exit 1
fi

if [ -z "$RADIOG_CONF" ]; then
    echo "export RADIOG_CONF="
    exit 1
fi

cd $RADIOK_HOME/run

echo "Check the configured values"
cat $RADIOG_CONF
cat $RADIOK_HOME/www/webui/src/assets/radiok-conf.json

echo "Backend server should be accepting requests !"

curl -s http://localhost:18300/player
if [ ! $? ]; then
    echo "Can't connect to the backend server, rc : $?"
    exit 1
fi

curl -s http://localhost:18300/device/info
if [ ! $? ]; then
    echo "Can't check the output device, rc : $?"
    exit 1
fi

# Launch the frontend server.
echo "Frontend server is being started !"

cd $RADIOK_HOME/www/webui

ng serve --host $HOSTNAME --port 18301 \
1>../run/frontend.log 2>../run/frontend.err &

echo "Frontend server is now online !"
echo "Go to http://$HOSTNAME:18301"

cd $RADIOG_HOME/run
touch timestamp.2
echo "Check the log files if necessary"

echo "The RadioK is about to be available but be patient !"
echo "Verify the backend on port 18300 and the frontend on port 18301"

exit 0

#______________________________________________________________________________
