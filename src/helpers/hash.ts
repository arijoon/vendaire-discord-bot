import { Readable, PassThrough } from "stream"

const crypto = require('crypto')

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
