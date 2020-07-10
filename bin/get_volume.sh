#!/bin/bash
#______________________________________________________________________________

# Script get volume - Jean-Paul Le Fèvre April 2014
# It just prints the number.

# It uses a Perl regular expression in the grep command.
# See perlre(1) - Why backslash K ?
# See also onair.sh

# Try `amixer scontrols` to get the name of the output
#______________________________________________________________________________

regex="Left.+ \[\K(\d+)"
scontrol="Master"

echo `amixer get $scontrol | grep -oP "$regex"`

#______________________________________________________________________________

