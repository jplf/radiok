/*___________________________________________________________________________*/
/**
 * @file enflac.c
 * @brief An experimental program used to learn how to convert a raw audio
 * file into a flac one.
 *
 * Usage: enflac filename  (to process filename.raw; no suffix must be given)
 *
 * The code was copied from the original version found in the Flac library,
 * then it was adapted, simplified and cleaned up.
 *
 * @author Jean-Paul Le Fèvre
 * @date September 2014
 */
/*___________________________________________________________________________*/

/* example_c_encode_file - Simple FLAC file encoder using libFLAC
 * Copyright (C) 2007-2009  Josh Coalson
 * Copyright (C) 2011-2013  Xiph.Org Foundation
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

/*
 * This example shows how to use libFLAC to encode a WAVE file to a FLAC
 * file.  It only supports 16-bit stereo files in canonical WAVE format.
 *
 * Complete API documentation can be found at:
 *   http://flac.sourceforge.net/api/
 */

#if HAVE_CONFIG_H
#  include <config.h>
#endif

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include "FLAC/stream_encoder.h"

static unsigned total_samples = 0;

int main(int argc, char *argv[])
{
  FLAC__bool ok = true;
  FLAC__StreamEncoder *encoder = 0;
  FLAC__StreamEncoderInitStatus init_status;

  FILE *fin;
  unsigned sample_rate = 0;
  unsigned channels = 1;
  unsigned bps = 0;
  char input[32];
  char output[32];
  struct stat info;

  if(argc != 2) {
    fprintf(stderr, "usage: %s file", argv[0]);
    return 1;
  }

  strcpy(input,  argv[1]);
  strcpy(output, argv[1]);
  strcat(input,  ".raw");
  strcat(output,  ".flac");
  fprintf(stdout, "Flacing %s -> %s\n", input, output);

  if((fin = fopen(input, "rb")) == NULL) {
    fprintf(stderr, "Can't open %s for input\n", input);
    return 1;
  }

  if (fstat(fileno(fin), &info) < 0) {
    fprintf(stderr, "Can't stat %s for info\n", input);
    return 1;
  }

  sample_rate = 44100;
  bps = 16;
  total_samples = info.st_size / 2;
  fprintf(stdout, "File %s: %d samples\n", input, total_samples);

  /* allocate the encoder */
  if((encoder = FLAC__stream_encoder_new()) == NULL) {
    fprintf(stderr, "ERROR: allocating encoder\n");
    fclose(fin);
    return 1;
  }

  ok &= FLAC__stream_encoder_set_verify(encoder, true);
  ok &= FLAC__stream_encoder_set_compression_level(encoder, 5);
  ok &= FLAC__stream_encoder_set_channels(encoder, channels);
  ok &= FLAC__stream_encoder_set_bits_per_sample(encoder, bps);
  ok &= FLAC__stream_encoder_set_sample_rate(encoder, sample_rate);
  ok &= FLAC__stream_encoder_set_total_samples_estimate(encoder, 0);

  init_status = FLAC__stream_encoder_init_file(encoder, output, NULL, NULL);

  if(init_status != FLAC__STREAM_ENCODER_INIT_STATUS_OK) {
    fprintf(stderr, "ERROR: initializing encoder: %s\n",
            FLAC__StreamEncoderInitStatusString[init_status]);
    ok = false;
    return 1;
  }

  FLAC__byte* buffer = malloc(info.st_size);
  if (buffer == NULL) {
    fprintf(stderr, "Can't allocate buffer of %d bytes !\n", info.st_size);
    return 1;
  }
  
  int n;
  if((n = fread(buffer, 1, info.st_size, fin)) != info.st_size) {
    fprintf(stderr, "Error reading from raw file %d / %u\n", n, info.st_size);
    ok = false;
    return 1;
  }

  printf("Number of bytes read: %d\n", n);
  fclose(fin);

  /*
   * Convert the packed little-endian 16-bit PCM samples
   * from WAVE into an interleaved FLAC__int32 buffer for libFLAC
   */
  FLAC__int32* pcm = malloc(total_samples * sizeof(FLAC__int32));
  printf("Number of samples allocated: %d\n", total_samples);

  if (pcm == NULL) {
    fprintf(stderr, "Can't allocate pcm for %d samples !\n", total_samples);
    return 1;
  }

  size_t i;

  for(i = 0; i < total_samples; i++) {
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
  ok = FLAC__stream_encoder_process_interleaved(encoder, pcm, total_samples);

  ok &= FLAC__stream_encoder_finish(encoder);

  fprintf(stderr, "Enflacing: %s\n", ok? "succeeded" : "FAILED");

  FLAC__stream_encoder_delete(encoder);

  return 0;
}
/*___________________________________________________________________________*/
