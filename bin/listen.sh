#!/bin/bash
#______________________________________________________________________________

# Script listen.sh - Jean-Paul Le Fèvre June 2014
# 
# It listens to what is said by someone and sends a command to the webapp.
# See also kontrol/server/vox.js
#______________________________________________________________________________

cd $RADIOK_HOME/vox/ps

corpus=words
opt="-adcdev plughw:1,0 -lm $corpus.lm -dict $corpus.dic"
screen -L -m -d ./whatusay $opt -agc max -agcthresh 2.0

#______________________________________________________________________________

