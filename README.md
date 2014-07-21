
**RadioK** is an application used to manage an internet radio implemented
on a *Raspberry Pi*.

It consists of a collection of shell scripts, a web server written with
[nodejs](http://nodejs.org/) packages,
a web page built with [angularjs](https://angularjs.org/)
and a client program allowing
to control vocally the Rpi thanks
to the [Jasper](http://jasperproject.github.io/) library.

Work is still in progress but a first version is already usable by the braves.

The full documentation is available in french from 
the [RadioK](http://www.fonteny.org/radiok) dedicated web site:
http://www.fonteny.org/radiok

The code is pretty well documented in english and
below is a brief summary in english of what is detailed in the full web site.

### Hardware

A computer with a sound card, a loud speaker and an internet
connection is needed. A *Raspberry* is an excellent choice to implement
this application.

### Architecture

The program *mplayer* is at the heart of the application. It is managed by
a bunch of small shell scripts. These scripts themselves are run thru a
web server. A client can send http request to the web server to trigger
the scripts.

A dedicated program is used to implement the voice control. Each time it
understands something said by a user it sends a http request containing
the words which were guessed.

### The bash scripts

The next layer above the standard unix programs consists of bash scripts.
The main ones are the following :

#### onair.sh

It is the main script. It encapsulates the call to *mplayer* and
the management of the radio stations.

#### offair.sh

This script stops a running *mplayer*.

#### get_volume.sh

This script encapsulates *amixer* to get the value of the audio volume.

#### set_volume.sh

This script encapsulates *amixer* to change the value of the volume.

#### get_state.sh

This script generates a json formatted file providing the value of
some parameters. It is used by the web server to display information
about the application.

#### listen.sh

This script encapsulates the call to the program *whatusay* which
performs the voice recognition.

#### say.sh

This script encapsulates the call to *aplay* used to provide audio
feed back to the user.

#### start.sh

This script is used to start the web server with the correct environment.

#### radiok.sh

This last script launches the voice recognition program then the web server.
It is meant to be run at boot time.

### The web server

The http server is implemented thanks to the NodeJs library.
Two files *box.js* and *vox.js* have been written to process requests
arriving at the server. These requests can be sent by a browser or by
a program such as *curl*.

The first one, *box.js*, is in charge of calling
the bash scripts controlling the radio. The radio can be started, stopped
from a browser at the current time or at later time, for instance in
the morning, and the volume can be changed.

The second one, *vox.js*, processes requests coming from the voice control
program. Depending on the word recognized by *whatusay* and received by
the web server different actions are taken.

The web pages sent by the server to the browsers are generated in the
AngularJS framework.

### Installation

Coming soon

### Voice control

Coming soon


