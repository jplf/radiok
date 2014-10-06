/*___________________________________________________________________________*/
/**
 * @file parse.c
 * @brief An experimental program used to learn how to use a json parser
 * in C language.
 * A typical google output looks like:
 * {"result":[]}
 * {"result":[{"alternative":[{"transcript":"bravo","confidence":0.75374281},{"transcript":"Bravo"},{"transcript":"bravos"},{"transcript":"travaux"},{"transcript":"Bravo 2"}],"final":true}],"result_index":0}
 *
 *
 * @see https://github.com/udp/json-parser
 *
 * @see speech.py a python script getting and parsing google's replies
 *
 * @author Jean-Paul Le Fèvre
 * @date October 2014
 */
/*___________________________________________________________________________*/

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <json-parser/json.h>

#define MAX_SIZE 1024

static char* type_name(json_type t);

int main(int argc, char *argv[])
{
  char input[32];
  char content[MAX_SIZE];
  FILE *fin;
  struct stat info;
  int s;
  int debug = 0;

  if(argc != 2) {
    fprintf(stderr, "usage: %s file", argv[0]);
    return 1;
  }
  /*
   * First read the content of file generated from a google reply.
   */
  strcpy(input,  argv[1]);
  if (debug) {
    fprintf(stdout, "Parsing %s\n", input);
  }

  if ((fin = fopen(input, "r")) == NULL) {
    fprintf(stderr, "Can't open %s for input\n", input);
    return 1;
  }
  else if (fstat(fileno(fin), &info) < 0) {
    fprintf(stderr, "Can't stat %s for info\n", input);
    return 1;
  }
  else if (info.st_size >= MAX_SIZE) {
    fprintf(stderr, "File %s too big: %d\n", info.st_size);
    return 1;
  }

  s = fread(content, 1, info.st_size, fin);
  content[info.st_size] = 0;

  if (debug) {
    fprintf(stdout, "Read size %d (%d)\n", s, info.st_size);
  }

  fclose(fin);

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
  json_value* value = json_parse(line, s);
  if (value == NULL) {
    fprintf(stderr, "Can't parse content !\n");
    return 1;
  }

  fprintf(stdout, "Content:\n%s\n", line);

  if (value->type != json_object) {
    fprintf(stderr, "Wrong type %s / %s\n",
            type_name(value->type), type_name(json_object));
    return 1;
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
      return 1;
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
      return 1;
    }

    entry = (v->u).object.values[0];

    if (strcmp("alternative", entry.name) != 0) {
      fprintf(stderr, "Wrong name %s / %s\n", entry.name, "alternative");
      return 1;
    }

    v = entry.value;
    if (v->type != json_array) {
      fprintf(stderr, "Wrong type %s / %s\n",
              type_name(v->type), type_name(json_array));
      return 1;
    }

    v = (v->u).array.values[0];
    if (v->type != json_object) {
      fprintf(stderr, "Wrong type %s / %s\n",
              type_name(v->type), type_name(json_object));
      return 1;
    }

    n = (v->u).object.length;
    if (n != 2) {
      fprintf(stderr, "Wrong number of keys %d / %d\n", n, 2);
      return 1;
    }

    entry = (v->u).object.values[0];
    json_value* v_word = entry.value;

    if (strcmp("transcript", entry.name) != 0 || v_word->type != json_string) {
      fprintf(stderr, "Wrong entry %s / %s\n",
              entry.name, type_name(v_word->type));
      return 1;
    }

    char* word = (v_word->u).string.ptr;


    entry = (v->u).object.values[1];
    json_value* v_level = entry.value;

    if (strcmp("confidence", entry.name) != 0 || v_level->type != json_double) {
      fprintf(stderr, "Wrong entry %s / %s\n",
              entry.name, type_name(v_level->type));
      return 1;
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
