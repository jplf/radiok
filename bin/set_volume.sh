#!/bin/bash
#______________________________________________________________________________

# Script set_volume - Jean-Paul Le Fèvre April 2014
# Usage: set_volume value [%|+|-]

# When the second parameter is null or '%' the volume is set to the
# specified value. When it is '+' or '-' the current volume value is
# increased or decreased. Otherwise the volume is not charged.

# See also amixer(1) onair.sh
#______________________________________________________________________________

# Set the new value.

if [ -z "$2" ]; then
    s="%"
elif [ "$2" = "%" ]; then
    s=$2
elif [ "$2" = "+" ]; then
    s=$2
elif [ "$2" = "-" ]; then
    s=$2
else
    exit 1
fi

amixer -c 0 set 'PCM' $1$s

# Keep track on the new value.

get_volume.sh > $RADIOK_HOME/run/volume

#______________________________________________________________________________

