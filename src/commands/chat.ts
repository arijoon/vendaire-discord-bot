import { IMessage } from '../contracts';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import { makeSubscription } from '../helpers/command';
import * as opt from 'optimist';
import { TextGenApi } from '../services';
import { getMainContent } from '../helpers';

@injectable()
export class ChatCommand implements ICommand, IHasHelp {

  _command: string = commands.chat;

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.Logger) private _logger: ILogger,
    @inject(TYPES.IBasicCache) private _cache: IBasicCache,
    @inject(TextGenApi) private _textgenApi: TextGenApi,
  ) { }

  getHelp(): IHelp[] {
    return [
      {
        Key: this._command,
        Message: 'Chat to an AI model',
        Usage: this.setupOptions(['']).help()
      }
    ]
  }

  attach(): void {
    makeSubscription(this._client.getCommandStream(this._command),
      this.subscription.bind(this))
  }

  private async subscription(imsg: IMessage) {
    let argv = this.setupOptions(imsg.Content.split(' '));
    let ops = argv.argv

    if (ops.h) {
      return imsg.send(argv.help(), { code: 'md' });
    } if (ops.c) {
      // Changing characters and the such
    }

    const query = getMainContent(ops);

    return this.handleChat(imsg, query)

  }

  async handleChat(imsg: IMessage, query: string) {
    const result = await this._textgenApi.genText(query)
    return imsg.send(result, { reply: imsg.Message })
  }

  setupOptions(args: string[]): any {
    return opt(args)
      .usage('Chat to an AI')
      .options('c', {
        alias: 'change',
        describe: 'Change character (not functional yet)',
        default: ''
      })
  }
}
