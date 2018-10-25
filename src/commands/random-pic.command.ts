import { IMessage } from './../contracts';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';

import * as path from 'path';
import { Message, MessageAttachment } from 'discord.js';
import { pathSeperator } from './add-pic.command';

const RandomRange: number = 1/20;
const RandomRangeMin: number = 5;

@injectable()
export class RandomPic implements ICommand {

  _commands: string[] = commands.randomPics;
  _command: string = commands.randomPic;

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.IFiles) private _filesService: IFiles,
    @inject(TYPES.IBasicCache) private _cache: IBasicCache,
  ) { }

  attach(): void {
    // Chosen folder
    for (let i = 0; i < this._commands.length; i++) {
      const command = this._commands[i];

      this._client
        .getCommandStream(command)
        .subscribe(imsg => this.subscription(imsg, command));
    }

    // Random folder
    this._client
      .getCommandStream(this._command)
      .subscribe(imsg => this.subscription(imsg, this._commands.crandom()));
  }

  subscription(imsg: IMessage, command: string) {
    let dir = this.extractDirectoryPathFromCommand(imsg);
    this.selectRandomFile(dir)
      .then(async (filename: string) => {

        const guildId = imsg.guidId;
        let channelId = imsg.channelId;

        if(command.toLowerCase() == 'nsfw') {  // Special case
          channelId = await this._client.getNsfwChannel(guildId);

          if(!channelId)
            return imsg.send("No NSFW channels found to post this haram stuff you weirdo");
        }

        if (await this._cache.has(filename)) {
          return this._client.sendMessage(guildId, channelId, "", { files: [await this._cache.get(filename)] });
        }

        return this._client.sendMessage(guildId, channelId, "", { file: filename })
          .then(async (res: Message) => {
            const attach: MessageAttachment = res.attachments.values().next().value;
            if (!attach) return res;

            const url = attach.url;
            await this._cache.set(filename, url);

            return res;
          })
      })
      .then(() => imsg.done())
      .catch(err => imsg.done(err, true));
  }

  selectRandomFile(dir: string): Promise<string> {
    const fullPath = path.join(this._config.images["root"], this._command, dir);

    return this._filesService
      .getAllFiles(fullPath, { recursive: true })
      .then(lst => {
        return this._config.pathFromRoot(fullPath, lst.crandom());
      });
  }

  /**
   * In case of directory commands, it will extract the path: "!!tfw/r hello world" -> "tfw/r"
   */
  private extractDirectoryPathFromCommand(imsg: IMessage): string {
    let dir = imsg.Command;
    if (imsg.Content.startsWith(pathSeperator)) {
      dir += imsg.Content.split(' ')[0];
    }

    return dir;
  }

  _lastRandomInx: { [key: string]: number } = {};
  /**
   * generates a random by adding a number (using RandomRange*lst.lenght) to the last index selection
   * @param lst list to pick a random from
   */
  private getRandom(lst: string[], key: string) : string {
    if(!this._lastRandomInx[key]) {
      this._lastRandomInx[key]  = Math.floor(Math.random() * lst.length);
    }

    let range = Math.ceil(RandomRange * lst.length);
    range = range < RandomRangeMin ? RandomRangeMin : range;
    this._lastRandomInx[key] = (this._lastRandomInx[key] + (Math.ceil(Math.random() * range))) % lst.length;
    
    return lst[this._lastRandomInx[key]];
  }
}