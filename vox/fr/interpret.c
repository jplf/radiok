/*___________________________________________________________________________*/
/**
 * @file read.c
 * @brief An other step : read a flac file coming from hark, send the content
 * to google to interpret what was said in the flac file and finally print
 * the word understood by google.
 *
 * @see hark.c and parse.c
 *
 * @usage : read file1.flac file2.flac ...
 *
 * @author Jean-Paul Le Fèvre
 * @date December 2014
 */
/*___________________________________________________________________________*/

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <json-parser/json.h>
#include <curl/curl.h>

#define MAX_SIZE 1024
#define MAX_RESPONSE_LENGTH 4096
#define MAX_WORD_LENGTH 48

static char*    type_name(json_type t);
static size_t   get_response(void *content, size_t size, size_t n, void *ptr);
static int      interpret_flac(char* flacfile);
static int      parse_content(char* content);

static CURL* curl = NULL;
static int debug  = 1;
/*___________________________________________________________________________*/

int main(int argc, char *argv[]) {

  if(argc < 2) {
    fprintf(stderr, "usage: %s file1.flac file2.flac ...\n", argv[0]);
    return 1;
  }

  char* key = getenv("GOOGLE_KEY");
  if (key == NULL) {
    fprintf(stderr, "GOOGLE_KEY undefined\n");
    return 1;
  }

  static char* google = "https://www.google.com/speech-api/v2/recognize";
  static char* output = "json";
  static char* lang   = "fr-fr";

  char url[256];
  strcpy(url, google);
  strcat(url, "?output=");
  strcat(url, output);
  strcat(url, "&lang=");
  strcat(url, lang);
  strcat(url, "&key=");
  strcat(url, key);

  struct curl_slist *slist = NULL;
  slist = curl_slist_append(slist, "Content-type: audio/x-flac; rate=44100;");

  if(debug) {
    printf("%s (%d=\n", url, strlen(url));
  }

  char response[MAX_RESPONSE_LENGTH];
  curl = curl_easy_init( );
  curl_easy_setopt(curl, CURLOPT_VERBOSE, 0);
  curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, get_response);
  curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *)response);
  curl_easy_setopt(curl, CURLOPT_URL, url);
  curl_easy_setopt(curl, CURLOPT_POST, 1);
  curl_easy_setopt(curl, CURLOPT_USERAGENT, "Mozilla/5.0");
  curl_easy_setopt(curl, CURLOPT_HTTPHEADER, slist);

  int i;
  for (i = 1; i < argc; i++) {

    if (interpret_flac(argv[i]) < 1) {
      fprintf(stderr, "Can't interpret %s\n", argv[i]);
      curl_easy_cleanup(curl);
      return 1;
    }
  }

  curl_easy_cleanup(curl);

  return 0;
}
/*___________________________________________________________________________*/
/**
 * Makes a flac file read by google.
 */
static int interpret_flac(char* flacfile) {

  FILE* file;
  char buffer[MAX_SIZE];

  if ((file = fopen(flacfile, "r")) == NULL) {
    fprintf(stderr, "Can't open %s for input\n", flacfile);
    return -1;
  }

  size_t s = fread(buffer, 1, MAX_SIZE, file);
  buffer[s] = 0;

  if (debug) {
    fprintf(stdout, "Read size %d\n", s);
  }

  curl_easy_setopt(curl, CURLOPT_POSTFIELDS, buffer);

  if (curl_easy_perform(curl) != 0) {
    fprintf(stderr, "Can't perform %s\n", flacfile);
    return -1;
  }

  return 0;
}
/*___________________________________________________________________________*/
/**
 * Gets the answer from google.
 */
static size_t get_response(void *output, size_t size, size_t n, void *ptr) {

  size_t realsize = size * n;
 
  if(realsize >= MAX_RESPONSE_LENGTH) {
    fprintf(stderr, "Not enough memory to handle vox response (%d/%d) !\n",
            realsize, MAX_RESPONSE_LENGTH);
    return 0;
  }

  char* content = (char*)ptr;

  strncpy(content, (char*)output, realsize);
  content[realsize] = 0;

  if (parse_content(content) < 0) {
    fprintf(stderr, "Can't parse content: %s !\n", content);
    return 0;
  }

  return realsize;
}
/*___________________________________________________________________________*/
/**
 * Prints the answer from google.
 */
static int parse_content(char* content) {

  if (content == NULL) {
    fprintf(stderr, "No content to parse !\n");
    return -1;
  }

  /**
   * Get rid of the first line which should only contain {"result":[]}
   * Then get the second line.
   */
  char * line = strtok(content, "\n");
  line = strtok(NULL, "\n");

  /**
   * Then parse the content which should be a json formatted string.
   * json_array array  = (json_value)(*value);
   */
  json_value* value = json_parse(line, strlen(content));
  if (value == NULL) {
    fprintf(stderr, "Can't parse content !\n");
    return -1;
  }

  fprintf(stdout, "Content:\n%s\n", line);

  if (value->type != json_object) {
    fprintf(stderr, "Wrong type %s / %s\n",
            type_name(value->type), type_name(json_object));
    return -1;
  }

  int n = (value->u).object.length;
  int i;
  /**
   * Extract the first word which was guessed by google.
   * The loop is not necessary.
   */
  for (i = 0; i < 1; i++) {
    json_object_entry entry = (value->u).object.values[i];

    if (strcmp("result", entry.name) != 0) {
      fprintf(stderr, "Wrong name %s / %s\n", entry.name, "result");
      return -1;
    }

    json_value* v = entry.value;

    if (v->type != json_array) {
      fprintf(stderr, "Wrong type %s / %s\n",
              type_name(v->type), type_name(json_array));
      return 1;
    }

    v = (v->u).array.values[0];
    if (v->type != json_object) {
      fprintf(stderr, "Wrong type %s / %s\n",
              type_name(v->type), type_name(json_object));
      return -1;
    }

    entry = (v->u).object.values[0];

    if (strcmp("alternative", entry.name) != 0) {
      fprintf(stderr, "Wrong name %s / %s\n", entry.name, "alternative");
      return -1;
    }

    v = entry.value;
    if (v->type != json_array) {
      fprintf(stderr, "Wrong type %s / %s\n",
              type_name(v->type), type_name(json_array));
      return -1;
    }

    v = (v->u).array.values[0];
    if (v->type != json_object) {
      fprintf(stderr, "Wrong type %s / %s\n",
              type_name(v->type), type_name(json_object));
      return -1;
    }

    n = (v->u).object.length;
    if (n != 2) {
      fprintf(stderr, "Wrong number of keys %d / %d\n", n, 2);
      return -1;
    }

    entry = (v->u).object.values[0];
    json_value* v_word = entry.value;

    if (strcmp("transcript", entry.name) != 0 || v_word->type != json_string) {
      fprintf(stderr, "Wrong entry %s / %s\n",
              entry.name, type_name(v_word->type));
      return -1;
    }

    char* word = (v_word->u).string.ptr;

    entry = (v->u).object.values[1];
    json_value* v_level = entry.value;

    if (strcmp("confidence", entry.name) != 0 || v_level->type != json_double) {
      fprintf(stderr, "Wrong entry %s / %s\n",
              entry.name, type_name(v_level->type));
      return -1;
    }

    double level = (v_level->u).dbl;
    fprintf(stdout, "\nFound word: '%s' with confidence: %f\n", word, level);

  }

  return 0;
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