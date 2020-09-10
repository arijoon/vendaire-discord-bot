/**
 * Sanatize a user input to be used within a shell command
 * @param input string
 */
export function cmdSanatize(input: string) {
  return input.replace(/(["'$`\\\/:])/g,'\\$1');
}