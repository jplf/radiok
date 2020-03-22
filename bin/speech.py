#!/usr/bin/env python
# -*- coding: utf-8 -*-
#________________________________________________________________________________

"""
Ask google to recognize what has been said.

It is meant to see how it is possible to use python and the google api
for voice recognition.

Usage: speech.py [-o]
Environment variable GOOGLE_KEY must store your google developer key.

If option -o is given, google's reply is stored in file n.txt where
n is the loop index. It is meant to later test json parsing with a language C
library.

Just say 'stop' to exit the loop.

 @copyright Gnu general public license (http://www.gnu.org/licenses/gpl.html)
 @author Jean-Paul Le Fèvre
 @date December 2014

"""
#________________________________________________________________________________

import sys
import os
import getopt
import pycurl
import cStringIO
import json
import subprocess
import datetime

def usage():
    sys.stderr.write(__doc__)
    sys.exit(1)

def main(argv):

    # Do we keep in a file the google results ?
    keep = False
    
    try:                                
        opts, args = getopt.getopt(argv, 'ho', ['help', 'out'])
        
    except getopt.GetoptError:          
        usage()                         
        
    for opt, val in opts:
        if opt in ('-h', '--help'):
            usage()
        elif opt in ('-o', '--out'):
            keep = True

    google_key = os.getenv('GOOGLE_KEY')
    if google_key is None:
        print('Please set your GOOGLE_KEY !')
        sys.exit(1)

    # The specification of remote google app used for voice recognition
    spec = {'url': 'https://www.google.com/speech-api/v2/recognize',
            'output': 'json',
            'lang': 'fr-fr',
            'key': google_key
    }

    # The sox command line program with arguments used to catch words
    # The silence parameters have to be fixed
    silence = "silence 1 0.5 1% 1 0.5 1%"
    rec = "rec -V0 -q -t flac -r 44100 -b 16 - " + silence

    print('Say "stop" to exit the loop.')

    # The curl library is used to communicate with the google app.
    c = pycurl.Curl()
    u = spec['url'] + '?output=' + spec['output'] + '&lang=' + spec['lang']\
    + '&key=' + spec['key']

    c.setopt(c.URL, u)
    c.setopt(c.POST, 1)
    c.setopt(c.HTTPHEADER, ['Content-type: audio/x-flac; rate=44100;'])
    c.setopt(c.USERAGENT, 'Mozilla/5.0')

    # The loop index
    index = 0
    
    while True:

        print("\nSay something ...")
        # Word understood by sox will be in variable output
        p = subprocess.Popen(rec, stdout=subprocess.PIPE, shell=True)
        (output, err) = p.communicate()
        print("Popen code: ", p.returncode, "size: ", sys.getsizeof(output), "index:", index)

        # The buffer will store the google's answer
        buf = cStringIO.StringIO()
        c.setopt(c.WRITEFUNCTION, buf.write)

        t1 = datetime.datetime.now()
        # Curl is given the word and post is performed.
        c.setopt(pycurl.POSTFIELDS, output)
        c.perform()
        
        code = c.getinfo(pycurl.RESPONSE_CODE)
        if code != 200:
            print("Error code:", code)
            continue

        # Parse the reply from google
        out = buf.getvalue().splitlines()
        if len(out) < 2:
            print("Not enough lines got from google")
            continue

        if keep:
            filename = 'google-' + str(index) + '.json'
            handle = open(filename, 'w')
            handle.write(buf.getvalue())
            handle.close()
            
        result = json.loads(out[1]);
        found  = result['result'][0]['alternative']
        stop   = False
        
        t2 = datetime.datetime.now()
        print("Recognition time", int((t2 - t1).total_seconds() * 1000), "ms.")
        
        for s in found:
            word = s['transcript'].lower()
            print(word)
            stop = stop or (word == 'stop')

        buf.close()
        index += 1

        if stop:
            break

    print('\nHasta luego !')
    
if __name__ == "__main__":
    main(sys.argv[1:])
#________________________________________________________________________________
