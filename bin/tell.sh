#!/bin/bash
#______________________________________________________________________________

# Script tell.sh - Jean-Paul Le Fèvre July 2014
# It generates speech from a written text.
# Contrary to say.sh it synthesizes the sound from any french text.
# See also say.sh
#______________________________________________________________________________

phrase="$*"
if [ -z "$phrase" ]; then
    phrase="quoi encore ?"
fi

cmd="/usr/bin/mplayer -ao alsa -really-quiet -noconsolecontrols -volume 95"
what="http://translate.google.com/translate_tts?ie=UTF-8&tl=fr&q="

$cmd $what"$phrase"

#______________________________________________________________________________

