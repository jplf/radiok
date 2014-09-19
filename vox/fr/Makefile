
#______________________________________________________________________________

# Makefile : 		radiok vox tool for the french language
# Septembre 2014	Jean-Paul Le Fèvre
#______________________________________________________________________________

ORGROOT := /usr/local

PROG	:= hark
SRC.c	:= hark.c

INC	:= -I$(ORGROOT)/include/sphinxbase \
	   -I$(ORGROOT)/include/pocketsphinx

CPPFLAGS := -DSTDC_HEADERS=1 -DHAVE_SYS_TYPES_H=1 -DHAVE_SYS_STAT_H=1 \
	    -DHAVE_STDLIB_H=1 -DHAVE_STRING_H=1 -DHAVE_MEMORY_H=1 \
	    -DHAVE_STRINGS_H=1 -DHAVE_INTTYPES_H=1 -DHAVE_STDINT_H=1 \
	    -DHAVE_UNISTD_H=1 -DHAVE_DLFCN_H=1 -DHAVE_LONG_LONG=1 \
	    -DSIZEOF_LONG_LONG=8 -DHAVE_DUP2=1 $(INC)

CFLAGS  := -O2
LDFLAGS	:= -L$(ORGROOT)/lib -lpocketsphinx -lsphinxbase -lsphinxad \
	   -lasound -lpthread -lm -lsamplerate -lsndfile -lcurl

todo	: encode hark

encode  : encode.c
	$(CC) -O2 -lFLAC -lm $< -o $@

clean	:
	@$(RM) $(PROG) *~ encode hark screenlog.?

cleanall : clean
	@$(RM) *.flac

#______________________________________________________________________________

