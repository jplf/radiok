/*___________________________________________________________________________*/
/**
 * @file encode.c
 * @brief An experimental program used to learn how to convert a raw audio
 * file into a flac one.
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
 * #include "compat.h"
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
#include "FLAC/metadata.h"
#include "FLAC/stream_encoder.h"

static void progress_callback(const FLAC__StreamEncoder *encoder, FLAC__uint64 bytes_written, FLAC__uint64 samples_written, unsigned frames_written, unsigned total_frames_estimate, void *client_data);

#define READSIZE 1024

static unsigned total_samples = 0; /* can use a 32-bit number due to WAVE size limitations */
static FLAC__byte buffer[READSIZE/*samples*/ * 2/*bytes_per_sample*/ * 1/*channels*/]; /* we read the WAVE data into here */
static FLAC__int32 pcm[READSIZE/*samples*/ * 1/*channels*/];

int main(int argc, char *argv[])
{
	FLAC__bool ok = true;
	FLAC__StreamEncoder *encoder = 0;
	FLAC__StreamEncoderInitStatus init_status;
	FLAC__StreamMetadata *metadata[2];
	FLAC__StreamMetadata_VorbisComment_Entry entry;
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
        fprintf(stdout, "Opened %s\n", input);

        if (fstat(fileno(fin), &info) < 0) {
          fprintf(stderr, "Can't stat %s for info\n", input);
          return 1;
        }
        fprintf(stdout, "Stated %s\n", input);

	sample_rate = 44100;
	channels = 1;
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
	ok &= FLAC__stream_encoder_set_total_samples_estimate(encoder, total_samples);

	/* now add some metadata; we'll add some tags and a padding block */
	if(ok) {
		if(
			(metadata[0] = FLAC__metadata_object_new(FLAC__METADATA_TYPE_VORBIS_COMMENT)) == NULL ||
			(metadata[1] = FLAC__metadata_object_new(FLAC__METADATA_TYPE_PADDING)) == NULL ||
			/* there are many tag (vorbiscomment) functions but these are convenient for this particular use: */
			!FLAC__metadata_object_vorbiscomment_entry_from_name_value_pair(&entry, "ARTIST", "Some Artist") ||
			!FLAC__metadata_object_vorbiscomment_append_comment(metadata[0], entry, /*copy=*/false) || /* copy=false: let metadata object take control of entry's allocated string */
			!FLAC__metadata_object_vorbiscomment_entry_from_name_value_pair(&entry, "YEAR", "1984") ||
			!FLAC__metadata_object_vorbiscomment_append_comment(metadata[0], entry, /*copy=*/false)
		) {
			fprintf(stderr, "ERROR: out of memory or tag error\n");
			ok = false;
		}

		metadata[1]->length = 1234; /* set the padding length */

		ok = FLAC__stream_encoder_set_metadata(encoder, metadata, 2);
	}

	/* initialize encoder */
	if(ok) {
		init_status = FLAC__stream_encoder_init_file(
                               encoder, output, progress_callback, /*client_data=*/NULL);
		if(init_status != FLAC__STREAM_ENCODER_INIT_STATUS_OK) {
			fprintf(stderr, "ERROR: initializing encoder: %s\n", FLAC__StreamEncoderInitStatusString[init_status]);
			ok = false;
		}
	}

	/* read blocks of samples from WAVE file and feed to encoder */
	if(ok) {
		size_t left = (size_t)total_samples;
		while(ok && left) {
			size_t need = (left>READSIZE? (size_t)READSIZE : (size_t)left);
			if(fread(buffer, channels*(bps/8), need, fin) != need) {
				fprintf(stderr, "ERROR: reading from raw file\n");
				ok = false;
			}
			else {
				/* convert the packed little-endian 16-bit PCM samples from WAVE into an interleaved FLAC__int32 buffer for libFLAC */
				size_t i;
				for(i = 0; i < need*channels; i++) {
					/* inefficient but simple and works on big- or little-endian machines */
					pcm[i] = (FLAC__int32)(((FLAC__int16)(FLAC__int8)buffer[2*i+1] << 8) | (FLAC__int16)buffer[2*i]);
				}
				/* feed samples to encoder */
				ok = FLAC__stream_encoder_process_interleaved(encoder, pcm, need);
			}
			left -= need;
		}
	}

	ok &= FLAC__stream_encoder_finish(encoder);

	fprintf(stderr, "encoding: %s\n", ok? "succeeded" : "FAILED");
	fprintf(stderr, "   state: %s\n", FLAC__StreamEncoderStateString[FLAC__stream_encoder_get_state(encoder)]);

	/* now that encoding is finished, the metadata can be freed */
	FLAC__metadata_object_delete(metadata[0]);
	FLAC__metadata_object_delete(metadata[1]);

	FLAC__stream_encoder_delete(encoder);
	fclose(fin);

	return 0;
}

void progress_callback(const FLAC__StreamEncoder *encoder, FLAC__uint64 bytes_written, FLAC__uint64 samples_written, unsigned frames_written, unsigned total_frames_estimate, void *client_data)
{
	(void)encoder, (void)client_data;

	fprintf(stderr, "wrote %" PRIu64 " bytes, %" PRIu64 "/%u samples, %u/%u frames\n", bytes_written, samples_written, total_samples, frames_written, total_frames_estimate);
}
