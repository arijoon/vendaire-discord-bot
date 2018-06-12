import { IMessage } from './../contracts';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';

import * as path from 'path';
import { Message, MessageAttachment } from 'discord.js';

const RandomRange: number = 1/20;

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
    const msg = imsg.Message;
    this.selectRandomFile(command)
      .then(async (filename: string) => {

        if (await this._cache.has(filename)) {
          return msg.channel.send(await this._cache.get(filename));
        }

        return msg.channel.send('', { file: filename })
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
      .getAllFiles(fullPath)
      .then(lst => {
        return this._config.pathFromRoot(fullPath, this.getRandom(lst, dir));
      });
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

    const range = RandomRange * lst.length;
    this._lastRandomInx[key] = (this._lastRandomInx[key] + (Math.ceil(Math.random() * range))) % lst.length;
    
    return lst[this._lastRandomInx[key]];
  }
}