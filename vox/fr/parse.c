/*___________________________________________________________________________*/
/**
 * @file parse.c
 * @brief An experimental program used to learn how to use a json parser
 * in C language.
 *
 * @author Jean-Paul Le Fèvre
 * @date October 2014
 */
/*___________________________________________________________________________*/

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>

int main(int argc, char *argv[])
{
  char input[32];
  char content[1024];
  FILE *fin;
  int s;

  if(argc != 2) {
    fprintf(stderr, "usage: %s file", argv[0]);
    return 1;
  }

  strcpy(input,  argv[1]);
  fprintf(stdout, "Parsing %s\n", input);

  if((fin = fopen(input, "r")) == NULL) {
    fprintf(stderr, "Can't open %s for input\n", input);
    return 1;
  }

  fprintf(stdout, "Opened %s\n", input);
  s = fread(content, 1024, 1, fin);
  content[(sizeof content) - 1] = 0;

  fprintf(stdout, "Content\n%s\n", content);
  fprintf(stdout, "Size %u\n", s);

  fclose(fin);

  return 0;
}
/*___________________________________________________________________________*/
