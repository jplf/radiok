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

if [ -z "$RADIOK_PORT" ]; then
    export RADIOG_PORT=18303
fi

if [ -z "$RADIOG_CONF" ]; then
    echo "export RADIOG_CONF="
    exit 1
fi

# The backend server
if [ -z "$RADIOG_URL" ]; then
    export RADIOG_URL="http://localhost:18300"
fi

cd $RADIOK_HOME/run


echo "Backend server should be accepting requests !"

curl -s $RADIOG_URL/player > /dev/null
if [ $? -ne 0 ]; then
    echo "Can't connect to the backend server !"
    echo
    echo "Check the configured values"
    cat $RADIOG_CONF
    cat $RADIOK_HOME/www/webui/src/assets/radiok-conf.json
    exit 1
fi

curl -s $RADIOG_URL/device/info > /dev/null
if [ $? -ne 0 ]; then
    echo "Can't check the output device !"
    exit 1
fi

# Launch the frontend server.
echo "Frontend server is being started !"

cd $RADIOK_HOME/www/webui

ng serve --host $HOSTNAME --port $RADIOK_PORT \
1>$RADIOK_HOME/run/frontend.log 2>$RADIOK_HOME/run/frontend.err &

echo "Frontend server is now online !"
echo "Go to http://$HOSTNAME:$RADIOK_PORT"

cd $RADIOK_HOME/run
touch timestamp.2
echo "Check the log files if necessary"

echo "The RadioK is about to be available but be patient !"
echo "Verify the backend at $RADIOG_URL and the frontend on port $RADIOK_PORT"

exit 0

#______________________________________________________________________________
