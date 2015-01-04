#!/bin/bash
#______________________________________________________________________________

# Script listen.sh - Jean-Paul Le Fèvre June 2014
# 
# It listens to what is said by someone and sends a command to the webapp.
# See also kontrol/server/vox.js
#______________________________________________________________________________

if [ -z "$AUDIODEV" ]; then
    echo "export AUDIODEV="
    exit 1
fi

if [ "english" = "$1" ]; then
    echo "English version launched ! "
    cd $RADIOK_HOME/vox/ps
    corpus=words
    opt="-adcdev $AUDIODEV -lm $corpus.lm -dict $corpus.dic"
    screen -L -m -d ./whatusay $opt -agc max -agcthresh 2.0

else
    echo "Version française lancée ! "
    cd $RADIOK_HOME/vox/fr
    opt="-v -u http://localhost:18000/vox/process"
    screen -L -m -d ./command $opt
fi


#______________________________________________________________________________

