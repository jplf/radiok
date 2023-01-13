
**RadioK** is an application used to manage an internet radio implemented
on a *Raspberry Pi*.

It consists of a collection of shell scripts, a web server written in [typescript](https://www.typescriptlang.org/)
with [nodejs](http://nodejs.org/) packages,
a web page built with the new [Angular](https://angular.io)
and a client program allowing
to control vocally the Rpi thanks either
to the [Jasper](http://jasperproject.github.io/) library or
to the Google speech recognition API.


The first version was delivered by February 2015 and was usable (but not by the wimps). It has been in service without interruption since this date.
As of mid 2020 a complete new version was rebuilt.

The full documentation is available in french from 
the [RadioK](http://www.fonteny.org/radiok) dedicated web site:
http://www.fonteny.org/radiok

The code is pretty well documented in english and
below is a brief summary in english of what is detailed in the full web site.

### Changelog
| Date         | Changes |
|--------------|---------|
| 13 January 2023 | The packages for the original branch have been updated successfully |
| 02 December 2020 | The new version is working as designed |
| 23 November 2020 | The new version is now almost ready |
| 22 July 2020 | A big renovation is in progress. It is based on the new [Angular](https://gorrion.io/blog/angularjs-vs-angular) |
| 10 July 2020| A light renovation is carried out|
| 27 May 2020| Another different version of this app is being developped : [RadioG](https://github.com/jplf/radiog)|
| 20 May 2016 | Two crontabs are managed by the application |
| 23 April 2016 | New version based on the brave old crontab(1) |
| 11 February 2016 | I have successfully installed nodejs 5.5.0 on my slackware-based rpi |
| 30 December 2015 | Plain button replaced by a switch in the trigger page |
| 07 May 2015 | Updated for the new versions of nodejs modules. Version 3.1 |
| 23 February 2015 | Development is over |
| 05 January 2015 | Google based french version working. Version 2.0 |
| 06 August 2014 | Audio feedback improved. Version 1.2 |
| 21 July 2014 | This short README is online. Version 1.1 |
| 20 July 2014 | Documentation available in french |
| 15 July 2014 | First usable version 1.0 |


## Previous version
The rest of this page deals with the previous version of this app and must be considered as obsolete. However it is kept online temporarily.

### Hardware

A computer with a sound card, a loud speaker and an internet
connection are needed. A *Raspberry* is an excellent choice to implement
this application.

### Architecture

The program *mplayer* is at the heart of the application. It is managed by
a bunch of small shell scripts. These scripts themselves are run thru a
web server. A client can send http requests to the web frontend server to trigger
the scripts.

A dedicated program is used to implement the voice control. Each time it
understands something said by a user it sends a http request containing
the words which were guessed. The words are interpreted as commands by the
web backend application which triggers an appropriate procedure.

Two versions of the voice recognition program have been implemented.
The first one is based on the [CMU Sphinx](http://cmusphinx.sourceforge.net/)
library and it is run locally.
It has been configured to understand english words.
The second version uses the google speech recognition API. The recorded sound
files are sent to the remote google web application which replies by the
interpreted text. The language is selected as a option in the configuration.

### Update

This app is being slightly modified in July 2020. To make sure that it still works try :

1. `cd $RADIOK_HOME/bin`
1. `get_state.sh`
1. `get_volume.sh`
1. `ping.sh`
1. `onair.sh`
1. `offair.sh`

Guess the name of the soundcard with `amixer scontrols`.

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

The web pages sent by the server to the browser are generated in the
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

A new version (5.0) was committed in may 2016. It is no longer using the nodejs
crontab modules which were proven to be buggy. Alarms are now triggered by the
standard *crontab(1)* unix command. To allow *mplayer* to output sound when
started from *cron* you must belong to the *audio* group.

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

The current version is working with an english vocabulary. Development of
this version is discontinued since the efficiency of the recognition is less
than with the remote version.

#### Remote recognition

The code of the program is in the file *command.c*. By default it is configured
to manage french words but it can potentially accept any language by just
changing a parameter.

As for the local version the program starts by spliting the sounds recorded
from the microphone into chunks of data delimited by short periods of silence.
Once a chunk is detected it is written into a file using a compressed format.
This lossless compressed format is the [flac format](https://xiph.org/flac).
The file is given to the google recognition engine by a http request
transmitted to the google server.
The google web application sends back a list of strings corresponding to the
possible words expressed by the speaker.
The list which is json-formatted is parsed and the string which is the most
likeky is passed to the radiok web server. If it is understood as a valid
command it triggers an action of the application.

This version looks more reliable but seems to be a bit slower.


### Directories

* **bin**  scripts in bash, python, js, ...
* **lib**  miscellaneous resources : images, sounds ...
* **run**  files generated at runtime : log files, persistent data.
* **vox**  voice recognition programs. Local, english version in **ps**,
Remote, french version in **fr**
* **www**  web stuff. Documentation in **doc**, web application in **kontrol**
in which **backend** and **frontend** have the related components.
