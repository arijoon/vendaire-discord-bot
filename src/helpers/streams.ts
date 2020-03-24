import { Readable, PassThrough } from 'stream';

export function readbleFromString(data: string): Readable {
  const readable = emptyReadable();
  readable.push(data);
  readable.push(null);

  return readable;
}

export function readbleFromBuffer(data: any): Readable {
  const readable = emptyReadable();
  readable.push(data);
  readable.push(null);

  return readable;
}

export function emptyReadable(): Readable {
  const readable = new Readable();
  readable._read = () => { }; // avoid crash in console

  return readable;
}

/**
 * Duplicate a readble stream for multiple consumers 
 */
export function duplicateStream(stream: Readable): [Readable, Readable] {
  const pass1 = new PassThrough();
  const pass2 = new PassThrough();

  stream.pipe(pass1)
  stream.pipe(pass2)

  return [pass1, pass2];
}