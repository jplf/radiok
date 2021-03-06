/*___________________________________________________________________________*/
/**
 * @file split.c
 * @brief An test program used to split an audio input stream
 * into separate words.
 *
 * It was meant to prepare the french version of the full voice recognition
 * program.
 *
 * @see command.c The final program.
 *
 * @copyright Gnu general public license (http://www.gnu.org/licenses/gpl.html)
 *
 * @author Jean-Paul Le Fèvre
 * @date September 2014
 */
/* ====================================================================
 * Copyright (c) 1999-2001 Carnegie Mellon University.  All rights
 * reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer. 
 *
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in
 *    the documentation and/or other materials provided with the
 *    distribution.
 *
 * This work was supported in part by funding from the Defense Advanced 
 * Research Projects Agency and the National Science Foundation of the 
 * United States of America, and the CMU Sphinx Speech Consortium.
 *
 * THIS SOFTWARE IS PROVIDED BY CARNEGIE MELLON UNIVERSITY ``AS IS'' AND 
 * ANY EXPRESSED OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, 
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL CARNEGIE MELLON UNIVERSITY
 * NOR ITS EMPLOYEES BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT 
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, 
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY 
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT 
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE 
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
/*
 * This code has been modified by me (JPLF) starting from this program:
 * cont_adseg.c Continuously listen and segment input speech into utterances.
 * Found in directory sphinxbase-0.8/src/sphinx_adtools
 *
 * The original code was very old fashioned.
 */

#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include <math.h>

#include <sphinxbase/prim_type.h>
#include <sphinxbase/ad.h>
#include <sphinxbase/cont_ad.h>
#include <sphinxbase/err.h>
/*
 * To parse the command line arguments.
 */
#include <getopt.h>
typedef enum { false = 0, true = 1 } bool;

/**
 * Prints syntax and exit.
 */
static void usage();

/**
 * Segment raw A/D input data into utterances whenever silence
 * region of given duration is encountered.
 * Utterances are written to files named 0001.raw, 0002.raw, 0003.raw, etc.
 */
int main(int32 argc, char **argv)
{
    ad_rec_t *ad;
    cont_ad_t *cont;
    int32 k, uttno, ts, uttlen, endsilsamples;
    int16 buf[4096];
    FILE *fp;
    char file[1024];

    extern char *optarg;
    extern int   optind;
    int opt;

    /**
     * The main parameters and their default values.
     */
    int error = 0;
    int sps = 44100;
    float endsil = 1.0;
    bool verbose = true;
    char device[64];

    char* s = getenv("AUDIODEV");
    if (s == NULL) {
      strcpy(device, "plughw:1,0");
    }
    else {
      strcpy(device, s);
    }

    while((opt = getopt(argc, argv, "s:r:D:vh")) != EOF) {

      switch(opt) {
      case 'v'	:
        verbose = true;
        break;

      case 'h'	:
        usage(argv[0]);
        break;

      case 'r'	:
        sps = atoi(optarg);
        if(sps < 4000 || sps > 64000)
          error++;
        break;

      case 's'	:
        endsil = atof(optarg);
        if(endsil < 0. || endsil > 10.)
          error++;
        break;

      default:
        error++;
      }
    }

    if (verbose) {
      printf("sample rate: %d\nsilence: %f\ndevice: %s\n", sps, endsil, device);
    }

    if (error) {
      usage(argv[0]);
    }

    /** Convert desired min. inter-utterance silence duration to #samples */
    endsilsamples = (int32) (endsil * sps);

    if ((ad = ad_open_dev(device, sps)) == NULL) {
        E_FATAL("Failed to open audio device\n");
    }

    /**
     * Associate new continuous listening module with opened raw A/D device
     */
    if ((cont = cont_ad_init(ad, ad_read)) == NULL)
        E_FATAL("cont_ad_init failed\n");

    /** Calibrate continuous listening for background noise/silence level */
    if (verbose) {
      printf("Calibrating ...");
    }

    ad_start_rec(ad);
    if (cont_ad_calib(cont) < 0) {
        printf(" calibration failed\n");
    }
    else if (verbose) {
        printf(" done\n");
    }

    /** Almost forever listen for utterances */
    if (verbose) {
      printf("You may speak now\n");
    }

    for (uttno = 0; uttno < 999; uttno++) {
      /** Wait for beginning of next utterance; for non-silence data */
        while ((k = cont_ad_read(cont, buf, 4096)) == 0);
        if (k < 0)
            E_FATAL("cont_ad_read failed\n");

        /** Non-silence data received; open and write to new logging file */
        sprintf(file, "%03d.raw", uttno);
        if ((fp = fopen(file, "wb")) == NULL)
            E_FATAL_SYSTEM("Failed to open '%s' for writing", file);

        fwrite(buf, sizeof(int16), k, fp);
        uttlen = k;
        if (verbose) {
          printf("Utterance %04d, logging to %s\n", uttno, file);
        }

        /** Note current timestamp */
        ts = cont->read_ts;

        /* Read utterance data until a gap of at least 1 sec observed */
        for (;;) {
            if ((k = cont_ad_read(cont, buf, 4096)) < 0)
                E_FATAL("cont_ad_read failed\n");

            if (k == 0) {
              /**
                 * No speech data available; check current timestamp. 
                 * End of * utterance if no non-silence data been read
                 * for at least 1 sec.
                 */
                if ((cont->read_ts - ts) > endsilsamples)
                    break;
            }
            else {
              /**
                 * Note timestamp at the end of most recently
                 * read speech data
                 */
                ts = cont->read_ts;
                uttlen += k;
                fwrite(buf, sizeof(int16), k, fp);
            }
        }
        fclose(fp);

        if (verbose) {
          printf("\tUtterance %04d = %d samples (%.1fsec)\n\n",
                 uttno, uttlen, (double) uttlen / (double) sps);
        }
    }

    ad_stop_rec(ad);
    cont_ad_close(cont);
    ad_close(ad);

    return 0;
}
/*___________________________________________________________________________*/
/**
 * Prints usage and exit.
 * Parameter prog the name of the program.
 */
static void usage(char* prog) {

  printf("Usage: %s [-v] [-r sampling-rate] [-s silence(sec)] [-D device]\n",
          prog);

  exit(0);
}
/*___________________________________________________________________________*/
