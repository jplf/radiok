#!/bin/bash
#______________________________________________________________________________

# Script listen.sh - Jean-Paul Le Fèvre June 2014
# 
# It listens to what is said by someone close to the micropone and sends
# a command to the webapp.
#
# By default it starts the 'french' version of the command program based on
# the remote google api. If the string 'english' is given as argument it starts
# the whatusay program based on the local sphinx library.
#
# See also kontrol/server/vox.js
#
# @copyright Gnu general public license (http://www.gnu.org/licenses/gpl.html)
#______________________________________________________________________________

if [ -z "$AUDIODEV" ]; then
    echo "export AUDIODEV="
    exit 1
fi

if [ "english" = "$1" ]; then
    echo "English version launched ! "
    cd $RADIOK_HOME/vox/ps
    corpus=words
    opt="-url http://localhost:18000/vox/process"
    opt="-adcdev $AUDIODEV -lm $corpus.lm -dict $corpus.dic $opt"
    screen -L -m -d ./whatusay $opt -agc max -agcthresh 2.0

else
    echo "Version française lancée ! "
    # Actually an other language could be selected using the -l option.
    cd $RADIOK_HOME/vox/fr
    opt="-v -u http://localhost:18000/vox/process"
    ./command $opt
fi

#______________________________________________________________________________

