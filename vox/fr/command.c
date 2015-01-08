/*___________________________________________________________________________*/
/**
 * @file command.c
 * @brief The program used to send vocal commands in french to the radiok
 * server.
 *
 * Usage:
 * command [-vd]
 * [-r sampling-rate] [-s silence(sec)] [-D device] [-l language] [-u url]
 *
 * The proram listens continuously to the audio input, detects words when
 * they are prononced, stores this content in a flac file, sends this
 * file to the google engine, gets back the response, parses it, sends the
 * result to radiok server and prints the conclusion replied by radiok.
 *
 * @see split.c to see how to split audio stream into separate words.
 * @see parse.c to learn how to parse a json packet in the C language.
 * @see enflac.c to figure out how to convert a raw file into a flac file.
 * @see hark.c  to test storing speech into flac formatted file.
 * @see interpret.c to try the google api.
 *
 * @see whatusay.c The other version based on the pocket sphinx library.
 *
 * It would be nice to improve this code by encapsulating properly some
 * functions and also by creating a library instead of duplicating the
 * same code in many programs.
 *
 * @copyright Gnu general public license (http://www.gnu.org/licenses/gpl.html)
 *
 * @author Jean-Paul Le Fèvre
 * @date December 2014
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
 *
 * ====================================================================
 */
/**
 * This code merges routines from hark.c and from interpret.c
 *
 * See the google developer account associated with this project:
 * https://console.developers.google.com/project/dynamic-poet-655
 *
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

#include <json-parser/json.h>
#include <curl/curl.h>

/**
 * To parse the command line arguments.
 */
#include <getopt.h>
typedef enum { false = 0, true = 1 } bool;

#define NBR_SAMPLES   4096
#define MAX_SAMPLES 120000

#define MAX_FILE_SIZE 300000
#define MAX_RESPONSE_LENGTH 10000
#define MAX_WORD_LENGTH 48

#include <FLAC/stream_encoder.h>

static void     usage();

static int      start_flac_encoding(FLAC__byte*, int);
static int      make_flac_encoder(int);
static int      get_utterance(int16*);
static int      enflac_utterance(int, int16*);
static char*    interpret_flac();
static int      send_command(char*, char*);

static char*    type_name(json_type t);
static size_t   get_google_response(void *content, size_t size, size_t n,
                                    void *ptr);
static char*    parse_google_content(char*);

/**
 * Well that's not the most elegant way of programming but it saved my
 * time to code this kinda Fortran common ;)
 */
static bool verbose = false;
static bool debug   = false;

static FLAC__StreamEncoder* encoder = NULL;
static cont_ad_t* cont;
static int32 silence_samples;

static char* flacfile = "/tmp/utterance.flac";
static char* rawfile  = "utterance.raw";

static CURL* googlurl = NULL;
static char  error[CURL_ERROR_SIZE];
static char  google_response[MAX_RESPONSE_LENGTH];

static CURL* radiokurl = NULL;
static char  radiok_response[MAX_RESPONSE_LENGTH];
static char  vox_server_url[128];

/**
 * Starts the processing loop.
 */
int main(int32 argc, char **argv)
{
  ad_rec_t *ad;
  int32 total_samples;

  /**
   * The main parameters and their default values.
   */
  int error = 0;
  int sample_rate = 44100;
  float silence = 1.0;
  char device[64];
  char lang[12];

  strcpy(lang, "fr-fr");

  char* s = getenv("AUDIODEV");
  if (s == NULL) {
    strcpy(device, "plughw:1,0");
  }
  else {
    strcpy(device, s);
  }

  char* key = getenv("GOOGLE_KEY");
  if (key == NULL) {
    fprintf(stderr, "GOOGLE_KEY undefined\n");
    return 1;
  }

  extern char *optarg;
  extern int   optind;
  int opt;

  memset(vox_server_url, 0, sizeof(vox_server_url));

  while((opt = getopt(argc, argv, "s:r:D:u:l:vhd")) != EOF) {

    switch(opt) {
    case 'v'	:
      verbose = true;
      debug   = false;
      break;

    case 'd'	:
      verbose = true;
      debug   = true;
      break;

    case 'h'	:
      usage(argv[0]);
      break;

    case 'r'	:
      sample_rate = atoi(optarg);
      if(sample_rate < 4000 || sample_rate > 64000)
        error++;
      break;

    case 'D'	:
      strcpy(device, optarg);
      break;

    case 'l'	:
      strcpy(lang, optarg);
      break;

    case 'u'	:
      strcpy(vox_server_url, optarg);
      break;

    case 's'	:
      silence = atof(optarg);
      if(silence < 0. || silence > 10.)
        error++;
      break;

    default:
      error++;
    }
  }

  if (debug) {
    printf("Sample rate: %d\nsilence: %f\ndevice: %s\n",
           sample_rate, silence, device);
  }

  if (error) {
    usage(argv[0]);
  }

  /**
   * Prepare the connection to the google speech application.
   * The constant part of the request is prepared.
   */
  static char* google = "https://www.google.com/speech-api/v2/recognize";
  static char* output = "json";

  char google_url[256];
  strcpy(google_url, google);
  strcat(google_url, "?output="); strcat(google_url, output);
  strcat(google_url, "&lang="); strcat(google_url, lang);
  strcat(google_url, "&key="); strcat(google_url, key);

  struct curl_slist *slist = NULL;
  slist = curl_slist_append(slist, "Expect: 100-continue");
  slist = curl_slist_append(slist, "Content-type: audio/x-flac; rate=44100;");

  if(debug) {
    printf("URL: %s (size: %d)\n", google_url, strlen(google_url));
  }
  /**
   * The curl option are initialized.
   * @see http://curl.haxx.se/libcurl/c/
   */
  googlurl = curl_easy_init();
  curl_easy_setopt(googlurl, CURLOPT_WRITEFUNCTION, get_google_response);
  curl_easy_setopt(googlurl, CURLOPT_WRITEDATA, (void *)google_response);
  curl_easy_setopt(googlurl, CURLOPT_URL, google_url);
  curl_easy_setopt(googlurl, CURLOPT_POST, 1);
  curl_easy_setopt(googlurl, CURLOPT_USERAGENT, "Mozilla/5.0");
  curl_easy_setopt(googlurl, CURLOPT_HTTPHEADER, slist);
  curl_easy_setopt(googlurl, CURLOPT_ERRORBUFFER, error);
  curl_easy_setopt(googlurl, CURLOPT_VERBOSE, 0L);

  /**
   * Prepare the connection to the radiok server.
   */
  if (strlen(vox_server_url) > 0) {

      /* Add a trailing slash if necessary */
      if (vox_server_url[strlen(vox_server_url) -1 ] != '/') {
        strcat(vox_server_url, "/");
      }

      if (verbose) {
        printf("Radiok server URL: %s\n", vox_server_url);
      }

      radiokurl = curl_easy_init();
      curl_easy_setopt(radiokurl, CURLOPT_VERBOSE, 0);
      curl_easy_setopt(radiokurl, CURLOPT_WRITEFUNCTION, get_google_response);
      curl_easy_setopt(radiokurl, CURLOPT_WRITEDATA, (void *)radiok_response);
  }
  else if (verbose) {
    printf("No connection to the radiok server attempted !\n");
  }

  /**
   * Now prepare the pocket sphinx subprogram in charge of extracting
   * utterances when they happen.
   * @see split.c 
   * Convert desired min. inter-utterance silence duration to #samples
   */
  silence_samples = (int32)(silence * sample_rate);

  if ((ad = ad_open_dev(device, sample_rate)) == NULL) {
    fprintf(stderr, "Failed to open audio device %s\n", device);
    return 1;
  }

  /**
   * Associate new continuous listening module with opened raw A/D device
   */
  if ((cont = cont_ad_init(ad, ad_read)) == NULL) {
    fprintf(stderr, "Function cont_ad_init failed\n");
    return 1;
  }

  /**
   * Calibrate continuous listening for background noise/silence level
   */
  if (verbose) {
    printf("Calibrating ...");
  }

  ad_start_rec(ad);
  if (cont_ad_calib(cont) < 0) {
    printf(" calibration failed !\n");
    return 1;
  }

  /**
   * Forever listen for utterances
   */
  if (verbose) {
    printf(" you may speak now ...\n");
  }

  /**
   * Current number of caught words.
   */
  int utter_nbr = 0;
  bool forever  = true;
  struct timeval tv;
  char start_time[128];

  while (forever) {

    // This buffer gets the raw output.
    int16 utterance[MAX_SAMPLES];

    int total_samples = get_utterance(utterance);
    if (total_samples < 0) {
      fprintf(stderr, "Can't get utterance %d\n", utter_nbr);
      continue;
    }

    /**
     * Beginning of processing.
     * Number of milliseconds since Epoch.
     * This time is passed to the server which computes
     * the duration of the processing to get an idea of the performances.
     */
    gettimeofday(&tv, NULL);
    sprintf(start_time, "%llu",
            (unsigned long long)(tv.tv_sec) * 1000 +
            (unsigned long long)(tv.tv_usec) / 1000);

    /**
     * Then the new utterance has to be compressed used the flac
     * algorithm before being passed to google.
     * @see https://xiph.org/flac/api/index.html
     */
    if (make_flac_encoder(sample_rate) <0) {
      fprintf(stderr, "Can't make the flac encoder !\n");
      return 1;
    }

    if (enflac_utterance(total_samples, utterance) < 0) {
      fprintf(stderr, "Can't enflac utterance %d !\n", utter_nbr);
      forever = false;
    }

    if (encoder != NULL) {
      FLAC__stream_encoder_delete(encoder);
    }

    char* word;

    /**
     * Finally we may have a word suggested by google.
     * It is sent to the radiok server.
     */
    if ((word = interpret_flac()) == NULL) {
      fprintf(stderr, "Can't interpret utterance %d\n", utter_nbr);
      continue;
    }
    else if (verbose) {
      printf("Utterance %d: %s\n", utter_nbr, word);
    }

    /**
     * If we didn't say 'abandon' we keep on listening for the next utterance.
     * Otherwise we give up looping.
     */
    if (strcmp(word, "abandon") == 0) {
      forever = false;
      continue;
    }
    else if (send_command(word, start_time) < 0) {
      fprintf(stderr, "Sending command %s (%d) to radiok failed\n",
              word, utter_nbr);
    }

    utter_nbr++;
  }

  ad_stop_rec(ad);
  cont_ad_close(cont);
  ad_close(ad);

  curl_easy_cleanup(googlurl);

  return 0;
}
/*___________________________________________________________________________*/
/**
 * Begins to encode a buffer.
 */
static int start_flac_encoding(FLAC__byte* buffer, int nb_samples) {
  /**
   * Convert the packed little-endian 16-bit PCM samples
   * from the audio stream into an interleaved FLAC__int32 buffer for libFLAC
   */
  static FLAC__int32* pcm = NULL;

  pcm = (FLAC__int32*)realloc(pcm, nb_samples * sizeof(FLAC__int32));
  if (debug) {
    printf("Number of samples allocated in pcm: %d\n", nb_samples);
  }

  size_t i;

  for(i = 0; i < nb_samples; i++) {
    /**
     * Inefficient but simple and works on
     * big- or little-endian machines
     */
    pcm[i] = (FLAC__int32)(((FLAC__int16)(FLAC__int8)buffer[2*i+1] << 8)
                           | (FLAC__int16)buffer[2*i]);
  }
  /**
   * Feed samples to the encoder
   */
  FLAC__bool ok =
  FLAC__stream_encoder_process_interleaved(encoder, pcm, nb_samples);
  
  return ok ? 0 : -1;
}
/*___________________________________________________________________________*/
/**
 * Initializes the flac encoder.
 */
static int make_flac_encoder(int sample_rate) {

  if((encoder = FLAC__stream_encoder_new()) == NULL) {
    fprintf(stderr, "Can't allocate the flac encoder !");
    return -1;
  }

  FLAC__bool ok = true;
  int channels  =  1;
  int bps       = 16;

  ok &= FLAC__stream_encoder_set_verify(encoder, true);
  ok &= FLAC__stream_encoder_set_compression_level(encoder, 5);
  ok &= FLAC__stream_encoder_set_channels(encoder, channels);
  ok &= FLAC__stream_encoder_set_bits_per_sample(encoder, bps);
  ok &= FLAC__stream_encoder_set_sample_rate(encoder, sample_rate);
  ok &= FLAC__stream_encoder_set_total_samples_estimate(encoder, 0);

  if (!ok) {
    fprintf(stderr, "Can't set the flac encoder options !");
    return -1;
  }

  return 0;
}
/*___________________________________________________________________________*/
/**
 * Converts the input utterance into a flac compressed file.
 *
 * It was really hard to figure out how to use correctly the flac api.
 * I could not manage to avoid files written and read.
 * Returns the number of samples or -1.
 */
static int enflac_utterance(int total_samples, int16* utterance) {

  FLAC__StreamEncoderInitStatus status;
  status = FLAC__stream_encoder_init_file(encoder, flacfile, NULL, NULL);

  if(status != FLAC__STREAM_ENCODER_INIT_STATUS_OK) {
    fprintf(stderr, "Encoder initialization failed: %s\n",
            FLAC__StreamEncoderInitStatusString[status]);
    return -1;
  }

  size_t nb = total_samples * sizeof(int16);

  if (debug) {
    printf("Enflacing %d samples !\n", total_samples);
  }

  FLAC__byte* buffer = (FLAC__byte*) malloc(nb);

  memcpy((void*)buffer, (void*)utterance, nb);

  if (debug) {
    printf("Start encoding process !\n");
  }

  if (start_flac_encoding(buffer, total_samples) < 0) {
    fprintf(stderr, "Can't start the flac encoding process !\n");
    (void)free(buffer);
    return -1;
  }

  if (! FLAC__stream_encoder_finish(encoder)) {
    fprintf(stderr, "Encoder finalization failed\n");
  }

  (void)free(buffer);

  return 0;
}
/*___________________________________________________________________________*/
/**
 * Detects and stores an utterance.
 * Fills up the buffer
 * Returns the number of samples or -1.
 */
static int get_utterance(int16* utterance) {
    /**
     * Number of samples read in the audio stream.
     * A sample is a 16 bits integer.
     */
    int nbread;

    /**
     * Wait for beginning of next utterance; for non-silence data
     * read at most MAX_SAMPLES samples.
     */

    int16 buffer[NBR_SAMPLES];
    
    while ((nbread = cont_ad_read(cont, buffer, NBR_SAMPLES)) == 0);

    if (nbread < 0) {
      fprintf(stderr, "Function cont_ad_read failed\n");
      return -1;
    }

    int16* dest = utterance;
    memcpy(dest, buffer, nbread * sizeof(int16));
    dest += nbread;

    int total_samples = nbread;

    /* Note current timestamp */
    int32 ts = cont->read_ts;

    /* Read utterance data until a gap is observed */
    while (true) {

      if ((nbread = cont_ad_read(cont, buffer, NBR_SAMPLES)) < 0) {
        fprintf(stderr, "Call to cont_ad_read failed\n");
        continue;
      }

      if (nbread == 0) {
        /**
         * No speech data available; check current timestamp. 
         * End of * utterance if no non-silence data been read
         * for at least 1 sec.
         */
        if ((cont->read_ts - ts) > silence_samples) {
          break;
        }
      }
      else {
        /**
         * Note the timestamp at the end of most recently
         * read speech data
         */
        ts = cont->read_ts;
        total_samples += nbread;
        if (total_samples >= MAX_SAMPLES) {
          fprintf(stderr, "Too many samples read %d !\n", total_samples);
          return -1;
        }
      }

      memcpy(dest, buffer, nbread * sizeof(int16));
      dest += nbread;
    }

    return total_samples;
}
/*___________________________________________________________________________*/
/**
 * The following code is used to communicate with google to interpret
 * what was said.
 */
/*___________________________________________________________________________*/
/**
 * Makes the flac file interpreted by google.
 * Returns the word interpreted by google.
 */
static char* interpret_flac() {

  FILE* file;

  // The buffer is not dynamically allocated to avoid a malloc(3)
  // Make sure that MAX_FILE_SIZE is big enough.
  char buffer[MAX_FILE_SIZE]; 

  if ((file = fopen(flacfile, "rb")) == NULL) {
    fprintf(stderr, "Can't open %s for input\n", flacfile);
    return NULL;
  }

  size_t s = fread(buffer, 1, MAX_FILE_SIZE, file);
  buffer[s] = 0;

  if (debug) {
    fprintf(stdout, "Read %d bytes from %s\n", s, flacfile);
  }

  curl_easy_setopt(googlurl, CURLOPT_POSTFIELDSIZE, s);
  curl_easy_setopt(googlurl, CURLOPT_POSTFIELDS, buffer);

  // Reset the response buffer.
  memset(google_response, 0, sizeof(google_response));

  CURLcode rc;

  if ((rc = curl_easy_perform(googlurl)) != 0) {
    fprintf(stderr, "Can't perform %s rc: %s\n", flacfile,
            curl_easy_strerror(rc));
    fprintf(stderr, "Error: %s\n", error);

    return NULL;
  }

  char* word = parse_google_content(google_response);

  if (word == NULL) {
    fprintf(stderr, "Can't parse response: %s !\n", google_response);
    return NULL;
  }

  return word;
}
/*___________________________________________________________________________*/
/**
 * Gets the answer from google.
 * It may be called more than once so the output must be concateneted.
 */
static size_t get_google_response(void *output, size_t size, size_t n,
                                  void *ptr) {

  size_t realsize = size * n;
 
  if(realsize >= MAX_RESPONSE_LENGTH) {
    fprintf(stderr, "Not enough memory to handle curl response (%d/%d) !\n",
            realsize, MAX_RESPONSE_LENGTH);
    return 0;
  }

  if (debug) {
    fprintf(stdout, "Got %d bytes from google\n", realsize);
  }

  strncat((char*)ptr, (char*)output, realsize);

  return realsize;
}
/*___________________________________________________________________________*/
/**
 * Parses the answer from google.
 * Returns the word found or NULL.
 */
static char* parse_google_content(char* content) {

  if (content == NULL) {
    fprintf(stderr, "No content to parse !\n");
    return NULL;
  }

  if (debug) {
    printf("\nContent to parse:\n%s\n", content);
  }

  /**
   * Get rid of the first line which should only contain {"result":[]}
   * Then get the second line.
   */
  char * line = strtok(content, "\n");

  line = strtok(NULL, "\n");
  if (line == NULL) {
    fprintf(stderr, "No second line to parse !\n");
    return NULL;
  }

  /**
   * Then parse the content which should be a json formatted string.
   * json_array array  = (json_value)(*value);
   */
  json_value* value = json_parse(line, strlen(line));
  if (value == NULL) {
    fprintf(stderr, "Can't parse line %s !\n", line);
    return NULL;
  }

  if (value->type != json_object) {
    fprintf(stderr, "Wrong type %s / %s\n",
            type_name(value->type), type_name(json_object));
    return NULL;
  }

  int n = (value->u).object.length;
  int i = 0;
  /**
   * Extract the first word which was guessed by google.
   * The loop is not necessary.
   */
  json_object_entry entry = (value->u).object.values[i];

  if (strcmp("result", entry.name) != 0) {
    fprintf(stderr, "Wrong name %s / %s\n", entry.name, "result");
    fprintf(stderr, "%s\n", line);
    return NULL;
  }

  json_value* v = entry.value;

  if (v->type != json_array) {
    fprintf(stderr, "Wrong type %s / %s\n",
            type_name(v->type), type_name(json_array));
    fprintf(stderr, "%s\n", line);
    return NULL;
  }

  v = (v->u).array.values[0];
  if (v->type != json_object) {
    fprintf(stderr, "Wrong type %s / %s\n",
            type_name(v->type), type_name(json_object));
    fprintf(stderr, "%s\n", line);
    return NULL;
  }

  entry = (v->u).object.values[0];

  if (strcmp("alternative", entry.name) != 0) {
    fprintf(stderr, "Wrong name %s / %s\n", entry.name, "alternative");
    fprintf(stderr, "%s\n", line);
    return NULL;
  }

  v = entry.value;
  if (v->type != json_array) {
    fprintf(stderr, "Wrong type %s / %s\n",
            type_name(v->type), type_name(json_array));
    fprintf(stderr, "%s\n", line);
    return NULL;
  }

  v = (v->u).array.values[0];
  if (v->type != json_object) {
    fprintf(stderr, "Wrong type %s / %s\n",
            type_name(v->type), type_name(json_object));
    fprintf(stderr, "%s\n", line);
    return NULL;
  }

  int nk = (v->u).object.length;
  if (nk < 1) {
    fprintf(stderr, "Wrong number of keys: %d\n", nk);
    fprintf(stderr, "%s\n", line);
    return NULL;
  }

  entry = (v->u).object.values[0];
  json_value* v_word = entry.value;

  if (strcmp("transcript", entry.name) != 0 || v_word->type != json_string) {
    fprintf(stderr, "Wrong entry %s / %s\n",
            entry.name, type_name(v_word->type));
    fprintf(stderr, "%s\n", line);
    return NULL;
  }

  char* word = (v_word->u).string.ptr;

  if (verbose && nk > 1) {
    entry = (v->u).object.values[1];
    json_value* v_level = entry.value;

    if (strcmp("confidence", entry.name) != 0 || v_level->type != json_double){
      fprintf(stderr, "Wrong entry %s / %s\n",
              entry.name, type_name(v_level->type));
      fprintf(stderr, "%s\n", line);
      return NULL;
    }

    double level = (v_level->u).dbl;
    fprintf(stdout, "\nFound word: '%s' with confidence: %f\n", word, level);
  }
  else if (verbose) {
    fprintf(stdout, "\nFound word: '%s' without confidence\n", word);
  }

  return word;
}
/*___________________________________________________________________________*/
/**
 * Translates the enum value to strings.
 */
static char* type_name(json_type t) {

  switch(t) {
  case json_none:
    return "json_none";
  case  json_object:
    return "json_object";
  case  json_array:
    return "json_array";
  case  json_integer:
    return "json_integer";
  case  json_double:
    return "json_double";
  case  json_string:
    return "json_string";
  case  json_boolean:
    return "json_boolean";
  case  json_null:
    return "json_null";
  default:
    return "unknown";
  }
}
/*___________________________________________________________________________*/
/**
 * Sends a command to the radiok vox server.
 * If the connection is not actually set a message is just printed.
 * Parameter word the name of the command to send.
 * Parameter start_time the moment at which the word was heard.
 */
static int send_command(char* word, char* start_time) {

  if (radiokurl == NULL) {
    printf("%s at %s\n", word, start_time);
    return 0;
  }

  char command[256];
  strcpy(command, vox_server_url);
  strcat(command, word);
  strcat(command, "/");
  strcat(command, start_time);

  curl_easy_setopt(radiokurl, CURLOPT_URL, command);

  // Reset the response buffer.
  memset(radiok_response, 0, sizeof(radiok_response));

  int rc = curl_easy_perform(radiokurl);
  if (rc != CURLE_OK) {
    fprintf(stderr, "Curl to radiok failed: %s\n", curl_easy_strerror(rc));
    return -1;
  }

  printf("Radiok vox response: %s\n", radiok_response);

  return 0;
}
/*___________________________________________________________________________*/
/**
 * Prints usage and exit.
 * Parameter prog the name of the program.
 */
static void usage(char* prog) {

  printf("Usage: %s [-vd] [-r sampling_rate] [-s silence(sec)] [-D device] [-l language] [-u radiok_url\n", prog);

  exit(0);
}
/*___________________________________________________________________________*/
