import { Readable } from 'stream';

export function readbleFromString(data: string): Readable {
  const readable = new Readable();
  readable._read = () => { }; // avoid crash in console
  readable.push(data);
  readable.push(null);

  return readable;
}

export function readbleFromBuffer(data: any): Readable {
  const readable = new Readable();
  readable._read = () => { }; // avoid crash in console
  readable.push(data);
  readable.push(null);

  return readable;
}