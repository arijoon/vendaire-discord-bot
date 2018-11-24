import { IMessage } from '../contracts';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';

@injectable()
export class Replay implements ICommand, IHasHelp {

  _command: string = commands.replay;

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.IBasicCache) private _cache: IBasicCache
  ) { }

  public attach(): void {
    this._client
      .getCommandStream(this._command)
      .subscribe(imsg => {
        Promise.resolve().then(async _ => {
          const key = this.makeKey(imsg);
          if (await this._cache.has(key)) {
            const message: IMessageDetail = JSON.parse(await this._cache.get(key));
            await this._client.processDiscordMessage(message.guildId,
              message.channelId,
              message.messageId,
              imsg.id);
          }
        }).then(_ => imsg.done())
          .catch(err => imsg.done('', err));
      });

    this._client.getGlobalCommandStream()
      .subscribe(async imsg => {
        if (imsg.Command === this._command) {
          return;
        }

        const key = this.makeKey(imsg);
        const message: IMessageDetail = {
          guildId: imsg.guidId,
          channelId: imsg.channelId,
          messageId: imsg.id
        }
        await this._cache.set(key, JSON.stringify(message));
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

  private makeKey(imsg: IMessage) {
    return `${this._command}::${imsg.userId}:${imsg.channelId}:${imsg.guidId}`;
  }
}

interface IMessageDetail {
  guildId: string;
  channelId: string;
  messageId: string;
}