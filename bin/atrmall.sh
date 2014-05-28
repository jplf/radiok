#!/bin/bash
#______________________________________________________________________________

# Script atrmall.sh - Jean-Paul Le Fèvre April 2014
# It removes all at jobs.
# It was pretty hard to find out how to get the list of jobs from the while loop
# See at(1)
#______________________________________________________________________________

list=

# atq(1) gives the list of jobs. Each line provides the id and some extra stuff.
# The {} are mandatory to get the global list updated.
atq | { \
while read jobid stuff
do
    list+="$jobid "
done

if [ -n "$list" ]
then
    atrm $list
fi
}

atq

#______________________________________________________________________________

