#!/bin/bash
#______________________________________________________________________________

# A script to start the radio - Jean-Paul Le Fèvre march 2014

# Usage onair.sh [-k][-s][-l][-r] [-t time] [station]

# Option -h to see the list of options
# Option -k to kill a running player
# Option -t to set the duration of a play
# Option -s to find the status of the player
# Option -l to find the list of declared stations
# Option -r to check the reachability of the stations

# Argument station to select the radio station to listen.
# Volume control: amixer sset 'Master' 60%

#______________________________________________________________________________

# Output something like "a-fip, 2145" (radio key, process id)
function get_status {

    k="unknown"
    p=0

    if [ -f $keyfile ]; then
        k=`/bin/cat $keyfile`
    fi
    if [ -f $pidfile ]; then
        p=`/bin/cat $pidfile`
    fi

    echo "$k, $p"
}
#______________________________________________________________________________

# Pings a station
# Makes sure that the selected station is still connected to the internet and
# working. This test does not work if the site to be pinged do not handle
# a head request correctly.
function ping_station {

    url=${radios[$1]}

    if curl --output /dev/null --silent --head --fail "$url"; then
        echo "Station: $1 is on air"
        return 0
    elif [ "$1" = "b-inter" ]; then
        # France inter is used to wake up in the morning.
        echo "Station: $1 is not reachable"
        return 1
    else
        echo "Station: $1 may be not reachable"
        # May be because the reply by the server is wrong.
        return 0
    fi
}
#______________________________________________________________________________

# Output the  sorted list of known stations.
function print_list {

    # Necessary to process the last key (no comma appended)
    i=0
    l=$((${#radios[@]}-1))

    # Sort the keys
    list=`echo ${!radios[@]} | tr ' ' '\n'| sort | tr '\n' ' '`

    output="["

    for key in $list
    do
        output+="{\"key\":\"$key\", \"name\":\"${surnames[$key]}\"}"
        if [ $i -lt $l ]; then
           output+=", "  
        fi
        i=$(($i+1))
    done

    output+="]"

    echo $output
}
#______________________________________________________________________________

# Checks if the stations are reachable on the internet.
function check_list {

    # Sort the keys
    list=`echo ${!radios[@]} | tr ' ' '\n'| sort | tr '\n' ' '`

    for key in $list
    do
        ping_station $key
    done
    echo " "
}
#______________________________________________________________________________

# Launches mplayer and keeps track of the selected station and the pid.
# A duration may be specified.
function start {

    cmd="/usr/bin/mplayer -nogui -msglevel all=2 -vo null -idle -loop 0"
    url=${radios[$station]}

    # Mplayer demands this option for .m3u uri.
    if [[ $url =~ \.m3u$ ]]; then
        opt="-playlist -af volume=-10"
    else
        opt="-af volume=-10"
    fi

    echo $cmd $opt "$url">>$log

    if ping_station $station; then
        echo "Starting onair.sh $station on `date` ..." >>$log
    else
        echo "Station $station in not reachable on `date` ..." >>$log
        url="file://$RADIOK_HOME/lib/buffalo-soldier.mp3"
        echo "Playing $url"
    fi

    $cmd $opt $url 1>$RADIOK_HOME/run/mp.log 2>>$log &

    # Store pid and station into files.
    echo $! > $pidfile
    echo $station > $keyfile

    if [ -n "$time" ]; then
        echo "In queue:" >>$log
        /usr/bin/atq >>$log

        # Clean up the queue
        $RADIOK_HOME/bin/atrmall.sh

        echo "Playing onair.sh for $time minutes ..." >>$log
        at now +$time minutes -f $RADIOK_HOME/bin/offair.sh >>$log
    else
        echo "Playing onair.sh for ever ..." >>$log
    fi

    echo "Script onair.sh $station started !" >>$log
    get_status
}
#______________________________________________________________________________

# The list of my favorite radio stations.

# www.artificialworlds.net/blog/2012/10/17/bash-associative-array-examples/
# www.listenlive.eu/france.html
# http://www.linuxpedia.fr/doku.php/flux_radio
# As of may 2014 Radio France's urls are changed.

# It is not very elegant to have 2 arrays but it is easier and convenient.
# One stores the stream uri, the other the displayed names.
# The keys are prefixed by a letter to easily sort the list.
declare -A radios
declare -A surnames

# The key prefix is used to sort the list.
radios["a-fip"]="http://direct.fipradio.fr/live/fip-midfi.mp3";
surnames["a-fip"]="Fip Radio"

radios["c-musique"]="http://direct.francemusique.fr/live/francemusique-midfi.mp3";
surnames["c-musique"]="France Musique"

radios["b-inter"]="http://direct.franceinter.fr/live/franceinter-midfi.mp3";
surnames["b-inter"]="France Inter"

radios["d-culture"]="http://direct.franceculture.fr/live/franceculture-midfi.mp3";
surnames["d-culture"]="France Culture"

radios["r-chantefr"]="http://stream.chantefrance.com/stream_chante_france.mp3";
surnames["r-chantefr"]="Chante France"

radios["r-tsf"]="http://tsfjazz.ice.infomaniak.ch/tsfjazz-high.mp3";
surnames["r-tsf"]="TSF Jazz"

radios["s-swiss"]="http://stream.srg-ssr.ch/m/rsj/mp3_128"
surnames["s-swiss"]="Swiss Jazz"

radios["v-venice"]="http://109.123.116.202:8020"
surnames["v-venice"]="Venice Classic"

radios["w-world"]="http://direct.fipradio.fr/live/fip-webradio4.mp3"
surnames["w-world"]="Fip monde"

#______________________________________________________________________________

# The root directory of this application.
if [ -z "$RADIOK_HOME" ]; then
    export RADIOK_HOME=$HOME/work/git/radiok
    echo "Set RADIOK_HOME=$RADIOK_HOME"
fi

# The directory storing runtime parameters.
dir=$RADIOK_HOME/run
if [ ! -d "$dir" ]; then
    echo "Can't find directory $dir !"
    exit 1
fi

usage="Usage : $0 [-h][-k][-s][-l] [-t time] [station]"
log=$dir/onair.log

# The file used to remember the station playing
keyfile=$dir/key

# If defined stop playing
kill=

# If defined stop after time minutes
time=

# The key used to get the url
# Set by default to the last selected one or to fip
if [ -f $keyfile ]; then
    station=`/bin/cat $keyfile`
else
    station="a-fip"
fi

# The file keeping the mplayer pid
pidfile=$dir/mplayer.pid

while [ -n "$1" ]
do
case $1 in

    -k) kill="y" ;;

    -t) time=$2;
        shift ;;

    -s) get_status;
        exit 0 ;;

    -l) print_list;
        exit 0 ;;

    -r) check_list;
        exit 0 ;;

    -*) echo $usage
        echo "Stations : ${!radios[@]}"
        exit 1 ;;

    *)  station=$1
        break ;;
esac
shift
done

# Stop playing ...
if [ "$kill" = "y" ]; then
    $RADIOK_HOME/bin/offair.sh >>$log
    killStatus=$?
    get_status
    exit $killStatus
fi

# Check that the station is registered
if [ ! ${radios[$station]+_} ]; then
    echo "Unknown station: $station ! " >>$log
    exit 1
fi

# Check that time is a integer giving the number of minutes to play.
if [ -n "$time" ]; then
    if ! [[ $time =~ ^[0-9]+$ ]]; then
        echo "Bad duration: $time  ! "
        exit 1
    fi
fi

# Check if radio is already playing
# May try also /sbin/pidof -s mplayer ?
if [ -f $pidfile ]; then
    echo "Mplayer is already running ! " >>$log
    exit 1
fi

start
exit 0
#______________________________________________________________________________

