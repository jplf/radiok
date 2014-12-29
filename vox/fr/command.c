/*___________________________________________________________________________*/
/**
 * @file command.c
 * @brief command [-vd] [-r sampling-rate] [-s silence(sec)] [-D device]
 *
 * The program used to send commands interpreted by google to the radiok
 * server.
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

#define MAX_SAMPLES 4096

#include <FLAC/stream_encoder.h>

/**
 * Prints syntax and exit.
 */
static void usage();

static int start_flac_encoding();
static int make_flac_encoder();
static int get_utterance(int16*);
static int enflac_utterance(int, int16*);

static FLAC__StreamEncoder* encoder = NULL;
static bool verbose = true;
static bool debug   = false;
static cont_ad_t* cont;
static int32 silence_samples;

static char* flacfile = "utterance.flac";
static char* rawfile  = "utterance.raw";

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

  char* s = getenv("AUDIODEV");
  if (s == NULL) {
    strcpy(device, "plughw:1,0");
  }
  else {
    strcpy(device, s);
  }

  extern char *optarg;
  extern int   optind;
  int opt;

  while((opt = getopt(argc, argv, "s:r:D:vhd")) != EOF) {

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
    printf(" you may speak now\n");
  }

  /**
   * Current number of caught words.
   */
  int utter_nbr = 0;
  bool forever  = true;

  while (forever) {

    int16 utterance[MAX_SAMPLES];

    int total_samples = get_utterance(utterance);

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

    utter_nbr++;
    forever = false;
  }

  ad_stop_rec(ad);
  cont_ad_close(cont);
  ad_close(ad);

  return 0;
}
/*___________________________________________________________________________*/
/**
 * Begins to encode a buffer.
 */
static int start_flac_encoding(FLAC__byte* buffer, int nb_samples) {
  /*
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
   * Feed samples to encoder
   */
  FLAC__bool ok =
  FLAC__stream_encoder_process_interleaved(encoder, pcm, nb_samples);
  
  return ok ? 0 : -1;
}
/*___________________________________________________________________________*/
/**
 * Initializes the Flac encoder.
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
  if (debug) {
    printf("Buffer %d (%d) bytes !\n", sizeof(buffer), nb);
  }

  FILE* fq = fopen(rawfile, "rb");
  int nr = fread(buffer, sizeof(int16), total_samples, fq);
  printf("Number of bytes read: %d\n", nr * sizeof(int16));
  fclose(fq);

  //memcpy((void*)buffer, (void*)utterance, nb);

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
static int get_utterance(int16* buffer) {
    /**
     * Number of samples read in the audio stream.
     * A sample is a 16 bits integer.
     */
    int nbread;

    /**
     * Wait for beginning of next utterance; for non-silence data
     * read at most MAX_SAMPLES samples.
     */
    
    while ((nbread = cont_ad_read(cont, buffer, MAX_SAMPLES)) == 0);

    if (nbread < 0) {
      fprintf(stderr, "Function cont_ad_read failed\n");
      return -1;
    }

    FILE *fp;

    if ((fp = fopen(rawfile, "wb")) == NULL) {
      fprintf(stderr, "Failed to open '%s' for writing", rawfile);
      return -1;
    }
    fwrite(buffer, sizeof(int16), nbread, fp);

    int total_samples = nbread;

    /* Note current timestamp */
    int32 ts = cont->read_ts;

    /* Read utterance data until a gap is observed */
    while (true) {

      if ((nbread = cont_ad_read(cont, buffer, MAX_SAMPLES)) < 0) {
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
      }

      fwrite(buffer, sizeof(int16), nbread, fp);
    }

    fclose(fp);

    return total_samples;
}
/*___________________________________________________________________________*/
/**
 * Prints usage and exit.
 * Parameter prog the name of the program.
 */
static void usage(char* prog) {

  printf("Usage: %s [-vd] [-r sampling-rate] [-s silence(sec)] [-D device]\n",
         prog);

  exit(0);
}
/*___________________________________________________________________________*/
