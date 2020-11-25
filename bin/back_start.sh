#! /bin/sh
#______________________________________________________________________________

# Script used to start the backend server.
# It checks the environment and starts.

# The architecture of the new RadioK has been changed.
# The application is composed of 2 components : a backend server, the one
# developped for RadioG and a frontend server.
# The frontend provides the web interface and communicates via REST Api
# with the backend.

# Jean-Paul Le Fèvre - December 2020
# @copyright Gnu general public license (http://www.gnu.org/licenses/gpl.html)

#______________________________________________________________________________

if [ -z "$RADIOG_HOME" ]; then
    echo "export RADIOG_HOME="
    exit 1
fi
if [ -z "$RADIOK_HOME" ]; then
    echo "export RADIOK_HOME="
    exit 1
fi

# Check the current time to make comparison possible with timestamp.0
cd $RADIOK_HOME/run
touch timestamp.0

rm -f screenlog.? 2>/dev/null
mv -f *.log ../tmp/  2>/dev/null

# Launch the backend server.
echo "Backend server is being started !"

cd $RADIOG_HOME/backend
npm run start 1>../run/backend.log 2>../run/backend.err &

cd $RADIOK_HOME/run
touch timestamp.1

echo "Backend server is now accepting requests !"
curl -s http://localhost:18300/player | jq
curl -s http://localhost:18300/device/info | jq
echo "curl -s http://localhost:18300/player/listen/10"
echo "curl -s http://localhost:18300/player/off"

exit 0

#______________________________________________________________________________
