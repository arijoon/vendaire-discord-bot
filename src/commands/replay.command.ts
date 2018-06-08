import { IMessage } from '../contracts';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';

@injectable()
export class Replay implements ICommand, IHasHelp {

  _command: string = commands.replay;
  _cache = new Map<string, any>();

  constructor(
    @inject(TYPES.IClient) private _client: IClient
  ) { }

  public attach(): void {
    this._client
      .getCommandStream(this._command)
      .subscribe(imsg => {
        const key = imsg.Message.author.discriminator;
        if (this._cache.has(key)) {
          this._client.processDiscordMessage(this._cache.get(key));
        }

        imsg.done();
      });

    this._client.getGlobalCommandStream()
      .subscribe(imsg => {
        if (imsg.Command === this._command) {
          return;
        }

        const key = imsg.Message.author.discriminator;
        this._cache.set(key, imsg.Message);
      });
  }

  public getHelp(): IHelp[] {
    return [
      {
        Key: this._command,
        Message: "Replay the last message",
        Usage: "replay|Enter the prefix without commands"
      }
    ]
  }
}