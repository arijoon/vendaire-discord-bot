import { ServerSelectorService } from './../server-selector.service';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../ioc/types';
import { IClient } from '../../contracts';

import { IIntent } from 'aleksa/IIntent';

const responses = [
  "I know that feel bro!",
  "I don't know that feel",
  "stop feeling",
  "I'm feeling the feel too!",
  "It is one of those times for the feel"
]
@injectable()
export class TfwIntent implements IIntent  {
  name: string = "TfwIntent";

  constructor(
    @inject(TYPES.Logger) private _logger: ILogger,
    @inject(TYPES.AleksaServerSelector) private _serverSelector: ServerSelectorService,
    @inject(TYPES.IClient) private _client: IClient
  ) { }

  getCallback(_): (request: any, response: any) => Promise<void> {
    return async (req, res) => {
    const { guildId, channelId, userId, name } = await this._serverSelector.getServer();
      this._client.sendMessage(guildId, channelId, `tfw`, {}, { isCommand: true });
      res.say(responses.crandom());
    };
  }
}
