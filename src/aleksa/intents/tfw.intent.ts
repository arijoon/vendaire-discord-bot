import { injectable, inject } from 'inversify';
import { TYPES } from '../../ioc/types';
import { IClient } from '../../contracts';

import { IIntent } from 'aleksa/IIntent';

@injectable()
export class TfwIntent implements IIntent  {
  name: string = "TfwIntent";

  constructor(
    @inject(TYPES.Logger) private _logger: ILogger,
    @inject(TYPES.IClient) private _client: IClient
  ) { }

  getCallback(config): (request: any, response: any) => Promise<void> {
    const { guildId, channelId, userId, name } = config.discord;
    this._logger.info(`Posting to ${name}`);

    return async (req, res) => {
      this._client.sendMessage(guildId, channelId, "tfw", {}, { isCommand: true });
      res.say("I know that feel bro!");
    };
  }
}
