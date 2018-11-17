import { injectable, inject } from 'inversify';
import { TYPES } from '../../ioc/types';
import { IClient } from '../../contracts';

import { IIntent } from 'aleksa/IIntent';

@injectable()
export class PostImageIntent implements IIntent  {
  name: string = "PostImageIntent";

  private commandsMappins: {[word: string]: string} = {
    "miscellaneous": "misc",
    "anna": "misc/anna",
    "sexy": "misc/sexy",
    "anything": "randompic",
    "suicide": "kys",
    "laughter": "lol",
    "funny": "lol",
    "laugh": "lol"
  }

  constructor(
    @inject(TYPES.Logger) private _logger: ILogger,
    @inject(TYPES.IClient) private _client: IClient
  ) { }

  getCallback(config): (request: any, response: any) => Promise<void> {
    const { guildId, channelId, userId, name } = config.discord;
    this._logger.info(`${this.name} Posting to ${name}`);

    return async (req, res) => {
      let command: string = (req.slot('name') || "").toLowerCase();
      command = this.commandsMappins[command] || command || "";

      this._client.sendMessage(guildId, channelId, `${command} <@${userId}>`, {}, { isCommand: true });
      res.say("ok!");
    };
  }
}
