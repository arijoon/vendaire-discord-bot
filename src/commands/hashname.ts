import { IMessage } from '../contracts';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import { makeSubscription } from '../helpers/command';
import { hashName } from '../helpers';


@injectable()
export class HashName implements ICommand, IHasHelp {

  _command: string = commands.namehash;

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
  ) { }

  attach(): void {
    makeSubscription(this._client.getCommandStream(this._command),
      this.subscription.bind(this))
  }

  private async subscription(imsg: IMessage): Promise<any> {
    const target = imsg.Content;

    const result = hashName(target);

    return imsg.send(result)
  }

  getHelp(): IHelp[] {
    return [
      {
        Key: this._command,
        Message: "hash your name or the mentioned user",
        Usage: `USER`
      }
    ]
  }
}