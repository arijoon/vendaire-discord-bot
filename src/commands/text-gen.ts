import { IMessage } from '../contracts';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import { TextGenApi } from '../services';
import { getMainContent } from '../helpers';
import { makeSubscription, withDependencies } from '../helpers/command';

import * as opt from 'optimist';


@injectable()
export class TextGen implements ICommand, IHasHelp {

  _command: string = commands.textgen;

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.Logger) private _logger: ILogger,
    @inject(TYPES.IBasicCache) private _cache: IBasicCache,
    @inject(TextGenApi) private _textgenApi: TextGenApi,
  ) { }

  attach(): void {
    makeSubscription(this._client.getCommandStream(this._command),
      withDependencies([this._textgenApi], this._cache, this.subscription.bind(this)))
  }

  private async subscription(imsg: IMessage): Promise<any> {

    const content = imsg.Content;

    let argv = this.setupOptions(content.split(' '), imsg);
    let ops = argv.argv

    if (ops.h) {
      return imsg.send(argv.help(), { code: 'md' });
    }

    const query = getMainContent(ops);

    const result = await this._textgenApi.genText(query);

    return imsg.send(result, { code: 'md' });
  }

  getHelp(): IHelp[] {
    return [
      {
        Key: this._command,
        Message: "Search for a folder",
        Usage: `STARTING_STRING`
      }
    ]
  }

  setupOptions(args: string[], imsg: IMessage): any {
    var argv = opt(args)
      .usage(`Generate "random" text`)
      .options('h', {
        alias: 'help',
        describe: 'show this message',
      });

    return argv;
  }
}