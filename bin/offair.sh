#!/bin/bash
#______________________________________________________________________________

# Fichier stop radiok - Jean-Paul Le Fèvre march 2014
# It may used to kill a running radio player.
# See also onair.sh
#______________________________________________________________________________

if [ -z "$RADIOK_HOME" ]; then
    echo "RADIOK_HOME undefined !"
    exit 1
fi

dir=$RADIOK_HOME/run
if [ ! -d "$dir" ]; then
    echo "Can't find directory $dir !"
    exit 1
fi

log=$dir/onair.log
pidfile=$dir/mplayer.pid

echo "Killing onair on `date` ..." >>$log

if [ -f $pidfile ]; then
    cat $pidfile
else
    echo "No $pidfile file found !" >>$log
fi

# These commands may fail gently.
/bin/killall -q -u lefevre mplayer >>$log
/bin/rm -f $pidfile

#______________________________________________________________________________

