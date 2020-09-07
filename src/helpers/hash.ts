import { Readable, PassThrough } from "stream"

const crypto = require('crypto')

const hashLength = 32;

/**
 * hash the stream, if you would like to reuse the stream make sure to use the returned stream
 * @param fileStream a valid Stream
 */
export async function hash(fileStream: Readable): Promise<any> {
  return new Promise<any>((r,x) => {
    const hash = crypto.createHash('md5')
    hash.setEncoding('hex')

    fileStream.on('end', () => {
      hash.end();
      r(hash.read().toUpperCase());
    });

    fileStream.pipe(hash)
  })
}

/**
 * hash a string to remove non english characters from it
 * @param name 
 */
export function hashName(name: string) {
  return name.replace(/[^\x00-\x7F]/g, (c) => {
    const letter = c.charCodeAt(0);
    // map 65 - 90
    // (0 - 25 ) + 65 + (either lower case or uppercase)
    const code = (letter % 26) + 65 + ((letter % 2) * 32)
    return String.fromCharCode(code);
  });
}

/**
 * Whether a string is a valid MD5 hash 
 */
export function isHashString(str: string): boolean {
  return str && str.length === hashLength
}
