import { Readable } from 'stream';

export function readbleFromString(data: string) {
  const readable = new Readable();
  readable._read = () => { }; // avoid crash in console
  readable.push(data);
  readable.push(null);

  return readable;
}