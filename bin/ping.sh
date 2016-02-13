#!/bin/sh

#______________________________________________________________________________
# Pings a station
# Makes sure that the selected station is still connected to the internet and
# working.
function ping_station {
 
    if curl -o /dev/null --silent --fail --head "$1"; then
        echo "Station: $1 is on air"
        return 0
    else
        echo "Station: $1 is not reachable"
        return 1
    fi
}
#______________________________________________________________________________

#url="http://audio.scdn.arkena.com/11008/franceinter-midfi128.mp3"
#ping_station $url

url="http://109.123.116.202:8020"
ping_station $url

url="http://tsfjazz.ice.infomaniak.ch/tsfjazz-high.mp3"
ping_station $url

#______________________________________________________________________________
