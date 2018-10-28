import { IMessage } from './../contracts';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import * as opt from 'optimist';

import * as path from 'path';
import { Message, MessageAttachment } from 'discord.js';
import { pathSeperator } from './add-pic.command';
import { getMainContent } from '../helpers';

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

  async subscription(imsg: IMessage, command: string) {
    Promise.resolve().then(async () => {

      let argv = this.setupOptions(imsg.Content.trim().split(' '));
      let ops = argv.argv;

      if (ops.h) { // return help
        return imsg.send(argv.help(), { code: 'md' });
      }

      const dir = this.extractDirectoryPathFromCommand(command, getMainContent(ops));
      const fullPath = path.join(this._config.images["root"], this._command, dir);

      if (ops.l) { // list the folders
        return this.listFolders(imsg, fullPath);
      }

      return this.selectRandomFile(fullPath)
        .then(async (filename: string) => {

          const guildId = imsg.guidId;
          let channelId = imsg.channelId;

          if (command.toLowerCase() == 'nsfw') {  // Special case
            channelId = await this._client.getNsfwChannel(guildId);

            if (!channelId)
              return imsg.send("No NSFW channels found to post this haram stuff you weirdo");
          }

          const { message, options, shouldCache } = await this.makeFileOptions(filename);

          const sentMsg = this._client.sendMessage(guildId, channelId, message, options)

          return !shouldCache
            ? sentMsg
            : sentMsg.then(async (res: Message) => {
              const attach: MessageAttachment = res.attachments.values().next().value;
              if (!attach) return res;

              const url = attach.url;
              await this._cache.set(filename, url);

              return res;
            });
        });
    }).then(() => imsg.done())
      .catch(err => imsg.done(err, true));
  }

  async makeFileOptions(filename: string): Promise<{ message: string, shouldCache: boolean, options?: any}> {
    if (filename.endsWith('.link')) {
      return { message: await this._filesService.readFile(filename), shouldCache: false };
    }

    return {
      message: '', shouldCache: true, options: {
        files: [await this._cache.has(filename)
          ? await this._cache.get(filename)
          : filename]
      }
    }
  }

  async listFolders(imsg: IMessage, fullPath: string) {
    const cmdPath = imsg.Command == this._command
      ? path.join(this._config.images["root"], this._command)
      : fullPath

    const dir = this.extractDirectoryPathFromCommand(imsg.Command, imsg.Content);

    const folders = await this._filesService.getAllFolders(cmdPath);
    const message = folders.reduce((msg, current) => {
      const indentLevel = '\t'.repeat((current.match(/[\\\/]/g) || []).length);
      return `${msg}\n${indentLevel}${current}`;
    }, `Folders under ${dir}:\n`);

    return imsg.send(message, { code: 'md', split: true });
  }

  selectRandomFile(fullPath: string): Promise<string> {
    return this._filesService
      .getAllFiles(fullPath, { recursive: true })
      .then(lst => {
        return this._config.pathFromRoot(fullPath, lst.crandom());
      });
  }

  formatFolderList(folders: string[], dir: string) {
    return   }

  /**
   * In case of directory commands, it will extract the path: "!!tfw/r hello world" -> "tfw/r"
   */
  private extractDirectoryPathFromCommand(command: string, content: string): string {
    let dir = command;
    if (content && content.startsWith(pathSeperator)) {
      dir += content.split(' ')[0];
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

  setupOptions(args: string[]): any {
    var argv = opt(args)
      .usage("Post a random picture from available folders/subfolders")
      .options('l', {
        alias: 'list',
        describe: 'list all available folders',
      }).options('h', {
        alias: 'help',
        describe: 'show this message',
      });

    return argv;
  }
}