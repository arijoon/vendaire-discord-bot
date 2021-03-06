import { IClient } from './../../contracts/IClient';
import { ServerSelectorService } from './../server-selector.service';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../ioc/types';

import { IIntent } from 'aleksa/IIntent';
import { timeout } from '../../helpers';

@injectable()
export class AddImageIntent implements IIntent  {
  name: string = "AddImageIntent";
  responses = ["oh yeah, come to papa", "dat ass", "oh my"];

  constructor(
    @inject(TYPES.Logger) private _logger: ILogger,
    @inject(TYPES.AleksaServerSelector) private _serverSelector: ServerSelectorService,
    @inject(TYPES.IClient) private _client: IClient
  ) { }

  getCallback(_): (request: any, response: any) => Promise<void> {
    return async (req, res) => {
      const skipCount: string = req.slot('number');

      const { guildId, channelId } = await this._serverSelector.getServer();
      const wait = 3000;
      const commands: string[] = [
        `igdownload annanystrom ${skipCount ? `-s ${skipCount}` : ""}`,
        "add misc/anna"
      ];

      for (const command of commands) {
        await this._client.sendMessage(guildId, channelId, command, {}, { isCommand: true });
        await timeout(wait);
      }

      res.say(`${this.responses.crandom()}`);
    };
  }
}
