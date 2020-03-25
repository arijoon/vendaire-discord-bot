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
 * Whether a string is a valid MD5 hash 
 */
export function isHashString(str: string): boolean {
  return str && str.length === hashLength
}
