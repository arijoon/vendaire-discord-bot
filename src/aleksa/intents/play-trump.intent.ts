import { ServerSelectorService } from './../server-selector.service';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../ioc/types';
import { IClient } from '../../contracts';

import { IIntent } from 'aleksa/IIntent';

@injectable()
export class PlayTrumpIntent implements IIntent  {
  name: string = "PlayTrumpIntent";

  constructor(
    @inject(TYPES.Logger) private _logger: ILogger,
    @inject(TYPES.AleksaServerSelector) private _serverSelector: ServerSelectorService,
    @inject(TYPES.IClient) private _client: IClient
  ) { }

  getCallback(config): (request: any, response: any) => Promise<void> {
    // userId should come from alexa in future

    return async (req, res) => {
      const { guildId, channelId, userId, name } = await this._serverSelector.getServer();
      this._logger.info("Received trump intent");
      this._client.sendMessage(guildId, channelId, `trump`, {}, { isCommand: true });
    };
  }
}
