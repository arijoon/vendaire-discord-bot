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

/**
 * Duplicate a readble stream for multiple consumers 
 */
export function duplicateStream(stream: Readable): [Readable, Readable] {
  const clone1 = clone(stream);
  const clone2 = clone(stream);

  return [clone1, clone2];
}

function clone(stream: Readable): Readable {
  const readable = emptyReadable();
  stream.on("data" , (chunk) => {
    readable.push(chunk);
  });

  stream.on("end", () => {
    readable.push(null);
  });

  stream.on("error", (err) => {
    readable.emit("error", err);
  });

  return readable;
}

export function emptyReadable(): Readable {
  const readable = new Readable();
  readable._read = () => { }; // avoid crash in console

  return readable;
}