import { ServerSelectorService } from './../server-selector.service';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../ioc/types';
import { IClient } from '../../contracts';

import { IIntent } from 'aleksa/IIntent';

@injectable()
export class TachankaBotIntent implements IIntent  {
  name: string = "TachankaBotIntent";

  constructor(
    @inject(TYPES.Logger) private _logger: ILogger,
    @inject(TYPES.AleksaServerSelector) private _serverSelector: ServerSelectorService,
    @inject(TYPES.IClient) private _client: IClient
  ) { }

  getCallback(config): (request: any, response: any) => Promise<void> {
    return async (req, res) => {
      const { guildId, channelId, userId, name } = await this._serverSelector.getServer();
      this._client.sendMessage(guildId, channelId, `>sing for Arijoon`, {}, { isCommand: false });
    };
  }
}
