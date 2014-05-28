#!/bin/bash
#______________________________________________________________________________

# Script get state - Jean-Paul Le Fèvre March 2014
# It generates a json formatted string.
# Useful parameters are made available from this string.
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

out=/tmp/radiok.state

echo "{" >$out
s=`/bin/date "+%H h %M m %S s    %A %d %h %Y"`
echo "\"radiok\":" "\"$s\",">>$out

echo " " >>$out
log=$dir/onair.log
if [ -f $log ]; then
    s=`/bin/tail -1 $log`
    echo "\"onair\":" "\"$s\",">>$out
else
    echo "\"onair\":" "\"empty\",">>$out
fi


echo " " >>$out
s=`/sbin/iwconfig wlan0 2>/dev/null | fgrep Link | sed 's/^ *//'`
echo "\"wifi\":" "\"$s\",">>$out


echo " " >>$out
s=`/usr/bin/crontab -l | head -n 1`
echo "\"crontab\":" "\"$s\",">>$out

# Get the at queue and take care of the tab character.
echo " " >>$out
# Number of jobs in the at queue
n=`/usr/bin/atq | wc -l`
if [ $n -gt 1 ]; then
    s="$n jobs in the at queue"
else
    s=`/usr/bin/atq | tr '	' '   '`
fi
echo "\"atq\":" "\"$s\",">>$out

echo " " >>$out
pid=`/sbin/pidof -s mplayer`

if [ -n "$pid" ]; then
    s=`/bin/ps -p $pid --no-headers -o "%U %p %a"`
else
    s=""
fi
echo "\"mplayer\":" "\"$s\"">>$out
echo "}" >>$out

cat $out

#______________________________________________________________________________

