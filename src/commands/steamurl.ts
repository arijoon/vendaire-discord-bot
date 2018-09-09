import { IDisposable } from 'rx';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';

@injectable()
export class SteamUrlCommand implements ICommand {

  _command: string = commands.steamurl;
  _steamLink: RegExp = /(https?:\/\/steam(community)?\.com\S+)/g
  _subscriptions: IDisposable[] = [];

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
  ) { }

  attach(): void {
    this._subscriptions.push(this._client
      .getCommandStream(this._command)
      .subscribe(async (imsg) => {
        const content = imsg.Content;

        let urls: string[] = null;
        urls = this.getSteamLink(content);

        if(!urls) {
          const msgs = await imsg.fetchMessages({ limit: 10});

          for(let msg of msgs) {
            urls = this.getSteamLink(msg);

            if (urls) {
              break;
            }
          }
        }

        if(urls) { // links were found
          const response = urls
            .map(url => `steam://openurl/${url}`)
            .join("\n");

          await imsg.send(response);
          imsg.done();
        } else {
          await imsg.send("no steam links found dumbass");
          imsg.done("No links found");
        }
      }));
  }

  getSteamLink(content) {
    const results: string[] = [];
    let match: RegExpExecArray = null
    while(match = this._steamLink.exec(content)) {
      if (match && match.length > 0) {
        results.push(match[0]);
      }
    }

    return results.length > 0
      ? results
      : null;
  }
}