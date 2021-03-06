#!/bin/sh
#________________________________________________________________________________

# This is a simple test script to see what whatusay understands.
# It does not communicate with the radiok webapp.

# Usage: ./trywords.sh

# The dictionary is generated from the corpus
# by lmtool : http://www.speech.cs.cmu.edu/tools/lmtool-new.html

# Other possible options: -adcdev hw:n -samprate 44000 -samprate 44000 -nfft 2048
#________________________________________________________________________________

corpus=words
opt="-adcdev $AUDIODEV -lm $corpus.lm -dict $corpus.dic"
./whatusay $opt -agc max -agcthresh 2.0

#________________________________________________________________________________
