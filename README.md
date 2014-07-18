
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

### Implementation

Coming soon

### Installation

Coming soon

### Voice control

Coming soon


