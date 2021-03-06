/*___________________________________________________________________________*/
/**
 * @file whatusay.c
 * @brief What you say ?
 *
 * It is a simplified version of pocketsphinx_continuous for radiok.
 * This version use only the microphone to get the input stream.
 * It strives to figure out which words were said.
 * The vocabulary is defined in the file corpus-en.txt.
 * It has to provide the list of english words to understand.
 * This program is used as a client for the radiok control server.
 * The commands to the server are sent by http get calls.
 * These calls are implemented using libcurl.
 * The url of the server is given by the command line option -url.
 * If this url is 'none', 'null' no http connections are established.

 * The words which may be guessed are grouped in lists of synonyms
 * in the file cmd-en.js and are processed in the server module vox.js

 * @see command.c The other version based on the google API.
 *
 * @copyright Gnu general public license (http://www.gnu.org/licenses/gpl.html)
 *
 * @author Jean-Paul Le Fèvre
 * @date January 2015
 */

/*__________________________________________________________________________*/

/* ====================================================================
 * Copyright (c) 1999-2010 Carnegie Mellon University.  All rights
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
/**
 * continuous.c - Simple pocketsphinx command-line application to test
 *                both continuous listening/silence filtering from microphone
 *                and continuous file transcription.
 */

#include <stdio.h>
#include <string.h>

#include <signal.h>
#include <setjmp.h>
#include <sys/types.h>
#include <sys/time.h>

#include <sphinxbase/err.h>
#include <sphinxbase/ad.h>
#include <sphinxbase/cont_ad.h>

#include <pocketsphinx/pocketsphinx.h>

#include <curl/curl.h>
#define MAX_RESPONSE_LENGTH 4096
#define MAX_WORD_LENGTH 48

static const arg_t cont_args_def[] = {
    POCKETSPHINX_OPTIONS,
    /* Argument file. */
    { "-argfile",
      ARG_STRING,
      NULL,
      "Argument file giving extra arguments." },
    { "-adcdev", 
      ARG_STRING, 
      NULL, 
      "Name of audio device to use for input." },
    { "-url", 
      ARG_STRING, 
      NULL, 
      "Url of radiok server." },
    { "-time", 
      ARG_BOOLEAN, 
      "no", 
      "Print word times in file transcription." },
    CMDLN_EMPTY_OPTION
};

static ps_decoder_t *ps;
static cmd_ln_t *config;
static FILE* rawfd;

/** Sleep for specified msec */
static void sleep_msec(int32 ms)
{
    struct timeval tmo;

    tmo.tv_sec = 0;
    tmo.tv_usec = ms * 1000;

    select(0, NULL, NULL, NULL, &tmo);
}
/*__________________________________________________________________________*/
/**
 * Forces a string to lower case.
 * @param s the string to change.
 */
static char *strlwr(char *s)
{ 
  unsigned c; 
  unsigned char *p = (unsigned char *)s; 
  while (c = *p) *p++ = tolower(c); 
} 
/*__________________________________________________________________________*/
/**
 * Called by curl with the content replied by the server.
 * @see http://curl.haxx.se/libcurl/c/
 */
static size_t get_vox_response(void *content, size_t size, size_t n, void *ptr)
{
  size_t realsize = size * n;
 
  if(realsize >= MAX_RESPONSE_LENGTH) {
    fprintf(stderr, "Not enough memory to handle vox response (%d/%d) !\n",
            realsize, MAX_RESPONSE_LENGTH);
    return 0;
  }

  char* buf = (char*)ptr;

  strncpy(buf, (char*)content, realsize);
  buf[realsize] = 0;
 
  return realsize;
}
 /*__________________________________________________________________________*/
/*
 * Main utterance processing loop:
 *     for (;;) {
 * 	   wait for start of next utterance;
 * 	   decode utterance until silence of at least 1 sec observed;
 * 	   print utterance result;
 *         send result to the server.
 *     }
 */
static void recognize_from_microphone()
{
    ad_rec_t *ad;
    int16 adbuf[4096];
    int32 k, ts, rem;
    char const *hyp;
    char const *uttid;
    cont_ad_t *cont;
    /* Used to estimate the processing time */
    struct timeval tv;
    char start_time[128];

    /* For curl */
    int rc;
    char url[128];
    char word[MAX_WORD_LENGTH];
    char command[192];
    char response[MAX_RESPONSE_LENGTH];
    CURL* curl = NULL;

    if ((ad = ad_open_dev(cmd_ln_str_r(config, "-adcdev"),
                   (int)cmd_ln_float32_r(config, "-samprate"))) == NULL) {
        E_FATAL("Failed to open audio device\n");
    }

    strcpy(url, cmd_ln_str_r(config, "-url"));

    if (strcasecmp("none", url) == 0 || strcasecmp("null", url) == 0) {
      curl = NULL;
      printf("\nNo radiok server connection attempted !\n");
    }
    else {
      printf("\nRadiok server URL: %s\n", url);

      /* Add a trailing slash if necessary */
      if (url[strlen(url) -1 ] != '/') {
        strcat(url, "/");
      }

      curl = curl_easy_init( );
      curl_easy_setopt(curl, CURLOPT_VERBOSE, 0);
      curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, get_vox_response);
      curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *)response);
    }

    /* Initialize continuous listening module */
    if ((cont = cont_ad_init(ad, ad_read)) == NULL)
        E_FATAL("Failed to initialize voice activity detection\n");
    if (ad_start_rec(ad) < 0)
        E_FATAL("Failed to start recording\n");
    if (cont_ad_calib(cont) < 0)
        E_FATAL("Failed to calibrate voice activity detection\n");

    for (;;) {
        /* Indicate listening for next utterance */
        fflush(stderr);

        /* Wait data for next utterance */
        while ((k = cont_ad_read(cont, adbuf, 4096)) == 0)
            sleep_msec(100);

        if (k < 0) {
            E_FATAL("Failed to read audio\n");
        }

        /**
         * Non-zero amount of data received;
         * start recognition of new utterance.
         * NULL argument to uttproc_begin_utt =>
         * automatic generation of utterance-id.
         */

       if (ps_start_utt(ps, NULL) < 0) {
            E_FATAL("Failed to start utterance\n");
        }

       /**
         * Beginning of processing.
         * Number of milliseconds since Epoch.
         * This time is passed to the server which computes
         * the duration.
         */
        gettimeofday(&tv, NULL);
        sprintf(start_time, "%llu",
                (unsigned long long)(tv.tv_sec) * 1000 +
                (unsigned long long)(tv.tv_usec) / 1000);

        ps_process_raw(ps, adbuf, k, FALSE, FALSE);
        printf("\n");

        /* Note timestamp for this first block of data */
        ts = cont->read_ts;

        /** Decode utterance until end (marked by a "long" silence, >1sec) */
        for (;;) {
            /* Read non-silence audio data, if any,
             * from continuous listening module 
             */
            if ((k = cont_ad_read(cont, adbuf, 4096)) < 0)
                E_FATAL("Failed to read audio\n");
            if (k == 0) {
              /**
                 * No speech data available;
                 * check current timestamp with most recent
                 * speech to see if more than 1 sec elapsed.
                 * If so, end of utterance.
                 */
                if ((cont->read_ts - ts) > DEFAULT_SAMPLES_PER_SEC)
                    break;
            }
            else {
                /* New speech data received; note current timestamp */
                ts = cont->read_ts;
            }
            /**
             * Decode whatever data was read above.
             */
            rem = ps_process_raw(ps, adbuf, k, FALSE, FALSE);

            /* If no work to be done, sleep a bit */
            if ((rem == 0) && (k == 0))
                sleep_msec(20);
        }

        /**
         * Utterance ended; flush any accumulated,
         * unprocessed A/D data and stop
         * listening until current utterance completely decoded
         */
        ad_stop_rec(ad);
        while (ad_read(ad, adbuf, 4096) >= 0);
        cont_ad_reset(cont);

        ps_end_utt(ps);
        hyp = ps_get_hyp(ps, NULL, &uttid);
        printf("%s: %s %s\n", uttid, hyp, start_time);
        fflush(stdout);

        if (hyp && strlen(hyp) > 1) {

            strncpy(word, hyp, MAX_WORD_LENGTH - 1);
            strlwr(word);

            /**
             * Communicate with the radiok server.
             */
            if (curl != NULL) {
              /** Prepare the request to send */
              strcpy(command, url);
              strcat(command, word);
              strcat(command, "/");
              strcat(command, start_time);
              curl_easy_setopt(curl, CURLOPT_URL, command);

              /** Send the request */
              rc = curl_easy_perform(curl);
              if (rc != CURLE_OK) {
                fprintf(stderr, "Curl failed: %s\n", curl_easy_strerror(rc));
              }
              /** The callback sets the response */
              printf("Vox response: %s\n", response);
            }
            /** Exit if the first word spoken was GOODBYE */
            if (strcmp(word, "goodbye") == 0)
                break;
        }

        /* Resume A/D recording for next utterance */
        if (ad_start_rec(ad) < 0) {
            E_FATAL("Failed to start recording\n");
        }
    }

    if (curl != NULL) {
      curl_easy_cleanup(curl);
    }

    cont_ad_close(cont);
    ad_close(ad);
}

/**
 * I'm not sure that it is really necessary.
 */
static jmp_buf jbuf;
static void sighandler(int signo)
{
    longjmp(jbuf, 1);
}
/*__________________________________________________________________________*/

int main(int argc, char *argv[])
{
    char const *cfg;

    if (argc == 2) {
        config = cmd_ln_parse_file_r(NULL, cont_args_def, argv[1], TRUE);
    }
    else {
        config = cmd_ln_parse_r(NULL, cont_args_def, argc, argv, FALSE);
    }
    if (config == NULL)
        return 1;

    ps = ps_init(config);
    if (ps == NULL)
        return 1;

    err_set_logfp(NULL);

    E_INFO("%s COMPILED ON: %s, AT: %s\n\n", argv[0], __DATE__, __TIME__);

    /* Make sure we exit cleanly */
    /* Signals seem to be broken in arm-wince-pe. */
#if !defined(__SYMBIAN32__)
    signal(SIGINT, &sighandler);
#endif

    if (setjmp(jbuf) == 0) {
        recognize_from_microphone();
    }

    ps_free(ps);
    return 0;
}
/*___________________________________________________________________________*/
