/*___________________________________________________________________________*/
/**
 * @file parse.c
 * @brief An experimental program used to learn how to use a json parser
 * in C language.
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

int main(int argc, char *argv[])
{
  char input[32];
  char content[MAX_SIZE];
  FILE *fin;
  struct stat info;
  int s;

  if(argc != 2) {
    fprintf(stderr, "usage: %s file", argv[0]);
    return 1;
  }

  /*
   * First read the content of file generated from a google reply.
   */
  strcpy(input,  argv[1]);
  fprintf(stdout, "Parsing %s\n", input);

  if((fin = fopen(input, "r")) == NULL) {
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

  fprintf(stdout, "Opened %s\n", input);
  s = fread(content, 1, info.st_size, fin);
  content[info.st_size] = 0;

  fprintf(stdout, "Content:\n%s\n", content);
  fprintf(stdout, "Size %d (%d)\n", s, info.st_size);

  fclose(fin);

  /*
   * Then parse the content which should be a json formatted string.
   * json_array array  = (json_value)(*value);
   */
  json_value* value = json_parse(content, s);
  if (value == NULL) {
    fprintf(stderr, "Can't parse content !\n");
    return 1;
  }

  fprintf(stdout, "value %d\n", value);

  if (value->type == json_array) {
    fprintf(stdout, "Length %s\n", (value->u).array.length);
  }

  return 0;
}
/*___________________________________________________________________________*/
