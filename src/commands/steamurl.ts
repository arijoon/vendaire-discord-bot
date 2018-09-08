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
      .subscribe(async (imsg) => {
        const content = imsg.Content;

        const url = this.getSteamLink(content);

        if(url) {
          imsg.send(`steam://openurl/${url}`);
          imsg.done();
        } else {
          // Get from previous messages
          const msgs = await imsg.fetchMessages({ limit: 10});

          for(let msg of msgs) {
            const url = this.getSteamLink(msg);

            if (url) {
              imsg.send(`steam://openurl/${url}`);
              imsg.done();
              return;
            }
          }

          imsg.send("no steam links found dumbass");
          imsg.done("No links found");
        }
      }));
  }

  getSteamLink(content) {
    const link = commonRegex.link.exec(content);

    if (link && link.length > 0) {
      const url = link[0];

      return url;
    }

    return null;
  }
}