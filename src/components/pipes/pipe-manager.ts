import { IPipe } from './../../contracts/IPipe';
import { GrepPipe } from './grep';
export class PipeManager {
  /**
   * Create a set of pipes based on the arguments
   * @param args list of strings with pipe arguments
   */
  makePipes(args: string[]): IPipe<string, string>[] {
    const result: IPipe<string, string>[] = [];

    for(let pipe of args) {
      const parts = pipe.trim().split(' ');
      if (parts.length < 1) continue;

      switch(parts[0].toLowerCase()) {
        case 'grep':
          result.push(new GrepPipe(parts.slice(1).join(' ')))
          break;
      }
    }

    return result;
  }
}