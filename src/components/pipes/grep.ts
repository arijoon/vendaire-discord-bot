import { IPipe } from './../../contracts';

export class GrepPipe implements IPipe<string, string> {
  private static readonly exceptions = ['`'];
  private readonly searchStr;

  constructor(args: string) {
    this.searchStr = args.trim().toLowerCase();
  }

  async process(input: string): Promise<string> {
    const buffer = input.split(/\n/);
    const result = [];

    for(let line of buffer) {
      // Empty line
      if (line.length < 1) {
        result.push(line);
        continue;
      }

      for(let ex in GrepPipe.exceptions) {
        if (line.startsWith(ex)) {
          result.push(line)
        }
      }

      if (line.toLocaleLowerCase().indexOf(this.searchStr) > -1) {
        result.push(line)
      }
    }

    return result.join('\n');
  }
}