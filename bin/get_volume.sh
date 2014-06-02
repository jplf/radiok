#!/bin/bash
#______________________________________________________________________________

# Script get volume - Jean-Paul Le Fèvre April 2014
# It uses a Perl regular expression in the grep command.
# See perlre(1) - Why backslash K ?
# See also onair.sh
#______________________________________________________________________________

#  Mono: Playback 34 [53%] [-30.00dB] [on]

regex="Left.+ \[\K(\d+)"

echo `amixer -c 0 get $MIXER_CTRL | grep -oP "$regex"`

#______________________________________________________________________________

