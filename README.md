
**RadioK** is an application used to manage an internet radio implemented
on a *Raspberry Pi*.

It consists of a collection of shell scripts, a web server written with
[nodejs](http://nodejs.org/) packages,
a web page built with [angularjs](https://angularjs.org/)
and a client program allowing
to control vocally the Rpi thanks either
to the [Jasper](http://jasperproject.github.io/) library or
to the Google speech recognition API.

Main development is over and the current version is usable (but not by the wimps).

The full documentation is available in french from 
the [RadioK](http://www.fonteny.org/radiok) dedicated web site:
http://www.fonteny.org/radiok

The code is pretty well documented in english and
below is a brief summary in english of what is detailed in the full web site.

### Changelog
| Date         | Changes |
|--------------|---------|
| 05 January 2015 | Google based french version working. Version 2.0 |
| 06 August 2014 | Audio feedback improved. Version 1.2 |
| 21 July 2014 | This short README is online. Version 1.1 |
| 20 July 2014 | Documentation available in french |
| 15 July 2014 | First usable version 1.0 |

### Hardware

A computer with a sound card, a loud speaker and an internet
connection are needed. A *Raspberry* is an excellent choice to implement
this application.

### Architecture

The program *mplayer* is at the heart of the application. It is managed by
a bunch of small shell scripts. These scripts themselves are run thru a
web server. A client can send http request to the web server to trigger
the scripts.

A dedicated program is used to implement the voice control. Each time it
understands something said by a user it sends a http request containing
the words which were guessed. The words are interpreted as commands by the
web application which triggers an appropriate procedure.

Two versions of the voice recognition program have been implemented.
The first one is based on the [CMU Sphinx](http://cmusphinx.sourceforge.net/)
library and runs locally. It has been configured to understand english words.
The second version uses the google speech recognition API. The recorded sound
files are sent to the remote google web application which replies by the
interpreted text. The language is selected as a option in the configuration.

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

This script encapsulates the call either to the program *whatusay*
(local processing, english language)
or to the program *command* (remote processing, french language) 
which perform the voice recognition.

#### say.sh

This script encapsulates the call to *aplay* used to provide audio
feed back to the user. It uses a collection of recorded sentences contrary
to *tell.sh* which generates sounds from a string of characters.

#### tell.sh

This script encapsulates the google speech synthesis function and
is also used to provide audio feed back to the user. It is an alternative
to *say.sh*.

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
from a browser at the current time or at a later time, for instance in
the morning, and the volume can be changed.

The second one, *vox.js*, processes requests coming from the voice control
program. Depending on the word recognized by *whatusay* or *command*
and received by the web server different actions are taken.

The web pages sent by the server to the browsers are generated in the
AngularJS framework.

### Installation

This application can run on any computer running the linux operating system.
It is primarily intended to be installed on a raspberry pi box.

The linux distribution must have the program *mplayer* available, a working
audio configuration and an internet connection.

The first step consists of launching the command line scripts to make sure
that the basic commands work as expected.

Then the web server has to be set up. The NodeJS library and the necessary
modules must be downloaded and installed. The slider widget and the bootstrap
components have also to be installed in order to have a web user interface
correctly displayed. The style of the web pages is defined by a theme and
the radiok customization. The css file has to be regenerated in case of
a modification of the style.

The server is started by the script start.sh. The log files are found in
the *run* directory. In case of client-side errors a browser has the
possibility to show error messages.

### Voice control

Commands spoken by the user are grouped into lists of synomyms. Two versions
of the vocabulary are currently available : one in english
in the file *cmd-en.js*, the other in french in *cmd-fr.js*. The choice is made
in the module *vox.js*.

#### Local recognition

The list of words to be used as commands are kept in the file
*corpus-en.tst*. This file has to be compiled by the program
[*lmtool*](http://www.speech.cs.cmu.edu/tools/lmtool-new.html).

The source of the recognition program is in the file *whatusay.c*. If needed
the program can be regenerated using *make*. It is a good idea to see if it
works correctly by running it with *null* as the server url option.

The current version is working with an english vocabulary.

#### Remote recognition

The code of the program is in the file *command.c*. By default it is configured
to manage french words.

### Directories

* **bin**  scripts in bash, python, js, ...
* **lib**  miscellaneous resources : images, sounds ...
* **run**  files generated at runtime : log files, persistent data.
* **vox**  voice recognition programs. Local, english in **ps**,
Remote, french in **fr**
* **www**  web stuff. Documentation in **doc**, web application in **kontrol**
in which **server** and **client** have the related components.
