#!/bin/bash
#______________________________________________________________________________

# Script say.sh - Jean-Paul Le Fèvre June 2014
# It plays an audio message found in the radiok library.
# See also aplay(1)
#______________________________________________________________________________

file=$RADIOK_HOME/lib/sounds/$1

if [ -f $file ]; then
    /usr/bin/aplay -N $file 1>/dev/null 2>&1
    exit 0
else
    exit 1
fi

#______________________________________________________________________________

