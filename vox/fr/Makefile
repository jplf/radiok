#______________________________________________________________________________

# Makefile : 		radiok vox tool for the french language
# Septembre 2014	Jean-Paul Le Fèvre
#______________________________________________________________________________

ORGROOT := /usr/local

INC	:= -I$(ORGROOT)/include/sphinxbase \
	   -I$(ORGROOT)/include/pocketsphinx \
	   -I/opt/Flac/include

CPPFLAGS := -DSTDC_HEADERS=1 -DHAVE_SYS_TYPES_H=1 -DHAVE_SYS_STAT_H=1 \
	    -DHAVE_STDLIB_H=1 -DHAVE_STRING_H=1 -DHAVE_MEMORY_H=1 \
	    -DHAVE_STRINGS_H=1 -DHAVE_INTTYPES_H=1 -DHAVE_STDINT_H=1 \
	    -DHAVE_UNISTD_H=1 -DHAVE_DLFCN_H=1 -DHAVE_LONG_LONG=1 \
	    -DSIZEOF_LONG_LONG=8 -DHAVE_DUP2=1 $(INC)

CFLAGS  := -g
LDFLAGS	:= -L$(ORGROOT)/lib -logg \
	   -lpocketsphinx -lsphinxbase -lsphinxad \
	   -lasound -lpthread -lm -lsamplerate -lsndfile -lcurl

todo	: parse enflac split hark interpret command

# Note than a static link leads to a segfault. Dunno why !
hark 	: hark.c
	$(CC) $(CPPFLAGS) $(CFLAGS) $(LDFLAGS) -L/opt/Flac/lib -lFLAC -lm $< -o $@

command : command.c
	$(CC) $(CPPFLAGS) $(CFLAGS) $(LDFLAGS) -L/opt/Flac/lib -lFLAC -lm $< -o $@

split	: split.c
	$(CC) $(CPPFLAGS) $(CFLAGS) $(LDFLAGS) $< -o $@

parse  : parse.c
	$(CC) -I$(ORGROOT)/include $(CFLAGS) $< -L$(ORGROOT)/lib -ljsonparser -lm -o $@

enflac  : enflac.c
	$(CC) $(CFLAGS) -I/opt/Flac/include -L/opt/Flac/lib -lFLAC -lm $< -o $@

interpret  : interpret.c
	$(CC) $(CFLAGS) $< -L$(ORGROOT)/lib -ljsonparser -lcurl -lm -o $@

clean	:
	@$(RM) $(PROG) *~ enflac hark split parse interpret command screenlog.?

cleanflac :
	@$(RM) *.flac *.raw

#______________________________________________________________________________

