import { IDisposable } from 'rx';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import { commonRegex } from '../helpers';

@injectable()
export class SteamUrlCommand implements ICommand {

  _command: string = commands.steamurl;
  _subscriptions: IDisposable[] = [];

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
  ) { }

  attach(): void {
    this._subscriptions.push(this._client
      .getCommandStream(this._command)
      .subscribe(imsg => {
        const content = imsg.Content;

        const link = commonRegex.link.exec(content);

        if (link && link.length > 0) {
          const url = link[0];

          imsg.send(`steam://openurl/${url}`);
          imsg.done();
        } else {
          imsg.send("no steam links found dumbass");
          imsg.done("No links found");
        }
      }));
  }
}