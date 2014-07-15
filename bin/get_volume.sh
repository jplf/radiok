#!/bin/bash
#______________________________________________________________________________

# Script get volume - Jean-Paul Le Fèvre April 2014
# It just prints the number.

# It uses a Perl regular expression in the grep command.
# See perlre(1) - Why backslash K ?
# See also onair.sh
#______________________________________________________________________________

regex="Left.+ \[\K(\d+)"

echo `amixer get PCM | grep -oP "$regex"`

#______________________________________________________________________________

