import { ServerSelectorService } from './../server-selector.service';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../ioc/types';
import { IClient } from '../../contracts';

import { IIntent } from 'aleksa/IIntent';

@injectable()
export class PostImageIntent implements IIntent  {
  name: string = "PostImageIntent";

  private commandsMappins: {[word: string]: string} = {
    "miscellaneous": "misc",
    "what the fuck": "dafuq",
    "the fuck": "dafuq",
    "anna": "misc/anna",
    "sexy": "misc/sexy",
    "sexy anime": "anime/s",
    "k-pop": "kpop",
    "anything": "randompic",
    "suicide": "kys",
    "laughter": "lol",
    "funny": "lol",
    "laugh": "lol"
  }

  constructor(
    @inject(TYPES.Logger) private _logger: ILogger,
    @inject(TYPES.AleksaServerSelector) private _serverSelector: ServerSelectorService,
    @inject(TYPES.IClient) private _client: IClient
  ) { }

  getCallback(config): (request: any, response: any) => Promise<void> {

    return async (req, res) => {
    const { guildId, channelId, userId, name } = await this._serverSelector.getServer();
      let command: string = (req.slot('name') || "").toLowerCase();
      command = this.commandsMappins[command] || command || "";

      this._client.sendMessage(guildId, channelId, `${command} <@${userId}>`, {}, { isCommand: true });
      res.say("ok!");
    };
  }
}
